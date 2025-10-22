import { useState } from 'react'
import { apiEndpoints, apiCategories } from '../data/apiEndpoints'
import EndpointCard from '../components/EndpointCard.tsx'
import styles from './ApiDocs.module.css'

function ApiDocs() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredEndpoints = apiEndpoints.filter(endpoint => {
    const matchesSearch = endpoint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         endpoint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         endpoint.path.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || endpoint.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const scrollToEndpoint = (endpointId: string) => {
    const element = document.getElementById(endpointId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className={styles.apiDocs}>
      <div className={styles.header}>
        <h1>API Documentation</h1>
        <p className={styles.subtitle}>
          Comprehensive documentation for all available mock API endpoints
        </p>
        
        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search endpoints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.categoryFilter}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.categorySelect}
            >
              <option value="all">All Categories</option>
              {apiCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.sidebar}>
          <h3>Quick Navigation</h3>
          
          {apiCategories.map(category => {
            const categoryEndpoints = apiEndpoints.filter(ep => ep.category === category.id)
            const visibleEndpoints = categoryEndpoints.filter(ep => filteredEndpoints.includes(ep))
            
            if (visibleEndpoints.length === 0) return null
            
            return (
              <div key={category.id} className={styles.categorySection}>
                <h4>{category.name}</h4>
                <ul className={styles.endpointList}>
                  {visibleEndpoints.map(endpoint => (
                    <li key={endpoint.id}>
                      <button
                        onClick={() => scrollToEndpoint(endpoint.id)}
                        className={styles.endpointLink}
                      >
                        <span className={`${styles.methodBadge} ${styles[`method${endpoint.method}`]}`}>
                          {endpoint.method}
                        </span>
                        {endpoint.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        <div className={styles.main}>
          {filteredEndpoints.length === 0 ? (
            <div className={styles.noResults}>
              <h3>No endpoints found</h3>
              <p>Try adjusting your search terms or category filter.</p>
            </div>
          ) : (
            <div className={styles.endpoints}>
              {filteredEndpoints.map(endpoint => (
                <EndpointCard key={endpoint.id} endpoint={endpoint} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ApiDocs