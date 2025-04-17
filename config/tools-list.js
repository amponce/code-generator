// List of tools available to the assistant
// These will be mapped to function calls for the OpenAI API

export const toolsList = [
  {
    name: "compile_code",
    description: "Compile source code for a target environment",
    parameters: {
      sourceDir: {
        type: "string",
        description: "Path to the source code directory",
      },
      target: {
        type: "string",
        description: "Target environment (e.g., 'production', 'staging', 'development')",
      },
    },
  },
  {
    name: "package_artifact",
    description: "Package the compiled code into a deployable artifact",
    parameters: {
      buildDir: {
        type: "string",
        description: "Path to the build directory containing compiled code",
      },
      version: {
        type: "string",
        description: "Version number for the artifact (e.g., '1.0.0')",
      },
      type: {
        type: "string",
        description: "Type of package to create (e.g., 'zip', 'docker', 'npm')",
      },
    },
  },
  {
    name: "deploy_artifact",
    description: "Deploy a packaged artifact to a specified environment",
    parameters: {
      artifactPath: {
        type: "string",
        description: "Path to the artifact to deploy",
      },
      environment: {
        type: "string",
        description: "Environment to deploy to (e.g., 'production', 'staging')",
      },
    },
  },
  {
    name: "check_build_status",
    description: "Check the status of a running build process",
    parameters: {
      buildId: {
        type: "string",
        description: "ID of the build to check status for",
      },
    },
  },
]; 