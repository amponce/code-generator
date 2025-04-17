import { NextResponse } from 'next/server';
import { 
  getFigmaComponents, 
  getFigmaComponentImages, 
  mapFigmaComponentsToVA,
  parseFigmaUrl
} from '@/lib/figma';

export async function POST(request) {
  try {
    const { figmaToken, figmaUrl } = await request.json();

    if (!figmaToken) {
      return NextResponse.json(
        { error: 'Figma personal access token is required' },
        { status: 400 }
      );
    }

    if (!figmaUrl) {
      return NextResponse.json(
        { error: 'Figma file URL is required' },
        { status: 400 }
      );
    }

    // Parse Figma URL to get file key
    const fileKey = parseFigmaUrl(figmaUrl);
    
    // Get components from Figma file
    const components = await getFigmaComponents(figmaToken, fileKey);
    
    // Map Figma components to VA Design System components
    const mappedComponents = mapFigmaComponentsToVA(components);
    
    // Get images for components
    const nodeIds = mappedComponents.map(comp => comp.id);
    const images = await getFigmaComponentImages(figmaToken, fileKey, nodeIds);
    
    // Attach image URLs to component data
    const componentsWithImages = mappedComponents.map(comp => ({
      ...comp,
      imageUrl: images.images[comp.id]
    }));
    
    return NextResponse.json({
      components: componentsWithImages
    });
  } catch (error) {
    console.error('Error processing Figma request:', error);
    return NextResponse.json(
      { error: error.message || 'Error processing Figma request' },
      { status: 500 }
    );
  }
} 