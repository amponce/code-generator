export const updatePreview = (htmlCode, cssCode, jsCode) => {
  try {
    // Get the preview iframe
    const iframe = document.querySelector('#preview-frame');
    if (!iframe) {
      console.error('Preview iframe not found');
      return;
    }

    // Create a complete HTML document with the code
    const fullHtml = htmlCode.replace(
      '</head>',
      `<style>${cssCode}</style></head>`
    );

    // Write the HTML to the iframe
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(fullHtml);
    doc.close();

    // Add React and ReactDOM scripts
    const reactScript = doc.createElement('script');
    reactScript.src = 'https://unpkg.com/react@17/umd/react.development.js';
    doc.body.appendChild(reactScript);

    const reactDomScript = doc.createElement('script');
    reactDomScript.src = 'https://unpkg.com/react-dom@17/umd/react-dom.development.js';
    doc.body.appendChild(reactDomScript);

    // Add Babel for JSX transformation
    const babelScript = doc.createElement('script');
    babelScript.src = 'https://unpkg.com/@babel/standalone/babel.min.js';
    doc.body.appendChild(babelScript);

    // Wait for scripts to load then add the JS code
    Promise.all([
      new Promise(resolve => reactScript.onload = resolve),
      new Promise(resolve => reactDomScript.onload = resolve),
      new Promise(resolve => babelScript.onload = resolve)
    ]).then(() => {
      const script = doc.createElement('script');
      script.type = 'text/babel';
      script.text = jsCode;
      doc.body.appendChild(script);

      // Add error handling
      const errorScript = doc.createElement('script');
      errorScript.text = `
        window.onerror = function(msg, url, lineNo, columnNo, error) {
          console.error('Preview error:', msg, 'at', lineNo + ':' + columnNo);
          const errorDiv = document.createElement('div');
          errorDiv.style.color = 'red';
          errorDiv.style.padding = '1rem';
          errorDiv.style.fontFamily = 'monospace';
          errorDiv.style.whiteSpace = 'pre-wrap';
          errorDiv.textContent = 'Error: ' + msg + '\\nLine: ' + lineNo;
          document.body.insertBefore(errorDiv, document.body.firstChild);
          return false;
        };
      `;
      doc.body.appendChild(errorScript);
    }).catch(error => {
      console.error('Error loading preview dependencies:', error);
    });
  } catch (error) {
    console.error('Error updating preview:', error);
  }
}; 