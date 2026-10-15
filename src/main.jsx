import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.legacy.jsx'
import ErrorBoundary from './components/ErrorBoundary'

const RootCrashFallback = () => (
  <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>BAOMS failed to load</h1>
    <p style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '28rem' }}>
      Something went wrong before the app could start. Reloading the page usually fixes this.
    </p>
    <button
      onClick={() => window.location.reload()}
      style={{ padding: '0.5rem 1rem', background: '#0f172a', color: 'white', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}
    >
      Reload page
    </button>
  </div>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary fallback={() => <RootCrashFallback />}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
