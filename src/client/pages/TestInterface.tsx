import { useState } from 'react'
import styles from './TestInterface.module.css'
import { apiEndpoints } from '../data/apiEndpoints'
import type { ApiEndpoint } from '../types/api'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../contexts/AuthContext'
import { apiClient } from '../services/apiClient'
import LoadingIndicator from '../components/LoadingIndicator'
import ErrorDisplay from '../components/ErrorDisplay'

interface FormData {
  [key: string]: string | number
}

interface TestResult {
  endpoint: string
  request: any
  response: any
  status: number
  timestamp: Date
  error?: string
}

function TestInterface() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null)
  const [formData, setFormData] = useState<FormData>({})
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  
  const { tokens, setTokens, getAccessToken, clearTokens } = useAuth()
  const { data, loading, error, globalLoading, execute, reset } = useApi({
    onSuccess: (responseData) => {
      // Handle successful OAuth2 token responses
      if (selectedEndpoint?.id === 'oauth2-token' || selectedEndpoint?.id === 'oauth2-refresh') {
        if (responseData.access_token) {
          setTokens({
            access_token: responseData.access_token,
            refresh_token: responseData.refresh_token,
            expires_in: responseData.access_token_expires_in,
            refresh_expires_in: responseData.refresh_token_expires_in,
            open_id: responseData.open_id,
            scope: responseData.scope,
            timestamp: Date.now()
          })
        }
      }
    }
  })

  const copyToClipboard = async (data: any) => {
    try {
      const text = JSON.stringify(data, null, 2)
      await navigator.clipboard.writeText(text)
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const formatJsonWithSyntaxHighlighting = (obj: any) => {
    if (!obj) return 'null'
    
    const jsonString = JSON.stringify(obj, null, 2)
    
    // For now, return plain JSON - we'll add syntax highlighting via CSS
    return jsonString
  }

  const handleEndpointSelect = (endpoint: ApiEndpoint) => {
    setSelectedEndpoint(endpoint)
    setTestResult(null)
    reset() // Clear previous API state
    
    // Initialize form data with example values
    const initialData: FormData = {}
    endpoint.requestFormat.parameters.forEach(param => {
      if (param.name === 'access_token') {
        const token = getAccessToken()
        initialData[param.name] = token || ''
      } else if (param.example !== undefined) {
        initialData[param.name] = param.example
      } else {
        initialData[param.name] = ''
      }
    })
    setFormData(initialData)
  }

  const handleInputChange = (paramName: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [paramName]: value
    }))
  }

  const validateForm = (): string[] => {
    const errors: string[] = []
    if (!selectedEndpoint) return errors

    selectedEndpoint.requestFormat.parameters.forEach(param => {
      if (param.required && (!formData[param.name] || formData[param.name] === '')) {
        errors.push(`${param.name} is required`)
      }
    })

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEndpoint) return

    const errors = validateForm()
    if (errors.length > 0) {
      setTestResult({
        endpoint: selectedEndpoint.id,
        request: formData,
        response: { errors },
        status: 400,
        timestamp: new Date(),
        error: errors.join(', ')
      })
      return
    }

    try {
      let apiCall
      
      // Use specific API client methods for known endpoints
      switch (selectedEndpoint.id) {
        case 'oauth2-token':
          apiCall = () => apiClient.generateToken({
            client_id: formData.client_id as string,
            client_secret: formData.client_secret as string,
            authorization_code: formData.authorization_code as string
          })
          break
          
        case 'oauth2-refresh':
          apiCall = () => apiClient.refreshToken({
            client_id: formData.client_id as string,
            client_secret: formData.client_secret as string,
            refresh_token: formData.refresh_token as string
          })
          break
          
        case 'invoice-list':
          apiCall = () => apiClient.getInvoiceList({
            access_token: formData.access_token as string,
            page: formData.page as number || 1,
            page_size: formData.page_size as number || 20
          })
          break
          
        case 'invoice-handle':
          apiCall = () => apiClient.handleInvoice({
            access_token: formData.access_token as string,
            invoice_id: formData.invoice_id as string,
            action: formData.action as string
          })
          break
          
        case 'merchant-info':
          apiCall = () => apiClient.getMerchantInfo({
            access_token: formData.access_token as string
          })
          break
          
        default:
          // Generic API call for unknown endpoints
          apiCall = () => apiClient.request(
            selectedEndpoint.method,
            selectedEndpoint.path,
            formData
          )
      }

      const response = await execute(apiCall)
      
      if (response) {
        setTestResult({
          endpoint: selectedEndpoint.id,
          request: formData,
          response: response,
          status: 200,
          timestamp: new Date()
        })
      }

    } catch (apiError) {
      // Error is already handled by the useApi hook
      console.error('API call failed:', apiError)
    }
  }

  const renderParameterInput = (param: any) => {
    const value = formData[param.name] || ''
    
    return (
      <div key={param.name} className={styles.parameterGroup}>
        <label className={styles.parameterLabel}>
          {param.name}
          {param.required && <span className={styles.required}>*</span>}
        </label>
        <div className={styles.parameterDescription}>
          {param.description}
        </div>
        {param.type === 'number' ? (
          <input
            type="number"
            className={styles.parameterInput}
            value={value}
            onChange={(e) => handleInputChange(param.name, Number(e.target.value))}
            placeholder={param.example?.toString() || ''}
          />
        ) : (
          <input
            type="text"
            className={styles.parameterInput}
            value={value}
            onChange={(e) => handleInputChange(param.name, e.target.value)}
            placeholder={param.example || ''}
          />
        )}
      </div>
    )
  }

  return (
    <div className={styles.testInterface}>
      <h1>Test Interface</h1>
      <p className={styles.subtitle}>
        Interactive interface for testing mock API endpoints
      </p>

      {tokens && (
        <div className={styles.authTokenDisplay}>
          <strong>Current Access Token:</strong>
          <code className={styles.tokenCode}>
            {tokens.access_token.substring(0, 50)}...
          </code>
          <div className={styles.tokenInfo}>
            <span className={styles.tokenExpiry}>
              Expires: {new Date(tokens.timestamp + (tokens.expires_in * 1000)).toLocaleString()}
            </span>
            <span className={styles.openId}>
              Open ID: {tokens.open_id}
            </span>
          </div>
          <button 
            className={styles.clearTokenBtn}
            onClick={clearTokens}
          >
            Clear Tokens
          </button>
        </div>
      )}

      <div className={styles.testContainer}>
        <div className={styles.endpointSelector}>
          <h2>Select Endpoint</h2>
          <div className={styles.endpointList}>
            {apiEndpoints.map(endpoint => (
              <button
                key={endpoint.id}
                className={`${styles.endpointButton} ${
                  selectedEndpoint?.id === endpoint.id ? styles.selected : ''
                }`}
                onClick={() => handleEndpointSelect(endpoint)}
              >
                <div className={styles.endpointMethod}>{endpoint.method}</div>
                <div className={styles.endpointPath}>{endpoint.path}</div>
                <div className={styles.endpointTitle}>{endpoint.title}</div>
                {endpoint.requiresAuth && (
                  <div className={styles.authRequired}>🔒 Auth Required</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {selectedEndpoint && (
          <div className={styles.testForm}>
            <h2>Test {selectedEndpoint.title}</h2>
            <p className={styles.endpointDescription}>
              {selectedEndpoint.description}
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.parametersSection}>
                <h3>Parameters</h3>
                {selectedEndpoint.requestFormat.parameters.map(renderParameterInput)}
              </div>

              <div className={styles.submitSection}>
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={loading || globalLoading}
                >
                  {loading || globalLoading ? 'Sending Request...' : `Send ${selectedEndpoint.method} Request`}
                </button>
              </div>
            </form>

            {/* Loading indicator */}
            {(loading || globalLoading) && (
              <div className={styles.loadingSection}>
                <LoadingIndicator text="Sending request..." />
              </div>
            )}

            {/* Error display */}
            {error && (
              <ErrorDisplay 
                error={error}
                onRetry={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                onDismiss={reset}
              />
            )}

            {/* Success response */}
            {data && !error && (
              <div className={styles.responseSection}>
                <h3>Response</h3>
                <div className={styles.responseHeader}>
                  <div className={styles.responseStatus}>
                    <span className={`${styles.statusCode} ${styles.statusSuccess}`}>
                      200 OK
                    </span>
                    <span className={styles.timestamp}>
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <button
                    className={styles.copyButton}
                    onClick={() => copyToClipboard(data)}
                    title="Copy response to clipboard"
                  >
                    📋 Copy
                  </button>
                </div>

                <div className={styles.responseContent}>
                  <div className={styles.responseTab}>
                    <h4>Request</h4>
                    <div className={styles.jsonViewer}>
                      <pre className={styles.jsonCode}>
                        {JSON.stringify(formData, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div className={styles.responseTab}>
                    <h4>Response Body</h4>
                    <div className={styles.jsonViewer}>
                      <pre className={styles.jsonCode}>
                        {formatJsonWithSyntaxHighlighting(data)}
                      </pre>
                    </div>
                  </div>

                  <div className={styles.responseTab}>
                    <h4>Headers</h4>
                    <div className={styles.headersViewer}>
                      <div className={styles.headerItem}>
                        <span className={styles.headerName}>Content-Type:</span>
                        <span className={styles.headerValue}>application/json</span>
                      </div>
                      <div className={styles.headerItem}>
                        <span className={styles.headerName}>Status:</span>
                        <span className={styles.headerValue}>200</span>
                      </div>
                      <div className={styles.headerItem}>
                        <span className={styles.headerName}>Timestamp:</span>
                        <span className={styles.headerValue}>{new Date().toISOString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {testResult && (
              <div className={styles.responseSection}>
                <h3>Response</h3>
                <div className={styles.responseHeader}>
                  <div className={styles.responseStatus}>
                    <span className={`${styles.statusCode} ${
                      testResult.status >= 200 && testResult.status < 300 
                        ? styles.statusSuccess 
                        : styles.statusError
                    }`}>
                      {testResult.status || 'Network Error'}
                    </span>
                    <span className={styles.timestamp}>
                      {testResult.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <button
                    className={styles.copyButton}
                    onClick={() => copyToClipboard(testResult.response)}
                    title="Copy response to clipboard"
                  >
                    📋 Copy
                  </button>
                </div>

                {testResult.error && (
                  <div className={styles.errorMessage}>
                    <strong>Error:</strong> {testResult.error}
                  </div>
                )}

                <div className={styles.responseContent}>
                  <div className={styles.responseTab}>
                    <h4>Request</h4>
                    <div className={styles.jsonViewer}>
                      <pre className={styles.jsonCode}>
                        {JSON.stringify(testResult.request, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div className={styles.responseTab}>
                    <h4>Response Body</h4>
                    <div className={styles.jsonViewer}>
                      <pre className={styles.jsonCode}>
                        {testResult.response 
                          ? formatJsonWithSyntaxHighlighting(testResult.response)
                          : 'No response data'
                        }
                      </pre>
                    </div>
                  </div>

                  <div className={styles.responseTab}>
                    <h4>Headers</h4>
                    <div className={styles.headersViewer}>
                      <div className={styles.headerItem}>
                        <span className={styles.headerName}>Content-Type:</span>
                        <span className={styles.headerValue}>application/json</span>
                      </div>
                      <div className={styles.headerItem}>
                        <span className={styles.headerName}>Status:</span>
                        <span className={styles.headerValue}>{testResult.status}</span>
                      </div>
                      <div className={styles.headerItem}>
                        <span className={styles.headerName}>Timestamp:</span>
                        <span className={styles.headerValue}>{testResult.timestamp.toISOString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TestInterface