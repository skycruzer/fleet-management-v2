import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  close: vi.fn(),
  createAdminClient: vi.fn(),
  launch: vi.fn(),
  newPage: vi.fn(),
  pdf: vi.fn(),
  setContent: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mocks.createAdminClient,
}))

vi.mock('puppeteer', () => ({
  launch: mocks.launch,
}))

describe('generateRetirementForecastPDF', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    const query: Record<string, unknown> = {}
    query.select = vi.fn(() => query)
    query.eq = vi.fn(() => query)
    query.not = vi.fn(() => query)
    query.then = (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(resolve)
    mocks.createAdminClient.mockReturnValue({ from: vi.fn(() => query) })

    mocks.pdf.mockResolvedValue(new Uint8Array([1, 2, 3]))
    mocks.newPage.mockResolvedValue({
      setContent: mocks.setContent,
      pdf: mocks.pdf,
    })
    mocks.launch.mockResolvedValue({ close: mocks.close, newPage: mocks.newPage })
  })

  it('waits for the supported document-load event before rendering the PDF', async () => {
    const { generateRetirementForecastPDF } =
      await import('@/lib/services/retirement-forecast-service')

    await expect(generateRetirementForecastPDF()).resolves.toEqual(Buffer.from([1, 2, 3]))

    expect(mocks.setContent).toHaveBeenCalledWith(
      expect.stringContaining('Retirement Forecast Report'),
      { waitUntil: 'load' }
    )
    expect(mocks.close).toHaveBeenCalledOnce()
  })
})
