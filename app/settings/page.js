'use client';

import { useState } from 'react';
import WebSearchToggle from '@/components/WebSearchToggle';
import VectorStoreToggle from '@/components/VectorStoreToggle';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    
    // Hide the success message after 3 seconds
    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  return (
    <div className="vads-l-grid-container">
      <div className="vads-u-margin-bottom--4">
        <h1>AI Search Settings</h1>
        <p className="vads-u-font-size--lg">
          Configure the AI capabilities for searching and accessing information. 
          Enable web search to get up-to-date information or vector store search
          to access information from your document library.
        </p>
      </div>
      
      <div className="vads-u-padding--4 vads-u-background-color--gray-lightest vads-u-margin-bottom--4">
        <h2 className="vads-u-margin-top--0">Search Configuration</h2>
        
        <WebSearchToggle />
        
        <VectorStoreToggle />
        
        <div className="vads-u-margin-top--4 vads-u-display--flex vads-u-justify-content--space-between vads-u-align-items--center">
          <button 
            className="usa-button usa-button-primary"
            onClick={handleSave}
          >
            Save Settings
          </button>
          
          {saved && (
            <div className="vads-u-background-color--success-lightest vads-u-padding--1 vads-u-color--success vads-u-font-weight--bold">
              Settings saved successfully
            </div>
          )}
        </div>
      </div>
      
      <div className="vads-u-margin-top--6">
        <h2>About AI Search Tools</h2>
        <h3>Web Search</h3>
        <p>
          Web search allows the AI to search the internet for up-to-date information
          about VA benefits, services, and other topics. This is useful for getting
          the latest information that might not be in the AI's training data.
        </p>
        
        <h3>Vector Store Search</h3>
        <p>
          Vector store search allows the AI to search through uploaded PDF forms and 
          documents to find relevant information. This is useful for answering questions
          about specific VA forms and policies.
        </p>
      </div>
    </div>
  );
} 