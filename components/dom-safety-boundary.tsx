"use client";

import { Component, type ReactNode } from "react";

interface Props { children: ReactNode }
interface State { hasError: boolean }

/**
 * Silently swallows React 19 DOM reconciliation errors (removeChild / insertBefore).
 *
 * CRITICAL: render() MUST always return this.props.children — never null.
 * Returning null unmounts children which includes open Radix portals.
 * Unmounting an open portal triggers *another* removeChild during cleanup,
 * which the boundary catches again → infinite crash loop.
 *
 * By always rendering children the fiber tree stays unchanged across the
 * error-recovery render → React produces no DOM mutations → no cascade.
 */
export class DOMSafetyBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    const msg = error?.message ?? "";
    if (
      msg.includes("removeChild") ||
      msg.includes("insertBefore") ||
      msg.includes("not a child")
    ) {
      return { hasError: true };
    }
    throw error;
  }

  componentDidCatch() {
    // Reset so future errors can be caught.
    // setState triggers a re-render, but render() always returns the same
    // children output → no DOM mutations needed → no cascading errors.
    this.setState({ hasError: false });
  }

  render() {
    // Always render children — never return null.
    return this.props.children;
  }
}
