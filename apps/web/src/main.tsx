import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Prevent native context menu globally
if (typeof window !== 'undefined' && !(window as any).__disableContextMenu) {
  const handleContextMenu = (event: MouseEvent) => {
    event.preventDefault()
  }
  document.addEventListener('contextmenu', handleContextMenu)
  ;(window as any).__disableContextMenu = true
}

const rootElement = document.getElementById('root') as HTMLElement;

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);