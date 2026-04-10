/**
 * Unit tests for CertExpiryCard component
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CertExpiryCard } from '@/components/portal/cert-expiry-card'

const mockChecks = [
  {
    id: 1,
    check_code: 'LPC-2024',
    check_description: 'Line Proficiency Check',
    expiry_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  },
]

describe('CertExpiryCard', () => {
  it('renders nothing when checks array is empty', () => {
    const { container } = render(
      <CertExpiryCard variant="expired" title="Test" description="" checks={[]} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders the title and check code', () => {
    render(
      <CertExpiryCard
        variant="expired"
        title="Expired Certifications"
        description="Renew immediately"
        checks={mockChecks}
      />
    )
    expect(screen.getByText('Expired Certifications')).toBeInTheDocument()
    expect(screen.getByText('LPC-2024')).toBeInTheDocument()
    expect(screen.getByText('Line Proficiency Check')).toBeInTheDocument()
  })

  it('shows "ago" label for expired variant', () => {
    render(<CertExpiryCard variant="expired" title="Expired" description="" checks={mockChecks} />)
    expect(screen.getByText('expired')).toBeInTheDocument()
  })

  it('shows "remaining" label for danger variant', () => {
    const futureChecks = [
      {
        ...mockChecks[0],
        expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]
    render(
      <CertExpiryCard variant="danger" title="Critical" description="" checks={futureChecks} />
    )
    expect(screen.getByText('remaining')).toBeInTheDocument()
  })
})
