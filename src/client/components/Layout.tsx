import React, { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import styles from './Layout.module.css'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>
            <Link to="/">Dewu Mock API</Link>
          </h1>
          <nav className={styles.nav}>
            <Link 
              to="/" 
              className={`${styles.navLink} ${isActive('/') ? styles.active : ''}`}
            >
              Home
            </Link>
            <Link 
              to="/docs" 
              className={`${styles.navLink} ${isActive('/docs') ? styles.active : ''}`}
            >
              API Documentation
            </Link>
            <Link 
              to="/test" 
              className={`${styles.navLink} ${isActive('/test') ? styles.active : ''}`}
            >
              Test Interface
            </Link>
            <Link 
              to="/manage" 
              className={`${styles.navLink} ${isActive('/manage') ? styles.active : ''}`}
            >
              Invoice Manager
            </Link>
          </nav>
        </div>
      </header>
      <main className={styles.main}>
        {children}
      </main>
      <footer className={styles.footer}>
        <p>&copy; 2024 Dewu Mock API - For Development and Testing</p>
      </footer>
    </div>
  )
}

export default Layout