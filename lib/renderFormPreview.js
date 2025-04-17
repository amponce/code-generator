/**
 * Utilities for rendering the generated VA form component
 */

/**
 * Dynamically render a generated React component
 * @param {string} componentCode The generated VA component code
 * @param {string} targetId The ID of the DOM element to render into
 */
export const renderFormPreview = (componentCode, targetId = 'form-preview') => {
  if (!componentCode || typeof componentCode !== 'string') {
    console.error('Invalid component code provided');
    return;
  }

  const targetElement = document.getElementById(targetId);
  if (!targetElement) {
    console.error(`Target element with ID "${targetId}" not found`);
    return;
  }

  try {
    // Create a safe version of the component code
    // This is a simplified approach - in production, you would need more robust sandboxing
    const safeCode = componentCode
      // Remove imports since we're rendering directly
      .replace(/import\s+.*?from\s+['"].*?['"]/g, '')
      // Replace export statements
      .replace(/export\s+default\s+function\s+App/g, 'function App')
      .replace(/export\s+default\s+App/g, '')
      .replace(/export\s+function\s+App/g, 'function App')
      // Add code to render the component
      + `
        
        // Render the component
        const targetElement = document.getElementById('${targetId}');
        if (targetElement) {
          const rootElement = document.createElement('div');
          targetElement.appendChild(rootElement);
          
          try {
            const appElement = App();
            // Simple rendering approach (without React)
            rootElement.innerHTML = appElement.props.dangerouslySetInnerHTML 
              ? appElement.props.dangerouslySetInnerHTML.__html
              : '';
            
            // Add basic event handlers
            document.querySelectorAll('button, input, select').forEach(element => {
              element.addEventListener('click', () => {
                console.log('Element clicked:', element);
              });
            });
          } catch (err) {
            rootElement.innerHTML = '<div class="vads-u-color--error">Error rendering component: ' + err.message + '</div>';
            console.error('Error rendering component:', err);
          }
        }
      `;

    // Create and execute the script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.text = safeCode;
    document.body.appendChild(script);
    
    return true;
  } catch (error) {
    console.error('Error rendering form preview:', error);
    targetElement.innerHTML = `<div class="vads-u-color--error">Error rendering component: ${error.message}</div>`;
    return false;
  }
}; 