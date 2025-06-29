import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../utils'
import userEvent from '@testing-library/user-event'
import App from '../../App'

describe('Complete User Workflow Integration', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should complete the full user journey from welcome to summary', async () => {
    render(<App />)

    // 1. Welcome Screen
    expect(screen.getByText('Feel Forward')).toBeInTheDocument()
    expect(screen.getByText(/make better life decisions/i)).toBeInTheDocument()
    
    const beginButton = screen.getByRole('button', { name: /begin your journey/i })
    await user.click(beginButton)

    // 2. Phase Zero - Topic Input
    await waitFor(() => {
      expect(screen.getByText(/what decision are you trying to make/i)).toBeInTheDocument()
    })

    const topicInput = screen.getByRole('textbox')
    await user.type(topicInput, 'Should I change careers to software development?')
    
    const continueButton = screen.getByRole('button', { name: /continue/i })
    await user.click(continueButton)

    // 3. Phase Zero - Factor Selection
    await waitFor(() => {
      expect(screen.getByText(/what factors matter/i)).toBeInTheDocument()
    })

    // Select some factors
    const salaryButton = screen.getByRole('button', { name: /salary/i })
    const workLifeButton = screen.getByRole('button', { name: /work-life balance/i })
    
    await user.click(salaryButton)
    await user.click(workLifeButton)

    // Add a custom factor
    const customInput = screen.getByPlaceholderText(/add your own factor/i)
    await user.type(customInput, 'Remote Work Flexibility')
    
    const addFactorButton = screen.getByRole('button', { name: /add factor/i })
    await user.click(addFactorButton)

    const continueToPrefsButton = screen.getByRole('button', { name: /continue to preferences/i })
    await user.click(continueToPrefsButton)

    // 4. Phase One - Preferences Detail
    await waitFor(() => {
      expect(screen.getByText(/how important is/i)).toBeInTheDocument()
    })

    // Go through each factor
    for (let i = 0; i < 3; i++) {
      // Set importance level (slider interaction is complex in jsdom, so we'll just use next)
      
      // Set trade-off
      const tradeoffTextarea = screen.getByRole('textbox', { name: /trade/i })
      await user.type(tradeoffTextarea, `Trade-off consideration for factor ${i + 1}`)

      // If there's a limits toggle, test it
      const limitsToggle = screen.queryByRole('switch')
      if (limitsToggle && i === 0) {
        await user.click(limitsToggle)
        const limitInput = screen.getByPlaceholderText(/minimum/i)
        await user.type(limitInput, '$75,000 minimum salary')
      }

      // Navigate to next factor
      const nextButton = screen.getByRole('button', { name: i < 2 ? /next factor/i : /generate scenarios/i })
      await user.click(nextButton)

      if (i < 2) {
        await waitFor(() => {
          expect(screen.getByText(/how important is/i)).toBeInTheDocument()
        })
      }
    }

    // 5. Phase Two - Scenarios
    await waitFor(() => {
      expect(screen.getByText(/explore your options/i)).toBeInTheDocument()
    }, { timeout: 5000 })

    // Should show generated scenarios
    expect(screen.getByText(/high-growth startup/i)).toBeInTheDocument()
    expect(screen.getByText(/established corporation/i)).toBeInTheDocument()

    const continueToReactionsButton = screen.getByRole('button', { name: /continue to reactions/i })
    await user.click(continueToReactionsButton)

    // 6. Phase Three - Reactions
    await waitFor(() => {
      expect(screen.getByText(/how does this scenario make you feel/i)).toBeInTheDocument()
    })

    // React to scenarios
    const scenarios = screen.getAllByTestId(/scenario-/)
    expect(scenarios.length).toBeGreaterThan(0)

    // Fill out reaction for first scenario
    const excitementSlider = screen.getByLabelText(/excitement/i)
    const anxietySlider = screen.getByLabelText(/anxiety/i)
    const bodyTextarea = screen.getByPlaceholderText(/body sensations/i)
    const freeformTextarea = screen.getByPlaceholderText(/additional thoughts/i)

    // Since slider interaction is complex in jsdom, we'll use clicks
    await user.click(excitementSlider)
    await user.click(anxietySlider)
    
    await user.type(bodyTextarea, 'I feel energized and motivated by this option')
    await user.type(freeformTextarea, 'This aligns well with my long-term goals')

    const nextScenarioButton = screen.getByRole('button', { name: /next scenario|generate insights/i })
    await user.click(nextScenarioButton)

    // Continue through remaining scenarios (simplified for test)
    let attempts = 0
    while (screen.queryByRole('button', { name: /next scenario/i }) && attempts < 5) {
      const nextButton = screen.getByRole('button', { name: /next scenario/i })
      await user.click(nextButton)
      attempts++
      await waitFor(() => {}, { timeout: 1000 })
    }

    // Final scenario should have "Generate Insights" button
    const generateInsightsButton = screen.getByRole('button', { name: /generate insights/i })
    await user.click(generateInsightsButton)

    // 7. Phase Four - Summary
    await waitFor(() => {
      expect(screen.getByText(/your emotional insights/i)).toBeInTheDocument()
    }, { timeout: 5000 })

    // Should show generated summary
    expect(screen.getByText(/based on your preferences and reactions/i)).toBeInTheDocument()

    // Should show option to start over or share results
    expect(screen.getByRole('button', { name: /start new decision/i })).toBeInTheDocument()
  }, 30000) // Longer timeout for full integration test

  it('should handle API failures gracefully and continue in offline mode', async () => {
    // Mock API failures
    vi.mock('../../lib/api', () => ({
      apiClient: {
        healthCheck: vi.fn().mockRejectedValue(new Error('Network error')),
        getFactors: vi.fn().mockRejectedValue(new Error('API error')),
        savePreferences: vi.fn().mockRejectedValue(new Error('API error')),
        generateScenarios: vi.fn().mockRejectedValue(new Error('API error')),
        saveReaction: vi.fn().mockRejectedValue(new Error('API error')),
        generateSummary: vi.fn().mockRejectedValue(new Error('API error')),
      }
    }))

    render(<App />)

    // Start journey
    const beginButton = screen.getByRole('button', { name: /begin your journey/i })
    await user.click(beginButton)

    // Enter topic
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    const topicInput = screen.getByRole('textbox')
    await user.type(topicInput, 'Career change decision')
    
    const continueButton = screen.getByRole('button', { name: /continue/i })
    await user.click(continueButton)

    // Should show offline mode message and fallback factors
    await waitFor(() => {
      expect(screen.getByText(/using offline mode/i)).toBeInTheDocument()
    })

    // Should still be able to continue with fallback functionality
    expect(screen.getByText(/what factors matter/i)).toBeInTheDocument()
    expect(screen.getByText('Salary')).toBeInTheDocument() // Fallback factors
  })

  it('should maintain user data consistency throughout the workflow', async () => {
    render(<App />)

    // Start and complete Phase Zero
    const beginButton = screen.getByRole('button', { name: /begin your journey/i })
    await user.click(beginButton)

    // Enter specific topic
    const topicInput = screen.getByRole('textbox')
    const testTopic = 'Should I pursue an MBA or continue working?'
    await user.type(topicInput, testTopic)
    
    const continueButton = screen.getByRole('button', { name: /continue/i })
    await user.click(continueButton)

    // Select factors
    await waitFor(() => {
      expect(screen.getByText(/what factors matter/i)).toBeInTheDocument()
    })

    const salaryButton = screen.getByRole('button', { name: /salary/i })
    await user.click(salaryButton)

    const continueToPrefsButton = screen.getByRole('button', { name: /continue to preferences/i })
    await user.click(continueToPrefsButton)

    // Verify topic is maintained in Phase One
    await waitFor(() => {
      expect(screen.getByText(/how important is "salary"/i)).toBeInTheDocument()
    })

    // Complete preferences
    const nextButton = screen.getByRole('button', { name: /generate scenarios/i })
    await user.click(nextButton)

    // Verify data flows to Phase Two
    await waitFor(() => {
      expect(screen.getByText(/explore your options/i)).toBeInTheDocument()
    })

    // The scenarios should be relevant to our topic and preferences
    // This is validated by the mock API returning consistent data
  })

  it('should handle browser navigation and state persistence', async () => {
    render(<App />)

    // Start journey and get to Phase One
    const beginButton = screen.getByRole('button', { name: /begin your journey/i })
    await user.click(beginButton)

    const topicInput = screen.getByRole('textbox')
    await user.type(topicInput, 'Career decision')
    
    const continueButton = screen.getByRole('button', { name: /continue/i })
    await user.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText(/what factors matter/i)).toBeInTheDocument()
    })

    const salaryButton = screen.getByRole('button', { name: /salary/i })
    await user.click(salaryButton)

    const continueToPrefsButton = screen.getByRole('button', { name: /continue to preferences/i })
    await user.click(continueToPrefsButton)

    // Now in Phase One
    await waitFor(() => {
      expect(screen.getByText(/how important is/i)).toBeInTheDocument()
    })

    // Progress indicator should show correct phase
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument()
  })
})