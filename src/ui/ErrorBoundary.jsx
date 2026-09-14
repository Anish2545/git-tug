import React from 'react'

// Catches render errors in the 3D tree so a scene bug can never blank
// the whole page — the UI stays up with a readable message instead.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[GitTug 3D error]', error, info?.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="gl-error-fallback" role="alert">
          <h3>3D arena failed to start</h3>
          <p>{String(this.state.error?.message || this.state.error)}</p>
          <div className="gl-error-actions">
            <button
              className="btn-primary btn-modal-action"
              onClick={() => {
                this.setState({ error: null })
                window.location.reload()
              }}
            >
              Reload arena
            </button>
            <button
              className="btn-tactile-tool"
              onClick={() => {
                try {
                  localStorage.setItem('gittug_graphics', 'low')
                } catch {}
                this.setState({ error: null })
                window.location.reload()
              }}
            >
              Retry in LOW graphics
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
