import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Providers } from '@/app/providers'

vi.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: () => <div data-testid="react-query-devtools" />,
}))

vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('nuqs/adapters/next/app', () => ({
  NuqsAdapter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/lib/providers/csrf-provider', () => ({
  CsrfProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('Providers', () => {
  it('does not render React Query devtools outside development', () => {
    render(
      <Providers>
        <div>App content</div>
      </Providers>
    )

    expect(screen.getByText('App content')).toBeInTheDocument()
    expect(screen.queryByTestId('react-query-devtools')).not.toBeInTheDocument()
  })
})
