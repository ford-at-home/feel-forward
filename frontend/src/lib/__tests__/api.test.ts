import { describe, it, expect, beforeEach, vi } from 'vitest'
import { server } from '../../test/mocks/server'
import { http, HttpResponse } from 'msw'

// Mock the config to use localhost for tests
vi.mock('../config', () => ({
  getApiUrl: () => 'http://localhost:8080',
  config: { enableLogging: false }
}))

// Import after mocking
const { apiClient } = await import('../api')

describe('ApiClient', () => {
  beforeEach(() => {
    // Reset API client state
    apiClient['isHealthy'] = false
    apiClient['lastHealthCheck'] = 0
  })

  describe('healthCheck', () => {
    it('should return healthy status when API is online', async () => {
      const result = await apiClient.healthCheck()
      
      expect(result).toEqual({
        status: 'online',
        healthy: true
      })
      expect(apiClient.isApiHealthy()).toBe(true)
    })

    it('should return unhealthy status when API is offline', async () => {
      server.use(
        http.get('http://localhost:8080/health', () => {
          return HttpResponse.error()
        })
      )

      const result = await apiClient.healthCheck()
      
      expect(result).toEqual({
        status: 'offline',
        healthy: false
      })
      expect(apiClient.isApiHealthy()).toBe(false)
    })

    it('should cache health check results', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch')
      
      // First call
      await apiClient.healthCheck()
      const initialCallCount = fetchSpy.mock.calls.length
      
      // Second call within interval should not make new request
      await apiClient.healthCheck()
      expect(fetchSpy.mock.calls.length).toBe(initialCallCount)
      
      fetchSpy.mockRestore()
    })
  })

  describe('getFactors', () => {
    it('should fetch factors for a given topic', async () => {
      const result = await apiClient.getFactors({ topic: 'career change' })
      
      expect(result).toHaveProperty('factors')
      expect(Array.isArray(result.factors)).toBe(true)
      expect(result.factors[0]).toHaveProperty('category')
      expect(result.factors[0]).toHaveProperty('items')
    })

    it('should handle API errors gracefully', async () => {
      server.use(
        http.post('http://localhost:8080/phase0/factors', () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      await expect(apiClient.getFactors({ topic: 'test' })).rejects.toThrow()
    })
  })

  describe('savePreferences', () => {
    it('should save preferences successfully', async () => {
      const preferences = [
        {
          factor: 'Salary',
          importance: 8,
          hasLimit: true,
          limit: '$80k minimum',
          tradeoff: 'Would accept lower for better culture'
        }
      ]

      const result = await apiClient.savePreferences({
        preferences,
        topic: 'job search'
      })

      expect(result).toEqual({
        success: true,
        message: 'Preferences saved successfully'
      })
    })
  })

  describe('generateScenarios', () => {
    it('should generate scenarios based on preferences', async () => {
      const preferences = [
        {
          factor: 'Salary',
          importance: 8,
          hasLimit: false,
          limit: '',
          tradeoff: 'Test tradeoff'
        }
      ]

      const result = await apiClient.generateScenarios({
        preferences,
        topic: 'career decision'
      })

      expect(result).toHaveProperty('scenarios')
      expect(Array.isArray(result.scenarios)).toBe(true)
      expect(result.scenarios[0]).toHaveProperty('id')
      expect(result.scenarios[0]).toHaveProperty('title')
      expect(result.scenarios[0]).toHaveProperty('text')
    })
  })

  describe('saveReaction', () => {
    it('should save emotional reaction to scenario', async () => {
      const reaction = {
        scenario_id: 'test-scenario',
        excitement: 7,
        anxiety: 3,
        body: 'Feeling excited about the possibilities',
        freeform: 'This scenario aligns with my values'
      }

      const result = await apiClient.saveReaction(reaction)

      expect(result).toEqual({
        success: true,
        message: 'Reaction saved successfully'
      })
    })
  })

  describe('generateSummary', () => {
    it('should generate summary from reactions and preferences', async () => {
      const reactions = [
        {
          scenario_id: 'scenario-1',
          excitement: 8,
          anxiety: 2,
          body: 'Very excited',
          freeform: 'This is perfect'
        }
      ]

      const preferences = [
        {
          factor: 'Work-Life Balance',
          importance: 9,
          hasLimit: false,
          limit: '',
          tradeoff: 'Very important to me'
        }
      ]

      const result = await apiClient.generateSummary({
        reactions,
        preferences
      })

      expect(result).toHaveProperty('summary')
      expect(typeof result.summary).toBe('string')
      expect(result.summary.length).toBeGreaterThan(0)
    })
  })

  describe('retry logic', () => {
    it('should retry on 429 rate limit', async () => {
      let callCount = 0
      server.use(
        http.post('http://localhost:8080/phase0/factors', () => {
          callCount++
          if (callCount === 1) {
            return new HttpResponse(null, { status: 429 })
          }
          return HttpResponse.json({ factors: [] })
        })
      )

      const result = await apiClient.getFactors({ topic: 'test' })
      expect(result).toHaveProperty('factors')
      expect(callCount).toBe(2)
    })

    it('should retry on 500 server error', async () => {
      let callCount = 0
      server.use(
        http.post('http://localhost:8080/phase0/factors', () => {
          callCount++
          if (callCount === 1) {
            return new HttpResponse(null, { status: 500 })
          }
          return HttpResponse.json({ factors: [] })
        })
      )

      const result = await apiClient.getFactors({ topic: 'test' })
      expect(result).toHaveProperty('factors')
      expect(callCount).toBe(2)
    })

    it('should throw error after max retries exceeded', async () => {
      server.use(
        http.post('http://localhost:8080/phase0/factors', () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      await expect(apiClient.getFactors({ topic: 'test' })).rejects.toThrow('Server error')
    })
  })
})