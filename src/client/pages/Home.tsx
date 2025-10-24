import React from 'react'
import { Link } from 'react-router-dom'
import styles from './Home.module.css'

function Home() {
  return (
    <div className={styles.home}>
      <div className={styles.hero}>
        <h1>Dewu Mock API</h1>
        <p className={styles.subtitle}>
          Mock API server for Dewu platform integration testing
        </p>
        <p className={styles.description}>
          This application provides mock implementations of Dewu platform APIs,
          allowing developers to test their integrations without using real credentials
          or making actual API calls.
        </p>
      </div>

      <div className={styles.features}>
        <div className={styles.feature}>
          <h3>🔐 OAuth2 Authentication</h3>
          <p>Mock token generation and refresh endpoints</p>
          <Link to="/docs#oauth2" className={styles.featureLink}>
            View OAuth2 Docs →
          </Link>
        </div>

        <div className={styles.feature}>
          <h3>📄 Invoice Management</h3>
          <p>Mock invoice listing and handling endpoints</p>
          <Link to="/docs#invoices" className={styles.featureLink}>
            View Invoice Docs →
          </Link>
        </div>

        <div className={styles.feature}>
          <h3>🏪 Merchant Info</h3>
          <p>Mock merchant information retrieval</p>
          <Link to="/docs#merchant" className={styles.featureLink}>
            View Merchant Docs →
          </Link>
        </div>
      </div>

      <div className={styles.quickStart}>
        <h2>Quick Start</h2>
        <div className={styles.quickStartGrid}>
          <div className={styles.quickStartItem}>
            <h4>1. View API Documentation</h4>
            <p>Browse available endpoints and their specifications</p>
            <Link to="/docs" className={styles.button}>
              API Documentation
            </Link>
          </div>
          <div className={styles.quickStartItem}>
            <h4>2. Test Endpoints</h4>
            <p>Use the interactive interface to test API calls</p>
            <Link to="/test" className={styles.button}>
              Test Interface
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.info}>
        <h2>Server Information</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <strong>Base URL:</strong>
            <code>http://localhost:3000</code>
          </div>
          <div className={styles.infoItem}>
            <strong>Status:</strong>
            <span className={styles.statusOnline}>Online</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home