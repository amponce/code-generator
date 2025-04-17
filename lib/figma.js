import Figma from 'figma-api';

// Initialize Figma client
const figmaClient = (token) => {
  return new Figma.Api({
    personalAccessToken: token
  });
};

/**
 * Get a Figma file by its key
 * @param {string} token - Figma personal access token
 * @param {string} fileKey - Figma file key (from URL)
 */
export async function getFigmaFile(token, fileKey) {
  try {
    const api = figmaClient(token);
    const file = await api.getFile(fileKey);
    return file;
  } catch (error) {
    console.error('Error fetching Figma file:', error);
    throw error;
  }
}

/**
 * Get component information from a Figma file
 * @param {string} token - Figma personal access token
 * @param {string} fileKey - Figma file key
 */
export async function getFigmaComponents(token, fileKey) {
  try {
    const api = figmaClient(token);
    const file = await api.getFile(fileKey, { ids: [] });
    
    // Extract components
    const components = [];
    
    // Helper function to recursively find components
    const findComponents = (node) => {
      if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
        components.push({
          id: node.id,
          name: node.name,
          description: node.description || '',
          type: node.type
        });
      }
      
      if (node.children) {
        node.children.forEach(child => findComponents(child));
      }
    };
    
    // Start from the document root
    findComponents(file.document);
    
    return components;
  } catch (error) {
    console.error('Error fetching Figma components:', error);
    throw error;
  }
}

/**
 * Get component images from a Figma file
 * @param {string} token - Figma personal access token
 * @param {string} fileKey - Figma file key
 * @param {Array} nodeIds - Array of node IDs to get images for
 */
export async function getFigmaComponentImages(token, fileKey, nodeIds) {
  try {
    const api = figmaClient(token);
    const images = await api.getImage(fileKey, {
      ids: nodeIds,
      format: 'png',
      scale: 2
    });
    
    return images;
  } catch (error) {
    console.error('Error fetching Figma component images:', error);
    throw error;
  }
}

/**
 * Map Figma components to VA Design System components
 * @param {Object} components - Figma components
 */
export function mapFigmaComponentsToVA(components) {
  const componentMapping = {
    // Map Figma component names to VA component IDs
    'Alert': 'alert',
    'Alert/Info': 'alert',
    'Alert/Success': 'alert',
    'Alert/Warning': 'alert',
    'Alert/Error': 'alert',
    'Alert/Expandable': 'alert-expandable',
    'Accordion': 'accordion',
    'Banner': 'banner',
    'Button': 'buttons',
    'Button/Primary': 'buttons',
    'Button/Secondary': 'buttons',
    'Card': 'card',
    'Form': 'forms',
    'Form/Input': 'forms',
    'Form/Checkbox': 'forms',
    'Form/Select': 'forms',
    'Progress': 'progress',
    'Progress Bar': 'progress',
    'Additional Info': 'additional-info',
  };
  
  // Map components based on name matching
  return components.map(component => {
    const mappedId = Object.keys(componentMapping).find(key => 
      component.name.includes(key)
    );
    
    return {
      ...component,
      vaComponentId: mappedId ? componentMapping[mappedId] : null
    };
  }).filter(comp => comp.vaComponentId);
}

/**
 * Parse a Figma URL to extract the file key
 * @param {string} url - Figma URL
 */
export function parseFigmaUrl(url) {
  try {
    // Example URL: https://www.figma.com/file/abcd1234/DesignSystem
    const fileKeyRegex = /figma\.com\/file\/([a-zA-Z0-9]+)/;
    const match = url.match(fileKeyRegex);
    
    if (match && match[1]) {
      return match[1];
    }
    
    throw new Error('Invalid Figma URL');
  } catch (error) {
    console.error('Error parsing Figma URL:', error);
    throw error;
  }
} 