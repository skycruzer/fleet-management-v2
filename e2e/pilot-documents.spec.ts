/**
 * E2E Test: Pilot Document Attachments
 *
 * Developer: Maurice Rondeau
 * Date: June 10, 2026
 *
 * Tests the Documents tab on the admin pilot detail page:
 * upload → list → delete lifecycle (cleans up after itself).
 */

import { test, expect, Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { loginAsAdmin } from './helpers/test-utils'

// Minimal valid PDF (passes server-side magic-byte validation: %PDF header)
function createTestPdf(): string {
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
trailer
<< /Size 4 /Root 1 0 R >>
%%EOF`
  const filePath = path.join(os.tmpdir(), `e2e-pilot-doc-${Date.now()}.pdf`)
  fs.writeFileSync(filePath, pdfContent)
  return filePath
}

async function openFirstPilotDocumentsTab(page: Page) {
  await page.goto('/dashboard/pilots')
  await page.waitForLoadState('networkidle', { timeout: 60000 })

  // Open the first pilot's detail page (exclude /new and /edit links)
  const firstPilotLink = page
    .locator('a[href*="/dashboard/pilots/"]:not([href$="/new"]):not([href$="/edit"])')
    .first()
  await expect(firstPilotLink).toBeVisible({ timeout: 60000 })
  await firstPilotLink.click()
  await page.waitForURL(/\/dashboard\/pilots\/[0-9a-f]{8}-/, { timeout: 60000 })

  // Switch to the Documents tab
  await page.getByRole('tab', { name: /documents/i }).click()
  await expect(page.getByRole('heading', { name: /upload document/i })).toBeVisible({
    timeout: 60000,
  })
}

test.describe('Pilot Documents Tab', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('shows the Documents tab with upload form and list', async ({ page }) => {
    await openFirstPilotDocumentsTab(page)

    await expect(page.getByRole('heading', { name: /^documents$/i })).toBeVisible({
      timeout: 60000,
    })
    // Upload controls present
    await expect(page.locator('input[type="file"]')).toBeAttached({ timeout: 60000 })
    await expect(page.getByRole('button', { name: /^upload$/i })).toBeVisible({ timeout: 60000 })
    // Upload disabled until a file is selected
    await expect(page.getByRole('button', { name: /^upload$/i })).toBeDisabled()
  })

  test('uploads a PDF, lists it, then deletes it', async ({ page }) => {
    const pdfPath = createTestPdf()
    const fileName = path.basename(pdfPath)

    try {
      await openFirstPilotDocumentsTab(page)

      // Select file and a title so the row is uniquely identifiable
      await page.locator('input[type="file"]').setInputFiles(pdfPath)
      const title = `E2E test document ${Date.now()}`
      await page.getByLabel(/title/i).fill(title)

      // Upload
      const uploadButton = page.getByRole('button', { name: /^upload$/i })
      await expect(uploadButton).toBeEnabled({ timeout: 60000 })
      await uploadButton.click()

      // The new document appears in the list with its title and metadata
      const row = page.locator('li', { hasText: title })
      await expect(row).toBeVisible({ timeout: 60000 })
      await expect(row).toContainText(fileName)

      // Delete it (confirm dialog)
      await row.getByRole('button', { name: new RegExp(`delete ${title}`, 'i') }).click()
      await page.getByRole('button', { name: /^delete$/i }).click()

      // Row disappears — DB row and storage object removed server-side
      await expect(row).not.toBeVisible({ timeout: 60000 })
    } finally {
      fs.unlinkSync(pdfPath)
    }
  })

  test('rejects a file with invalid content masquerading as PDF', async ({ page }) => {
    // Plain text with .pdf extension — must fail server-side magic-byte validation
    const fakePath = path.join(os.tmpdir(), `e2e-fake-${Date.now()}.pdf`)
    fs.writeFileSync(fakePath, 'this is not a pdf')

    try {
      await openFirstPilotDocumentsTab(page)

      await page.locator('input[type="file"]').setInputFiles(fakePath)
      const uploadButton = page.getByRole('button', { name: /^upload$/i })

      // Client-side validation may already reject; if the button is enabled,
      // the server's magic-byte check must reject it.
      if (await uploadButton.isEnabled()) {
        await uploadButton.click()
        await expect(
          page.getByText(/upload failed|unable to detect file type|invalid file type/i).first()
        ).toBeVisible({ timeout: 60000 })
      } else {
        await expect(uploadButton).toBeDisabled()
      }
    } finally {
      fs.unlinkSync(fakePath)
    }
  })
})
