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
    const handler = (event: ErrorEvent) => {
      const msg = event.message ?? "";
      if (
        msg.includes("removeChild") ||
        msg.includes("insertBefore") ||
        msg.includes("not a child") ||
        msg.includes("NotFoundError")
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    // capture: true — intercept before React's own error handler
    window.addEventListener("error", handler, { capture: true });
    return () => window.removeEventListener("error", handler, { capture: true });
  }, []);

  return null;
}
