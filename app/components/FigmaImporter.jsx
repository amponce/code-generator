'use client';

import { useState } from 'react';

const FigmaImporter = ({ onComponentsSelected }) => {
  const [figmaUrl, setFigmaUrl] = useState('');
  const [figmaToken, setFigmaToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [figmaComponents, setFigmaComponents] = useState([]);
  const [selectedComponents, setSelectedComponents] = useState(new Set());

  const handleFigmaConnect = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/figma', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          figmaToken,
          figmaUrl
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error connecting to Figma');
      }
      
      const data = await response.json();
      setFigmaComponents(data.components);
    } catch (err) {
      console.error('Error connecting to Figma:', err);
      setError(err.message || 'Error connecting to Figma');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleComponent = (componentId) => {
    const newSelected = new Set(selectedComponents);
    if (newSelected.has(componentId)) {
      newSelected.delete(componentId);
    } else {
      newSelected.add(componentId);
    }
    setSelectedComponents(newSelected);
  };

  const handleImportComponents = () => {
    // Map selected components to VA component IDs
    const vaComponentIds = Array.from(selectedComponents)
      .map(id => {
        const component = figmaComponents.find(c => c.id === id);
        return component ? component.vaComponentId : null;
      })
      .filter(id => id); // Remove nulls
    
    // Call the parent component's onComponentsSelected function
    onComponentsSelected(vaComponentIds);
  };

  return (
    <div className="vads-u-padding--3">
      <va-alert status="info">
        <h3 slot="headline">Import Components from Figma</h3>
        <p>Connect to your Figma design file to import components directly into your generated page.</p>
      </va-alert>

      <div className="vads-u-margin-top--4">
        <form onSubmit={handleFigmaConnect} className="vads-u-margin-bottom--4">
          <div className="vads-u-margin-bottom--3">
            <label htmlFor="figmaToken" className="vads-u-display--block vads-u-margin-bottom--1">
              Figma Personal Access Token
            </label>
            <va-text-input
              id="figmaToken"
              name="figmaToken"
              type="password"
              value={figmaToken}
              onInput={(e) => setFigmaToken(e.target.value)}
              placeholder="Enter your Figma personal access token"
              required
              className="vads-u-width--full"
            />
            <p className="vads-u-font-size--sm vads-u-color--gray-medium vads-u-margin-top--1 vads-u-display--block ">
              <a 
                href="https://www.figma.com/developers/api#access-tokens" 
                target="_blank" 
                rel="noopener noreferrer"
                className="vads-u-color--primary"
              >
                How to get a Figma access token
              </a>
            </p>
          </div>

          <div className="vads-u-margin-bottom--3">
            <label htmlFor="figmaUrl" className="vads-u-display--block vads-u-margin-bottom--1">
              Figma File URL
            </label>
            <va-text-input
              id="figmaUrl"
              name="figmaUrl"
              value={figmaUrl}
              onInput={(e) => setFigmaUrl(e.target.value)}
              placeholder="https://www.figma.com/file/..."
              required
              className="vads-u-width--full"
            />
          </div>

          <va-button 
            text={isLoading ? "Connecting..." : "Connect to Figma"} 
            type="submit" 
            disabled={isLoading || !figmaToken || !figmaUrl}
          />
        </form>

        {error && (
          <va-alert 
            status="error" 
            className="vads-u-margin-bottom--3"
          >
            <h3 slot="headline">Error</h3>
            <p>{error}</p>
          </va-alert>
        )}

        {figmaComponents.length > 0 && (
          <div>
            <h3 className="vads-u-margin-top--4 vads-u-margin-bottom--2">
              Available Components
            </h3>
            
            <div className="vads-u-display--flex vads-u-flex-wrap--wrap vads-u-gap--3">
              {figmaComponents.map((component) => (
                <div 
                  key={component.id}
                  className={`vads-u-background-color--gray-lightest vads-u-padding--3 vads-u-border-radius--lg vads-u-width--full medium-screen:vads-u-width--auto ${
                    selectedComponents.has(component.id) ? 'vads-u-border--2px vads-u-border-color--primary' : ''
                  }`}
                  style={{ flex: '1 1 400px', maxWidth: '400px' }}
                >
                  <div className="vads-u-display--flex vads-u-justify-content--between vads-u-align-items--center vads-u-margin-bottom--2">
                    <h4 className="vads-u-margin--0">{component.name}</h4>
                    <va-checkbox
                      label="Select"
                      name={`select-${component.id}`}
                      checked={selectedComponents.has(component.id)}
                      onInput={() => toggleComponent(component.id)}
                    />
                  </div>
                  
                  {component.description && (
                    <p className="vads-u-margin-top--0 vads-u-margin-bottom--2 vads-u-color--gray">
                      {component.description}
                    </p>
                  )}
                  
                  {component.imageUrl && (
                    <div className="vads-u-background-color--white vads-u-padding--2 vads-u-border-radius--md vads-u-margin-bottom--2">
                      <img 
                        src={component.imageUrl} 
                        alt={component.name}
                        className="vads-u-width--full"
                      />
                    </div>
                  )}
                  
                  <div className="vads-u-font-size--sm vads-u-color--gray-medium">
                    Maps to VA component: <strong>{component.vaComponentId}</strong>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="vads-u-margin-y--4 vads-u-display--flex vads-u-justify-content--center">
              <va-button
                text="Import Selected Components"
                onClick={handleImportComponents}
                disabled={selectedComponents.size === 0}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FigmaImporter; 