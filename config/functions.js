// Function implementations for the tool calls
import { compile_code, package_artifact, deploy_artifact, check_build_status } from "../lib/buildArtifacts";

export const functionsMap = {
  compile_code,
  package_artifact,
  deploy_artifact,
  check_build_status
}; 