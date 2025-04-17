import { NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';


export async function POST(request) {
  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Parse the request body
    const { pdf, filename } = await request.json();
    
    if (!pdf) {
      return NextResponse.json(
        { error: 'PDF content is required' },
        { status: 400 }
      );
    }

    // Convert base64 PDF to Buffer
    const pdfBuffer = Buffer.from(pdf, 'base64');
    
    // Wrap buffer as a file object with filename for OpenAI SDK
    const fileData = await toFile(pdfBuffer, filename || 'upload.pdf');
    
    // Upload the PDF to OpenAI as a file for extraction
    const file = await openai.files.create({
      file: fileData,
      purpose: 'assistants',
    });

    // Call the Responses API to extract text and form fields from the PDF
    const response = await openai.responses.create({
      model: 'gpt-4o',
      instructions: `Extract all text from the PDF and identify form fields with their labels, types, and validation requirements. Return the output as JSON with 'text' and 'formFields' properties.`,
      input: fileData,
      stream: false,
    });

    // Parse the JSON output from the model
    let output;
    try {
      output = JSON.parse(response.output_text);
    } catch (parseError) {
      throw new Error(`Failed to parse model output as JSON: ${parseError.message}`);
    }
    
    // Attach metadata about the PDF
    output.filename = filename;
    output.fileId = file.id;

    // Clean up the temporary file
    await openai.files.del(file.id);
    
    return NextResponse.json(output);
  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process PDF' },
      { status: 500 }
    );
  }
} 