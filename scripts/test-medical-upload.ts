/**
 * Test Script: Medical Certificate Upload
 *
 * Developer: Maurice Rondeau
 * Date: February 2, 2026
 *
 * Tests the file upload service directly (bypassing API auth)
 * to verify Supabase Storage integration works correctly.
 *
 * Run with: npx tsx scripts/test-medical-upload.ts
 */

// Load environment variables before other imports
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createServiceRoleClient } from '../lib/supabase/service-role'
import {
  uploadMedicalCertificate,
  getMedicalCertificateSignedUrl,
  deleteMedicalCertificate,
  MEDICAL_CERTIFICATES_BUCKET,
} from '../lib/services/file-upload-service'
import { detectMimeType } from '../lib/services/file-upload-service'

// Test pilot ID (use a real one from your database for actual testing)
const TEST_PILOT_ID = 'test-pilot-12345'

// Create a simple test PNG (1x1 red pixel)
function createTestPNG(): Uint8Array {
  // Minimal valid PNG: 1x1 red pixel
  const pngHeader = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  const ihdrChunk = [
    0x00,
    0x00,
    0x00,
    0x0d, // length
    0x49,
    0x48,
    0x44,
    0x52, // IHDR
    0x00,
    0x00,
    0x00,
    0x01, // width: 1
    0x00,
    0x00,
    0x00,
    0x01, // height: 1
    0x08, // bit depth: 8
    0x02, // color type: RGB
    0x00, // compression: deflate
    0x00, // filter: none
    0x00, // interlace: none
    0x90,
    0x77,
    0x53,
    0xde, // CRC
  ]
  const idatChunk = [
    0x00,
    0x00,
    0x00,
    0x0c, // length
    0x49,
    0x44,
    0x41,
    0x54, // IDAT
    0x08,
    0xd7,
    0x63,
    0xf8,
    0xcf,
    0xc0,
    0x00,
    0x00, // compressed data
    0x01,
    0x01,
    0x01,
    0x00, // CRC (approximate)
  ]
  const iendChunk = [
    0x00,
    0x00,
    0x00,
    0x00, // length
    0x49,
    0x45,
    0x4e,
    0x44, // IEND
    0xae,
    0x42,
    0x60,
    0x82, // CRC
  ]

  return new Uint8Array([...pngHeader, ...ihdrChunk, ...idatChunk, ...iendChunk])
}

// Create a simple test PDF
function createTestPDF(): Uint8Array {
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
  return new TextEncoder().encode(pdfContent)
}

async function runTests() {
  console.log('🧪 Testing Medical Certificate Upload Feature\n')
  console.log('='.repeat(50))

  // Test 1: Verify bucket exists
  console.log('\n📦 Test 1: Verify storage bucket exists')
  try {
    const supabase = createServiceRoleClient()
    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
      console.log('❌ Failed to list buckets:', error.message)
    } else {
      const bucket = buckets?.find((b) => b.id === MEDICAL_CERTIFICATES_BUCKET)
      if (bucket) {
        console.log('✅ Bucket found:', bucket.name)
        console.log('   - Public:', bucket.public)
        console.log('   - Size limit:', bucket.file_size_limit, 'bytes')
        console.log('   - Allowed types:', bucket.allowed_mime_types)
      } else {
        console.log('❌ Bucket not found. Run the migration first.')
        return
      }
    }
  } catch (err) {
    console.log('❌ Error checking bucket:', err)
    return
  }

  // Test 2: Test PNG magic byte detection
  console.log('\n🔍 Test 2: Magic byte detection (PNG)')
  const testPNG = createTestPNG()
  const pngType = detectMimeType(testPNG)
  console.log('   Detected type:', pngType)
  console.log(pngType === 'image/png' ? '✅ PNG detection correct' : '❌ PNG detection failed')

  // Test 3: Test PDF magic byte detection
  console.log('\n🔍 Test 3: Magic byte detection (PDF)')
  const testPDF = createTestPDF()
  const pdfType = detectMimeType(testPDF)
  console.log('   Detected type:', pdfType)
  console.log(
    pdfType === 'application/pdf' ? '✅ PDF detection correct' : '❌ PDF detection failed'
  )

  // Test 4: Upload a test file
  console.log('\n📤 Test 4: Upload test PDF')
  const uploadResult = await uploadMedicalCertificate({
    file: testPDF,
    filename: 'test-medical-cert.pdf',
    mimeType: 'application/pdf',
    pilotId: TEST_PILOT_ID,
  })

  if (uploadResult.success) {
    console.log('✅ Upload successful!')
    console.log('   - Path:', uploadResult.path)
    console.log('   - URL:', uploadResult.url?.substring(0, 80) + '...')

    // Test 5: Get signed URL
    console.log('\n🔗 Test 5: Generate signed URL')
    if (uploadResult.path) {
      const signedUrl = await getMedicalCertificateSignedUrl(uploadResult.path)
      if (signedUrl) {
        console.log('✅ Signed URL generated')
        console.log('   - URL expires in 1 hour')
      } else {
        console.log('❌ Failed to generate signed URL')
      }
    }

    // Test 6: Delete test file (cleanup)
    console.log('\n🗑️ Test 6: Delete test file (cleanup)')
    if (uploadResult.path) {
      const deleted = await deleteMedicalCertificate(uploadResult.path)
      console.log(deleted ? '✅ Test file deleted' : '❌ Failed to delete test file')
    }
  } else {
    console.log('❌ Upload failed:', uploadResult.error)
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('🏁 Testing complete!')
}

// Run tests
runTests().catch(console.error)
