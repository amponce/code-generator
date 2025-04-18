    // Clean up any markdown code ticks that might be in the generated code
    safeJsCode = safeJsCode.replace(/```jsx|```js|```javascript|```|jsx/g, "").trim();
    
    // Clean up any markdown code ticks that might be in the generated code
    safeJsCode = safeJsCode.replace(/```jsx|```js|```javascript|```|jsx/g, "").trim();
    
    // Check if the code defines an App component
    const hasAppComponent = /function\s+App\s*\(|const\s+App\s*=|class\s+App\s+extends|var\s+App\s*=/.test(safeJsCode);

    // If no App component is found, wrap the code in one
    if (!hasAppComponent) {
      console.log("No App component found, wrapping code in App function");
      safeJsCode = `
// Auto-generated App wrapper component
function App() {
  return (
    <div className="vads-l-grid-container">
      ${safeJsCode.includes('return') ? safeJsCode : `
      <div>
        {/* Original code wrapped in App */}
        ${safeJsCode}
      </div>
      `}
    </div>
  );
}
`;
    }
    
    return `
    if (!hasAppComponent) {
      console.log("No App component found, wrapping code in App function");
      safeJsCode = `
// Auto-generated App wrapper component
function App() {
  return (
    <div className="vads-l-grid-container">
      ${safeJsCode.includes('return') ? safeJsCode : `
      <div>
        {/* Original code wrapped in App */}
        ${safeJsCode}
      </div>
      `}
    </div>
  );
}
`;
    }
    
