import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '60vh', gap: 16, padding: 32,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h2 style={{ color: 'var(--gold)', fontSize: 20 }}>Something went wrong</h2>
          <p style={{ color: 'var(--text2)', maxWidth: 400, fontSize: 14 }}>
            {this.props.message || 'An unexpected error occurred. Please try refreshing the page.'}
          </p>
          <button
            className="btn btn-gold"
            onClick={() => {
              this.setState({ error: null })
              this.props.onReset?.()
            }}
          >
            Try again
          </button>
          <button
            className="btn btn-outline"
            style={{ fontSize: 13 }}
            onClick={() => window.location.href = '/'}
          >
            Back to home
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
