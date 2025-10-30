#!/usr/bin/env node

/**
 * Naming Convention Validator
 *
 * Validates that all files follow the project's naming conventions:
 * - Component files: kebab-case.tsx
 * - Service files: kebab-case-service.ts
 * - Util files: kebab-case-utils.ts
 * - Hook files: use-kebab-case.ts
 * - Test files: kebab-case.test.ts or kebab-case.spec.ts
 * - Story files: kebab-case.stories.tsx
 *
 * Usage: node scripts/validate-naming.mjs
 */

import { readdir, stat } from 'fs/promises'
import { join, basename, extname } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROJECT_ROOT = join(__dirname, '..')

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

// Validation results
const results = {
  total: 0,
  valid: 0,
  invalid: 0,
  warnings: 0,
  errors: [],
}

/**
 * Check if a string is in kebab-case
 */
function isKebabCase(str) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(str)
}

/**
 * Check if a string is in PascalCase
 */
function isPascalCase(str) {
  return /^[A-Z][a-zA-Z0-9]*$/.test(str)
}

/**
 * Check if a string is in camelCase
 */
function isCamelCase(str) {
  return /^[a-z][a-zA-Z0-9]*$/.test(str)
}

/**
 * Check if a string is in UPPER_SNAKE_CASE
 */
function isUpperSnakeCase(str) {
  return /^[A-Z0-9]+(_[A-Z0-9]+)*$/.test(str)
}

/**
 * Validate a filename against conventions
 */
function validateFileName(filePath, fileName) {
  const ext = extname(fileName)
  const nameWithoutExt = basename(fileName, ext)

  // Special Next.js files (always lowercase)
  const nextJsSpecialFiles = [
    'page.tsx', 'layout.tsx', 'loading.tsx', 'error.tsx',
    'not-found.tsx', 'route.ts', 'middleware.ts', 'providers.tsx'
  ]

  if (nextJsSpecialFiles.includes(fileName)) {
    return { valid: true, message: 'Next.js special file' }
  }

  // Configuration files
  const configFiles = [
    'next.config.js', 'tailwind.config.ts', 'tsconfig.json',
    'eslint.config.mjs', 'playwright.config.ts', 'package.json'
  ]

  if (configFiles.includes(fileName)) {
    return { valid: true, message: 'Configuration file' }
  }

  // Storybook stories
  if (fileName.endsWith('.stories.tsx')) {
    const baseName = fileName.replace('.stories.tsx', '')
    if (isKebabCase(baseName)) {
      return { valid: true, message: 'Storybook story (kebab-case)' }
    }
    return {
      valid: false,
      message: `Storybook story should use kebab-case: ${baseName}.stories.tsx`
    }
  }

  // Test files
  if (fileName.endsWith('.test.ts') || fileName.endsWith('.spec.ts')) {
    const suffix = fileName.endsWith('.test.ts') ? '.test.ts' : '.spec.ts'
    const baseName = fileName.replace(suffix, '')
    if (isKebabCase(baseName)) {
      return { valid: true, message: 'Test file (kebab-case)' }
    }
    return {
      valid: false,
      message: `Test file should use kebab-case: ${baseName}${suffix}`
    }
  }

  // React hooks
  if (fileName.startsWith('use-') && (ext === '.ts' || ext === '.tsx')) {
    const hookName = nameWithoutExt.replace('use-', '')
    if (isKebabCase(hookName)) {
      return { valid: true, message: 'Hook file (use-kebab-case)' }
    }
    return {
      valid: false,
      message: `Hook should use kebab-case: use-${hookName}${ext}`
    }
  }

  // Component files (.tsx)
  if (ext === '.tsx' && !fileName.includes('.stories.')) {
    if (isKebabCase(nameWithoutExt)) {
      return { valid: true, message: 'Component file (kebab-case)' }
    }
    if (isPascalCase(nameWithoutExt)) {
      return {
        valid: false,
        message: `Component file should use kebab-case, not PascalCase: ${nameWithoutExt}.tsx`
      }
    }
    return {
      valid: false,
      message: `Component file should use kebab-case: ${nameWithoutExt}.tsx`
    }
  }

  // TypeScript/JavaScript files (.ts, .js, .mjs)
  if (['.ts', '.js', '.mjs'].includes(ext)) {
    // Service files
    if (fileName.endsWith('-service.ts')) {
      const baseName = fileName.replace('-service.ts', '')
      if (isKebabCase(baseName)) {
        return { valid: true, message: 'Service file (kebab-case-service.ts)' }
      }
    }

    // Util files
    if (fileName.endsWith('-utils.ts')) {
      const baseName = fileName.replace('-utils.ts', '')
      if (isKebabCase(baseName)) {
        return { valid: true, message: 'Utility file (kebab-case-utils.ts)' }
      }
    }

    // Validation files
    if (fileName.endsWith('-validation.ts')) {
      const baseName = fileName.replace('-validation.ts', '')
      if (isKebabCase(baseName)) {
        return { valid: true, message: 'Validation file (kebab-case-validation.ts)' }
      }
    }

    // General TypeScript/JavaScript files
    if (isKebabCase(nameWithoutExt)) {
      return { valid: true, message: 'TypeScript/JavaScript file (kebab-case)' }
    }

    if (isPascalCase(nameWithoutExt) || isCamelCase(nameWithoutExt)) {
      return {
        valid: false,
        message: `File should use kebab-case: ${nameWithoutExt}${ext}`
      }
    }
  }

  // Index files
  if (fileName === 'index.ts' || fileName === 'index.tsx') {
    return { valid: true, message: 'Index file' }
  }

  // Default: warn about unknown pattern
  return {
    valid: true,
    message: 'Unknown file pattern (allowed but review recommended)',
    warning: true
  }
}

/**
 * Recursively scan directory
 */
async function scanDirectory(dirPath, relativePath = '') {
  const entries = await readdir(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name)
    const relPath = join(relativePath, entry.name)

    // Skip node_modules, .next, .git, etc.
    if (entry.name.startsWith('.') ||
        entry.name === 'node_modules' ||
        entry.name === '.next' ||
        entry.name === 'dist' ||
        entry.name === 'build') {
      continue
    }

    if (entry.isDirectory()) {
      // Validate directory name (should be kebab-case)
      if (!isKebabCase(entry.name) && entry.name !== '__tests__') {
        results.errors.push({
          path: relPath,
          message: `Directory should use kebab-case: ${entry.name}/`,
          severity: 'warning'
        })
        results.warnings++
      }

      // Recurse into subdirectories
      await scanDirectory(fullPath, relPath)
    } else if (entry.isFile()) {
      // Validate file name
      const validation = validateFileName(fullPath, entry.name)
      results.total++

      if (validation.valid) {
        results.valid++
        if (validation.warning) {
          results.warnings++
          results.errors.push({
            path: relPath,
            message: validation.message,
            severity: 'warning'
          })
        }
      } else {
        results.invalid++
        results.errors.push({
          path: relPath,
          message: validation.message,
          severity: 'error'
        })
      }
    }
  }
}

/**
 * Print validation results
 */
function printResults() {
  console.log(`\n${colors.cyan}=== Naming Convention Validation ===${colors.reset}\n`)

  console.log(`Total files scanned: ${colors.blue}${results.total}${colors.reset}`)
  console.log(`Valid: ${colors.green}${results.valid}${colors.reset}`)
  console.log(`Invalid: ${colors.red}${results.invalid}${colors.reset}`)
  console.log(`Warnings: ${colors.yellow}${results.warnings}${colors.reset}\n`)

  if (results.errors.length > 0) {
    console.log(`${colors.yellow}Issues Found:${colors.reset}\n`)

    // Group by severity
    const errors = results.errors.filter(e => e.severity === 'error')
    const warnings = results.errors.filter(e => e.severity === 'warning')

    if (errors.length > 0) {
      console.log(`${colors.red}Errors (${errors.length}):${colors.reset}`)
      errors.forEach(({ path, message }) => {
        console.log(`  ${colors.red}✗${colors.reset} ${path}`)
        console.log(`    ${message}`)
      })
      console.log('')
    }

    if (warnings.length > 0) {
      console.log(`${colors.yellow}Warnings (${warnings.length}):${colors.reset}`)
      warnings.forEach(({ path, message }) => {
        console.log(`  ${colors.yellow}⚠${colors.reset} ${path}`)
        console.log(`    ${message}`)
      })
      console.log('')
    }
  }

  // Summary
  if (results.invalid > 0) {
    console.log(`${colors.red}Validation FAILED${colors.reset}`)
    console.log(`Please fix ${results.invalid} naming convention error(s).\n`)
    console.log(`See COMPONENT-NAMING-CONVENTIONS.md for detailed guidelines.\n`)
    process.exit(1)
  } else if (results.warnings > 0) {
    console.log(`${colors.yellow}Validation PASSED with warnings${colors.reset}`)
    console.log(`Consider reviewing ${results.warnings} warning(s).\n`)
    process.exit(0)
  } else {
    console.log(`${colors.green}✓ Validation PASSED${colors.reset}`)
    console.log(`All files follow naming conventions!\n`)
    process.exit(0)
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log(`${colors.cyan}Validating naming conventions...${colors.reset}`)
    console.log(`Project root: ${PROJECT_ROOT}\n`)

    // Scan key directories
    const directoriesToScan = [
      'app',
      'components',
      'lib',
      'types',
      'e2e',
      'scripts'
    ]

    for (const dir of directoriesToScan) {
      const dirPath = join(PROJECT_ROOT, dir)
      try {
        await stat(dirPath)
        await scanDirectory(dirPath, dir)
      } catch (error) {
        // Directory doesn't exist, skip
        continue
      }
    }

    printResults()
  } catch (error) {
    console.error(`${colors.red}Error during validation:${colors.reset}`, error)
    process.exit(1)
  }
}

main()
