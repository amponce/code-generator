'use client';

import PdfUploader from '@/components/PdfUploader';
import Link from 'next/link';

export default function PdfFormsPage() {
  return (
    <div className="vads-l-grid-container">
      <div className="vads-u-margin-bottom--4">
        <h1>VA PDF Form Digitization</h1>
        <p className="vads-u-font-size--lg">
          Upload VA PDF forms to convert them into digital VA components for web applications.
          The system uses AI to extract form fields and generate accessible VA components.
        </p>
        
        <div className="vads-u-margin-top--2">
          <Link 
            href="/settings" 
            className="usa-button usa-button-secondary vads-u-margin-right--2"
          >
            Configure AI Search Settings
          </Link>
        </div>
      </div>
      
      <div className="vads-u-padding-bottom--6">
        <PdfUploader />
      </div>
      
      <div className="vads-u-margin-top--6">
        <h2>How It Works</h2>
        <ol className="vads-u-margin-top--2">
          <li className="vads-u-margin-bottom--1">Upload a PDF form</li>
          <li className="vads-u-margin-bottom--1">Extract form content and identify form fields</li>
          <li className="vads-u-margin-bottom--1">Upload to vector store for knowledge management (optional)</li>
          <li className="vads-u-margin-bottom--1">Generate a digital VA component based on the form</li>
          <li>Preview the generated component</li>
        </ol>
      </div>
    </div>
  );
} 