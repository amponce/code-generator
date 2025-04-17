import { NextResponse } from 'next/server';
import OpenAI from 'openai';


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

    // Create a blob from the base64 PDF
    const pdfBlob = Buffer.from(pdf, 'base64');
    
    // Create a file to send to OpenAI
    const file = await openai.files.create({
      file: new Blob([pdfBlob], { type: 'application/pdf' }),
      purpose: 'assistants',
    });

    // Use the OpenAI API to extract text from the PDF
    const messages = [
      {
        role: 'system',
        content: `Extract all text from the PDF. Also identify form fields, their labels, types (text input, checkbox, dropdown, etc.), and any validation requirements. Return a comprehensive structured analysis of the form.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'file',
            file_id: file.id,
          },
          {
            type: 'text',
            text: `Please extract all text content from this PDF form. Also identify form fields with their labels, types, and validation requirements. Format your response as JSON with text and formFields properties.`,
          },
        ],
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      response_format: { type: 'json_object' },
    });

    // Parse the response to get text and form fields
    const result = JSON.parse(completion.choices[0].message.content);
    
    // Add metadata about the PDF
    result.filename = filename;
    result.fileId = file.id;

    // Delete the temporary file
    await openai.files.del(file.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process PDF' },
      { status: 500 }
    );
  }
} 