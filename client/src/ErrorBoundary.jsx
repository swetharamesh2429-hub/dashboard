import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false } }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error) { console.error('UTAP UI error:', error) }
  render() {
    if (!this.state.failed) return this.props.children
    return <main className="fatal"><p className="eyebrow">UTAP RECOVERY</p><h1>Unable to load this workspace.</h1><p>Your data was not changed. Refresh to try again.</p><button className="primary" onClick={() => window.location.reload()}>Reload UTAP</button></main>
  }
}
