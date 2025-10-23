import React from 'react'
import styles from './ErrorDisplay.module.css'
import { ApiError } from '../services/apiClient'

interface ErrorDisplayProps {
  error: ApiError
  onRetry?: () => void
  onDismiss?: () => void
}

function ErrorDisplay({ error, onRetry, onDismiss }: ErrorDisplayProps) {
  const getErrorIcon = (status: number) => {
    if (status === 401 || status === 403) return '🔒'
    if (status === 404) return '🔍'
    if (status === 503) return '🚫'
    if (status >= 500) return '⚠️'
    if (status === 0) return '🌐'
    return '❌'
  }

  const getErrorTitle = (status: number) => {
    if (status === 401) return 'Authentication Required'
    if (status === 403) return 'Access Forbidden'
    if (status === 404) return 'Not Found'
    if (status === 503) return 'Service Unavailable'
    if (status >= 500) return 'Server Error'
    if (status === 0) return 'Network Error'
    return 'Request Failed'
  }

  const getUserFriendlyMessage = (status: number, originalMessage: string) => {
    switch (status) {
      case 503:
        return 'Service temporarily unavailable. The database is currently not accessible. Please try again in a few moments.'
      case 500:
        return 'Database error occurred. There was a problem processing your request. Please try again or contact support if the issue persists.'
      case 404:
        return 'Invoice not found. The requested invoice could not be located in the system.'
      case 0:
        return 'Connection failed. Please check your internet connection and try again.'
      case 401:
        return 'Authentication required. Please log in again to continue.'
      case 403:
        return 'Access denied. You do not have permission to perform this action.'
      default:
        return originalMessage || 'An unexpected error occurred. Please try again.'
    }
  }

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorHeader}>
        <span className={styles.errorIcon}>
          {getErrorIcon(error.status)}
        </span>
        <div className={styles.errorTitle}>
          {getErrorTitle(error.status)}
        </div>
        {onDismiss && (
          <button 
            className={styles.dismissButton}
            onClick={onDismiss}
            title="Dismiss error"
          >
            ×
          </button>
        )}
      </div>
      
      <div className={styles.errorContent}>
        <div className={styles.errorMessage}>
          {getUserFriendlyMessage(error.status, error.msg)}
        </div>
        
        {error.status !== 0 && (
          <div className={styles.errorDetails}>
            <span className={styles.errorCode}>Code: {error.code}</span>
            <span className={styles.errorStatus}>Status: {error.status}</span>
          </div>
        )}
        
        {error.data && (
          <details className={styles.errorData}>
            <summary>Error Details</summary>
            <pre className={styles.errorDataContent}>
              {JSON.stringify(error.data, null, 2)}
            </pre>
          </details>
        )}
      </div>

      {onRetry && (
        <div className={styles.errorActions}>
          <button 
            className={styles.retryButton}
            onClick={onRetry}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}

export default ErrorDisplay