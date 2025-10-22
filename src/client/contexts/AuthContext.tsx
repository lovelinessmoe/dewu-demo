import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  refresh_expires_in: number
  open_id: string
  scope: string[]
  timestamp: number
}

interface AuthContextType {
  tokens: AuthTokens | null
  setTokens: (tokens: AuthTokens | null) => void
  isAuthenticated: boolean
  isTokenExpired: boolean
  clearTokens: () => void
  getAccessToken: () => string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [tokens, setTokensState] = useState<AuthTokens | null>(() => {
    // Try to load tokens from localStorage on initialization
    try {
      const stored = localStorage.getItem('dewu_mock_tokens')
      if (stored) {
        const parsed = JSON.parse(stored)
        // Check if tokens are still valid
        const now = Date.now()
        if (parsed.timestamp + (parsed.expires_in * 1000) > now) {
          return parsed
        }
      }
    } catch (error) {
      console.warn('Failed to load stored tokens:', error)
    }
    return null
  })

  const setTokens = useCallback((newTokens: AuthTokens | null) => {
    setTokensState(newTokens)
    
    if (newTokens) {
      // Store tokens in localStorage
      try {
        localStorage.setItem('dewu_mock_tokens', JSON.stringify({
          ...newTokens,
          timestamp: Date.now()
        }))
      } catch (error) {
        console.warn('Failed to store tokens:', error)
      }
    } else {
      // Clear stored tokens
      try {
        localStorage.removeItem('dewu_mock_tokens')
      } catch (error) {
        console.warn('Failed to clear stored tokens:', error)
      }
    }
  }, [])

  const clearTokens = useCallback(() => {
    setTokens(null)
  }, [setTokens])

  const isAuthenticated = tokens !== null

  const isTokenExpired = tokens ? 
    Date.now() > (tokens.timestamp + (tokens.expires_in * 1000)) : 
    true

  const getAccessToken = useCallback(() => {
    if (!tokens || isTokenExpired) {
      return null
    }
    return tokens.access_token
  }, [tokens, isTokenExpired])

  const value: AuthContextType = {
    tokens,
    setTokens,
    isAuthenticated,
    isTokenExpired,
    clearTokens,
    getAccessToken
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}