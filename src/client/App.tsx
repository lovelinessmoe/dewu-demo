import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import Home from './pages/Home.tsx'
import ApiDocs from './pages/ApiDocs.tsx'
import TestInterface from './pages/TestInterface.tsx'
import InvoiceManager from './pages/InvoiceManager.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/docs" element={<ApiDocs />} />
            <Route path="/test" element={<TestInterface />} />
            <Route path="/manage" element={<InvoiceManager />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  )
}

export default App
