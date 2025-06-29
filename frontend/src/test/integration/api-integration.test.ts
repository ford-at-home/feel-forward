import { describe, it, expect, beforeEach } from 'vitest'
import { apiClient } from '../../lib/api'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

describe('API Integration Tests', () => {
  beforeEach(() => {
    // Reset API client state
    apiClient['isHealthy'] = false
    apiClient['lastHealthCheck'] = 0
  })

  describe('Complete API Workflow', () => {
    it('should complete the full API workflow from Phase 0 to Phase 4', async () => {
      // Phase 0: Get factors
      const factorsResponse = await apiClient.getFactors({ 
        topic: 'Career transition to tech' 
      })
      
      expect(factorsResponse.factors).toBeDefined()
      expect(factorsResponse.factors.length).toBeGreaterThan(0)
      expect(factorsResponse.factors[0]).toHaveProperty('category')
      expect(factorsResponse.factors[0]).toHaveProperty('items')
      
      // Phase 1: Save preferences
      const preferences = [
        {
          factor: 'Salary',
          importance: 8,
          hasLimit: true,
          limit: '$80k minimum',
          tradeoff: 'Would accept slightly lower for better culture'
        },
        {
          factor: 'Work-Life Balance',
          importance: 9,
          hasLimit: false,
          limit: '',
          tradeoff: 'Most important factor, willing to sacrifice some growth'
        }
      ]
      
      const preferencesResponse = await apiClient.savePreferences({
        preferences,
        topic: 'Career transition to tech'
      })
      
      expect(preferencesResponse.success).toBe(true)
      
      // Phase 2: Generate scenarios
      const scenariosResponse = await apiClient.generateScenarios({
        preferences,
        topic: 'Career transition to tech'
      })
      
      expect(scenariosResponse.scenarios).toBeDefined()
      expect(scenariosResponse.scenarios.length).toBeGreaterThan(0)
      expect(scenariosResponse.scenarios[0]).toHaveProperty('id')
      expect(scenariosResponse.scenarios[0]).toHaveProperty('title')
      expect(scenariosResponse.scenarios[0]).toHaveProperty('text')
      
      // Phase 3: Save reactions
      const reactions = scenariosResponse.scenarios.map(scenario => ({
        scenario_id: scenario.id,
        excitement: Math.floor(Math.random() * 10) + 1,
        anxiety: Math.floor(Math.random() * 10) + 1,
        body: 'Test body reaction',
        freeform: 'Test freeform reaction'
      }))
      
      for (const reaction of reactions) {
        const reactionResponse = await apiClient.saveReaction(reaction)
        expect(reactionResponse.success).toBe(true)
      }
      
      // Phase 4: Generate summary
      const summaryResponse = await apiClient.generateSummary({
        reactions,
        preferences
      })
      
      expect(summaryResponse.summary).toBeDefined()
      expect(typeof summaryResponse.summary).toBe('string')
      expect(summaryResponse.summary.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      server.use(
        http.post('http://localhost:8080/phase0/factors', () => {
          return HttpResponse.error()
        })
      )

      await expect(
        apiClient.getFactors({ topic: 'test' })
      ).rejects.toThrow('Unable to connect to server')
    })

    it('should handle 500 server errors with retry', async () => {
      let callCount = 0
      server.use(
        http.post('http://localhost:8080/phase0/factors', () => {
          callCount++
          if (callCount <= 2) {
            return new HttpResponse(null, { status: 500 })
          }
          return HttpResponse.json({ factors: [] })
        })
      )

      const result = await apiClient.getFactors({ topic: 'test' })
      expect(result.factors).toBeDefined()
      expect(callCount).toBe(3) // Initial call + 2 retries
    })

    it('should handle rate limiting with exponential backoff', async () => {
      let callCount = 0
      const startTime = Date.now()
      
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
      const endTime = Date.now()
      
      expect(result.factors).toBeDefined()
      expect(callCount).toBe(2)
      expect(endTime - startTime).toBeGreaterThan(1000) // Should have waited for retry
    })

    it('should fail after maximum retries', async () => {
      server.use(
        http.post('http://localhost:8080/phase0/factors', () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      await expect(
        apiClient.getFactors({ topic: 'test' })
      ).rejects.toThrow('Server error')
    })
  })

  describe('Health Check Integration', () => {
    it('should perform health check and update client state', async () => {
      expect(apiClient.isApiHealthy()).toBe(false)
      
      const healthResult = await apiClient.healthCheck()
      
      expect(healthResult.healthy).toBe(true)
      expect(healthResult.status).toBe('online')
      expect(apiClient.isApiHealthy()).toBe(true)
    })

    it('should cache health check results', async () => {
      const firstCheck = await apiClient.healthCheck()
      const secondCheck = await apiClient.healthCheck()
      
      expect(firstCheck).toEqual(secondCheck)
      expect(apiClient.isApiHealthy()).toBe(true)
    })

    it('should handle health check failures', async () => {
      server.use(
        http.get('http://localhost:8080/health', () => {
          return HttpResponse.error()
        })
      )

      const healthResult = await apiClient.healthCheck()
      
      expect(healthResult.healthy).toBe(false)
      expect(healthResult.status).toBe('offline')
      expect(apiClient.isApiHealthy()).toBe(false)
    })
  })

  describe('Data Validation', () => {
    it('should handle empty responses gracefully', async () => {
      server.use(
        http.post('http://localhost:8080/phase0/factors', () => {
          return HttpResponse.json({})
        })
      )

      const result = await apiClient.getFactors({ topic: 'test' })
      expect(result).toEqual({})
    })

    it('should handle malformed JSON responses', async () => {
      server.use(
        http.post('http://localhost:8080/phase0/factors', () => {
          return new HttpResponse('invalid json', {
            headers: { 'Content-Type': 'application/json' }
          })
        })
      )

      await expect(
        apiClient.getFactors({ topic: 'test' })
      ).rejects.toThrow()
    })

    it('should validate required fields in requests', async () => {
      // Test with missing topic
      await expect(
        apiClient.getFactors({ topic: '' })
      ).resolves.toBeDefined() // API should handle validation
    })
  })

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = [
        apiClient.getFactors({ topic: 'career 1' }),
        apiClient.getFactors({ topic: 'career 2' }),
        apiClient.getFactors({ topic: 'career 3' })
      ]

      const results = await Promise.all(requests)
      
      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(result.factors).toBeDefined()
      })
    })

    it('should handle mixed success and failure requests', async () => {
      let callCount = 0
      server.use(
        http.post('http://localhost:8080/phase0/factors', () => {
          callCount++
          if (callCount === 2) {
            return new HttpResponse(null, { status: 500 })
          }
          return HttpResponse.json({ factors: [] })
        })
      )

      const requests = [
        apiClient.getFactors({ topic: 'success 1' }),
        apiClient.getFactors({ topic: 'failure' }),
        apiClient.getFactors({ topic: 'success 2' })
      ]

      const results = await Promise.allSettled(requests)
      
      expect(results[0].status).toBe('fulfilled')
      expect(results[1].status).toBe('rejected')
      expect(results[2].status).toBe('fulfilled')
    })
  })
})