import React from 'react'
import styles from './LoadingIndicator.module.css'

interface LoadingIndicatorProps {
  size?: 'small' | 'medium' | 'large'
  text?: string
  overlay?: boolean
}

function LoadingIndicator({ 
  size = 'medium', 
  text = 'Loading...', 
  overlay = false 
}: LoadingIndicatorProps) {
  const content = (
    <div className={`${styles.loadingContainer} ${styles[size]}`}>
      <div className={styles.spinner}>
        <div className={styles.spinnerRing}></div>
      </div>
      {text && <div className={styles.loadingText}>{text}</div>}
    </div>
  )

  if (overlay) {
    return (
      <div className={styles.overlay}>
        {content}
      </div>
    )
  }

  return content
}

export default LoadingIndicator