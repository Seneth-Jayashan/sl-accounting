import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// --- RIGHT CLICK PROTECTION ---
// This runs once when the app loads.
if (typeof window !== 'undefined') {
  document.addEventListener('contextmenu', (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    // Allow right-click on Inputs and Textareas so users can Paste
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Block everything else
    event.preventDefault();
  });
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