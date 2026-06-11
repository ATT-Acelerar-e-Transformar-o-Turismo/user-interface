import { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * Small error boundary for panel/tab content. Keeps a render failure in one
 * panel from taking down the whole admin page (which otherwise hits the
 * route-level errorElement). Shows the error message inline so it can be
 * diagnosed instead of a generic full-page error.
 */
export default class PanelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surface in the console for diagnosis.
    console.error('Panel render error:', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-xl border border-[#dc2626]/30 bg-[#dc2626]/5 px-4 py-3 text-[#dc2626] text-sm font-['Onest']">
          {this.props.label || 'Não foi possível carregar esta secção.'}
          {this.state.error?.message ? ` (${this.state.error.message})` : ''}
        </div>
      );
    }
    return this.props.children;
  }
}

PanelErrorBoundary.propTypes = {
  children: PropTypes.node,
  label: PropTypes.string,
};
