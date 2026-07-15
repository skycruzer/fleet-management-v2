import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requireRoleMock, createClientMock, revalidatePathMock, redirectMock } = vi.hoisted(() => ({
  requireRoleMock: vi.fn(),
  createClientMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  redirectMock: vi.fn(),
}))

vi.mock('@/lib/ebt/auth/roles', () => ({
  requireRole: requireRoleMock,
}))

vi.mock('@/lib/ebt/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}))

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

import { createReport } from '@/app/dashboard/ebt/reports/report-actions'

describe('createReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireRoleMock.mockResolvedValue({ id: crypto.randomUUID() })
  })

  it('removes the report if its mandatory EVAL phase cannot be initialized', async () => {
    const reportId = crypto.randomUUID()
    const deleteEq = vi.fn().mockResolvedValue({ error: null })
    const deleteReport = vi.fn().mockReturnValue({ eq: deleteEq })
    const insertReport = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: reportId }, error: null }),
      }),
    })
    const insertPhase = vi.fn().mockResolvedValue({
      error: { code: 'XX000', message: 'phase insert failed' },
    })

    createClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'training_reports') {
          return { insert: insertReport, delete: deleteReport }
        }
        if (table === 'report_phases') {
          return { insert: insertPhase }
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    })

    const formData = new FormData()
    formData.set('pilot_id', crypto.randomUUID())

    const result = await createReport({ ok: false, message: '' }, formData)

    expect(deleteReport).toHaveBeenCalledOnce()
    expect(deleteEq).toHaveBeenCalledWith('id', reportId)
    expect(result).toEqual({
      ok: false,
      message: 'Could not initialise the report. No report was created. Please try again.',
    })
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it('escalates when the incomplete report cannot be removed', async () => {
    const reportId = crypto.randomUUID()
    const deleteEq = vi.fn().mockResolvedValue({
      error: { code: '42501', message: 'delete denied' },
    })
    const insertReport = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: reportId }, error: null }),
      }),
    })

    createClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'training_reports') {
          return {
            insert: insertReport,
            delete: vi.fn().mockReturnValue({ eq: deleteEq }),
          }
        }
        if (table === 'report_phases') {
          return {
            insert: vi.fn().mockResolvedValue({
              error: { code: 'XX000', message: 'phase insert failed' },
            }),
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    })

    const formData = new FormData()
    formData.set('pilot_id', crypto.randomUUID())

    const result = await createReport({ ok: false, message: '' }, formData)

    expect(deleteEq).toHaveBeenCalledWith('id', reportId)
    expect(result).toEqual({
      ok: false,
      message:
        'The report could not be initialised and automatic cleanup failed. Ask an administrator to remove the incomplete draft.',
    })
    expect(redirectMock).not.toHaveBeenCalled()
  })
})
