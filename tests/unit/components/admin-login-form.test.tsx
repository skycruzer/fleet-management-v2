import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LoginForm } from '@/app/auth/login/login-form'

vi.mock('@/app/auth/login/actions', () => ({
  loginAction: vi.fn(),
}))

describe('LoginForm', () => {
  it('disables email text transformations on mobile keyboards', () => {
    render(<LoginForm />)

    const email = screen.getByLabelText('Email Address')
    expect(email).toHaveAttribute('autocapitalize', 'none')
    expect(email).toHaveAttribute('autocorrect', 'off')
    expect(email).toHaveAttribute('spellcheck', 'false')
  })
})
