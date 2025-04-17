/**
 * Utilities for processing PDF forms and extracting content for vector stores
 */

/**
 * Process a PDF file and extract its content for embedding
 * @param {File} file The PDF file to process
 * @returns {Promise<{content: string, metadata: Object}>} The extracted content and metadata
 */
export const extractPdfContent = async (file) => {
  try {
    // Convert file to base64 for processing
    const base64Content = await fileToBase64(file);
    
    // Call the API to extract text from the PDF
    const response = await fetch('/api/extract_pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pdf: base64Content, filename: file.name }),
    });
    
    if (!response.ok) {
      throw new Error(`PDF extraction failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      content: data.text,
      metadata: {
        title: data.title || file.name,
        pageCount: data.pageCount || 0,
        formFields: data.formFields || [],
        filename: file.name,
        fileSize: file.size,
        date: new Date().toISOString(),
      }
    };
  } catch (error) {
    console.error('Error extracting PDF content:', error);
    throw error;
  }
};

/**
 * Upload a PDF to the vector store for embedding
 * @param {File} file The PDF file to upload
 * @param {string} vectorStoreId The ID of the vector store to use
 * @returns {Promise<Object>} The upload result
 */
export const uploadPdfToVectorStore = async (file, vectorStoreId) => {
  try {
    // First upload the file to get a file ID
    const fileObject = {
      name: file.name,
      content: await fileToBase64(file),
    };
    
    // Upload file to get file_id
    const uploadResponse = await fetch('/api/vector_stores/upload_file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileObject }),
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`File upload failed: ${uploadResponse.statusText}`);
    }
    
    const uploadResult = await uploadResponse.json();
    const fileId = uploadResult.id;
    
    // Add file to vector store
    const addResponse = await fetch('/api/vector_stores/add_file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vectorStoreId, fileId }),
    });
    
    if (!addResponse.ok) {
      throw new Error(`Adding to vector store failed: ${addResponse.statusText}`);
    }
    
    return await addResponse.json();
  } catch (error) {
    console.error('Error uploading PDF to vector store:', error);
    throw error;
  }
};

/**
 * Generate a digital VA component from a PDF form
 * @param {string} pdfText The extracted text from the PDF
 * @param {Array} formFields The form fields extracted from the PDF
 * @returns {Promise<string>} The generated React component code
 */
export const generateVAComponentFromPdf = async (pdfText, formFields) => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `Convert this PDF form to a digital VA form component: ${pdfText.substring(0, 1000)}...`,
        components: ['va-text-input', 'va-checkbox', 'va-select', 'va-button', 'va-alert', 'va-accordion'],
        formFields: formFields
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Component generation failed: ${response.statusText}`);
    }
    
    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = '';
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(5));
            if (data.event === 'response.completed' && data.code) {
              result = data.code;
            }
          } catch (e) {
            console.error('Error parsing SSE JSON:', e);
          }
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error generating VA component:', error);
    throw error;
  }
};

/**
 * Convert a file to base64 encoding
 * @param {File} file The file to convert
 * @returns {Promise<string>} Base64 encoded file content
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove the prefix (e.g., "data:application/pdf;base64,")
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}; 