import OpenAI from 'openai';
import { MODEL, DEVELOPER_PROMPT } from '../../../config/constants';

export const runtime = 'edge'; // Using edge runtime for low-latency streaming responses

export async function POST(req) {
  try {
    // Check if we have an OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('Missing OpenAI API key');
      return Response.json(
        { error: 'OpenAI API key not configured', success: false },
        { status: 500 }
      );
    }

    // Initialize the OpenAI client
    const client = new OpenAI({
      apiKey: apiKey,
    });

    // Parse the request body
    const body = await req.json();
    const { 
      prompt, 
      components = [], 
      isFollowUp = false,
      previousCode = null,
      previousPrompts = [],
      currentCode = null
    } = body;

    // Check if we have a prompt
    if (!prompt) {
      console.error('Missing prompt in request');
      return Response.json(
        { error: 'No prompt provided', success: false },
        { status: 400 }
      );
    }

    console.log(`Received prompt: ${prompt.substring(0, 100)}...`);
    console.log(`Requested components: ${components ? components.join(', ') : 'none'}`);
    console.log(`Is follow-up request: ${isFollowUp}`);

    // Use the central developer prompt for full VA page generation with additional context for follow-up requests
    let systemPrompt = DEVELOPER_PROMPT;
    
    // Add follow-up specific instructions if this is a follow-up request
    if (isFollowUp && previousCode) {
      systemPrompt += `\n\nIMPORTANT - THIS IS A FOLLOW-UP REQUEST:
You previously generated code for this user. They are now asking you to make changes to the existing code.
DO NOT regenerate the entire component from scratch. Instead, make targeted modifications to the previous code.
Keep the existing structure and only change what's necessary to fulfill the new request.
Ensure all changes maintain the same style, naming conventions, and approach as the original code.`;
    }

    // Construct the user prompt
    let userPrompt = prompt;
    
    // Add component info
    if (components && components.length > 0) {
      userPrompt += `\n\nUse the following VA components in the implementation: ${components.join(', ')}`;
    }
    
    // Add previous code context for follow-up requests
    if (isFollowUp && previousCode) {
      userPrompt += `\n\nHere is the previous code I'd like you to modify:\n\n${previousCode}\n\nPlease make the requested changes to this existing code.`;
    }
    
    // Add previous conversation context
    if (previousPrompts && previousPrompts.length > 0) {
      userPrompt += `\n\nFor context, here are my previous requests:\n${previousPrompts.map(p => `- ${p}`).join('\n')}`;
    }
    
    // If we have current code state, include that as well
    if (currentCode && Object.keys(currentCode).some(key => currentCode[key])) {
      userPrompt += "\n\nCurrently, the component has these parts:";
      if (currentCode.html) userPrompt += `\n\nHTML:\n${currentCode.html}`;
      if (currentCode.css) userPrompt += `\n\nCSS:\n${currentCode.css}`;
      if (currentCode.js) userPrompt += `\n\nJavaScript:\n${currentCode.js}`;
    }

    // Set up a ReadableStream to handle SSE
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Create a streaming response from OpenAI API using the new responses.create endpoint
          const events = await client.responses.create({
            model: MODEL,
            input: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            stream: true,
          });

          // Send an immediate event to indicate streaming has started
          const startEvent = {
            event: 'response.start',
            data: JSON.stringify({ success: true }),
          };
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(startEvent)}\n\n`));

          let accumulatedCode = "";
          let progressCount = 0;

          try {
            // Process each chunk as it arrives
            for await (const event of events) {
              // Get content from event - look for text property in new API format
              const content = event.text || "";

              if (content) {
                console.log(`Received content chunk: ${content.length} chars`);
                accumulatedCode += content;

                // Send periodic progress events to keep the connection alive
                if (progressCount % 5 === 0) {
                  const progressEvent = {
                    event: 'response.progress',
                    data: JSON.stringify({
                      progress: Math.min(0.9, 0.1 + (accumulatedCode.length / 500)),
                      text: isFollowUp ? "Updating component..." : "Generating component..."
                    }),
                  };
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(progressEvent)}\n\n`));
                }
                progressCount++;
              }
            }

            console.log(`Total accumulated code: ${accumulatedCode.length} chars`);
          } catch (streamProcessError) {
            console.error('Error processing OpenAI stream chunks:', streamProcessError);

            // Send a partial result if we have accumulated some code
            if (accumulatedCode.length > 0) {
              const partialEvent = {
                event: 'response.completed',
                data: JSON.stringify({
                  success: true,
                  done: true,
                  code: `function App() {
  return (
    <div className="vads-l-grid-container">
      <va-alert status="warning" visible>
        <h2 slot="headline">Partial Result</h2>
        <p>The generation was interrupted. Here's what was generated so far:</p>
      </va-alert>
      ${accumulatedCode}
    </div>
  );
}`,
                  explanation: "Generation was interrupted. Partial result shown."
                }),
              };
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(partialEvent)}\n\n`));
            } else {
              throw streamProcessError; // Re-throw to be caught by outer catch
            }
          }

          // Make sure code starts with "function App()" or wrap it
          let finalCode = accumulatedCode;

          // Add code validation logging
          console.log(`Raw generated code: ${finalCode.substring(0, 100)}...`);

          if (!finalCode.trim().startsWith('function App()') && !finalCode.trim().startsWith('function App ') && !finalCode.trim().startsWith('const App')) {
            console.log("Code doesn't start with App function declaration, attempting to wrap it");
            // Try to extract JSX if there is any
            const jsxMatch = finalCode.match(/<[\s\S]*>[\s\S]*<\/[\s\S]*>/m);
            if (jsxMatch) {
              // If JSX found, wrap it in an App function
              console.log("Found JSX, wrapping in App function");
              finalCode = `function App() {
  return (
    ${jsxMatch[0]}
  );
}`;
            } else {
              // Fallback to a default App function
              console.log("No JSX found, using fallback App function");
              finalCode = `function App() {
  return (
    <div className="vads-l-grid-container">
      <h2>Generated Component</h2>
      <pre>${finalCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    </div>
  );
}`;
            }
          }

          // Add export default if missing, and ensure it has proper spacing
          if (!finalCode.includes('export default App')) {
            // Add a line break before the export statement to avoid syntax issues
            finalCode += '\n\nexport default App;';
          }

          // Check for React dependencies
          if (finalCode.includes('useState') || finalCode.includes('useEffect') || finalCode.includes('useRef')) {
            if (!finalCode.includes('React.useState') && !finalCode.includes('import React')) {
              // Add React destructuring if not present
              finalCode = finalCode.replace(/function App\(\)\s*{/,
                'function App() {\n  // React hooks must be imported or accessed via React namespace\n  const { useState, useEffect, useRef } = React;');
            }
          }

          console.log(`Final processed code length: ${finalCode.length}`);

          // Generate a more conversational explanation based on whether this was a follow-up
          const explanation = isFollowUp
            ? "Your component has been updated with the requested changes."
            : "Your component has been created successfully.";

          // Send the completed event with the full generated code
          const completedEvent = {
            event: 'response.completed',
            data: JSON.stringify({
              success: true,
              done: true,
              code: finalCode,
              explanation
            }),
          };
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(completedEvent)}\n\n`));

          // Close the stream
          controller.close();
        } catch (error) {
          console.error('Error in OpenAI streaming:', error);

          // Send an error event
          const errorEvent = {
            event: 'response.error',
            data: JSON.stringify({
              success: false,
              error: error.message || 'An error occurred during generation'
            }),
          };

          try {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
            controller.close();
          } catch (controllerError) {
            console.error('Error sending error through controller:', controllerError);
            // If controller operations fail, we can't do much but log it
          }
        }
      }
    });

    // Return the stream as a response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
    });

  } catch (error) {
    console.error('Error in generation endpoint:', error);
    return Response.json(
      { error: error.message || 'An error occurred', success: false },
      { status: 500 }
    );
  }
}