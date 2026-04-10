/**
 * E2E Test: Medical Certificate Upload
 *
 * Developer: Maurice Rondeau
 * Date: February 2, 2026
 *
 * Tests the medical certificate upload feature in the pilot portal
 * leave request form.
 */

import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

// Test data
const PILOT_EMAIL = process.env.TEST_PILOT_EMAIL || 'pilot@test.com'
const PILOT_PASSWORD = process.env.TEST_PILOT_PASSWORD || 'testpassword123'

// Create a test PDF file
function createTestPDF(): Buffer {
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
trailer
<< /Size 4 /Root 1 0 R >>
startxref
192
%%EOF`
  return Buffer.from(pdfContent)
}

test.describe('Medical Certificate Upload', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to pilot portal login
    await page.goto('/portal/login')
  })

  test('file upload appears only for sick leave', async ({ page }) => {
    // Skip login for now - just test the UI behavior
    await page.goto('/portal/leave-requests/new')

    // Initially, select Annual Leave - no file upload should show
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Annual Leave' }).click()

    // File upload should NOT be visible
    await expect(page.getByText('Medical Certificate')).not.toBeVisible()

    // Select Sick Leave - file upload should appear
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Sick Leave' }).click()

    // File upload should now be visible
    await expect(page.getByText('Medical Certificate (Optional)')).toBeVisible()
    await expect(page.getByText('You can attach a medical certificate')).toBeVisible()
  })

  test('validates file type restrictions', async ({ page }) => {
    await page.goto('/portal/leave-requests/new')

    // Select Sick Leave
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Sick Leave' }).click()

    // The file upload component should accept PDF, JPG, PNG
    const fileInput = page.locator('input[type="file"]')
    await expect(fileInput).toHaveAttribute('accept', expect.stringContaining('.pdf'))
    await expect(fileInput).toHaveAttribute('accept', expect.stringContaining('.jpg'))
    await expect(fileInput).toHaveAttribute('accept', expect.stringContaining('.png'))
  })

  test('shows file preview after selection', async ({ page }) => {
    // Create a temporary test PDF file
    const testPdfPath = path.join(__dirname, 'test-medical-cert.pdf')
    fs.writeFileSync(testPdfPath, createTestPDF())

    try {
      await page.goto('/portal/leave-requests/new')

      // Select Sick Leave
      await page.getByRole('combobox').click()
      await page.getByRole('option', { name: 'Sick Leave' }).click()

      // Upload the test file
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(testPdfPath)

      // Should show file name
      await expect(page.getByText('test-medical-cert.pdf')).toBeVisible()

      // Should show remove button
      await expect(page.getByRole('button', { name: 'Remove file' })).toBeVisible()
    } finally {
      // Cleanup test file
      if (fs.existsSync(testPdfPath)) {
        fs.unlinkSync(testPdfPath)
      }
    }
  })

  test('can remove selected file', async ({ page }) => {
    // Create a temporary test PDF file
    const testPdfPath = path.join(__dirname, 'test-medical-cert-remove.pdf')
    fs.writeFileSync(testPdfPath, createTestPDF())

    try {
      await page.goto('/portal/leave-requests/new')

      // Select Sick Leave
      await page.getByRole('combobox').click()
      await page.getByRole('option', { name: 'Sick Leave' }).click()

      // Upload the test file
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(testPdfPath)

      // Verify file is shown
      await expect(page.getByText('test-medical-cert-remove.pdf')).toBeVisible()

      // Click remove button
      await page.getByRole('button', { name: 'Remove file' }).click()

      // File name should no longer be visible
      await expect(page.getByText('test-medical-cert-remove.pdf')).not.toBeVisible()

      // Upload prompt should be visible again
      await expect(page.getByText('Click to upload')).toBeVisible()
    } finally {
      // Cleanup test file
      if (fs.existsSync(testPdfPath)) {
        fs.unlinkSync(testPdfPath)
      }
    }
  })

  test('rejects oversized files', async ({ page }) => {
    // Create a file that exceeds the 10MB limit
    const testFilePath = path.join(__dirname, 'test-oversized.pdf')
    // Create an 11MB buffer (just over the limit)
    const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024, 0)
    // Add PDF header so it looks like a valid PDF
    const pdfHeader = createTestPDF()
    pdfHeader.copy(oversizedBuffer, 0)
    fs.writeFileSync(testFilePath, oversizedBuffer)

    try {
      await page.goto('/portal/leave-requests/new')

      // Select Sick Leave
      await page.getByRole('combobox').click()
      await page.getByRole('option', { name: 'Sick Leave' }).click()

      // Try to upload the oversized file
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(testFilePath)

      // Should show an error about file size
      await expect(page.getByText(/file size|too large|exceeds|10\s*MB/i)).toBeVisible({
        timeout: 5000,
      })
    } finally {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath)
      }
    }
  })

  test('rejects invalid file types', async ({ page }) => {
    const testFilePath = path.join(__dirname, 'test-invalid.txt')
    fs.writeFileSync(testFilePath, 'This is a plain text file, not a valid medical certificate.')

    try {
      await page.goto('/portal/leave-requests/new')

      // Select Sick Leave
      await page.getByRole('combobox').click()
      await page.getByRole('option', { name: 'Sick Leave' }).click()

      // Try to upload a .txt file
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(testFilePath)

      // Should show an error about file type (or the file should be rejected by the accept attribute)
      // The component validates via the accept attribute and client-side validation
      const errorVisible = await page
        .getByText(/invalid|not supported|file type|format/i)
        .isVisible()
        .catch(() => false)
      const fileNotShown = await page
        .getByText('test-invalid.txt')
        .isVisible()
        .catch(() => false)

      // Either an error message shows, or the file is not accepted
      expect(errorVisible || !fileNotShown).toBeTruthy()
    } finally {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath)
      }
    }
  })

  test('file upload zone is keyboard accessible', async ({ page }) => {
    await page.goto('/portal/leave-requests/new')

    // Select Sick Leave
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Sick Leave' }).click()

    // The drop zone should have role="button" and be focusable
    const dropZone = page.locator(
      '[role="button"][aria-label*="upload" i], [role="button"][aria-label*="Upload" i]'
    )
    await expect(dropZone).toBeVisible()

    // Should be focusable via tabIndex
    await expect(dropZone).toHaveAttribute('tabindex', '0')
  })
})
