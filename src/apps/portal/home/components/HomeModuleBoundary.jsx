import { Component } from 'react'
import { ErrorState } from '../../../../design-system'

export class HomeModuleBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error(`[HomeModuleBoundary] ${this.props.moduleName || 'Modulo'} indisponivel`, error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title={`${this.props.moduleName || 'Modulo'} indisponivel`}
          description="Este modulo nao carregou agora, mas o restante da Home continua funcionando."
        />
      )
    }

    return this.props.children
  }
}
