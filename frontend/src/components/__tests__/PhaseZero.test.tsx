import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../test/utils'
import userEvent from '@testing-library/user-event'
import PhaseZero from '../PhaseZero'
import { apiClient } from '../../lib/api'
import { server } from '../../test/mocks/server'
import { http, HttpResponse } from 'msw'

// Mock the config to use localhost for tests
vi.mock('../../lib/config', () => ({
  getApiUrl: () => 'http://localhost:8080',
  config: { enableLogging: false }
}))

describe('PhaseZero', () => {
  const mockOnComplete = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Topic Input Phase', () => {
    it('should render topic input initially', () => {
      render(<PhaseZero onComplete={mockOnComplete} />)
      
      expect(screen.getByRole('textbox')).toBeInTheDocument()
      expect(screen.getByText(/what decision are you trying to make/i)).toBeInTheDocument()
    })

    it('should show error when submitting empty topic', async () => {
      render(<PhaseZero onComplete={mockOnComplete} />)
      
      const submitButton = screen.getByRole('button', { name: /continue/i })
      await user.click(submitButton)
      
      expect(screen.getByText(/please enter a topic/i)).toBeInTheDocument()
    })

    it('should proceed to factor selection after valid topic submission', async () => {
      render(<PhaseZero onComplete={mockOnComplete} />)
      
      const input = screen.getByRole('textbox')
      const submitButton = screen.getByRole('button', { name: /continue/i })
      
      await user.type(input, 'Career change decision')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/what factors matter/i)).toBeInTheDocument()
      })
    })

    it('should use fallback factors when API fails', async () => {
      // Mock API failure
      server.use(
        http.post('http://localhost:8080/phase0/factors', () => {
          return HttpResponse.error()
        })
      )
      
      render(<PhaseZero onComplete={mockOnComplete} />)
      
      const input = screen.getByRole('textbox')
      const submitButton = screen.getByRole('button', { name: /continue/i })
      
      await user.type(input, 'Career change decision')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/using offline mode/i)).toBeInTheDocument()
      })
      
      // Should still show factor selection with fallback factors
      await waitFor(() => {
        expect(screen.getByText(/what factors matter/i)).toBeInTheDocument()
      })
    })

    it('should show loading state during API call', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise(resolve => {
        resolvePromise = resolve
      })
      mockApiClient.getFactors.mockReturnValue(promise)
      
      render(<PhaseZero onComplete={mockOnComplete} />)
      
      const input = screen.getByRole('textbox')
      const submitButton = screen.getByRole('button', { name: /continue/i })
      
      await user.type(input, 'Career change decision')
      await user.click(submitButton)
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
      
      resolvePromise!({ factors: [] })
    })
  })

  describe('Factor Selection Phase', () => {
    beforeEach(async () => {
      render(<PhaseZero onComplete={mockOnComplete} />)
      
      const input = screen.getByRole('textbox')
      const submitButton = screen.getByRole('button', { name: /continue/i })
      
      await user.type(input, 'Career change decision')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/what factors matter/i)).toBeInTheDocument()
      })
    })

    it('should display available factors', () => {
      expect(screen.getByText('Salary')).toBeInTheDocument()
      expect(screen.getByText('Benefits')).toBeInTheDocument()
      expect(screen.getByText('Work-Life Balance')).toBeInTheDocument()
    })

    it('should allow selecting and deselecting factors', async () => {
      const salaryButton = screen.getByRole('button', { name: /salary/i })
      
      expect(salaryButton).not.toHaveClass('bg-gradient-to-r')
      
      await user.click(salaryButton)
      expect(salaryButton).toHaveClass('bg-gradient-to-r')
      
      await user.click(salaryButton)
      expect(salaryButton).not.toHaveClass('bg-gradient-to-r')
    })

    it('should allow adding custom factors', async () => {
      const customInput = screen.getByPlaceholderText(/add your own factor/i)
      const addButton = screen.getByRole('button', { name: /add factor/i })
      
      await user.type(customInput, 'Remote Work')
      await user.click(addButton)
      
      expect(screen.getByText('Remote Work')).toBeInTheDocument()
      expect(customInput).toHaveValue('')
    })

    it('should not add duplicate custom factors', async () => {
      const customInput = screen.getByPlaceholderText(/add your own factor/i)
      const addButton = screen.getByRole('button', { name: /add factor/i })
      
      await user.type(customInput, 'Remote Work')
      await user.click(addButton)
      
      await user.type(customInput, 'Remote Work')
      await user.click(addButton)
      
      const remoteWorkElements = screen.getAllByText('Remote Work')
      expect(remoteWorkElements).toHaveLength(1)
    })

    it('should show error when trying to continue without selecting factors', async () => {
      const continueButton = screen.getByRole('button', { name: /continue to preferences/i })
      await user.click(continueButton)
      
      expect(screen.getByText(/select some factors/i)).toBeInTheDocument()
    })

    it('should complete phase when factors are selected', async () => {
      const salaryButton = screen.getByRole('button', { name: /salary/i })
      await user.click(salaryButton)
      
      const continueButton = screen.getByRole('button', { name: /continue to preferences/i })
      await user.click(continueButton)
      
      expect(mockOnComplete).toHaveBeenCalledWith({
        topic: 'Career change decision',
        factors: [{ category: 'Selected', items: ['Salary'] }]
      })
    })
  })

  describe('API Health Check', () => {
    it('should check API health on mount', async () => {
      render(<PhaseZero onComplete={mockOnComplete} />)
      
      await waitFor(() => {
        expect(mockApiClient.healthCheck).toHaveBeenCalled()
      })
    })

    it('should handle API health check failure', async () => {
      mockApiClient.healthCheck.mockRejectedValue(new Error('Health check failed'))
      
      render(<PhaseZero onComplete={mockOnComplete} />)
      
      // Component should still render normally even if health check fails
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
  })
})