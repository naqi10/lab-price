"use client";

import { Component, Fragment, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  retryKey: number;
}

/**
 * Catches React 19 DOM reconciliation errors (removeChild / insertBefore)
 * and auto-recovers by forcing a clean remount of all children.
 */
export class DOMSafetyBoundary extends Component<Props, State> {
  state: State = { hasError: false, retryKey: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch() {
    setTimeout(() => {
      this.setState((prev) => ({
        hasError: false,
        retryKey: prev.retryKey + 1,
      }));
    }, 0);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return (
      <Fragment key={this.state.retryKey}>{this.props.children}</Fragment>
    );
  }
}
