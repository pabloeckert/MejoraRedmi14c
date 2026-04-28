import { Component } from 'react';
import { RotateCcw } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[ErrorBoundary] ${this.props.module || 'App'}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass rounded-xl p-6 text-center">
          <RotateCcw className="w-8 h-8 text-danger mx-auto mb-3" />
          <h3 className="text-lg font-bold text-text-primary mb-2">Algo salió mal</h3>
          <p className="text-sm text-text-secondary mb-4">
            {this.props.module
              ? `Error en el módulo "${this.props.module}". Los demás módulos siguen funcionando.`
              : 'Ocurrió un error inesperado.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-400 transition-colors"
          >
            Reintentar
          </button>
          {this.state.error && (
            <pre className="code-block text-xs mt-4 text-left max-h-32 overflow-y-auto">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
