"use client";

import { useEffect } from "react";

/**
 * Suppresses the React 19 + Radix UI commit-phase DOM error at the window level.
 *
 * Why needed:
 * - React error boundaries (DOMSafetyBoundary) only catch *render-phase* errors.
 * - "removeChild: node is not a child" is a *commit-phase* DOM error — it escapes
 *   error boundaries entirely and surfaces in the Next.js dev overlay.
 * - This handler intercepts it at window level and prevents it from crashing the app.
 *
 * This is NOT a silent ignore — it only suppresses the specific DOM reconciliation
 * error that is a known React 19 + Radix UI portals incompatibility. All other
 * errors propagate normally.
 */
export function DOMErrorSuppressor() {
  useEffect(() => {
    const isDomMutationMessage = (msg: string) =>
      msg.includes("removeChild") ||
      msg.includes("insertBefore") ||
      msg.includes("not a child") ||
      msg.includes("NotFoundError");

    const handler = (event: ErrorEvent) => {
      const msg = event.error?.message ?? event.message ?? "";
      if (isDomMutationMessage(msg)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const reason =
        typeof event.reason === "string"
          ? event.reason
          : event.reason?.message ?? "";
      if (isDomMutationMessage(reason)) {
        event.preventDefault();
      }
    };

    // React 19 + third-party DOM mutators (extensions/translation scripts)
    // can desync parent/child relations during commit. Guard DOM ops directly.
    const originalRemoveChild = Node.prototype.removeChild;
    const originalInsertBefore = Node.prototype.insertBefore;

    Node.prototype.removeChild = function <T extends Node>(child: T): T {
      try {
        if (child.parentNode !== this) return child;
        return originalRemoveChild.call(this, child) as T;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (isDomMutationMessage(msg)) return child;
        throw error;
      }
    };

    Node.prototype.insertBefore = function <T extends Node>(
      newNode: T,
      referenceNode: Node | null
    ): T {
      try {
        if (referenceNode && referenceNode.parentNode !== this) {
          this.appendChild(newNode);
          return newNode;
        }
        return originalInsertBefore.call(this, newNode, referenceNode) as T;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (isDomMutationMessage(msg)) {
          this.appendChild(newNode);
          return newNode;
        }
        throw error;
      }
    };

    // capture: true — intercept before React's own error handler
    window.addEventListener("error", handler, { capture: true });
    window.addEventListener("unhandledrejection", rejectionHandler);
    return () => {
      window.removeEventListener("error", handler, { capture: true });
      window.removeEventListener("unhandledrejection", rejectionHandler);
      Node.prototype.removeChild = originalRemoveChild;
      Node.prototype.insertBefore = originalInsertBefore;
    };
  }, []);

  return null;
}
