import { useState } from 'react'
import type { ApiEndpoint } from '../types/api'
import styles from './EndpointCard.module.css'

interface EndpointCardProps {
  endpoint: ApiEndpoint
}

function EndpointCard({ endpoint }: EndpointCardProps) {
  const [activeTab, setActiveTab] = useState<'request' | 'response' | 'examples'>('request')

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return styles.methodGet
      case 'POST': return styles.methodPost
      case 'PUT': return styles.methodPut
      case 'DELETE': return styles.methodDelete
      default: return styles.methodDefault
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className={styles.endpointCard} id={endpoint.id}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={`${styles.method} ${getMethodColor(endpoint.method)}`}>
            {endpoint.method}
          </span>
          <h3 className={styles.title}>{endpoint.title}</h3>
          {endpoint.requiresAuth && (
            <span className={styles.authBadge}>🔒 Auth Required</span>
          )}
        </div>
        <code className={styles.path}>{endpoint.path}</code>
        <p className={styles.description}>{endpoint.description}</p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'request' ? styles.active : ''}`}
          onClick={() => setActiveTab('request')}
        >
          Request
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'response' ? styles.active : ''}`}
          onClick={() => setActiveTab('response')}
        >
          Response
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'examples' ? styles.active : ''}`}
          onClick={() => setActiveTab('examples')}
        >
          Examples
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'request' && (
          <div className={styles.requestContent}>
            <div className={styles.section}>
              <h4>Content-Type</h4>
              <code>{endpoint.requestFormat.contentType}</code>
            </div>
            
            <div className={styles.section}>
              <h4>Parameters</h4>
              <div className={styles.parametersTable}>
                <div className={styles.tableHeader}>
                  <span>Name</span>
                  <span>Type</span>
                  <span>Required</span>
                  <span>Description</span>
                </div>
                {endpoint.requestFormat.parameters.map((param) => (
                  <div key={param.name} className={styles.tableRow}>
                    <code className={styles.paramName}>{param.name}</code>
                    <span className={styles.paramType}>{param.type}</span>
                    <span className={`${styles.paramRequired} ${param.required ? styles.required : styles.optional}`}>
                      {param.required ? 'Yes' : 'No'}
                    </span>
                    <span className={styles.paramDescription}>{param.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'response' && (
          <div className={styles.responseContent}>
            <div className={styles.section}>
              <h4>Success Response</h4>
              <div className={styles.codeBlock}>
                <button
                  className={styles.copyButton}
                  onClick={() => copyToClipboard(JSON.stringify(endpoint.responseFormat.success, null, 2))}
                >
                  Copy
                </button>
                <pre>
                  <code>{JSON.stringify(endpoint.responseFormat.success, null, 2)}</code>
                </pre>
              </div>
            </div>
            
            <div className={styles.section}>
              <h4>Error Response</h4>
              <div className={styles.codeBlock}>
                <button
                  className={styles.copyButton}
                  onClick={() => copyToClipboard(JSON.stringify(endpoint.responseFormat.error, null, 2))}
                >
                  Copy
                </button>
                <pre>
                  <code>{JSON.stringify(endpoint.responseFormat.error, null, 2)}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'examples' && (
          <div className={styles.examplesContent}>
            <div className={styles.section}>
              <h4>Example Request</h4>
              <div className={styles.codeBlock}>
                <button
                  className={styles.copyButton}
                  onClick={() => copyToClipboard(JSON.stringify(endpoint.examples.request, null, 2))}
                >
                  Copy
                </button>
                <pre>
                  <code>{JSON.stringify(endpoint.examples.request, null, 2)}</code>
                </pre>
              </div>
            </div>
            
            <div className={styles.section}>
              <h4>Example Response</h4>
              <div className={styles.codeBlock}>
                <button
                  className={styles.copyButton}
                  onClick={() => copyToClipboard(JSON.stringify(endpoint.examples.response, null, 2))}
                >
                  Copy
                </button>
                <pre>
                  <code>{JSON.stringify(endpoint.examples.response, null, 2)}</code>
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EndpointCard