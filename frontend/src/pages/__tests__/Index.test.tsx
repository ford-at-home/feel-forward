import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../test/utils'
import userEvent from '@testing-library/user-event'
import Index from '../Index'

// Mock the phase components
vi.mock('../../components/PhaseZero', () => ({
  default: ({ onComplete }: { onComplete: (data: any) => void }) => (
    <div data-testid="phase-zero">
      <button onClick={() => onComplete({ topic: 'Test Topic', factors: [] })}>
        Complete Phase Zero
      </button>
    </div>
  )
}))

vi.mock('../../components/PhaseOne', () => ({
  default: ({ onComplete }: { onComplete: (data: any) => void }) => (
    <div data-testid="phase-one">
      <button onClick={() => onComplete({ preferences: [] })}>
        Complete Phase One
      </button>
    </div>
  )
}))

vi.mock('../../components/PhaseTwo', () => ({
  default: ({ onComplete }: { onComplete: (data: any) => void }) => (
    <div data-testid="phase-two">
      <button onClick={() => onComplete({ scenarios: [] })}>
        Complete Phase Two
      </button>
    </div>
  )
}))

vi.mock('../../components/PhaseThree', () => ({
  default: ({ onComplete }: { onComplete: (data: any) => void }) => (
    <div data-testid="phase-three">
      <button onClick={() => onComplete({ reactions: [] })}>
        Complete Phase Three
      </button>
    </div>
  )
}))

vi.mock('../../components/PhaseFour', () => ({
  default: () => (
    <div data-testid="phase-four">
      Phase Four Complete
    </div>
  )
}))

describe('Index Page', () => {
  const user = userEvent.setup()

  it('should render welcome screen initially', () => {
    render(<Index />)
    
    expect(screen.getByText('Feel Forward')).toBeInTheDocument()
    expect(screen.getByText(/make better life decisions/i)).toBeInTheDocument()
    expect(screen.getByText('Your 5-Step Journey')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /begin your journey/i })).toBeInTheDocument()
  })

  it('should display all 5 phases in the journey overview', () => {
    render(<Index />)
    
    expect(screen.getByText('Discover Preferences')).toBeInTheDocument()
    expect(screen.getByText('Detail Preferences')).toBeInTheDocument()
    expect(screen.getByText('Explore Scenarios')).toBeInTheDocument()
    expect(screen.getByText('Feel Your Reactions')).toBeInTheDocument()
    expect(screen.getByText('Understand Yourself')).toBeInTheDocument()
  })

  it('should start Phase Zero when begin button is clicked', async () => {
    render(<Index />)
    
    const beginButton = screen.getByRole('button', { name: /begin your journey/i })
    await user.click(beginButton)
    
    expect(screen.getByTestId('phase-zero')).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument()
  })

  it('should show progress indicator with correct step', async () => {
    render(<Index />)
    
    const beginButton = screen.getByRole('button', { name: /begin your journey/i })
    await user.click(beginButton)
    
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument()
    
    // Check progress bar width
    const progressBar = document.querySelector('.bg-gradient-to-r')
    expect(progressBar).toHaveStyle({ width: '20%' })
  })

  it('should progress through all phases sequentially', async () => {
    render(<Index />)
    
    // Start the journey
    const beginButton = screen.getByRole('button', { name: /begin your journey/i })
    await user.click(beginButton)
    
    // Phase Zero
    expect(screen.getByTestId('phase-zero')).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument()
    
    const completePhaseZero = screen.getByText('Complete Phase Zero')
    await user.click(completePhaseZero)
    
    // Phase One
    expect(screen.getByTestId('phase-one')).toBeInTheDocument()
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument()
    
    const completePhaseOne = screen.getByText('Complete Phase One')
    await user.click(completePhaseOne)
    
    // Phase Two
    expect(screen.getByTestId('phase-two')).toBeInTheDocument()
    expect(screen.getByText('Step 3 of 5')).toBeInTheDocument()
    
    const completePhaseTwo = screen.getByText('Complete Phase Two')
    await user.click(completePhaseTwo)
    
    // Phase Three
    expect(screen.getByTestId('phase-three')).toBeInTheDocument()
    expect(screen.getByText('Step 4 of 5')).toBeInTheDocument()
    
    const completePhaseThree = screen.getByText('Complete Phase Three')
    await user.click(completePhaseThree)
    
    // Phase Four
    expect(screen.getByTestId('phase-four')).toBeInTheDocument()
    expect(screen.getByText('Step 5 of 5')).toBeInTheDocument()
  })

  it('should maintain user data throughout the journey', async () => {
    render(<Index />)
    
    // Start the journey
    const beginButton = screen.getByRole('button', { name: /begin your journey/i })
    await user.click(beginButton)
    
    // Complete Phase Zero with test data
    const completePhaseZero = screen.getByText('Complete Phase Zero')
    await user.click(completePhaseZero)
    
    // Phase One should receive the data from Phase Zero
    expect(screen.getByTestId('phase-one')).toBeInTheDocument()
    
    // Complete Phase One
    const completePhaseOne = screen.getByText('Complete Phase One')
    await user.click(completePhaseOne)
    
    // Phase Two should receive cumulated data
    expect(screen.getByTestId('phase-two')).toBeInTheDocument()
  })

  it('should update progress bar correctly for each phase', async () => {
    render(<Index />)
    
    const beginButton = screen.getByRole('button', { name: /begin your journey/i })
    await user.click(beginButton)
    
    // Phase 1 - 20%
    let progressBar = document.querySelector('.bg-gradient-to-r')
    expect(progressBar).toHaveStyle({ width: '20%' })
    
    // Complete Phase Zero
    const completePhaseZero = screen.getByText('Complete Phase Zero')
    await user.click(completePhaseZero)
    
    // Phase 2 - 40%
    progressBar = document.querySelector('.bg-gradient-to-r')
    expect(progressBar).toHaveStyle({ width: '40%' })
    
    // Complete Phase One
    const completePhaseOne = screen.getByText('Complete Phase One')
    await user.click(completePhaseOne)
    
    // Phase 3 - 60%
    progressBar = document.querySelector('.bg-gradient-to-r')
    expect(progressBar).toHaveStyle({ width: '60%' })
  })

  it('should maintain Feel Forward branding throughout', async () => {
    render(<Index />)
    
    // Welcome screen
    expect(screen.getByText('Feel Forward')).toBeInTheDocument()
    
    // Start journey
    const beginButton = screen.getByRole('button', { name: /begin your journey/i })
    await user.click(beginButton)
    
    // Should still show branding in app header
    expect(screen.getByText('Feel Forward')).toBeInTheDocument()
  })

  it('should handle phase data correctly', async () => {
    render(<Index />)
    
    const beginButton = screen.getByRole('button', { name: /begin your journey/i })
    await user.click(beginButton)
    
    // Mock data should be passed between phases
    const completePhaseZero = screen.getByText('Complete Phase Zero')
    await user.click(completePhaseZero)
    
    // The mock should have updated the internal state
    expect(screen.getByTestId('phase-one')).toBeInTheDocument()
    
    const completePhaseOne = screen.getByText('Complete Phase One')
    await user.click(completePhaseOne)
    
    expect(screen.getByTestId('phase-two')).toBeInTheDocument()
  })
})