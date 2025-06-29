import { http, HttpResponse } from 'msw'

const API_BASE_URL = 'http://localhost:8080'

export const handlers = [
  // Health check endpoint
  http.get(`${API_BASE_URL}/health`, () => {
    return HttpResponse.json({
      status: 'online',
      healthy: true
    })
  }),

  // Phase 0: Get factors
  http.post(`${API_BASE_URL}/phase0/factors`, async ({ request }) => {
    const body = await request.json() as { topic: string }
    
    return HttpResponse.json({
      factors: [
        {
          category: "Financial",
          items: ["Salary", "Benefits", "Job Security", "Cost of Living", "Financial Growth"]
        },
        {
          category: "Lifestyle", 
          items: ["Work-Life Balance", "Location", "Flexibility", "Commute", "Travel Requirements"]
        },
        {
          category: "Career",
          items: ["Growth Opportunities", "Learning", "Industry", "Company Culture", "Leadership"]
        },
        {
          category: "Personal",
          items: ["Values Alignment", "Impact", "Relationships", "Stress Level", "Fulfillment"]
        }
      ]
    })
  }),

  // Phase 1: Save preferences
  http.post(`${API_BASE_URL}/phase1/preferences`, async ({ request }) => {
    const body = await request.json()
    
    return HttpResponse.json({
      success: true,
      message: 'Preferences saved successfully'
    })
  }),

  // Phase 2: Generate scenarios
  http.post(`${API_BASE_URL}/phase2/scenarios`, async ({ request }) => {
    const body = await request.json()
    
    return HttpResponse.json({
      scenarios: [
        {
          id: 'scenario-1',
          title: 'High-Growth Startup',
          text: 'Join a fast-growing startup with equity, flexible hours, but moderate salary and high uncertainty.'
        },
        {
          id: 'scenario-2',
          title: 'Established Corporation',
          text: 'Work at a large corporation with excellent benefits, job security, but limited flexibility and growth.'
        },
        {
          id: 'scenario-3',
          title: 'Remote Consulting',
          text: 'Freelance consulting with maximum flexibility, high hourly rate, but variable income and limited benefits.'
        }
      ]
    })
  }),

  // Phase 3: Save reaction
  http.post(`${API_BASE_URL}/phase3/reactions`, async ({ request }) => {
    const body = await request.json()
    
    return HttpResponse.json({
      success: true,
      message: 'Reaction saved successfully'
    })
  }),

  // Phase 4: Generate summary
  http.post(`${API_BASE_URL}/phase4/summary`, async ({ request }) => {
    const body = await request.json()
    
    return HttpResponse.json({
      summary: 'Based on your preferences and reactions, you value work-life balance and stability over high growth potential. Consider the established corporation option as it aligns with your emotional responses.'
    })
  }),

  // Error scenarios for testing
  http.post(`${API_BASE_URL}/error/500`, () => {
    return new HttpResponse(null, { status: 500 })
  }),

  http.post(`${API_BASE_URL}/error/429`, () => {
    return new HttpResponse(null, { status: 429 })
  }),

  http.post(`${API_BASE_URL}/error/network`, () => {
    return HttpResponse.error()
  })
]