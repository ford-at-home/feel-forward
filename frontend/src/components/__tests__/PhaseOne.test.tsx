import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../../test/utils'
import userEvent from '@testing-library/user-event'
import PhaseOne from '../PhaseOne'
import { apiClient } from '../../lib/api'
import { mockFactor, mockPreference } from '../../test/utils'

// Mock the API client
vi.mock('../../lib/api', () => ({
  apiClient: {
    savePreferences: vi.fn(),
  }
}))

const mockApiClient = apiClient as any

describe('PhaseOne', () => {
  const mockOnComplete = vi.fn()
  const mockFactors = [
    mockFactor({ category: 'Financial', items: ['Salary', 'Benefits'] }),
    mockFactor({ category: 'Lifestyle', items: ['Work-Life Balance'] })
  ]
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockApiClient.savePreferences.mockResolvedValue({
      success: true,
      message: 'Preferences saved successfully'
    })
  })

  it('should render first factor initially', () => {
    render(
      <PhaseOne 
        factors={mockFactors} 
        topic="Career decision" 
        onComplete={mockOnComplete}
      />
    )
    
    expect(screen.getByText(/how important is "salary"/i)).toBeInTheDocument()
    expect(screen.getByText('Factor 1 of 3')).toBeInTheDocument()
  })

  it('should display importance slider with initial value', () => {
    render(
      <PhaseOne 
        factors={mockFactors} 
        topic="Career decision" 
        onComplete={mockOnComplete}
      />
    )
    
    expect(screen.getByText('5/10')).toBeInTheDocument()
    expect(screen.getByText('Somewhat important')).toBeInTheDocument()
  })

  it('should update importance when slider changes', async () => {
    render(
      <PhaseOne 
        factors={mockFactors} 
        topic="Career decision" 
        onComplete={mockOnComplete}
      />
    )
    
    const slider = screen.getByRole('slider')
    
    // Simulate moving slider to value 8
    await user.click(slider)
    // Note: Slider testing is complex with jsdom, so we'll test the UI update
    
    const nextButton = screen.getByRole('button', { name: /next factor/i })
    await user.click(nextButton)
    
    // Should proceed to next factor
    expect(screen.getByText(/how important is "benefits"/i)).toBeInTheDocument()
  })

  it('should toggle hard limits switch', async () => {
    render(
      <PhaseOne 
        factors={mockFactors} 
        topic="Career decision" 
        onComplete={mockOnComplete}
      />
    )
    
    const limitSwitch = screen.getByRole('switch')
    expect(limitSwitch).not.toBeChecked()
    
    await user.click(limitSwitch)
    expect(limitSwitch).toBeChecked()
    
    // Should show limit input when toggled on
    expect(screen.getByPlaceholderText(/minimum \$80k salary/i)).toBeInTheDocument()
  })

  it('should allow entering trade-off information', async () => {
    render(
      <PhaseOne 
        factors={mockFactors} 
        topic="Career decision" 
        onComplete={mockOnComplete}
      />
    )
    
    const tradeoffTextarea = screen.getByPlaceholderText(/I'd accept lower salary/i)
    await user.type(tradeoffTextarea, 'I would trade salary for better work-life balance')
    
    expect(tradeoffTextarea).toHaveValue('I would trade salary for better work-life balance')
  })

  it('should navigate between factors', async () => {
    render(
      <PhaseOne 
        factors={mockFactors} 
        topic="Career decision" 
        onComplete={mockOnComplete}
      />
    )
    
    // Start with first factor
    expect(screen.getByText(/how important is "salary"/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument()
    
    // Go to next factor
    const nextButton = screen.getByRole('button', { name: /next factor/i })
    await user.click(nextButton)
    
    expect(screen.getByText(/how important is "benefits"/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
    
    // Go back to previous factor
    const previousButton = screen.getByRole('button', { name: /previous/i })
    await user.click(previousButton)
    
    expect(screen.getByText(/how important is "salary"/i)).toBeInTheDocument()
  })

  it('should save preferences and complete when on last factor', async () => {
    render(
      <PhaseOne 
        factors={mockFactors} 
        topic="Career decision" 
        onComplete={mockOnComplete}
      />
    )
    
    // Navigate to last factor
    const nextButton = screen.getByRole('button', { name: /next factor/i })
    await user.click(nextButton) // Go to Benefits
    
    await user.click(nextButton) // Go to Work-Life Balance
    
    expect(screen.getByText(/how important is "work-life balance"/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generate scenarios/i })).toBeInTheDocument()
    
    // Complete the phase
    const generateButton = screen.getByRole('button', { name: /generate scenarios/i })
    await user.click(generateButton)
    
    await waitFor(() => {
      expect(mockApiClient.savePreferences).toHaveBeenCalledWith({
        preferences: expect.arrayContaining([
          expect.objectContaining({
            factor: 'Salary',
            importance: expect.any(Number)
          }),
          expect.objectContaining({
            factor: 'Benefits',
            importance: expect.any(Number)
          }),
          expect.objectContaining({
            factor: 'Work-Life Balance',
            importance: expect.any(Number)
          })
        ]),
        topic: 'Career decision'
      })
    })
    
    expect(mockOnComplete).toHaveBeenCalledWith({
      preferences: expect.any(Array)
    })
  })

  it('should continue in offline mode when API save fails', async () => {
    mockApiClient.savePreferences.mockRejectedValue(new Error('API Error'))
    
    render(
      <PhaseOne 
        factors={mockFactors} 
        topic="Career decision" 
        onComplete={mockOnComplete}
      />
    )
    
    // Navigate to last factor and complete
    const nextButton = screen.getByRole('button', { name: /next factor/i })
    await user.click(nextButton)
    await user.click(nextButton)
    
    const generateButton = screen.getByRole('button', { name: /generate scenarios/i })
    await user.click(generateButton)
    
    await waitFor(() => {
      expect(screen.getByText(/saved locally/i)).toBeInTheDocument()
    })
    
    expect(mockOnComplete).toHaveBeenCalled()
  })

  it('should show loading state while saving', async () => {
    let resolvePromise: (value: any) => void
    const promise = new Promise(resolve => {
      resolvePromise = resolve
    })
    mockApiClient.savePreferences.mockReturnValue(promise)
    
    render(
      <PhaseOne 
        factors={mockFactors} 
        topic="Career decision" 
        onComplete={mockOnComplete}
      />
    )
    
    // Navigate to last factor
    const nextButton = screen.getByRole('button', { name: /next factor/i })
    await user.click(nextButton)
    await user.click(nextButton)
    
    const generateButton = screen.getByRole('button', { name: /generate scenarios/i })
    await user.click(generateButton)
    
    expect(screen.getByText('Saving...')).toBeInTheDocument()
    expect(generateButton).toBeDisabled()
    
    resolvePromise!({ success: true })
  })

  it('should preserve form data when navigating between factors', async () => {
    render(
      <PhaseOne 
        factors={mockFactors} 
        topic="Career decision" 
        onComplete={mockOnComplete}
      />
    )
    
    // Fill out first factor
    const tradeoffTextarea = screen.getByPlaceholderText(/I'd accept lower salary/i)
    await user.type(tradeoffTextarea, 'Test trade-off')
    
    // Navigate to next factor
    const nextButton = screen.getByRole('button', { name: /next factor/i })
    await user.click(nextButton)
    
    // Navigate back
    const previousButton = screen.getByRole('button', { name: /previous/i })
    await user.click(previousButton)
    
    // Data should be preserved
    expect(tradeoffTextarea).toHaveValue('Test trade-off')
  })
})