import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'

// Configure global API baseURL with fallback for Vercel deployment
const defaultProdApi = 'https://mock-with-siva.onrender.com';
const resolvedApiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : defaultProdApi);
axios.defaults.baseURL = resolvedApiUrl;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
