'use client';

import { useState, useRef, useEffect } from 'react';
import { generateVACode } from '../lib/openai';
import { extractPdfContent, uploadPdfToVectorStore, generateVAComponentFromPdf } from '../lib/pdfProcessing';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import PdfUploader from '../components/PdfUploader';
import FigmaImporter from './components/FigmaImporter';
import ComponentGallerySelector from './components/ComponentGallerySelector';

// Dynamically import the AICodeEditor component to prevent SSR issues
const AICodeEditor = dynamic(
  () => import('./components/AICodeEditor'),
  { ssr: false }
);

// Dynamically import language packages
const javascript = dynamic(
  () => import('@codemirror/lang-javascript').then((mod) => mod.javascript),
  { ssr: false }
);

export default function Home() {
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('html');
  const [htmlCode, setHtmlCode] = useState('<!-- VA component HTML will appear here -->');
  const [cssCode, setCssCode] = useState('/* Component styles will appear here */');
  const [jsCode, setJsCode] = useState('// React component code will appear here');
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [activeSection, setActiveSection] = useState('builder'); // 'builder', 'pdf', 'figma'
  const [isPreviewLoading, setIsPreviewLoading] = useState(false); // New loading state for preview
  const messagesEndRef = useRef(null);
  const previewRef = useRef(null);
  
  // Keep track of conversation context
  const [conversationContext, setConversationContext] = useState({
    lastGeneratedCode: null,
    componentHistory: []
  });
  
  // Handle component selection from the gallery
  const handleComponentsSelected = (components) => {
    // Only update if the components array has actually changed
    if (!Array.isArray(components) || 
        JSON.stringify(components) === JSON.stringify(selectedComponents)) {
      return;  // Skip update if components haven't actually changed
    }
    setSelectedComponents(components);
  };

  // Handle VA form component code generated from PDF
  const handleFormGenerated = (code) => {
    try {
      // Ensure we're working with a string
      const safeCode = typeof code === 'string' ? code : JSON.stringify(code);
      
      // Clean up any markdown code ticks
      const cleanedCode = safeCode.replace(/```jsx|```js|```javascript|```|jsx/g, "").trim();
      
      console.log("Processing form generated code, length:", cleanedCode.length);
      
      // Check for App component
      const appComponentPattern = /function\s+App\s*\(|const\s+App\s*=|class\s+App\s+extends|var\s+App\s*=|let\s+App\s*=|export\s+(default\s+)?(function\s+App|class\s+App|const\s+App\s*=)/i;
      const hasAppComponent = appComponentPattern.test(cleanedCode);
      
      let processedCode = cleanedCode;
      
      if (!hasAppComponent) {
        console.log("No App component found in form code, adding one");
        processedCode = `function App() {
  // Make React hooks available
  const { useState, useEffect, useRef, useCallback, useMemo } = React;
  
  return (
    <div className="vads-l-grid-container">
      ${cleanedCode}
    </div>
  );
}`;
      }
      
      const { parsedHtml, parsedCss, parsedJs } = parseGeneratedCode(processedCode);
      setHtmlCode(parsedHtml);
      setCssCode(parsedCss);
      setJsCode(parsedJs);
      setShowResults(true);
      setTimeout(updatePreview, 300);
    } catch (err) {
      console.error('Error applying form generated code:', err);
      setError('Failed to generate form: ' + err.message);
    }
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Function to update the preview iframe
  const updatePreview = () => {
    try {
      console.log("Updating preview");
      setIsPreviewLoading(true); // Set loading state when preview update begins
      
      // Look for both possible iframe IDs - the one in page and the one in AICodeEditor
      let iframe = document.getElementById('preview-frame') || document.querySelector('.preview-iframe');
      
      // If iframe isn't found, try to create it
      if (!iframe) {
        console.log("Preview iframe not found - creating one");
        const previewContainer = document.querySelector('.preview-container');
        if (previewContainer) {
          iframe = document.createElement('iframe');
          iframe.id = 'preview-frame';
          iframe.className = 'preview-iframe';
          iframe.style.width = '100%';
          iframe.style.height = '100%';
          iframe.style.border = 'none';
          iframe.style.backgroundColor = 'white';
          previewContainer.appendChild(iframe);
          console.log("Created new preview iframe");
        } else {
          console.error("Preview container not found");
          setIsPreviewLoading(false); // Reset loading state on error
          return;
        }
      }

      // Process the JavaScript code before injecting it
      // Enhanced App component check
      const appComponentPattern = /function\s+App\s*\(|const\s+App\s*=|class\s+App\s+extends|var\s+App\s*=|let\s+App\s*=|export\s+(default\s+)?(function\s+App|class\s+App|const\s+App\s*=)/i;
      let hasAppComponent = appComponentPattern.test(jsCode); 
      
      let processedJsCode = '';
      if (!hasAppComponent) {
        console.log("No App component found in JS code, adding wrapper");
        processedJsCode = `
// Auto-generated App wrapper component
function App() {
  // Make React hooks available
  const { useState, useEffect, useRef, useCallback, useMemo } = React;
  
  return (
    <div className="vads-l-grid-container">
      <div>
        {/* Original code wrapped in App */}
        ${jsCode || '// No code provided'}
      </div>
    </div>
  );
}`;
      } else {
        // Regular processing when App component exists
        processedJsCode = (jsCode || '')
          // Remove all export variations
          .replace(/export\s+default\s+App\s*;?/g, '')
          .replace(/export\s+default\s+function\s+App/g, 'function App')
          .replace(/export\s+function\s+App/g, 'function App')
          .replace(/export\s+const\s+App\s*=/g, 'const App =')
          .replace(/export\s+default\s+class\s+App/g, 'class App')
          .replace(/export\s+class\s+App/g, 'class App')
          .replace(/export\s+default\s+/g, '')
          .replace(/export\s+/g, '')
          // Remove all import variations
          .replace(/import\s+React\s*,?\s*{\s*[^}]*\s*}\s*from\s+['"]react['"];?/g, '/* React import removed */')
          .replace(/import\s+React\s+from\s+['"]react['"];?/g, '/* React import removed */')
          .replace(/import\s+{\s*[^}]*\s*}\s*from\s+['"]react['"];?/g, '/* React import removed */')
          .replace(/import\s+[^;]+;?/g, '/* import removed */');
      }

      // Make sure we handle null/undefined values
      const safeHtmlCode = htmlCode || '<!-- No HTML content -->';
      const safeCssCode = cssCode || '/* No CSS content */';

      console.log(`Processed code lengths - JS: ${processedJsCode.length}, HTML: ${safeHtmlCode.length}, CSS: ${safeCssCode.length}`);

      // Create a complete HTML document using the three code tabs
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>VA Component Preview</title>
          
          <!-- VA Component Library CSS -->
          <link rel="stylesheet" href="https://unpkg.com/@department-of-veterans-affairs/web-components/dist/main.css">
          
          <!-- Error handling -->
          <script>
            window.onerror = function(message, source, lineno, colno, error) {
              console.error('Preview error:', message, error);
              document.querySelector('body').innerHTML += 
                '<div style="color: red; padding: 1rem; background: rgba(255,0,0,0.1); margin: 1rem; border: 1px solid red;">' + 
                '<strong>Preview Error:</strong> ' + message + '</div>';
              window.parent.postMessage('preview-error', '*');
              return true;
            };
          </script>
          
          <!-- Custom CSS -->
          <style>
            ${safeCssCode}
            
            /* Ensure background is white */
            body {
              background-color: white;
              color: #323a45;
              font-family: Source Sans Pro, Helvetica Neue, Helvetica, Roboto, Arial, sans-serif;
            }
          </style>
          
          <!-- React and ReactDOM scripts -->
          <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          
          <!-- Babel for JSX transformation -->
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          
          <!-- VA Web Components -->
          <script type="module">
            (async () => {
              try {
                const { defineCustomElements } = await import('https://unpkg.com/@department-of-veterans-affairs/web-components@latest/loader/index.js');
                await defineCustomElements();
                console.log('VA Components defined and ready');
                document.dispatchEvent(new CustomEvent('va-components-ready'));
                window.parent.postMessage('preview-loaded', '*');
              } catch (err) {
                console.error('Error loading VA components:', err);
                window.parent.postMessage('preview-error', '*');
              }
            })();
          </script>
        </head>
        <body style="background-color: white;">
          <!-- Explicit root container for React app -->
          <div id="root">${safeHtmlCode}</div>
          
          <!-- JavaScript Tab Content -->
          <script type="text/babel" data-presets="react,env" id="user-code">
            // Wait for VA components to be ready before rendering user code
            (function() {
              const renderUserApp = () => {
                try {
                  // Set up React hooks to be available in the scope
                  const { useState, useEffect, useRef, useCallback, useMemo, useContext } = React;
                
                  // Define the App component from the generated code
                  ${processedJsCode}
                  
                  // Find the root element - if not explicit in HTML, use a default root
                  const rootElement = document.getElementById('root');
                  if (rootElement && typeof App === 'function') {
                    try {
                      // Check if a root already exists
                      if (window._reactRoot) {
                        // Update existing root
                        window._reactRoot.render(React.createElement(App));
                      } else if (typeof ReactDOM.createRoot === 'function') {
                        // React 18 - create new root
                        window._reactRoot = ReactDOM.createRoot(rootElement);
                        window._reactRoot.render(React.createElement(App));
                      } else {
                        // React 17 fallback
                        ReactDOM.render(React.createElement(App), rootElement);
                      }
                      console.log('App rendered successfully');
                    } catch (err) {
                      console.error('Error rendering App:', err);
                      rootElement.innerHTML = '<div style="color: red; padding: 1rem; background: rgba(255,0,0,0.1); border: 1px solid red;">Error rendering component: ' + err.message + '</div>';
                    }
                  } else if (!rootElement) {
                    console.error('Root element not found');
                    document.body.innerHTML += '<div style="color: red; padding: 1rem; background: rgba(255,0,0,0.1); border: 1px solid red;">Error: No root element found.</div>';
                  } else if (typeof App !== 'function') {
                    console.error('App is not a function');
                    document.body.innerHTML += '<div style="color: red; padding: 1rem; background: rgba(255,0,0,0.1); border: 1px solid red;">Error: App component is not defined as a function.</div>';
                    
                    // Try to automatically create an App function if missing
                    try {
                      // Define a basic App function that will show the error but allow the preview to initialize
                      window.App = function() {
                        return React.createElement('div', {
                          className: 'vads-l-grid-container vads-u-padding--3'
                        }, [
                          React.createElement('va-alert', {
                            status: 'error',
                            visible: true,
                            key: 'error-alert'
                          }, [
                            React.createElement('span', {
                              slot: 'headline',
                              key: 'headline'
                            }, 'App Function Missing'),
                            React.createElement('p', {
                              key: 'message'
                            }, 'Your code needs to define an App function component. Please check your JavaScript code and ensure a proper App component is defined.')
                          ])
                        ]);
                      };
                      
                      // Try rendering the auto-created App
                      if (typeof ReactDOM.createRoot === 'function') {
                        window._reactRoot = ReactDOM.createRoot(rootElement);
                        window._reactRoot.render(React.createElement(window.App));
                      } else {
                        ReactDOM.render(React.createElement(window.App), rootElement);
                      }
                    } catch (recoverErr) {
                      console.error('Failed to create recovery App component:', recoverErr);
                    }
                  }
                } catch (err) {
                  console.error('Script error:', err);
                  document.body.innerHTML += '<div style="color: red; padding: 1rem; background: rgba(255,0,0,0.1); border: 1px solid red;">Script error: ' + err.message + '</div>';
                }
              };

              // Try to render when document is ready
              if (document.readyState === 'complete' || document.readyState === 'interactive') {
                setTimeout(renderUserApp, 100);
              } else {
                document.addEventListener('DOMContentLoaded', () => {
                  setTimeout(renderUserApp, 100);
                });
              }

              // Also render when VA components are ready
              document.addEventListener('va-components-ready', renderUserApp);
            })();
          </script>
        </body>
        </html>
      `;
      
      // Add event listener for iframe loaded message
      const handleIframeMessage = (event) => {
        if (event.data === 'preview-loaded') {
          console.log('Preview loaded successfully');
          setIsPreviewLoading(false); // Turn off loading indicator when preview is ready
        } else if (event.data === 'preview-error') {
          console.error('Preview loading error');
          setIsPreviewLoading(false);
        }
      };
      
      window.addEventListener('message', handleIframeMessage);
      
      // Try using srcdoc first (most reliable)
      try {
        iframe.srcdoc = html;
        console.log("Preview HTML set using srcdoc");
        
        // Set a timeout to stop loading if the iframe doesn't respond
        setTimeout(() => {
          setIsPreviewLoading(false);
        }, 5000);
        
        return;
      } catch (srcdocError) {
        console.warn("srcdoc failed, trying document.write approach:", srcdocError);
      }
      
      // Fallback to document.write method
      try {
        iframe.src = 'about:blank'; // Reset the iframe
        setTimeout(() => {
          try {
            const doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
            if (doc) {
              doc.open();
              doc.write(html);
              doc.close();
              console.log("Preview HTML written using document.write");
              
              // Set a timeout to stop loading if the iframe doesn't respond
              setTimeout(() => {
                setIsPreviewLoading(false);
              }, 5000);
            } else {
              console.error("Could not access iframe document");
              setIsPreviewLoading(false);
            }
          } catch (docWriteError) {
            console.error('Error writing to iframe:', docWriteError);
            setIsPreviewLoading(false);
          }
        }, 50);
      } catch (error) {
        console.error('Error updating preview:', error);
        setIsPreviewLoading(false);
      }
    } catch (error) {
      console.error('Error in updatePreview:', error);
      setIsPreviewLoading(false);
    }
  };

  // Parse generated code into separate HTML, CSS, and JS
  const parseGeneratedCode = (code) => {
    // Default values - use current values if they exist
    let parsedHtml = htmlCode || '<!-- No HTML content generated -->';
    let parsedCss = cssCode || '/* No CSS content generated */';
    let parsedJs = code || '// No JavaScript content generated';

    try {
      // Make sure code is always a string
      if (!code || typeof code !== 'string') {
        console.warn("Invalid code provided to parseGeneratedCode:", code);
        return { parsedHtml, parsedCss, parsedJs };
      }
      
      console.log("Parsing generated code, length:", code.length);

      // More robust App component pattern matching
      const appComponentPattern = /function\s+App\s*\(|const\s+App\s*=|class\s+App\s+extends|var\s+App\s*=|let\s+App\s*=|export\s+function\s+App|export\s+default\s+function\s+App|export\s+const\s+App|export\s+default\s+class\s+App/i;
      const hasAppComponent = appComponentPattern.test(code);
      
      if (!hasAppComponent) {
        console.warn("Code does not contain an App component. Will attempt to add one.");
        // Still proceed with extraction to find any elements or styles
      }
      
      // Extract HTML content if present (look for JSX in the return statement)
      const returnMatch = code.match(/return\s*\(\s*(<[\s\S]*>[\s\S]*<\/[\s\S]*>)\s*\);/m);
      if (returnMatch && returnMatch[1]) {
        parsedHtml = returnMatch[1];
        console.log("Found HTML content in JSX return statement");
      } else {
        // First try to match a top level div
        const htmlMatch = code.match(/<div[^>]*>[\s\S]*?<\/div>/m);
        if (htmlMatch) {
          parsedHtml = htmlMatch[0];
          console.log("Found HTML content using fallback regex");
        } else {
          // Try to match any valid HTML tag
          const anyTagMatch = code.match(/<[a-zA-Z][^>]*>[\s\S]*?<\/[a-zA-Z][^>]*>/m);
          if (anyTagMatch) {
            parsedHtml = anyTagMatch[0];
            console.log("Found HTML content using any tag fallback regex");
          } else {
            // If we didn't find any HTML, keep the existing HTML
            console.log("No HTML content found in code, keeping existing HTML");
          }
        }
      }

      // Extract CSS if present (look for style blocks)
      const cssMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/);
      if (cssMatch) {
        parsedCss = cssMatch[1];
        console.log("Found CSS content in style tags");
      } else {
        // Look for CSS assignments
        const cssAssignmentMatch = code.match(/const\s+styles\s*=\s*{([^}]*)}/);
        if (cssAssignmentMatch) {
          parsedCss = `/* Styles extracted from JS */\n.component {\n${cssAssignmentMatch[1]}\n}`;
          console.log("Found CSS content in styles object");
        } else {
          // If we didn't find any CSS, keep the existing CSS
          console.log("No CSS content found in code, keeping existing CSS");
        }
      }
      
      // Clean up JS to make it more compatible with inline Babel transformation
      parsedJs = code
        // Remove all export variations
        .replace(/export\s+default\s+App\s*;?/g, '')
        .replace(/export\s+default\s+function\s+App/g, 'function App')
        .replace(/export\s+function\s+App/g, 'function App')
        .replace(/export\s+const\s+App\s*=/g, 'const App =')
        .replace(/export\s+default\s+class\s+App/g, 'class App')
        .replace(/export\s+class\s+App/g, 'class App')
        .replace(/export\s+default\s+/g, '')
        .replace(/export\s+/g, '')
        // Remove all import variations
        .replace(/import\s+React\s*,?\s*{\s*[^}]*\s*}\s*from\s+['"]react['"];?/g, '/* React import removed */')
        .replace(/import\s+React\s+from\s+['"]react['"];?/g, '/* React import removed */')
        .replace(/import\s+{\s*[^}]*\s*}\s*from\s+['"]react['"];?/g, '/* React import removed */')
        .replace(/import\s+[^;]+;?/g, '/* import removed */');
      
      // Ensure App component exists - only create it if we found HTML but no App component
      if (!hasAppComponent && parsedHtml !== '<!-- No HTML content generated -->' && parsedHtml !== htmlCode) {
        parsedJs = `// Auto-generated App wrapper component
function App() {
  // Make React hooks available
  const { useState, useEffect, useRef, useCallback, useMemo } = React;
  
  return (
    <div className="vads-l-grid-container">
      ${parsedHtml}
    </div>
  );
}
        
// Original code:
${parsedJs}`;
      } else if (!hasAppComponent) {
        // No App component and no valid HTML found - create a basic App component 
        parsedJs = `// Auto-generated App wrapper component
function App() {
  // Make React hooks available
  const { useState, useEffect, useRef, useCallback, useMemo } = React;
  
  return (
    <div className="vads-l-grid-container vads-u-padding--3">
      <va-alert status="info" visible>
        <span slot="headline">Component Generated</span>
        <p>Your code has been wrapped in an App component.</p>
      </va-alert>
      <div className="vads-u-padding-top--3">
        ${parsedJs.includes('<') && parsedJs.includes('>') ? parsedJs : `<pre>${parsedJs.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`}
      </div>
    </div>
  );
}`;
      }
      
      console.log("Parsing complete - HTML:", parsedHtml.length, "CSS:", parsedCss.length, "JS:", parsedJs.length);
    } catch (error) {
      console.error('Error parsing generated code:', error);
      // Fall back to just showing everything as JS
      parsedJs = code || '// No JavaScript content generated';
    }

    return { parsedHtml, parsedCss, parsedJs };
  };

  // Generate code based on user prompt
  const handleGenerateCode = async () => {
    if (!prompt || !prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    // If we're not showing results yet, initialize with loading placeholders
    if (!showResults) {
      setHtmlCode('<!-- Generating HTML... -->');
      setCssCode('/* Generating CSS... */');
      setJsCode('// Generating JavaScript...');
      
      // Immediately show results
      setShowResults(true);
    }
    
    // Add user message to chat
    setChatMessages(prev => [...prev, { role: 'user', content: prompt }]);
    
    // Add a more conversational acknowledgment message
    const acknowledgeMessages = [
      "I'll work on that for you right away...",
      "Sure, I'm creating that component now...",
      "I understand, building your VA component now...",
      "Got it! Working on your request...",
      "I'll help you with that. Creating your component..."
    ];
    const randomAcknowledge = acknowledgeMessages[Math.floor(Math.random() * acknowledgeMessages.length)];
    
    setChatMessages(prev => [...prev, { role: 'assistant', content: randomAcknowledge, isLoading: true }]);
    
    try {
      console.log("Starting code generation with prompt:", prompt);
      console.log("Selected components:", selectedComponents);
      console.log("Conversation context:", conversationContext);
      
      const startTime = Date.now();
      
      // Include previous code context for follow-up prompts
      const contextData = {
        components: selectedComponents,
        previousCode: conversationContext.lastGeneratedCode,
        isFollowUp: conversationContext.lastGeneratedCode !== null,
        previousPrompts: chatMessages
          .filter(msg => msg.role === 'user')
          .map(msg => msg.content)
      };
      
      await generateVACode(
        prompt,
        {
          ...contextData,
          onProgress: (message) => {
            // Update the streaming message in chat with better UX
            setChatMessages(prev => {
              const newMessages = [...prev];
              
              // Find the last loading or streaming message
              const lastStreamingIndex = newMessages.findLastIndex(
                msg => msg.isLoading || msg.isStreaming
              );
              
              if (lastStreamingIndex !== -1) {
                newMessages[lastStreamingIndex] = {
                  role: 'assistant',
                  content: message,
                  isStreaming: true
                };
              } else {
                // If none found, add a new streaming message
                newMessages.push({
                  role: 'assistant',
                  content: message,
                  isStreaming: true
                });
              }
              
              return newMessages;
            });
          },
          onComplete: (code, explanation) => {
            const elapsedTime = ((Date.now() - startTime) / 1000);
            console.log(`Code generation completed in ${elapsedTime}s with ${code.length} characters`);
            
            // Save this code to the conversation context
            setConversationContext({
              lastGeneratedCode: code,
              componentHistory: [...conversationContext.componentHistory, {
                prompt,
                code,
                timestamp: new Date().toISOString()
              }]
            });
            
            // Parse the generated code into HTML, CSS, and JS parts
            const { parsedHtml, parsedCss, parsedJs } = parseGeneratedCode(code);
            
            // Update the code states
            setHtmlCode(parsedHtml);
            setCssCode(parsedCss);
            setJsCode(parsedJs);
            
            // Find and replace any streaming/loading messages with the final success message
            setChatMessages(prev => {
              // Filter out all streaming and loading messages
              const newMessages = prev.filter(
                msg => !msg.isStreaming && !msg.isLoading
              );
              
              // More conversational success messages
              const successMessages = [
                `I've created that component for you! ${explanation || "Take a look at the preview."}`,
                `Your component is ready! ${explanation || "I think this will work well for your needs."}`,
                `All done! ${explanation || "The component is now available in the preview panel."}`,
                `Finished creating your component. ${explanation || "Let me know if you'd like any changes!"}`,
                `Here's the component you requested. ${explanation || "Feel free to ask if you need any adjustments."}`
              ];
              const randomSuccessMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
              
              // Add success message with just the explanation, not the code
              newMessages.push({ 
                role: 'assistant', 
                content: randomSuccessMessage,
                isSuccess: true,
                generatedCode: code // Store code in the message but don't display it in chat
              });
              
              return newMessages;
            });
            
            // Update the preview with the generated code
            setTimeout(() => {
              updatePreview();
            }, 300);
          },
          onError: (err) => {
            console.error("Error in code generation:", err);
            
            // Replace loading message with error message
            setChatMessages(prev => {
              const newMessages = prev.filter(msg => !msg.isStreaming && !msg.isLoading);
              
              // Add error message
              newMessages.push({ 
                role: 'assistant', 
                content: `Error: ${err.message || 'An error occurred while generating code'}`,
                isError: true
              });
              
              return newMessages;
            });
            
            setError(err.message || 'An error occurred while generating code');
          }
        }
      );
    } catch (err) {
      console.error("Exception in handleGenerateCode:", err);
      
      // Replace loading message with error message
      setChatMessages(prev => {
        const newMessages = prev.filter(msg => !msg.isStreaming && !msg.isLoading);
        
        newMessages.push({ 
          role: 'assistant', 
          content: 'Sorry, there was an error processing your request.',
          isError: true
        });
        
        return newMessages;
      });
      
      setError(err.message || 'An error occurred while generating code');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle sending messages after initial generation
  const handleSendMessage = async (message) => {
    // Add user message to chat
    setChatMessages(prev => [...prev, { role: 'user', content: message }]);
    
    // Add a more conversational acknowledgment
    const loadingMessages = [
      "I'll handle that modification for you...",
      "Sure, I'll update the component...",
      "Got it, making those changes now...",
      "I understand, updating your component...",
      "I'll apply those changes for you..."
    ];
    const randomLoadingMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
    
    setChatMessages(prev => [...prev, { role: 'assistant', content: randomLoadingMessage, isLoading: true }]);
    
    try {
      // Create context data for follow-up modifications
      const contextData = {
        components: selectedComponents,
        previousCode: conversationContext.lastGeneratedCode || jsCode,
        isFollowUp: true,
        previousPrompts: chatMessages
          .filter(msg => msg.role === 'user')
          .map(msg => msg.content),
        currentCode: {
          html: htmlCode,
          css: cssCode,
          js: jsCode
        }
      };
      
      await generateVACode(
        message,
        {
          ...contextData,
          onProgress: (message) => {
            // Update the streaming message in chat without showing code
            setChatMessages(prev => {
              const newMessages = [...prev];
              
              // Find the last loading message and replace it
              const loadingMsgIndex = newMessages.findIndex(msg => msg.isLoading);
              if (loadingMsgIndex !== -1) {
                newMessages[loadingMsgIndex] = {
                  role: 'assistant',
                  content: message,
                  isLoading: false,
                  isStreaming: true
                };
              } else {
                // Or add a new message if no loading message exists
                newMessages.push({
                  role: 'assistant',
                  content: message,
                  isStreaming: true
                });
              }
              
              return newMessages;
            });
          },
          onComplete: (code, explanation) => {
            // Save this code to the conversation context
            setConversationContext({
              lastGeneratedCode: code,
              componentHistory: [...conversationContext.componentHistory, {
                prompt: message,
                code,
                timestamp: new Date().toISOString()
              }]
            });
            
            // Parse the generated code into HTML, CSS, and JS parts
            const { parsedHtml, parsedCss, parsedJs } = parseGeneratedCode(code);
            
            // Update the code states
            setHtmlCode(parsedHtml);
            setCssCode(parsedCss);
            setJsCode(parsedJs);
            
            // Find and remove any streaming messages
            setChatMessages(prev => {
              const newMessages = prev.filter(msg => !msg.isStreaming && !msg.isLoading);
              
              // More conversational success messages
              const successMessages = [
                "I've updated your component! Take a look at the changes.",
                "Your component has been modified as requested. Let me know what you think!",
                "All changes applied! Check out the preview to see how it looks.",
                "Done! I've made those changes to your component.",
                "The component has been updated. Let me know if you need any more adjustments!"
              ];
              const randomSuccessMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
              
              // Add final success message
              newMessages.push({ 
                role: 'assistant', 
                content: randomSuccessMessage,
                isSuccess: true,
                generatedCode: code // Store but don't display in chat
              });
              
              return newMessages;
            });
            
            // Update the preview
            setTimeout(() => {
              updatePreview();
            }, 300);
          },
          onError: (err) => {
            // Replace loading message with error message
            setChatMessages(prev => {
              const newMessages = prev.filter(msg => !msg.isStreaming && !msg.isLoading);
              
              // More conversational error messages
              const errorMessages = [
                `I ran into a problem: ${err.message || 'There was an error processing your request'}`,
                `Sorry, I couldn't complete that: ${err.message || 'Something went wrong'}`,
                `I wasn't able to make those changes: ${err.message || 'An error occurred'}`,
                `There was an issue updating your component: ${err.message || 'Please try again'}`,
                `I hit a snag while working on that: ${err.message || 'There was a technical problem'}`
              ];
              const randomErrorMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];
              
              // Add error message
              newMessages.push({ 
                role: 'assistant', 
                content: randomErrorMessage,
                isError: true
              });
              
              return newMessages;
            });
            
            setError(err.message || 'An error occurred while processing your request');
          }
        }
      );
    } catch (err) {
      console.error(err);
      
      // Replace loading message with error message
      setChatMessages(prev => {
        const newMessages = prev.filter(msg => !msg.isStreaming && !msg.isLoading);
        
        // Add error message with casual, conversational tone
        newMessages.push({ 
          role: 'assistant', 
          content: "Sorry, I wasn't able to process that request. Can you try again or maybe phrase it differently?",
          isError: true
        });
        
        return newMessages;
      });
      
      setError(err.message || 'An error occurred while processing your request');
    }
  };

  const toggleComponent = (id) => {
    // Use functional update to ensure we're working with the latest state
    setSelectedComponents(prev => {
      // If this ID already exists in the array, remove it
      if (prev.includes(id)) {
        return prev.filter(component => component !== id);
      } else {
        // Otherwise, add it to the array
        return [...prev, id];
      }
    });
  };
  
  // Auto-generate code when component selection changes
  useEffect(() => {
    // Disable auto-generation to avoid infinite loop issues
    // Only use manual prompt submission instead
    
    // if (selectedComponents.length > 0) {
    //   // Only update the prompt if it's different from the current one
    //   // to prevent unnecessary re-renders
    //   const compPrompt = `Generate a VA page using these components: ${selectedComponents.join(', ')}`;
    //   
    //   // Prevent infinite loop by checking if the prompt would change
    //   if (prompt !== compPrompt) {
    //     setPrompt(compPrompt);
    //   }
    // }
    
    // Instead, just update the prompt text but don't trigger generation
    if (selectedComponents.length > 0) {
      const compPrompt = `Generate a VA page using these components: ${selectedComponents.join(', ')}`;
      if (prompt !== compPrompt) {
        setPrompt(compPrompt);
      }
    }
    
    // Removed prompt from dependencies to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedComponents]);

  const handleTemplateClick = (templatePrompt) => {
    // Enhanced template prompts for better results
    let fullPrompt = "";
    
    if (templatePrompt.includes("VA contact form")) {
      fullPrompt = "Create a comprehensive VA contact form page with validation, clear instructions, success messages, and proper VA form layout.";
    } 
    else if (templatePrompt.includes("benefits")) {
      fullPrompt = "Create a detailed VA benefits dashboard that shows multiple benefit types, status indicators, and relevant veteran information.";
    }
    else if (templatePrompt.includes("documents")) {
      fullPrompt = "Create a VA document upload form with dropzone, file validation, progress indicators, and submission confirmation.";
    }
    else if (templatePrompt.includes("landing page")) {
      fullPrompt = "Create a VA service landing page with hero section, benefit highlights, eligibility information, and application steps.";
    }
    else if (templatePrompt.includes("multi-step flow")) {
      fullPrompt = "Create a multi-step education benefits application flow with progress tracking, form validation, and save functionality.";
    }
    else {
      fullPrompt = templatePrompt;
    }
    
    setPrompt(fullPrompt);
  };

  const handleBack = () => {
    setShowResults(false);
    // Reset state if needed
    // setPrompt('');
    // setChatMessages([]);
    // setSelectedComponents([]);
  };

  return (
    <main className="main-container">
      <header className="header">
        <h1 className="title">VA Component Builder</h1>
      </header>

      <div className="content-container">
        {!showResults && (
          <div className="tabs">
            <button 
              className={`tab ${activeSection === 'builder' ? 'active' : ''}`} 
              onClick={() => setActiveSection('builder')}
            >
              Build Components
            </button>
            <button 
              className={`tab ${activeSection === 'pdf' ? 'active' : ''}`} 
              onClick={() => setActiveSection('pdf')}
            >
              PDF Import
            </button>
            <button 
              className={`tab ${activeSection === 'figma' ? 'active' : ''}`} 
              onClick={() => setActiveSection('figma')}
            >
              Figma Import
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {showResults ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="editor-view-container" 
              style={{
                width: '100%',
                height: '100vh',
                margin: 0,
                padding: 0,
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <AICodeEditor 
                initialCode={jsCode}
                onBack={handleBack}
                chatMessages={chatMessages}
                onSendMessage={handleSendMessage}
                isGenerating={isGenerating}
                isPreviewLoading={isPreviewLoading}
              />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="tab-content"
            >
              {activeSection === 'builder' && (
                <div className="builder-content">
                  <div className="heading-container">
                    <h2 className="section-heading">What can I help you ship?</h2>
                    <p className="section-description">
                      Ask VA agent to build something...
                    </p>
                  </div>

                  <div className="prompt-container">
                    <textarea
                      className="prompt-input"
                      placeholder="E.g., Create a form for veterans to submit feedback with fields for name, email, and message."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                    ></textarea>
                    
                    <div className="prompt-footer">
                      <div className="tools">
                        <button className="tool-button">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 16L8 12L4 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 20H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M9 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M12 4H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                        <button className="tool-button">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                            <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M12 8L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                      
                      <button 
                        className="send-button"
                        onClick={handleGenerateCode}
                        disabled={isGenerating || !prompt.trim()}
                      >
                        {isGenerating ? 'Generating...' : (
                          <>
                            Send
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="template-shortcuts">
                    <div className="shortcut-card" onClick={() => handleTemplateClick('VA contact form template with validation')}>
                      <div className="icon document-icon"></div>
                      <div className="shortcut-name">VA Contact Form</div>
                    </div>
                    
                    <div className="shortcut-card" onClick={() => handleTemplateClick('Dashboard for benefit status tracking')}>
                      <div className="icon dashboard-icon"></div>
                      <div className="shortcut-name">Benefits Dashboard</div>
                    </div>
                    
                    <div className="shortcut-card" onClick={() => handleTemplateClick('Form for uploading and submitting documents')}>
                      <div className="icon upload-icon"></div>
                      <div className="shortcut-name">Document Upload</div>
                    </div>
                    
                    <div className="shortcut-card" onClick={() => handleTemplateClick('Program or service landing page')}>
                      <div className="icon page-icon"></div>
                      <div className="shortcut-name">Landing Page</div>
                    </div>
                    
                    <div className="shortcut-card" onClick={() => handleTemplateClick('Create a multi-step flow for applying for education benefits, including user authentication simulation, form progress saving, and a final review step.')}>
                      <div className="icon complex-icon"></div>
                      <div className="shortcut-name">Complex Prompt</div>
                    </div>
                  </div>

                  <div className="section">
                    <div className="section-header">
                      <h3>VA Layout Templates</h3>
                      <a href="#" className="view-all">View All</a>
                    </div>
                    
                    <div className="templates-grid">
                      <div className="template-card">
                        <div className="template-icon document-icon"></div>
                        <h4>VA Contact Form</h4>
                        <p>VA contact form template with validation</p>
                        <a href="#" className="template-link">View template →</a>
                      </div>
                      
                      <div className="template-card">
                        <div className="template-icon layout-icon"></div>
                        <h4>Single Column Layout</h4>
                        <p>A simple single column layout for content-focused pages</p>
                        <a href="#" className="template-link">View template →</a>
                      </div>
                      
                      <div className="template-card">
                        <div className="template-icon dashboard-icon"></div>
                        <h4>VA Dashboard</h4>
                        <p>Dashboard template with multiple panels for VA healthcare</p>
                        <a href="#" className="template-link">View template →</a>
                      </div>
                    </div>
                  </div>

                  <div className="section">
                    <div className="section-header">
                      <h3>Component Gallery</h3>
                    </div>
                    
                    <div className="component-gallery">
                      <ComponentGallerySelector onComponentsSelected={handleComponentsSelected} />
                    </div>
                  </div>
                </div>
              )}
              
              {activeSection === 'pdf' && (
                <div className="pdf-content">
                  <div className="heading-container">
                    <h2 className="section-heading">Generate from PDF Form</h2>
                    <p className="section-description">
                      Upload a VA PDF form to automatically generate a digital equivalent.
                    </p>
                  </div>
                  
                  <PdfUploader onFormGenerated={handleFormGenerated} />
                </div>
              )}
              
              {activeSection === 'figma' && (
                <div className="figma-content">
                  <div className="heading-container">
                    <h2 className="section-heading">Import from Figma (Experimental)</h2>
                    <p className="section-description">
                      Connect to Figma to import designs directly into code.
                    </p>
                  </div>
                  
                  <div className="figma-import-container">
                    <div className="info-banner">
                      <div className="info-icon">ⓘ</div>
                      <div>
                        <h3>Import Components from Figma</h3>
                        <p>Connect to your Figma design file to import components directly into your generated page.</p>
                      </div>
                    </div>
                    
                    <div className="form-section">
                      <label>Figma Personal Access Token</label>
                      <input type="text" className="text-input" />
                      <a href="#" className="help-link">How to get a Figma access token</a>
                    </div>
                    
                    <div className="form-section">
                      <label>Figma File URL</label>
                      <input type="text" className="text-input" />
                    </div>
                    
                    <button className="action-button">Connect to Figma</button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .main-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          min-height: 100vh;
          background-color: #f9f9fa;
        }
        
        .header {
          background-color: white;
          padding: 20px 0;
          text-align: center;
          border-bottom: 1px solid #dfe1e2;
        }
        
        .title {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          color: #212121;
        }
        
        .content-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 16px;
          width: 100%;
        }
        
        .tabs {
          display: flex;
          border: 1px solid #dfe1e2;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 32px;
          background-color: #f1f1f1;
        }
        
        .tab {
          flex: 1;
          padding: 16px;
          background: none;
          border: none;
          font-size: 16px;
          font-weight: 500;
          color: #212121;
          cursor: pointer;
          transition: background-color 0.2s;
          text-align: center;
        }
        
        .tab:not(:last-child) {
          border-right: 1px solid #dfe1e2;
        }
        
        .tab:hover {
          background-color: #e6e6e6;
        }
        
        .tab.active {
          background-color: white;
          font-weight: 600;
          color: #0071bb;
        }
        
        .tab-content {
          width: 100%;
        }
        
        .heading-container {
          margin-bottom: 24px;
        }
        
        .section-heading {
          font-size: 28px;
          font-weight: 600;
          color: #212121;
          margin: 0 0 8px;
        }
        
        .section-description {
          font-size: 16px;
          color: #5d5d5d;
          margin: 0;
        }
        
        .prompt-container {
          background-color: white;
          border-radius: 8px;
          border: 1px solid #dfe1e2;
          overflow: hidden;
          margin-bottom: 32px;
        }
        
        .prompt-input {
          width: 100%;
          border: none;
          resize: none;
          padding: 16px;
          font-size: 16px;
          font-family: inherit;
          min-height: 100px;
        }
        
        .prompt-input:focus {
          outline: none;
        }
        
        .prompt-footer {
          display: flex;
          justify-content: space-between;
          padding: 8px 16px;
          border-top: 1px solid #dfe1e2;
          background-color: #f9f9fa;
        }
        
        .tools {
          display: flex;
          gap: 8px;
        }
        
        .tool-button {
          background: none;
          border: none;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #5d5d5d;
          cursor: pointer;
          border-radius: 4px;
        }
        
        .tool-button:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        
        .send-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #0071bb;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .send-button:hover:not(:disabled) {
          background-color: #005ea2;
        }
        
        .send-button:disabled {
          background-color: #aeb0b5;
          cursor: not-allowed;
        }
        
        .template-shortcuts {
          display: flex;
          gap: 16px;
          margin-bottom: 40px;
          justify-content: center;
        }
        
        .shortcut-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px;
          background-color: white;
          border-radius: 8px;
          border: 1px solid #dfe1e2;
          cursor: pointer;
          transition: all 0.2s;
          width: 110px;
        }
        
        .shortcut-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-color: #0071bb;
        }
        
        .icon {
          width: 48px;
          height: 48px;
          border-radius: 4px;
          background-color: #e1f3f8;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .shortcut-name {
          font-size: 14px;
          font-weight: 500;
          text-align: center;
        }
        
        .section {
          margin-bottom: 40px;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .section-header h3 {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }
        
        .view-all {
          color: #0071bb;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
        }
        
        .templates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }
        
        .template-card {
          background-color: white;
          border-radius: 8px;
          padding: 24px;
          border: 1px solid #dfe1e2;
          transition: all 0.2s;
        }
        
        .template-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-color: #0071bb;
        }
        
        .template-icon {
          width: 48px;
          height: 48px;
          border-radius: 4px;
          background-color: #e1f3f8;
          margin-bottom: 16px;
        }
        
        .template-card h4 {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 8px;
          color: #0071bb;
        }
        
        .template-card p {
          font-size: 14px;
          color: #5d5d5d;
          margin: 0 0 16px;
        }
        
        .template-link {
          color: #0071bb;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
        }
        
        .component-gallery {
          background-color: white;
          border-radius: 8px;
          padding: 24px;
          border: 1px solid #dfe1e2;
        }
        
        .component-description {
          margin: 0 0 16px;
          font-size: 16px;
          color: #5d5d5d;
        }
        
        /* PDF Import Tab Styles */
        .pdf-processor {
          background-color: white;
          border-radius: 8px;
          padding: 24px;
          border: 1px solid #dfe1e2;
        }
        
        .pdf-processor h3 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 24px;
        }
        
        .form-section {
          margin-bottom: 24px;
        }
        
        .form-section h4 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 12px;
        }
        
        .file-input {
          display: block;
          margin-bottom: 8px;
        }
        
        .action-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .action-button {
          background-color: #f1f1f1;
          border: 1px solid #dfe1e2;
          border-radius: 4px;
          padding: 8px 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .action-button:hover {
          background-color: #e6e6e6;
        }
        
        .action-button.primary {
          background-color: #0071bb;
          color: white;
          border-color: #0071bb;
        }
        
        .action-button.primary:hover {
          background-color: #005ea2;
        }
        
        /* Figma Import Tab Styles */
        .figma-import-container {
          background-color: white;
          border-radius: 8px;
          padding: 24px;
          border: 1px solid #dfe1e2;
        }
        
        .info-banner {
          display: flex;
          gap: 16px;
          background-color: #e1f3f8;
          border-radius: 4px;
          padding: 16px;
          margin-bottom: 24px;
          align-items: center;
        }
        
        .info-icon {
          font-size: 24px;
          color: #0071bb;
        }
        
        .info-banner h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px;
        }
        
        .info-banner p {
          font-size: 14px;
          margin: 0;
        }
        
        .text-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #dfe1e2;
          border-radius: 4px;
          font-size: 16px;
        }
        
        .help-link {
          display: inline-block;
          margin-top: 8px;
          color: #0071bb;
          font-size: 14px;
        }
        
        /* Editor view */
        .editor-view-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 50;
          background-color: white;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
        }
      `}</style>
    </main>
  );
}
