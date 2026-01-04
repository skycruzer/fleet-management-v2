/**
 * Next.js 15 Icon API Route
 * Generates PNG icons dynamically for PWA
 */

import { ImageResponse } from 'next/og'

// Image metadata
export const runtime = 'edge'
export const size = {
  width: 192,
  height: 192,
}
export const contentType = 'image/png'

// Icon generation
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 128,
        background: '#0ea5e9',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'system-ui',
        fontWeight: 'bold',
      }}
    >
      FM
    </div>,
    {
      ...size,
    }
  )
}
