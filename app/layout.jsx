'use client';

import { useEffect, useState } from 'react';
import "@department-of-veterans-affairs/component-library/dist/main.css";
import "./globals.css";

// Create a client-side only component for VA components
function VAComponents({ children }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const loadVAComponents = async () => {
      try {
        const { applyPolyfills, defineCustomElements } = await import(
          '@department-of-veterans-affairs/component-library'
        );
        await applyPolyfills();
        await defineCustomElements();
        setIsClient(true);
      } catch (error) {
        console.error("Error loading VA components:", error);
        // Still set isClient to true so we show content even if component loading fails
        setIsClient(true);
      }
    };

    loadVAComponents();
  }, []);

  if (!isClient) {
    // Show a minimal loading state instead of null
    return <div className="vads-u-padding--5 vads-u-text-align--center">Loading...</div>;
  }

  return (
    <>

      <main>{children}</main>
   
    </>
  );
}

export default function RootLayout({ children }) {
  // Use useState and useEffect to track if we're in the browser
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <html lang="en">
      <head>
        <title>VA Prototyping</title>
      </head>
      {/* Use suppressHydrationWarning to prevent hydration warnings from browser extensions */}
      <body suppressHydrationWarning={true}>
        <style jsx global>{`
          .full-width-header {
            width: 100%;
          }
          
          va-header-minimal {
            width: 100%;
            display: block;
          }
          
          va-header-minimal::part(va-header-minimal) {
            width: 100%;
            max-width: 100%;
          }
        `}</style>
        <VAComponents>{children}</VAComponents>
      </body>
    </html>
  );
}
