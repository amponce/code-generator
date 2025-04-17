import { functionsMap } from "@/config/functions";

export const handleTool = async (functionName, args) => {
  console.log(`Executing function: ${functionName}`, args);
  
  if (!functionName || !functionsMap[functionName]) {
    console.error(`Function ${functionName} not found in functionsMap`);
    return { error: `Function ${functionName} not found` };
  }
  
  try {
    const result = await functionsMap[functionName](args);
    return result;
  } catch (error) {
    console.error(`Error executing ${functionName}:`, error);
    return { error: error.message || 'An unknown error occurred' };
  }
}; 