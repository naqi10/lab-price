"use client";

import { Component, type ReactNode } from "react";

interface Props { children: ReactNode }
interface State { hasError: boolean }

const DOM_ERROR_PATTERNS = ["removeChild", "insertBefore", "not a child"];

function isDomMutationError(msg: string): boolean {
  return DOM_ERROR_PATTERNS.some((p) => msg.includes(p));
}

/**
 * Catches React 19 DOM reconciliation errors (removeChild / insertBefore)
 * caused by Radix UI portal teardown racing with React's commit phase.
 *
 * Two layers of suppression:
 *  1. Error boundary (getDerivedStateFromError) — prevents React from
 *     unmounting the tree and re-rendering to a broken state.
 *  2. window "error" event listener — prevents the dev overlay from
 *     showing the error in development mode.
 *
 * render() MUST always return children — returning null would unmount
 * open portals, triggering another removeChild in the cleanup.
 */
export class DOMSafetyBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  private _suppressWindowError = (event: ErrorEvent) => {
    const msg = event.error?.message ?? event.message ?? "";
    if (isDomMutationError(msg)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  componentDidMount() {
    window.addEventListener("error", this._suppressWindowError, true);
  }

  componentWillUnmount() {
    window.removeEventListener("error", this._suppressWindowError, true);
  }

  static getDerivedStateFromError(error: Error): State {
    if (isDomMutationError(error?.message ?? "")) {
      return { hasError: true };
    }
    throw error;
  }

  componentDidCatch() {
    // Reset immediately so future errors can be caught.
    // render() always returns children → no DOM mutations on recovery.
    this.setState({ hasError: false });
  }

  render() {
    // Always render children — never return null.
    return this.props.children;
  }
}
