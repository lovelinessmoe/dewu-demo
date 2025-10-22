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
    if (status >= 500) return '⚠️'
    if (status === 0) return '🌐'
    return '❌'
  }

  const getErrorTitle = (status: number) => {
    if (status === 401) return 'Authentication Required'
    if (status === 403) return 'Access Forbidden'
    if (status === 404) return 'Not Found'
    if (status >= 500) return 'Server Error'
    if (status === 0) return 'Network Error'
    return 'Request Failed'
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
          {error.msg}
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