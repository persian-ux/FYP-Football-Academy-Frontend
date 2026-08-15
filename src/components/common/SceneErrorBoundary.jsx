import { Component } from 'react'

// Guards the decorative 3D/canvas layers: if WebGL/animation code ever
// throws at runtime, we swap in a static CSS background instead of letting
// the error unmount the whole page.
class SceneErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error('[SceneErrorBoundary] 3D layer failed, using static fallback:', error)
  }

  render() {
    if (this.state.failed) {
      return <div className="football-css-fallback" aria-hidden="true" />
    }
    return this.props.children
  }
}

export default SceneErrorBoundary