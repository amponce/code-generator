// Functions mapping to tool calls for build artifact operations
// Define one function per tool call - each tool call should have a matching function
// Parameters for a tool call are passed as an object to the corresponding function

export const compile_code = async ({ sourceDir, target }) => {
  console.log("Compiling from source directory:", sourceDir);
  console.log("Target environment:", target);
  const res = await fetch(
    `/api/functions/compile?sourceDir=${encodeURIComponent(sourceDir)}&target=${target}`
  ).then((res) => res.json());

  console.log("executed compile_code function", res);

  return res;
};

export const package_artifact = async ({ buildDir, version, type }) => {
  console.log("Packaging from build directory:", buildDir);
  console.log("Version:", version);
  console.log("Package type:", type);
  
  const res = await fetch(
    `/api/functions/package?buildDir=${encodeURIComponent(buildDir)}&version=${version}&type=${type}`
  ).then((res) => res.json());

  console.log("executed package_artifact function", res);

  return res;
};

export const deploy_artifact = async ({ artifactPath, environment }) => {
  console.log("Deploying artifact:", artifactPath);
  console.log("To environment:", environment);
  
  const res = await fetch(
    `/api/functions/deploy?artifactPath=${encodeURIComponent(artifactPath)}&environment=${environment}`
  ).then((res) => res.json());

  console.log("executed deploy_artifact function", res);

  return res;
};

export const check_build_status = async ({ buildId }) => {
  const res = await fetch(`/api/functions/build-status?buildId=${buildId}`).then((res) => res.json());
  return res;
};

export const functionsMap = {
  compile_code: compile_code,
  package_artifact: package_artifact,
  deploy_artifact: deploy_artifact,
  check_build_status: check_build_status,
}; 