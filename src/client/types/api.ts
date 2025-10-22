export interface ApiEndpoint {
  id: string
  title: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  category: string
  requiresAuth: boolean
  requestFormat: {
    contentType: string
    parameters: ApiParameter[]
  }
  responseFormat: {
    success: any
    error: any
  }
  examples: {
    request: any
    response: any
  }
}

export interface ApiParameter {
  name: string
  type: string
  required: boolean
  description: string
  example?: any
}

export interface ApiCategory {
  id: string
  name: string
  description: string
  endpoints: string[]
}