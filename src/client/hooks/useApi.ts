import { useState, useCallback, useEffect } from 'react'
import { apiClient, ApiResponse, ApiError } from '../services/apiClient'

export interface UseApiState<T = any> {
  data: T | null
  loading: boolean
  error: ApiError | null
}

export interface UseApiOptions {
  onSuccess?: (data: any) => void
  onError?: (error: ApiError) => void
  showGlobalLoading?: boolean
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null
  })

  const [globalLoading, setGlobalLoading] = useState(false)

  useEffect(() => {
    if (options.showGlobalLoading !== false) {
      const unsubscribe = apiClient.onLoadingChange(setGlobalLoading)
      return unsubscribe
    }
  }, [options.showGlobalLoading])

  const execute = useCallback(async <R = T>(
    apiCall: () => Promise<ApiResponse<R>>
  ): Promise<R | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await apiCall()
      const data = response.data as R

      setState({
        data,
        loading: false,
        error: null
      })

      if (options.onSuccess) {
        options.onSuccess(data)
      }

      return data
    } catch (error) {
      const apiError = error as ApiError
      
      setState({
        data: null,
        loading: false,
        error: apiError
      })

      if (options.onError) {
        options.onError(apiError)
      }

      return null
    }
  }, [options])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    })
  }, [])

  return {
    ...state,
    globalLoading,
    execute,
    reset
  }
}

// Specific hooks for different API endpoints
export function useOAuth2() {
  return useApi({
    onSuccess: (data) => {
      // Could store token in localStorage or context here
      console.log('OAuth2 success:', data)
    }
  })
}

export function useInvoices() {
  return useApi({
    onError: (error) => {
      if (error.status === 401) {
        console.warn('Authentication required for invoice operations')
      } else if (error.status === 503) {
        console.warn('Database service unavailable for invoice operations')
      } else if (error.status === 500) {
        console.warn('Database error occurred during invoice operations')
      }
    }
  })
}

export function useMerchant() {
  return useApi({
    onError: (error) => {
      if (error.status === 401 || error.status === 403) {
        console.warn('Authentication/authorization required for merchant operations')
      }
    }
  })
}