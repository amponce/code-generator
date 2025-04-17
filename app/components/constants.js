export const DEFAULT_REACT_CODE = `// Welcome to the VA React Component Editor
function App() {
  const [isLoading, setIsLoading] = React.useState(true);
  
  // Simulate loading process
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="vads-l-grid-container">
      {isLoading ? (
        <div className="vads-u-display--flex vads-u-flex-direction--column vads-u-align-items--center vads-u-padding-y--5">
          <va-loading-indicator message="Loading your component..." set-focus />
        </div>
      ) : (
        <div className="vads-u-padding-y--3">
          <va-alert
            status="info"
            visible
          >
            <h2 slot="headline" className="vads-u-font-size--h3 vads-u-margin--0">
              Welcome to the VA React Component Editor
            </h2>
            <p className="vads-u-margin-y--2">
              Your component code will appear here once generated. You can modify the code and see the changes in real-time.
            </p>
          </va-alert>
          
          <div className="vads-u-padding-top--4 vads-u-margin-top--3">
            <h2 className="vads-u-font-size--h3 vads-u-margin-y--2">Getting Started</h2>
            <p className="vads-u-margin-bottom--2">
              To start creating components:
            </p>
            <ul className="usa-list vads-u-margin-bottom--3">
              <li className="vads-u-margin-bottom--1">Enter a prompt describing what you want to build</li>
              <li className="vads-u-margin-bottom--1">The AI will generate React code for you</li>
              <li className="vads-u-margin-bottom--1">Edit the code in this panel</li>
              <li>See the results immediately in the preview panel</li>
            </ul>
            
            <va-button
              text="View Documentation" 
              onClick={() => console.log('Documentation clicked')}
              class="vads-u-margin-top--3"
            />
          </div>
        </div>
      )}
    </div>
  );
}`;

export const DEFAULT_HTML_CODE = `<div id="root"></div>`;

export const DEFAULT_CSS_CODE = `/* 
 * VA Design System CSS is imported automatically in the preview:
 * 
 * You can override specific styles here or add your own custom styles
 */

/* Base styles */
body {
  font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  margin: 0;
  padding: 20px;
  color: #323a45;
  background-color: #fff;
  scroll-behavior: smooth;
}`;

// Export aliases to ensure consistency across the app
export { DEFAULT_REACT_CODE as DEFAULT_CODE };
