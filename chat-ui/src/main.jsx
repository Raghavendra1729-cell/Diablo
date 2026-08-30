import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import { RefreshCw, ShieldAlert } from 'lucide-react'
import '@fontsource-variable/geist'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="recovery-screen">
          <div className="recovery-card">
            <span className="recovery-icon"><ShieldAlert /></span>
            <p className="hero-eyebrow">Diablo recovery mode</p>
            <h1>The interface hit an unexpected error.</h1>
            <p>No booking was submitted. Reload the experience and try again.</p>
            <button type="button" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4" /> Reload Diablo
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
