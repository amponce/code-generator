'use client';

import { useState, useEffect, useRef } from 'react';
import { generateVACode } from '../../lib/openai';

export const ChatInterface = ({ onCodeGenerated, initialPrompt }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Process initial prompt if provided
  useEffect(() => {
    if (initialPrompt && messages.length === 0) {
      handleGenerateComponent(initialPrompt);
    }
  }, [initialPrompt]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleGenerateComponent = async (prompt) => {
    try {
      // Add user message to chat
      setMessages(prev => [...prev, { role: 'user', content: prompt }]);
      
      // Add a loading message
      setMessages(prev => [...prev, { role: 'assistant', content: 'Generating your VA component...', isLoading: true }]);
      
      setIsLoading(true);
      
      // Store the latest prompt in localStorage for potential code regeneration
      localStorage.setItem('last-user-prompt', prompt);
      
      // Call the code generation function
      await generateVACode(prompt, {
        onComplete: (code) => {
          // Replace loading message with success message
          setMessages(prev => {
            const newMessages = [...prev];
            // Remove the loading message
            if (newMessages.length > 0 && newMessages[newMessages.length - 1].isLoading) {
              newMessages.pop();
            }
            // Add success message
            newMessages.push({ 
              role: 'assistant', 
              content: 'I\'ve generated the component based on your request.' 
            });
            return newMessages;
          });
          
          // Pass the generated code to the parent component
          onCodeGenerated(code);
          
          setIsLoading(false);
        },
        onError: (error) => {
          // Replace loading message with error message
          setMessages(prev => {
            const newMessages = [...prev];
            // Remove the loading message
            if (newMessages.length > 0 && newMessages[newMessages.length - 1].isLoading) {
              newMessages.pop();
            }
            // Add error message
            newMessages.push({ 
              role: 'assistant', 
              content: `Sorry, there was an error generating your component: ${error.message}` 
            });
            return newMessages;
          });
          
          // Show error alert
          const alertContainer = document.createElement('div');
          alertContainer.innerHTML = `
            <va-alert status="error">
              <h3 slot="headline">Error</h3>
              ${error.message || 'Failed to generate code'}
            </va-alert>
          `;
          document.body.appendChild(alertContainer);
          setTimeout(() => document.body.removeChild(alertContainer), 5000);
          
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Error in handleGenerateComponent:', error);
      
      // Replace loading message with error message
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].isLoading) {
          newMessages.pop();
        }
        newMessages.push({ 
          role: 'assistant', 
          content: 'Sorry, there was an error processing your request.' 
        });
        return newMessages;
      });
      
      // Show error alert
      const alertContainer = document.createElement('div');
      alertContainer.innerHTML = `
        <va-alert status="error">
          <h3 slot="headline">Error</h3>
          Failed to process your request
        </va-alert>
      `;
      document.body.appendChild(alertContainer);
      setTimeout(() => document.body.removeChild(alertContainer), 5000);
      
      setIsLoading(false);
    }
  };

  return (
    <div className="vads-u-display--flex vads-u-flex-direction--column vads-u-height--full">
      <div className="vads-u-flex--1 vads-u-padding--3 vads-u-overflow-y--auto">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`vads-u-margin-bottom--2 vads-u-padding--2 vads-u-border-radius--lg vads-u-max-width--85 ${
              message.role === 'user' 
                ? 'vads-u-background-color--primary-alt-lightest vads-u-margin-left--auto' 
                : 'vads-u-background-color--gray-lightest'
            }`}
          >
            {message.content}
            {message.isLoading && (
              <div className="vads-u-display--flex vads-u-align-items--center vads-u-margin-top--1">
                <va-loading-indicator message="Generating component..." />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="vads-u-border-top--1px vads-u-padding--3 vads-u-margin-top--auto">
        <div className="vads-u-display--flex vads-u-align-items--center">
          <va-text-input
            name="prompt"
            label="Enter your prompt"
            onInput={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                handleGenerateComponent(e.target.value);
                e.target.value = '';
              }
            }}
            className="vads-u-flex--1 vads-u-margin-right--2"
          />
          <va-button
            onClick={() => {
              const input = document.querySelector('va-text-input');
              if (input && input.value && !isLoading) {
                handleGenerateComponent(input.value);
                input.value = '';
              }
            }}
            disabled={isLoading}
            text={isLoading ? 'Generating...' : 'Generate'}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface; 