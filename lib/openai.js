/**
 * Client-side helper function to call the OpenAI API directly
 */
export async function generateVACode(prompt, { 
  components = [], 
  previousCode = null,
  isFollowUp = false,
  previousPrompts = [],
  currentCode = null,
  onComplete, 
  onError, 
  onProgress 
}) {
  console.log("Calling OpenAI with prompt:", prompt);
  console.log("Components to use:", components);
  console.log("Is follow-up request:", isFollowUp);
  
  try {
    if (!prompt) {
      const error = new Error("Prompt is required");
      console.error(error);
      if (onError && typeof onError === 'function') {
        onError(error);
      }
      return '';
    }
    
    const componentsList = Array.isArray(components) ? components : [];
    
    // Set initial progress message to show the interpreted prompt
    if (onProgress && typeof onProgress === 'function') {
      onProgress(`I'm ${isFollowUp ? 'updating' : 'creating'} a VA component based on your request: "${prompt}"`);
    }
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    try {
      // Build request body with additional context for follow-up requests
      const requestBody = {
        prompt,
        components: componentsList,
        isFollowUp,
      };
      
      // Add previous context if this is a follow-up request
      if (isFollowUp && previousCode) {
        requestBody.previousCode = previousCode;
        requestBody.previousPrompts = previousPrompts;
      }
      
      // Add current code state if available
      if (currentCode) {
        requestBody.currentCode = currentCode;
      }

      // Call the API endpoint provided by the server - this time expecting a stream of events
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Store response status and status text before attempting to read the body
      const status = response.status;
      const statusText = response.statusText;
      
      if (!response.ok) {
        let errorMessage = `API Error: ${status} ${statusText}`;
        
        // Only try to parse response body if status isn't a network error (0)
        if (status !== 0) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error?.message || errorMessage;
          } catch (e) {
            console.error('Error parsing error response:', e);
          }
        }
        
        const error = new Error(errorMessage);
        console.error('API returned error:', error);
        if (onError && typeof onError === 'function') {
          onError(error);
        }
        return '';
      }
      
      // Handle streaming response with semantic events
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';
      let buffer = '';
      let accumulatedCode = '';
      
      try {
        // Process the stream
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('Stream complete');
            break;
          }
          
          // Decode the chunk and add to buffer
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Process complete SSE data lines from the buffer
          let newlineIndex;
          while ((newlineIndex = buffer.indexOf('\n\n')) !== -1) {
            const line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 2);
            
            if (line.trim() === '') continue;
            
            try {
              // Check if line starts with "data: " and extract the JSON part
              const match = line.match(/^data: (.+)$/);
              
              if (!match) {
                console.log('Skipping non-data line:', line);
                continue;
              }
              
              const jsonString = match[1];
              const data = JSON.parse(jsonString);
              
              // Handle the various semantic events from the generation endpoint
              switch (data.event) {
                case 'response.start':
                  // Stream has started
                  if (onProgress && typeof onProgress === 'function') {
                    onProgress('Stream started');
                  }
                  break;
                case 'response.progress':
                  // Progress update
                  if (onProgress && typeof onProgress === 'function') {
                    try {
                      const progressData = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
                      onProgress(progressData.text || '', progressData.progress);
                    } catch (e) {
                      onProgress('Processing...');
                    }
                  }
                  break;
                case 'response.completed': {
                  // Full response is complete
                  let payload;
                  try {
                    payload = typeof data.data === 'string' ? JSON.parse(data.data) : data;
                  } catch (e) {
                    payload = data;
                  }
                  result = payload.code || accumulatedCode;
                  const explanation = payload.explanation || '';
                  if (onComplete && typeof onComplete === 'function') {
                    onComplete(result, explanation);
                  }
                  break;
                }
                case 'response.error':
                  // Error during generation
                  if (onError && typeof onError === 'function') {
                    try {
                      const err = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
                      onError(new Error(err.error || 'An error occurred')); 
                    } catch {
                      onError(new Error('An error occurred'));
                    }
                  }
                  break;
                default:
                  // Unhandled event types are ignored
                  break;
              }
            } catch (e) {
              console.error('Error parsing streaming JSON:', e, 'Line:', line);
            }
          }
        }
      } catch (streamError) {
        console.error('Error processing stream:', streamError);
        if (onError && typeof onError === 'function') {
          onError(new Error('Error processing stream: ' + streamError.message));
        }
      } finally {
        reader.releaseLock();
      }
      
      return { code: result, explanation: '' };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Handle AbortController timeout
      if (fetchError.name === 'AbortError') {
        const error = new Error('Request timed out. The API took too long to respond.');
        console.error('Fetch timeout:', error);
        if (onError && typeof onError === 'function') {
          onError(error);
        }
        return '';
      }
      
      // Handle other fetch errors
      console.error('Error fetching from API:', fetchError);
      if (onError && typeof onError === 'function') {
        onError(fetchError);
      }
      return '';
    }
  } catch (error) {
    console.error('Error generating code:', error);
    if (onError && typeof onError === 'function') {
      onError(error);
    }
    return '';
  }
} 