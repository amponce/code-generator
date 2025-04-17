'use client';

import React, { useState, useEffect, useRef } from "react";
import { generateVACode } from '../../lib/openai';
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import beautify from "js-beautify";
import { DEFAULT_REACT_CODE, DEFAULT_HTML_CODE, DEFAULT_CSS_CODE } from "../components/constants";
// Import core EditorView for basic theming
import { EditorView } from '@codemirror/view';

// Create a more readable dark theme that matches the screenshot
const darkTheme = EditorView.theme({
  // Base editor styling
  '.cm-editor': {
    backgroundColor: '#1e1e1e !important',
    color: '#d4d4d4 !important',
    height: '100%',
    width: '100%',
    padding: '0 !important',
    margin: '0 !important',
  },
  '&': {
    color: '#d4d4d4',
    height: '100%',
  },
  '.cm-scroller': {
    overflow: 'auto',
    padding: '0 !important',
    margin: '0 !important',
    width: '100%',
  },
  '.cm-content': {
    caretColor: '#aeafad',
    padding: '0 !important',
    margin: '0 !important',
    width: '100%',
  },
  '.cm-line': {
    backgroundColor: '#1e1e1e !important',
    color: '#d4d4d4 !important',
    padding: '0 10px !important',
  },
  '.cm-cursor': {
    borderLeftColor: '#aeafad',
  },
  '.cm-activeLine': {
    backgroundColor: '#2c313a',
  },
  '.cm-gutters': {
    backgroundColor: '#1e1e1e',
    color: '#858585',
    border: 'none',
    padding: '0 5px 0 5px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#2c313a',
  },
  // Syntax highlighting
  '.cm-keyword': { color: '#c678dd !important' }, // purple for keywords
  '.cm-operator': { color: '#c678dd !important' }, // purple for operators
  '.cm-variable': { color: '#e06c75 !important' }, // pinkish for variables
  '.cm-function': { color: '#61afef !important' }, // light blue for functions
  '.cm-string': { color: '#98c379 !important' }, // green for strings
  '.cm-number': { color: '#d19a66 !important' }, // orange for numbers
  '.cm-comment': { color: '#5c6370 !important', fontStyle: 'italic' }, // gray for comments
  '.cm-property': { color: '#e06c75 !important' }, // pinkish for properties
  '.cm-def': { color: '#61afef !important' }, // light blue for definitions
  '.cm-punctuation': { color: '#abb2bf !important' }, // light gray for punctuation
  '.cm-tag': { color: '#e06c75 !important' }, // pinkish for HTML tags
  '.cm-attribute': { color: '#d19a66 !important' }, // orange for attributes
  '.cm-builtin': { color: '#61afef !important' }, // blue for builtins
}, { dark: true });

const AICodeEditor = ({
  initialCode = DEFAULT_REACT_CODE,
  isGenerating = false,
  isPreviewLoading = false,
  jsOnly = false,
  selectedComponents = [],
  onBack = () => {},
  chatMessages = [],
  onSendMessage = null
}) => {
  const [htmlCode, setHtmlCode] = useState(DEFAULT_HTML_CODE);
  const [cssCode, setCssCode] = useState(DEFAULT_CSS_CODE);
  const [jsCode, setJsCode] = useState(initialCode || DEFAULT_REACT_CODE);
  const [activeTab, setActiveTab] = useState("react");
  const [isRunning, setIsRunning] = useState(true);
  const [userMessage, setUserMessage] = useState('');
  const [isStreamingResponse, setIsStreamingResponse] = useState(false);
  const [currentStreamedResponse, setCurrentStreamedResponse] = useState('');
  const messagesEndRef = useRef(null);
  const previewRef = useRef(null);

  // Process initialCode to remove any markdown code ticks
  useEffect(() => {
    if (initialCode) {
      const cleanedCode = initialCode.replace(/```jsx|```js|```javascript|```|jsx/g, "").trim();
      if (cleanedCode !== jsCode) {
        setJsCode(cleanedCode);
      }
    }
  }, [initialCode]);

  // Force trigger editor rerender on mount and ensure default code values
  useEffect(() => {
    if (!htmlCode || htmlCode.trim() === "") {
      setHtmlCode(DEFAULT_HTML_CODE);
    }
    if (!cssCode || cssCode.trim() === "") {
      setCssCode(DEFAULT_CSS_CODE);
    }
    if (!jsCode || jsCode.trim() === "") {
      setJsCode(initialCode || DEFAULT_REACT_CODE);
    }
    
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    // Prevent aggressive scrolling behavior
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }, [chatMessages, currentStreamedResponse]);

  // Generate preview content based on the code in all editors
  const generatePreviewContent = (htmlCode, cssCode, jsCode) => {
    // Ensure we have valid content
    const safeHtmlCode = htmlCode && htmlCode.trim() ? htmlCode : '<div id="root"></div>';
    const safeCssCode = cssCode && cssCode.trim() ? cssCode : '/* Default CSS */';
    let safeJsCode = jsCode && jsCode.trim() ? jsCode : '// Default JS';
    
    // Clean up any markdown code ticks that might be in the generated code
    safeJsCode = safeJsCode.replace(/```jsx|```js|```javascript|```|jsx/g, "").trim();
    
    return `
      <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>VA The Preview</title>

            <!-- VA Design System CSS -->
            <link rel="stylesheet" href="https://unpkg.com/@department-of-veterans-affairs/web-components/dist/main.css" />

            <!-- React and Babel -->
            <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
            <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
            <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

            <style>
              /* Base styles for proper display */
              html {
                height: auto;
                overflow: visible;
              }
              body {
                min-height: 100%;
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                overflow: visible;
                background-color: #ffffff;
                color: #323a45;
                font-family: Source Sans Pro, Helvetica Neue, Helvetica, Roboto, Arial, sans-serif;
              }

              /* Make sure code blocks are scrollable */
              pre,
              code {
                white-space: pre;
                overflow-x: auto;
                max-width: 100%;
                display: block;
              }

              /* Custom user styles */
              ${safeCssCode}
            </style>
          </head>
          <body>
            <!-- Component HTML -->
            ${safeHtmlCode}

            <!-- VA Web Components -->
            <script type="module">
              console.log("Initializing VA components integration");
              
              import { defineCustomElements } from 'https://unpkg.com/@department-of-veterans-affairs/web-components@latest/loader/index.js';
              defineCustomElements()
                .then(() => {
                  console.log('VA Components defined and ready');
                  document.dispatchEvent(new CustomEvent('va-components-ready'));
                })
                .catch(err => {
                  console.error('Error loading VA components:', err);
                });
            </script>

            <script type="text/babel" id="user-code">
              // Wait for VA components to be ready before rendering user code
              (function() {
                const renderUserApp = () => {
                  try {
                    ${safeJsCode}
                    
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
                        rootElement.innerHTML = '<div style="color: red; padding: 1rem;">Error rendering component: ' + err.message + '</div>';
                      }
                    } else if (!rootElement) {
                      console.error('Root element not found');
                      document.body.innerHTML += '<div style="color: red; padding: 1rem;">Error: No root element found.</div>';
                    } else if (typeof App !== 'function') {
                      console.error('App is not a function');
                      document.body.innerHTML += '<div style="color: red; padding: 1rem;">Error: App component is not defined as a function.</div>';
                    }
                  } catch (err) {
                    console.error('Script error:', err);
                    document.body.innerHTML += '<div style="color: red; padding: 1rem;">Script error: ' + err.message + '</div>';
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
  };

  const updatePreview = () => {
    try {
      console.log("Updating preview");
      const iframe = document.getElementById('preview-frame');
      
      if (!iframe) {
        console.error("Preview iframe not found");
        return;
      }
      
      const content = generatePreviewContent(htmlCode, cssCode, jsCode);
      
      // Use srcdoc for better compatibility
      iframe.srcdoc = content;
      console.log("Preview content set via srcdoc");
    } catch (error) {
      console.error("Error updating preview:", error);
    }
  };

  const formatCode = () => {
    let formattedCode = "";
    let code = "";

    switch (activeTab) {
      case "html":
        code = htmlCode.trim();
        formattedCode = beautify.html(code, { indent_size: 2, wrap_line_length: 80 });
        setHtmlCode(formattedCode);
        break;
      case "css":
        code = cssCode.trim();
        formattedCode = beautify.css(code, { indent_size: 2 });
        setCssCode(formattedCode);
        break;
      case "react":
        code = jsCode.trim();
        formattedCode = beautify.js(code, { indent_size: 2, space_in_empty_paren: true });
        setJsCode(formattedCode);
        break;
    }
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim()) return;
    
    try {
      setIsStreamingResponse(true);
      setCurrentStreamedResponse(''); // Reset streaming response
      
      if (onSendMessage) {
        await onSendMessage(userMessage);
        
        // Set a timer to ensure we don't get stuck in generating state
        setTimeout(() => {
          if (isStreamingResponse) {
            setIsStreamingResponse(false);
            setCurrentStreamedResponse(prev => prev + "\n\nGeneration completed.");
          }
        }, 30000); // 30 second timeout
      } else {
        // Local handling when no callback provided
        console.log("No onSendMessage callback provided");
        setTimeout(() => {
          setIsStreamingResponse(false);
        }, 1000);
      }
      setUserMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setIsStreamingResponse(false);
      // Add the error to the streaming message
      setCurrentStreamedResponse(prev => 
        prev + "\n\nError: " + (error.message || "Failed to generate code")
      );
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderCodeContent = () => {
    switch (activeTab) {
      case "html":
        return (
          <CodeMirror
            value={htmlCode}
            height="100%"
            extensions={[html(), darkTheme]}
            onChange={(value) => setHtmlCode(value)}
            className="code-mirror-wrapper"
          />
        );
      case "css":
        return (
          <CodeMirror
            value={cssCode}
            height="100%"
            extensions={[css(), darkTheme]}
            onChange={(value) => setCssCode(value)}
            className="code-mirror-wrapper"
          />
        );
      case "react":
        return (
          <CodeMirror
            value={jsCode}
            height="100%"
            extensions={[javascript(), darkTheme]}
            onChange={(value) => setJsCode(value)}
            className="code-mirror-wrapper"
          />
        );
      case "preview":
        return (
          <div className="preview-container">
            <div className="preview-header">
              <button 
                className="preview-action-button"
                onClick={updatePreview}
                title="Refresh preview"
              >
                Refresh
              </button>
            </div>
            <div className="preview-iframe-container">
              <iframe 
                id="preview-frame" 
                title="Component Preview" 
                className="preview-iframe"
                sandbox="allow-scripts"
              ></iframe>
              {isPreviewLoading && (
                <div className="preview-loading-overlay">
                  <div className="preview-loading-spinner"></div>
                  <div className="preview-loading-text">Loading preview...</div>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Effect to update preview when switching to the preview tab
  useEffect(() => {
    if (activeTab === "preview") {
      // Delay slightly to ensure the tab switch render completes
      setTimeout(updatePreview, 100);
    }
  }, [activeTab]); // Removed dependencies that might cause premature calls

  // Effect to update code and preview from chat responses
  useEffect(() => {
    if (chatMessages.length > 0) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.isSuccess && lastMessage.generatedCode) {
        const cleanedCode = lastMessage.generatedCode.replace(/```jsx|```js|```javascript|```|jsx/g, "").trim();
        setJsCode(cleanedCode);
        setActiveTab("preview"); // Switch tab *after* setting code

        // updatePreview is now handled by the activeTab useEffect
      }
    }
  }, [chatMessages]); // Dependency only on chatMessages

  return (
    <div className="editor-container">
      {/* Chat Panel (Left) */}
      <div className="chat-panel">
        <div className="chat-header">
          <h3 className="chat-title">VA Generator</h3>
          <button className="back-button" onClick={onBack}>
            ← Back
          </button>
        </div>

        <div className="chat-messages">
          {/* Render existing chat messages */}
          {(chatMessages || []).map((message, index) => (
            <div 
              key={index} 
              className={`chat-message ${message.role === 'user' ? 'user-message' : 'assistant-message'} ${message.isError ? 'error-message' : ''} ${message.isSuccess ? 'success-message' : ''} ${message.isStreaming ? 'streaming-message' : ''}`}
            >
              {message.isLoading ? (
                <div className="loading-message">
                  <span>{message.content}</span>
                  <div className="loading-dots">
                    <span>.</span><span>.</span><span>.</span>
                  </div>
                </div>
              ) : (
                <div>{message.content}</div>
              )}
            </div>
          ))}
          
          {/* Show currently streaming response if any */}
          {isStreamingResponse && (
            <div className="chat-message assistant-message streaming-message">
              <div>{currentStreamedResponse || 'Generating response...'}</div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="chat-input-container">
          <input
            type="text"
            className="chat-input"
            placeholder="Ask about your component..."
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            className="send-button"
            onClick={handleSendMessage}
            disabled={!userMessage.trim() || isStreamingResponse}
          >
            {isStreamingResponse ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
      
      {/* Code Panel (Right) */}
      <div className="code-panel">
        <div className="editor-header">
          <div className="editor-title">
            <h3 className="title-text">VA Code Generator</h3>
          </div>
          
          <div className="editor-controls">
            <button 
              className="home-button"
              onClick={onBack}
              title="Back to Home"
            >
              Back to Home
            </button>
            
            <button 
              className="preview-toggle"
              onClick={() => setActiveTab(activeTab === "preview" ? "react" : "preview")}
              title={activeTab === "preview" ? "Hide Preview" : "Show Preview"}
            >
              <svg className="preview-icon" viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
              </svg>
              {activeTab === "preview" ? "Hide Preview" : "Show Preview"}
            </button>
            
            {activeTab !== "preview" && (
              <button className="action-button" onClick={formatCode} title="Format code">
                <svg className="format-icon" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M8,6.5V6.3L7.9,5.6H7.1L7,6.3V6.5H8M14,6H7.1V6.1L7.5,10H7.75L8,8.25H11V10L17,10C18.09,8.81 18.09,7.19 17,6H14Z M7.42,4L7.58,5.25H8.5V4H7.92L7.92,4H7.42V4Z M6,2V11A1,1 0 0,0 7,12H18V11H7.5V8.75L8.08,8.37L8.42,6.56H8.5L8.83,8.37L9.42,8.75V11H10.92L11.58,3.29C11.58,2.58 11,2 10.29,2H6Z M18,14H6V16H18V14Z M18,18H6V20H18V18Z" />
                </svg>
                Format
              </button>
            )}
          </div>
        </div>

        <div className="code-content">
          {activeTab === "preview" ? (
            <div className="preview-container">
              <iframe 
                id="preview-frame" 
                title="Component Preview" 
                className="preview-iframe"
                sandbox="allow-scripts"
              ></iframe>
              {isPreviewLoading && (
                <div className="preview-loading-overlay">
                  <div className="preview-loading-spinner"></div>
                  <div className="preview-loading-text">Loading preview...</div>
                </div>
              )}
            </div>
          ) : renderCodeContent()}
        </div>
      </div>
      
      <style jsx>{`
        .editor-container {
          display: flex;
          height: 100vh;
          width: 100%;
          max-width: 100vw;
          overflow: hidden;
          position: relative;
          background-color: #1e1e1e;
          color: #d4d4d4;
          padding: 0;
          margin: 0;
        }
        
        .chat-panel {
          display: flex;
          flex-direction: column;
          width: 25%;
          min-width: 280px;
          height: 100%;
          border-right: 1px solid #333;
          overflow: hidden;
          background-color: #252526;
        }
        
        .code-panel {
          display: flex;
          flex-direction: column;
          flex: 1;
          height: 100%;
          overflow: hidden;
          background-color: #1e1e1e;
          padding: 0;
          margin: 0;
          width: 75%;
        }
        
        @media (max-width: 1200px) {
          .chat-panel {
            width: 30%;
          }
          
          .code-panel {
            width: 70%;
          }
        }
        
        @media (max-width: 900px) {
          .chat-panel {
            width: 35%;
            min-width: 250px;
          }
          
          .code-panel {
            width: 65%;
          }
        }
        
        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background-color: #112e51;
          color: white;
          border-bottom: 1px solid #333;
          flex-shrink: 0;
        }
        
        .chat-title {
          margin: 0;
          font-size: 16px;
        }
        
        .back-button {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 14px;
          padding: 4px 8px;
        }
        
        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background-color: #112e51;
          color: white;
          border-bottom: 1px solid #333;
          flex-shrink: 0;
        }
        
        .editor-title {
          display: flex;
          align-items: center;
        }
        
        .title-text {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .editor-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .home-button {
          background-color: #2b5278;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 6px 12px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .home-button:hover {
          background-color: #005ea2;
        }
        
        .chat-messages {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background-color: #252526;
        }
        
        .chat-message {
          padding: 10px 12px;
          border-radius: 8px;
          max-width: 85%;
          word-break: break-word;
        }
        
        .user-message {
          background-color: #2b5278;
          color: #ffffff;
          align-self: flex-end;
          margin-left: auto;
        }
        
        .assistant-message {
          background-color: #3c3c3c;
          color: #ffffff;
          align-self: flex-start;
          margin-right: auto;
        }
        
        .streaming-message {
          background-color: #1e4273;
          border-left: 3px solid #0078d7;
        }
        
        .error-message {
          background-color: #5c2b2b;
          color: #f48771;
        }
        
        .success-message {
          background-color: #2c4a2c;
          color: #89d185;
        }
        
        .loading-message {
          display: flex;
          align-items: center;
        }
        
        .loading-dots {
          display: inline-block;
          margin-left: 6px;
        }
        
        .loading-dots span {
          animation: loading 1.4s infinite;
          display: inline-block;
        }
        
        .loading-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .loading-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes loading {
          0%, 80%, 100% { 
            opacity: 0;
          }
          40% { 
            opacity: 1; 
          }
        }
        
        .chat-input-container {
          display: flex;
          padding: 12px;
          border-top: 1px solid #333;
          background-color: #252526;
          flex-shrink: 0;
        }
        
        .chat-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #333;
          border-radius: 4px 0 0 4px;
          font-size: 14px;
          background-color: #3c3c3c;
          color: #d4d4d4;
        }
        
        .chat-input:focus {
          outline: none;
          border-color: #0078d7;
        }
        
        .send-button {
          background-color: #0078d7;
          color: white;
          border: none;
          border-radius: 0 4px 4px 0;
          padding: 8px 16px;
          cursor: pointer;
          min-width: 100px;
        }
        
        .send-button:hover:not(:disabled) {
          background-color: #2b5278;
        }
        
        .send-button:disabled {
          background-color: #555;
          cursor: not-allowed;
        }
        
        .preview-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: #0078d7;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 6px 10px;
          font-size: 14px;
          cursor: pointer;
        }
        
        .preview-toggle:hover {
          background-color: #2b5278;
        }
        
        .preview-toggle.active {
          background-color: #2b5278;
        }
        
        .action-button {
          display: flex;
          align-items: center;
          gap: 4px;
          background-color: transparent;
          border: 1px solid #555;
          border-radius: 4px;
          padding: 5px 8px;
          font-size: 14px;
          cursor: pointer;
          color: #d4d4d4;
        }
        
        .action-button:hover {
          background-color: rgba(255, 255, 255, 0.08);
        }
        
        .code-content {
          flex: 1;
          overflow: hidden;
          background-color: #1e1e1e;
          display: flex;
          flex-direction: column;
          width: 100%;
          padding: 0;
          margin: 0;
        }
        
        .code-mirror-wrapper {
          height: 100%;
          width: 100%;
          overflow: auto;
          background-color: #1e1e1e;
          padding: 0;
          margin: 0;
        }
        
        .preview-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          background-color: #1e1e1e;
          position: relative;
          border: 1px solid #333;
        }
        
        .preview-header {
          display: flex;
          justify-content: flex-end;
          padding: 8px;
          background-color: #252526;
          border-bottom: 1px solid #333;
        }
        
        .preview-action-button {
          background-color: #0078d7;
          color: white;
          border: none;
          border-radius: 3px;
          padding: 5px 10px;
          font-size: 12px;
          cursor: pointer;
        }
        
        .preview-iframe-container {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          flex: 1;
          background-color: #1e1e1e;
          border: 1px solid #333;
        }
        
        .preview-iframe {
          width: 100%;
          height: 100%;
          border: none;
          background-color: white;
          display: block;
        }
        
        .preview-loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(30, 30, 30, 0.7);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }
        
        .preview-loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(0, 113, 187, 0.2);
          border-radius: 50%;
          border-top-color: #0071bb;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        .preview-loading-text {
          color: white;
          font-size: 14px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        :global(.CodeMirror), 
        :global(.cm-editor),
        :global(.cm-scroller),
        :global(.cm-content),
        :global(.cm-gutters) {
          background-color: #1e1e1e !important;
        }
        
        :global(.cm-line) {
          background-color: #1e1e1e !important;
          color: #ffffff !important;
          font-size: 15px !important;
        }
        
        :global(.CodeMirror) {
          background: #1e1e1e !important;
          color: #ffffff !important;
          font-family: 'Consolas', 'Monaco', 'Andale Mono', monospace;
          font-size: 15px !important;
          height: 100%;
          line-height: 1.6 !important;
        }
        
        :global(.cm-keyword) {
          color: #d197f3 !important;
          font-weight: bold !important;
        }
        
        :global(.cm-string) {
          color: #a5e075 !important;
        }
        
        :global(.cm-comment) {
          color: #7d8799 !important;
        }
        
        :global(.cm-property) {
          color: #f38e99 !important;
        }
        
        :global(.cm-number) {
          color: #e5c07b !important;
        }
        
        :global(.cm-operator) {
          color: #d197f3 !important;
        }
        
        :global(.cm-def) {
          color: #61afef !important;
          font-weight: bold !important;
        }
        
        :global(.cm-tag) {
          color: #f38e99 !important;
          font-weight: bold !important;
        }
        
        :global(.cm-attribute) {
          color: #e5c07b !important;
        }
        
        /* Apply full width to CodeMirror elements */
        :global(.cm-editor), 
        :global(.CodeMirror) {
          width: 100% !important;
          height: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
          box-sizing: border-box !important;
        }
        
        :global(.cm-gutters),
        :global(.CodeMirror-gutters) {
          height: 100% !important;
          background-color: #252526 !important;
          border-right: 1px solid #333 !important;
        }
        
        :global(.cm-scroller),
        :global(.CodeMirror-scroll) {
          width: 100% !important;
          height: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        
        :global(.cm-cursor) {
          border-left: 2px solid #ffffff !important;
        }
        
        :global(.cm-activeLineGutter),
        :global(.cm-activeLine) {
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
      `}</style>
    </div>
  );
};

export default AICodeEditor; 