import path from "path"
import fs from "fs"

/**
 * Get the OpenCode package directory (for dependency resolution)
 * 
 * When OpenCode is run from a monorepo, bun needs to execute from the package
 * directory where node_modules can be properly resolved.
 * 
 * This function:
 * 1. First checks OPENCODE_PACKAGE_DIR environment variable (set by wrapper)
 * 2. Falls back to detecting by walking up from __dirname
 * 3. Finally falls back to process.cwd()
 */
export function getPackageDirectory(): string {
  // Check environment variable first (set by wrapper script)
  if (process.env.OPENCODE_PACKAGE_DIR) {
    return process.env.OPENCODE_PACKAGE_DIR
  }
  
  // Start from the directory of this file
  let currentDir = __dirname
  
  // Walk up the directory tree looking for package.json
  while (currentDir !== path.dirname(currentDir)) {
    const packageJsonPath = path.join(currentDir, "package.json")
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))
        // Check if this is the opencode package
        if (packageJson.name === "opencode" || packageJson.name === "@opencode-ai/opencode") {
          return currentDir
        }
      } catch {
        // Ignore JSON parse errors and continue walking up
      }
    }
    
    currentDir = path.dirname(currentDir)
  }
  
  // Fallback to current working directory if not found
  return process.cwd()
}

/**
 * Execute a function with the working directory temporarily set to the package directory.
 * This is useful for operations that need dependency resolution (like dynamic imports).
 */
export async function withPackageDirectory<T>(fn: () => Promise<T>): Promise<T> {
  const originalCwd = process.cwd()
  const packageDir = getPackageDirectory()
  
  try {
    process.chdir(packageDir)
    return await fn()
  } finally {
    process.chdir(originalCwd)
  }
}
