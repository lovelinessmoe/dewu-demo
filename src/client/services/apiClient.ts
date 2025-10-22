import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

// API Response types
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
  status: number
}

export interface ApiError {
  code: number
  msg: string
  data?: any
  status: number
}

export interface ApiClientConfig {
  baseURL?: string
  timeout?: number
  headers?: Record<string, string>
}

export class ApiClient {
  private client: ReturnType<typeof axios.create>
  private loadingCallbacks: Set<(loading: boolean) => void> = new Set()

  constructor(config: ApiClientConfig = {}) {
    this.client = axios.create({
      baseURL: config.baseURL || '',
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      }
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        this.notifyLoading(true)
        return config
      },
      (error: AxiosError) => {
        this.notifyLoading(false)
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        this.notifyLoading(false)
        return response
      },
      (error: AxiosError) => {
        this.notifyLoading(false)
        return Promise.reject(this.handleError(error))
      }
    )
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      // Server responded with error status
      const responseData = error.response.data as any
      return {
        code: responseData?.code || error.response.status,
        msg: responseData?.msg || error.message || 'Server error',
        data: responseData?.data || null,
        status: error.response.status
      }
    } else if (error.request) {
      // Network error
      return {
        code: 0,
        msg: 'Network error - unable to connect to server',
        data: null,
        status: 0
      }
    } else {
      // Request setup error
      return {
        code: -1,
        msg: error.message || 'Request configuration error',
        data: null,
        status: -1
      }
    }
  }

  private notifyLoading(loading: boolean) {
    this.loadingCallbacks.forEach(callback => callback(loading))
  }

  // Subscribe to loading state changes
  onLoadingChange(callback: (loading: boolean) => void) {
    this.loadingCallbacks.add(callback)
    return () => this.loadingCallbacks.delete(callback)
  }

  // OAuth2 endpoints
  async generateToken(params: {
    client_id: string
    client_secret: string
    authorization_code: string
  }): Promise<ApiResponse> {
    const response = await this.client.post('/api/v1/h5/passport/v1/oauth2/token', params)
    return response.data
  }

  async refreshToken(params: {
    client_id: string
    client_secret: string
    refresh_token: string
  }): Promise<ApiResponse> {
    const response = await this.client.post('/api/v1/h5/passport/v1/oauth2/refresh_token', params)
    return response.data
  }

  // Invoice endpoints
  async getInvoiceList(params: {
    access_token: string
    page?: number
    page_size?: number
  }): Promise<ApiResponse> {
    const response = await this.client.post('/dop/api/v1/invoice/list', params)
    return response.data
  }

  async handleInvoice(params: {
    access_token: string
    invoice_id: string
    action: string
  }): Promise<ApiResponse> {
    const response = await this.client.post('/dop/api/v1/invoice/handle', params)
    return response.data
  }

  // Merchant endpoints
  async getMerchantInfo(params: {
    access_token: string
  }): Promise<ApiResponse> {
    const response = await this.client.post('/dop/api/v1/common/merchant/base/info', params)
    return response.data
  }

  // Generic method for any endpoint
  async request<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    const response = await this.client.request({
      method,
      url,
      data
    })
    return response.data
  }
}

// Create default instance
export const apiClient = new ApiClient()

// Export types for use in components
export type { ApiResponse, ApiError }