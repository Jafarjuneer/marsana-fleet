import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initSentry() {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

  if (!sentryDsn) {
    console.warn("Sentry DSN not configured, error tracking disabled");
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    // Performance Monitoring
    tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 1.0,
    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || "unknown",
  });
}

/**
 * Capture exception with context
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: {
      app: context,
    },
  });
}

/**
 * Capture message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = "info") {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context
 */
export function setUserContext(userId: string, email?: string, name?: string) {
  Sentry.setUser({
    id: userId,
    email,
    username: name,
  });
}

/**
 * Clear user context
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(
  message: string,
  category: string = "user-action",
  level: Sentry.SeverityLevel = "info"
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  });
}
