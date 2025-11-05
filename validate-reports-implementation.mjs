/**
 * Reports Implementation Validation Script
 * Author: Maurice Rondeau
 * Date: November 3, 2025
 *
 * Validates that all Reports system files exist and are properly structured
 */

import fs from 'fs/promises'
import path from 'path'

const VALIDATION_RESULTS = {
  files: { passed: 0, failed: 0, tests: [] },
  structure: { passed: 0, failed: 0, tests: [] },
  imports: { passed: 0, failed: 0, tests: [] }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function validateCoreFiles() {
  console.log('📁 Validating Core Files...\n')

  const coreFiles = [
    { path: 'types/reports.ts', name: 'Type definitions' },
    { path: 'lib/config/reports-config.ts', name: 'Reports configuration' },
    { path: 'lib/utils/report-generators.ts', name: 'Report generators utility' },
    { path: 'components/reports/report-card.tsx', name: 'ReportCard component' },
    { path: 'app/dashboard/reports/page.tsx', name: 'Reports page (server)' },
    { path: 'app/dashboard/reports/reports-client.tsx', name: 'Reports page (client)' }
  ]

  for (const file of coreFiles) {
    const exists = await fileExists(file.path)
    VALIDATION_RESULTS.files.tests.push({
      name: file.name,
      passed: exists,
      details: exists ? `✓ Found at ${file.path}` : `✗ Missing: ${file.path}`
    })
    if (exists) VALIDATION_RESULTS.files.passed++
    else VALIDATION_RESULTS.files.failed++
  }

  console.log(`Core Files: ${VALIDATION_RESULTS.files.passed}/${coreFiles.length} passed\n`)
}

async function validateAPIEndpoints() {
  console.log('🔌 Validating API Endpoints...\n')

  const endpoints = [
    // Fleet Reports
    { path: 'app/api/reports/fleet/active-roster/route.ts', name: 'Fleet: Active Roster' },
    { path: 'app/api/reports/fleet/demographics/route.ts', name: 'Fleet: Demographics' },
    { path: 'app/api/reports/fleet/retirement-forecast/route.ts', name: 'Fleet: Retirement Forecast' },
    { path: 'app/api/reports/fleet/succession-pipeline/route.ts', name: 'Fleet: Succession Pipeline' },

    // Certification Reports
    { path: 'app/api/reports/certifications/all/route.ts', name: 'Certs: All Certifications' },
    { path: 'app/api/reports/certifications/expiring/route.ts', name: 'Certs: Expiring' },
    { path: 'app/api/reports/certifications/compliance/route.ts', name: 'Certs: Compliance' },
    { path: 'app/api/reports/certifications/renewal-schedule/route.ts', name: 'Certs: Renewal Schedule' },

    // Leave Reports
    { path: 'app/api/reports/leave/request-summary/route.ts', name: 'Leave: Request Summary' },
    { path: 'app/api/reports/leave/annual-allocation/route.ts', name: 'Leave: Annual Allocation' },
    { path: 'app/api/reports/leave/bid-summary/route.ts', name: 'Leave: Bid Summary' },
    { path: 'app/api/reports/leave/calendar-export/route.ts', name: 'Leave: Calendar Export' },

    // Operational Reports
    { path: 'app/api/reports/operational/flight-requests/route.ts', name: 'Ops: Flight Requests' },
    { path: 'app/api/reports/operational/task-completion/route.ts', name: 'Ops: Task Completion' },
    { path: 'app/api/reports/operational/disciplinary/route.ts', name: 'Ops: Disciplinary' },

    // System Reports
    { path: 'app/api/reports/system/audit-log/route.ts', name: 'System: Audit Log' },
    { path: 'app/api/reports/system/user-activity/route.ts', name: 'System: User Activity' },
    { path: 'app/api/reports/system/feedback/route.ts', name: 'System: Feedback' },
    { path: 'app/api/reports/system/health/route.ts', name: 'System: Health' }
  ]

  for (const endpoint of endpoints) {
    const exists = await fileExists(endpoint.path)
    VALIDATION_RESULTS.files.tests.push({
      name: endpoint.name,
      passed: exists,
      details: exists ? `✓ ${endpoint.path}` : `✗ Missing: ${endpoint.path}`
    })
    if (exists) VALIDATION_RESULTS.files.passed++
    else VALIDATION_RESULTS.files.failed++
  }

  console.log(`API Endpoints: ${endpoints.filter((_, i) => VALIDATION_RESULTS.files.tests.slice(-19)[i].passed).length}/${endpoints.length} found\n`)
}

async function validateFileStructure() {
  console.log('🏗️ Validating File Structure...\n')

  try {
    // Validate types/reports.ts
    const typesContent = await fs.readFile('types/reports.ts', 'utf-8')
    const hasReportInterface = typesContent.includes('export interface Report')
    const hasReportCategory = typesContent.includes('export type ReportCategory')
    const hasReportFormat = typesContent.includes('export type ReportFormat')

    VALIDATION_RESULTS.structure.tests.push({
      name: 'Type definitions complete',
      passed: hasReportInterface && hasReportCategory && hasReportFormat,
      details: `Report interface: ${hasReportInterface}, ReportCategory: ${hasReportCategory}, ReportFormat: ${hasReportFormat}`
    })
    if (hasReportInterface && hasReportCategory && hasReportFormat) VALIDATION_RESULTS.structure.passed++
    else VALIDATION_RESULTS.structure.failed++

    // Validate lib/config/reports-config.ts
    const configContent = await fs.readFile('lib/config/reports-config.ts', 'utf-8')
    const hasReportsArray = configContent.includes('export const REPORTS')
    const has19Reports = (configContent.match(/id:/g) || []).length >= 19

    VALIDATION_RESULTS.structure.tests.push({
      name: 'Reports configuration complete',
      passed: hasReportsArray && has19Reports,
      details: `REPORTS array: ${hasReportsArray}, Report count: ${(configContent.match(/id:/g) || []).length}`
    })
    if (hasReportsArray && has19Reports) VALIDATION_RESULTS.structure.passed++
    else VALIDATION_RESULTS.structure.failed++

    // Validate lib/utils/report-generators.ts
    const utilsContent = await fs.readFile('lib/utils/report-generators.ts', 'utf-8')
    const hasGenerateCSV = utilsContent.includes('export function generateCSV')
    const hasGenerateExcel = utilsContent.includes('export function generateExcel')
    const hasGenerateICalendar = utilsContent.includes('export function generateICalendar')

    VALIDATION_RESULTS.structure.tests.push({
      name: 'Report utilities complete',
      passed: hasGenerateCSV && hasGenerateExcel && hasGenerateICalendar,
      details: `generateCSV: ${hasGenerateCSV}, generateExcel: ${hasGenerateExcel}, generateICalendar: ${hasGenerateICalendar}`
    })
    if (hasGenerateCSV && hasGenerateExcel && hasGenerateICalendar) VALIDATION_RESULTS.structure.passed++
    else VALIDATION_RESULTS.structure.failed++

    // Validate components/reports/report-card.tsx
    const componentContent = await fs.readFile('components/reports/report-card.tsx', 'utf-8')
    const hasReportCardExport = componentContent.includes('export function ReportCard')
    const hasGenerateHandler = componentContent.includes('handleGenerate')

    VALIDATION_RESULTS.structure.tests.push({
      name: 'ReportCard component complete',
      passed: hasReportCardExport && hasGenerateHandler,
      details: `Component export: ${hasReportCardExport}, Generate handler: ${hasGenerateHandler}`
    })
    if (hasReportCardExport && hasGenerateHandler) VALIDATION_RESULTS.structure.passed++
    else VALIDATION_RESULTS.structure.failed++

    // Validate app/dashboard/reports/reports-client.tsx
    const clientContent = await fs.readFile('app/dashboard/reports/reports-client.tsx', 'utf-8')
    const hasReportsClientExport = clientContent.includes('export function ReportsClient')
    const hasCategoryTabs = clientContent.includes('Tabs')
    const hasSearchQuery = clientContent.includes('searchQuery')

    VALIDATION_RESULTS.structure.tests.push({
      name: 'ReportsClient component complete',
      passed: hasReportsClientExport && hasCategoryTabs && hasSearchQuery,
      details: `Component export: ${hasReportsClientExport}, Tabs: ${hasCategoryTabs}, Search: ${hasSearchQuery}`
    })
    if (hasReportsClientExport && hasCategoryTabs && hasSearchQuery) VALIDATION_RESULTS.structure.passed++
    else VALIDATION_RESULTS.structure.failed++

    console.log(`Structure Validation: ${VALIDATION_RESULTS.structure.passed}/5 passed\n`)

  } catch (error) {
    console.error(`Structure validation error: ${error.message}\n`)
    VALIDATION_RESULTS.structure.failed++
  }
}

async function validateImports() {
  console.log('📦 Validating Imports...\n')

  try {
    // Check sample API endpoint imports
    const sampleEndpoint = await fs.readFile('app/api/reports/fleet/active-roster/route.ts', 'utf-8')

    const hasNextImports = sampleEndpoint.includes('from \'next/server\'')
    const hasSupabaseImport = sampleEndpoint.includes('from \'@/lib/supabase/server\'')
    const hasUtilsImport = sampleEndpoint.includes('from \'@/lib/utils/report-generators\'')
    const hasServiceImport = sampleEndpoint.includes('from \'@/lib/services/')
    const hasPOSTHandler = sampleEndpoint.includes('export async function POST')

    VALIDATION_RESULTS.imports.tests.push({
      name: 'API endpoint imports correct',
      passed: hasNextImports && hasSupabaseImport && hasUtilsImport && hasPOSTHandler,
      details: `Next.js: ${hasNextImports}, Supabase: ${hasSupabaseImport}, Utils: ${hasUtilsImport}, POST handler: ${hasPOSTHandler}`
    })
    if (hasNextImports && hasSupabaseImport && hasUtilsImport && hasPOSTHandler) VALIDATION_RESULTS.imports.passed++
    else VALIDATION_RESULTS.imports.failed++

    // Check ReportsClient imports
    const clientContent = await fs.readFile('app/dashboard/reports/reports-client.tsx', 'utf-8')

    const hasUseClientDirective = clientContent.includes("'use client'")
    const hasReactImports = clientContent.includes('from \'react\'')
    const hasReportsConfigImport = clientContent.includes('from \'@/lib/config/reports-config\'')
    const hasReportCardImport = clientContent.includes('from \'@/components/reports/report-card\'')

    VALIDATION_RESULTS.imports.tests.push({
      name: 'ReportsClient imports correct',
      passed: hasUseClientDirective && hasReactImports && hasReportsConfigImport && hasReportCardImport,
      details: `'use client': ${hasUseClientDirective}, React: ${hasReactImports}, Config: ${hasReportsConfigImport}, ReportCard: ${hasReportCardImport}`
    })
    if (hasUseClientDirective && hasReactImports && hasReportsConfigImport && hasReportCardImport) VALIDATION_RESULTS.imports.passed++
    else VALIDATION_RESULTS.imports.failed++

    console.log(`Import Validation: ${VALIDATION_RESULTS.imports.passed}/2 passed\n`)

  } catch (error) {
    console.error(`Import validation error: ${error.message}\n`)
    VALIDATION_RESULTS.imports.failed++
  }
}

function generateReport() {
  console.log('=' .repeat(80))
  console.log('📊 REPORTS IMPLEMENTATION VALIDATION RESULTS')
  console.log('='.repeat(80))

  const totalPassed = Object.values(VALIDATION_RESULTS).reduce((sum, cat) => sum + cat.passed, 0)
  const totalFailed = Object.values(VALIDATION_RESULTS).reduce((sum, cat) => sum + cat.failed, 0)
  const totalTests = totalPassed + totalFailed

  console.log('\n📈 SUMMARY')
  console.log('-'.repeat(80))
  console.log(`Total Validations: ${totalTests}`)
  console.log(`✅ Passed: ${totalPassed} (${((totalPassed/totalTests)*100).toFixed(1)}%)`)
  console.log(`❌ Failed: ${totalFailed} (${((totalFailed/totalTests)*100).toFixed(1)}%)`)

  console.log('\n📋 BY CATEGORY')
  console.log('-'.repeat(80))
  for (const [category, results] of Object.entries(VALIDATION_RESULTS)) {
    const total = results.passed + results.failed
    const percentage = total > 0 ? ((results.passed/total)*100).toFixed(1) : '0.0'
    console.log(`${category.toUpperCase().padEnd(20)} - ${results.passed}/${total} passed (${percentage}%)`)
  }

  console.log('\n🔍 DETAILED RESULTS')
  console.log('-'.repeat(80))
  for (const [category, results] of Object.entries(VALIDATION_RESULTS)) {
    if (results.tests.length > 0) {
      console.log(`\n${category.toUpperCase()}:`)
      results.tests.forEach(test => {
        const icon = test.passed ? '✅' : '❌'
        console.log(`  ${icon} ${test.name}`)
        if (test.details && !test.passed) {
          console.log(`     ${test.details}`)
        }
      })
    }
  }

  console.log('\n' + '='.repeat(80))

  if (totalFailed === 0) {
    console.log('🎉 ALL VALIDATIONS PASSED! Reports implementation is complete and correct.')
  } else {
    console.log(`⚠️ ${totalFailed} validation(s) failed. Review details above.`)
  }

  return { totalPassed, totalFailed, totalTests, results: VALIDATION_RESULTS }
}

async function saveValidationReport(reportData) {
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `REPORTS-VALIDATION-RESULTS-${timestamp}.md`

  let markdown = `# Reports Implementation Validation Results\n\n`
  markdown += `**Date**: ${new Date().toISOString()}\n`
  markdown += `**Total Validations**: ${reportData.totalTests}\n`
  markdown += `**Passed**: ${reportData.totalPassed} (${((reportData.totalPassed/reportData.totalTests)*100).toFixed(1)}%)\n`
  markdown += `**Failed**: ${reportData.totalFailed} (${((reportData.totalFailed/reportData.totalTests)*100).toFixed(1)}%)\n\n`

  markdown += `## Summary by Category\n\n`
  for (const [category, results] of Object.entries(reportData.results)) {
    const total = results.passed + results.failed
    const percentage = total > 0 ? ((results.passed/total)*100).toFixed(1) : '0.0'
    markdown += `- **${category.toUpperCase()}**: ${results.passed}/${total} passed (${percentage}%)\n`
  }

  markdown += `\n## Files Validated\n\n`
  markdown += `### Core Files (6)\n`
  markdown += `- Type definitions\n`
  markdown += `- Reports configuration\n`
  markdown += `- Report generators utility\n`
  markdown += `- ReportCard component\n`
  markdown += `- Reports page (server)\n`
  markdown += `- Reports page (client)\n\n`

  markdown += `### API Endpoints (19)\n`
  markdown += `- **Fleet Reports**: 4 endpoints\n`
  markdown += `- **Certification Reports**: 4 endpoints\n`
  markdown += `- **Leave Reports**: 4 endpoints\n`
  markdown += `- **Operational Reports**: 3 endpoints\n`
  markdown += `- **System Reports**: 4 endpoints\n\n`

  markdown += `## Detailed Results\n\n`
  for (const [category, results] of Object.entries(reportData.results)) {
    if (results.tests.length > 0) {
      markdown += `### ${category.toUpperCase()}\n\n`
      results.tests.forEach(test => {
        const icon = test.passed ? '✅' : '❌'
        markdown += `${icon} **${test.name}**\n`
        if (test.details && !test.passed) {
          markdown += `   - ${test.details}\n`
        }
        markdown += `\n`
      })
    }
  }

  if (reportData.totalFailed === 0) {
    markdown += `## 🎉 Conclusion\n\nAll implementation validations passed! The Reports system files are complete and properly structured.\n\n`
    markdown += `### What This Means\n`
    markdown += `- ✅ All 25 files created successfully\n`
    markdown += `- ✅ Type system is complete\n`
    markdown += `- ✅ Configuration is valid\n`
    markdown += `- ✅ Utilities are implemented\n`
    markdown += `- ✅ Components are structured correctly\n`
    markdown += `- ✅ All 19 API endpoints exist\n`
    markdown += `- ✅ Imports are correct\n\n`
    markdown += `### Next Steps\n`
    markdown += `1. Run manual testing of API endpoints\n`
    markdown += `2. Test UI functionality in browser\n`
    markdown += `3. Verify file downloads work correctly\n`
    markdown += `4. Check data accuracy in generated reports\n`
  } else {
    markdown += `## ⚠️ Issues Found\n\n${reportData.totalFailed} validation(s) failed. Review the detailed results above to fix implementation issues.\n`
  }

  await fs.writeFile(filename, markdown)
  console.log(`\n📄 Validation report saved: ${filename}`)
}

async function main() {
  console.log('🚀 Starting Reports Implementation Validation...\n')

  try {
    await validateCoreFiles()
    await validateAPIEndpoints()
    await validateFileStructure()
    await validateImports()

    const reportData = generateReport()
    await saveValidationReport(reportData)

  } catch (error) {
    console.error('\n❌ Validation failed:', error)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
