'use client';

export default function NotFound() {
  return (
    <div className="vads-u-padding--5 vads-u-text-align--center">
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist or has been moved.</p>
      <a href="/" className="vads-u-display--inline-block vads-u-margin-top--2 vads-u-text-decoration--none">
        <va-button text="Return to Home" />
      </a>
    </div>
  );
} 