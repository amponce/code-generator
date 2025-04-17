'use client';

const CodeEditor = ({ code, onChange }) => {
  const copyCode = () => {
    navigator.clipboard.writeText(code);
    
    // Show success alert
    const alertContainer = document.createElement('div');
    alertContainer.innerHTML = `
      <va-alert status="success">
        <h3 slot="headline">Copied!</h3>
        Code copied to clipboard
      </va-alert>
    `;
    document.body.appendChild(alertContainer);
    setTimeout(() => document.body.removeChild(alertContainer), 3000);
  };

  return (
    <div className="vads-u-display--flex vads-u-flex-direction--column vads-u-height--full">
      <div className="vads-u-display--flex vads-u-justify-content--between vads-u-align-items--center vads-u-padding--2 vads-u-background-color--primary-darker vads-u-color--white">
        <span className="vads-u-font-family--mono vads-u-font-size--sm">component.tsx</span>
        <va-button
          secondary
          text="Copy"
          onClick={copyCode}
        />
      </div>
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        className="vads-u-flex--1 vads-u-width--full vads-u-padding--2 vads-u-font-family--mono vads-u-font-size--sm vads-u-background-color--primary-darkest vads-u-color--white vads-u-border--0"
        spellCheck="false"
        placeholder="// Your component code will appear here"
      />
    </div>
  );
};

export default CodeEditor; 