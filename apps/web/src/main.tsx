import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster, toast } from 'react-hot-toast'
import App from './App'
import './index.css'

// Prevent native context menu globally
if (typeof window !== 'undefined' && !(window as any).__disableContextMenu) {
  const showRightClickToast = (() => {
    let locked = false
    return () => {
      if (locked) return
      locked = true
      toast.error('Right click is disabled.', { duration: 1500 })
      setTimeout(() => {
        locked = false
      }, 1200)
    }
  })()

  const handleContextMenu = (event: MouseEvent) => {
    event.preventDefault()
    showRightClickToast()
  }
  document.addEventListener('contextmenu', handleContextMenu)
  ;(window as any).__disableContextMenu = true
}

const rootElement = document.getElementById('root') as HTMLElement;

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 1500,
          style: {
            background: '#111827',
            color: '#f9fafb',
            fontWeight: 600,
          },
        }}
      />
    </>
  </React.StrictMode>
);