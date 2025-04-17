import { useState, useCallback, useEffect } from 'react';
import { extractPdfContent, uploadPdfToVectorStore, generateVAComponentFromPdf } from '../lib/pdfProcessing';
import { renderFormPreview } from '../lib/renderFormPreview';
import useToolsStore from '../lib/stores/useToolsStore';

export default function PdfUploader({ onFormGenerated = () => {} }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [formPreview, setFormPreview] = useState('');
  const [pdfData, setPdfData] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  
  const { vectorStore, setVectorStore } = useToolsStore();
  
  // Render the form preview when code is available
  useEffect(() => {
    if (formPreview) {
      // Give time for the component to mount
      setTimeout(() => {
        renderFormPreview(formPreview);
      }, 100);
    }
  }, [formPreview]);
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
      setStatus(`File selected: ${selectedFile.name}`);
    } else {
      setFile(null);
      setError('Please select a valid PDF file');
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setError('');
        setStatus(`File selected: ${droppedFile.name}`);
      } else {
        setError('Please drop a valid PDF file');
      }
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleExtract = useCallback(async () => {
    if (!file) {
      setError('Please select a PDF file first');
      return;
    }
    
    setProcessing(true);
    setStatus('Extracting content from PDF...');
    setError('');
    
    try {
      const extractedData = await extractPdfContent(file);
      setPdfData(extractedData);
      setStatus(`Content extracted successfully. Form fields detected: ${extractedData.metadata.formFields.length}`);
      
      // Auto-create vector store if none exists
      if (!vectorStore || !vectorStore.id) {
        await handleCreateVectorStore();
      }
      
      // Proceed to form generation
      await handleGenerateForm(extractedData);
      
    } catch (err) {
      setError(`Failed to extract content: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  }, [file, vectorStore]);
  
  const handleCreateVectorStore = useCallback(async () => {
    setStatus('Setting up knowledge base...');
    
    try {
      const response = await fetch('/api/vector_stores/create_store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'VA Forms Library' }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create vector store: ${response.statusText}`);
      }
      
      const newStore = await response.json();
      setVectorStore(newStore);
    } catch (err) {
      console.error(`Failed to create knowledge base: ${err.message}`);
      // Continue anyway, this isn't critical for demo
    }
  }, [setVectorStore]);
  
  const handleGenerateForm = useCallback(async (data = null) => {
    const contentData = data || pdfData;
    
    if (!contentData) {
      setError('Please extract PDF content first');
      return;
    }
    
    setGenerating(true);
    setStatus('Generating VA form component...');
    setError('');
    
    try {
      const generatedCode = await generateVAComponentFromPdf(
        contentData.content,
        contentData.metadata.formFields
      );
      setFormPreview(generatedCode);
      // Notify parent of generated form component code
      onFormGenerated(generatedCode);
      setStatus('VA form component generated successfully');
      setCurrentStep(2); // Move to results view
    } catch (err) {
      setError(`Failed to generate form: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  }, [pdfData, onFormGenerated]);
  
  return (
    <div className="pdf-uploader">
      {currentStep === 1 ? (
        <div className="upload-container">
          <div 
            className="drop-area" 
            onDrop={handleDrop} 
            onDragOver={handleDragOver}
          >
            <div className="file-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="#0050D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 8V2L20 8H14Z" stroke="#0050D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 18V12" stroke="#0050D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 15L12 18L15 15" stroke="#0050D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Drag and drop your PDF form here</h3>
            <p>or</p>
            <div className="file-input-container">
              <label htmlFor="file-input" className="file-input-button">Browse Files</label>
              <input
                id="file-input"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden-file-input"
              />
            </div>
            
            {file && (
              <div className="selected-file">
                <span className="check-icon">✓</span>
                <span className="filename">{file.name}</span>
              </div>
            )}
          </div>
          
          <div className="actions">
            <button 
              className="primary-button"
              onClick={handleExtract}
              disabled={!file || processing || generating}
            >
              {processing || generating ? (
                <span>
                  <span className="spinner"></span>
                  Processing...
                </span>
              ) : (
                "Convert to Digital Form"
              )}
            </button>
          </div>
          
          {(status || error) && (
            <div className={`status-container ${error ? 'error' : ''}`}>
              {error ? (
                <span className="error-icon">!</span>
              ) : (
                <span className="info-icon">i</span>
              )}
              <p>{error || status}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="results-container">
          <div className="success-banner">
            <span className="success-icon">✓</span>
            <h3>Digital VA Form Generated Successfully!</h3>
          </div>
          
          <div className="preview-section">
            <h3>Form Preview</h3>
            <div id="form-preview" className="form-preview-area"></div>
          </div>
          
          <div className="code-section">
            <div className="code-header">
              <h3>Generated Code</h3>
              <button 
                className="copy-button"
                onClick={() => {
                  navigator.clipboard.writeText(formPreview);
                  setStatus('Code copied to clipboard!');
                  setTimeout(() => setStatus(''), 2000);
                }}
              >
                Copy Code
              </button>
            </div>
            <pre className="code-display">
              <code>{formPreview}</code>
            </pre>
          </div>
          
          <div className="actions centered">
            <button 
              className="secondary-button"
              onClick={() => {
                setCurrentStep(1);
                setFile(null);
                setPdfData(null);
                setFormPreview('');
                setStatus('');
                setError('');
              }}
            >
              Start New Conversion
            </button>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .pdf-uploader {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }
        
        .upload-container, .results-container {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 30px;
          margin-bottom: 30px;
        }
        
        .drop-area {
          border: 2px dashed #0050D8;
          border-radius: 8px;
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: #f8f9fa;
          transition: all 0.2s ease;
          margin-bottom: 20px;
        }
        
        .drop-area:hover {
          background-color: #f0f7ff;
          cursor: pointer;
        }
        
        .file-icon {
          margin-bottom: 20px;
        }
        
        .drop-area h3 {
          margin: 0 0 10px 0;
          font-size: 18px;
          font-weight: 600;
          color: #323a45;
        }
        
        .drop-area p {
          margin: 0 0 20px 0;
          color: #71767a;
        }
        
        .file-input-container {
          margin-bottom: 20px;
        }
        
        .file-input-button {
          background-color: #0050D8;
          color: white;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: background-color 0.2s;
        }
        
        .file-input-button:hover {
          background-color: #003eb3;
        }
        
        .hidden-file-input {
          display: none;
        }
        
        .selected-file {
          display: flex;
          align-items: center;
          padding: 10px 15px;
          background-color: #f0f7ff;
          border-radius: 4px;
          margin-top: 15px;
          border: 1px solid #e1f3f8;
        }
        
        .check-icon {
          background-color: #2e8540;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-right: 10px;
          font-size: 12px;
        }
        
        .filename {
          font-weight: 500;
        }
        
        .actions {
          margin-top: 30px;
          display: flex;
          justify-content: center;
        }
        
        .centered {
          justify-content: center;
        }
        
        .primary-button {
          background-color: #0050D8;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .primary-button:hover:not(:disabled) {
          background-color: #003eb3;
        }
        
        .primary-button:disabled {
          background-color: #d6d7d9;
          cursor: not-allowed;
        }
        
        .secondary-button {
          background-color: #ffffff;
          color: #0050D8;
          border: 1px solid #0050D8;
          border-radius: 4px;
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .secondary-button:hover {
          background-color: #f0f7ff;
        }
        
        .status-container {
          margin-top: 20px;
          padding: 15px;
          border-radius: 4px;
          background-color: #f0f7ff;
          display: flex;
          align-items: flex-start;
        }
        
        .status-container.error {
          background-color: #fff1e1;
        }
        
        .info-icon, .error-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          margin-right: 12px;
          font-style: italic;
          font-weight: bold;
          flex-shrink: 0;
        }
        
        .info-icon {
          background-color: #0050D8;
          color: white;
        }
        
        .error-icon {
          background-color: #cd2026;
          color: white;
        }
        
        .status-container p {
          margin: 0;
          font-size: 14px;
        }
        
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
          margin-right: 10px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Results styles */
        .success-banner {
          background-color: #ecf3ec;
          border-radius: 4px;
          padding: 15px;
          margin-bottom: 30px;
          display: flex;
          align-items: center;
        }
        
        .success-icon {
          background-color: #2e8540;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          font-size: 14px;
        }
        
        .success-banner h3 {
          margin: 0;
          font-size: 18px;
          color: #2e8540;
        }
        
        .preview-section, .code-section {
          margin-bottom: 30px;
        }
        
        .preview-section h3, .code-section h3 {
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 18px;
        }
        
        .form-preview-area {
          border: 1px solid #dfe1e2;
          border-radius: 4px;
          padding: 20px;
          min-height: 200px;
          overflow: auto;
          background-color: #f8f9fa;
        }
        
        .code-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .copy-button {
          background-color: transparent;
          color: #0050D8;
          border: 1px solid #0050D8;
          border-radius: 4px;
          padding: 5px 10px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .copy-button:hover {
          background-color: #f0f7ff;
        }
        
        .code-display {
          background-color: #323a45;
          color: white;
          border-radius: 4px;
          padding: 15px;
          overflow: auto;
          max-height: 300px;
          margin: 0;
          font-family: monospace;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
} 