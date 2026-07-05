import { inflateSync } from 'node:zlib'

/** Result of inspecting a candidate signature PNG. */
export type SignaturePngCheck = { ok: true } | { ok: false; reason: 'unreadable' | 'blank' }

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/**
 * Server-side blank-signature guard: a canvas.toDataURL PNG of an untouched (or cleared)
 * signature pad is a perfectly uniform image — every pixel identical (fully transparent on
 * our pad). Any real stroke or rendered typed name produces non-uniform pixels (antialiasing
 * guarantees it). The client disables Save while untouched, but the keyboard/typed-name path
 * and any direct caller of the Server Action could still post a blank PNG — and a signature
 * is a mandatory lifecycle gate on a regulatory record, so the server must reject it too.
 *
 * Pure and dependency-free: parses PNG chunks, inflates IDAT with node:zlib, unfilters
 * scanlines, and compares every pixel to the first. Supports what canvas emits (8-bit RGBA,
 * non-interlaced) plus 8-bit RGB/greyscale. Anything unparseable is rejected as "unreadable"
 * (fail-closed); exotic-but-valid formats we cannot cheaply verify (interlaced, paletted,
 * 16-bit) are allowed through — the data-URI allowlist upstream already constrains the source.
 */
export function checkSignaturePng(bytes: Buffer): SignaturePngCheck {
  try {
    if (bytes.length < 8 + 25 || !bytes.subarray(0, 8).equals(PNG_MAGIC)) {
      return { ok: false, reason: 'unreadable' }
    }

    let width = 0,
      height = 0,
      bitDepth = 0,
      colorType = 0,
      interlace = 0
    const idat: Buffer[] = []
    let off = 8
    while (off + 8 <= bytes.length) {
      const len = bytes.readUInt32BE(off)
      const type = bytes.toString('ascii', off + 4, off + 8)
      const dataStart = off + 8
      if (dataStart + len + 4 > bytes.length) return { ok: false, reason: 'unreadable' }
      if (type === 'IHDR') {
        width = bytes.readUInt32BE(dataStart)
        height = bytes.readUInt32BE(dataStart + 4)
        bitDepth = bytes[dataStart + 8]
        colorType = bytes[dataStart + 9]
        interlace = bytes[dataStart + 12]
      } else if (type === 'IDAT') {
        idat.push(bytes.subarray(dataStart, dataStart + len))
      } else if (type === 'IEND') {
        break
      }
      off = dataStart + len + 4 // skip CRC
    }
    if (width === 0 || height === 0 || idat.length === 0) return { ok: false, reason: 'unreadable' }

    // Formats canvas never emits and we can't cheaply unfilter — allow (upstream allowlist applies).
    const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : 0
    if (interlace !== 0 || bitDepth !== 8 || channels === 0) return { ok: true }

    const raw = inflateSync(Buffer.concat(idat))
    const bpp = channels // bytes per pixel at bit depth 8
    const stride = width * bpp
    if (raw.length < height * (stride + 1)) return { ok: false, reason: 'unreadable' }

    // Unfilter (PNG filters 0-4), then compare every pixel against the first.
    const prev = Buffer.alloc(stride)
    const cur = Buffer.alloc(stride)
    const first = Buffer.alloc(bpp)
    let uniform = true
    for (let y = 0; y < height; y++) {
      const rowStart = y * (stride + 1)
      const filter = raw[rowStart]
      for (let x = 0; x < stride; x++) {
        const v = raw[rowStart + 1 + x]
        const a = x >= bpp ? cur[x - bpp] : 0
        const b = prev[x]
        const c = x >= bpp ? prev[x - bpp] : 0
        let out: number
        switch (filter) {
          case 0:
            out = v
            break
          case 1:
            out = (v + a) & 0xff
            break
          case 2:
            out = (v + b) & 0xff
            break
          case 3:
            out = (v + ((a + b) >> 1)) & 0xff
            break
          case 4: {
            const p = a + b - c
            const pa = Math.abs(p - a),
              pb = Math.abs(p - b),
              pc = Math.abs(p - c)
            out = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff
            break
          }
          default:
            return { ok: false, reason: 'unreadable' }
        }
        cur[x] = out
      }
      if (y === 0) cur.copy(first, 0, 0, bpp)
      if (uniform) {
        for (let x = 0; x < stride; x++) {
          if (cur[x] !== first[x % bpp]) {
            uniform = false
            break
          }
        }
      }
      cur.copy(prev)
      if (!uniform) return { ok: true } // found a distinct pixel — real content, stop early
    }
    return uniform ? { ok: false, reason: 'blank' } : { ok: true }
  } catch {
    return { ok: false, reason: 'unreadable' }
  }
}
