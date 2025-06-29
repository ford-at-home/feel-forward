import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'

// Create a custom render hook that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {children}
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock data factories
export const mockFactor = (overrides = {}) => ({
  category: 'Test Category',
  items: ['Test Item 1', 'Test Item 2'],
  ...overrides,
})

export const mockPreference = (overrides = {}) => ({
  factor: 'Test Factor',
  importance: 5,
  hasLimit: false,
  limit: '',
  tradeoff: 'Test tradeoff',
  ...overrides,
})

export const mockScenario = (overrides = {}) => ({
  id: 'test-scenario-1',
  title: 'Test Scenario',
  text: 'This is a test scenario description.',
  ...overrides,
})

export const mockReaction = (overrides = {}) => ({
  scenario_id: 'test-scenario-1',
  excitement: 5,
  anxiety: 3,
  body: 'Test body reaction',
  freeform: 'Test freeform reaction',
  ...overrides,
})

// User data mock
export const mockUserData = {
  topic: 'Test Decision',
  factors: [mockFactor()],
  preferences: [mockPreference()],
  scenarios: [mockScenario()],
  reactions: [mockReaction()],
  summary: 'Test summary'
}

// Helper to create a query client for tests
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
})

// Helper to wait for async operations
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// Custom matcher for testing API calls
export const expectApiCall = (mockFn: any, endpoint: string, data?: any) => {
  expect(mockFn).toHaveBeenCalledWith(
    expect.stringContaining(endpoint),
    expect.objectContaining({
      method: data ? 'POST' : 'GET',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
      }),
      ...(data && { body: JSON.stringify(data) }),
    })
  )
}