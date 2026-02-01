type LogLevel = "info" | "warn" | "error" | "debug";

interface StripeLogEntry {
  timestamp: string;
  level: LogLevel;
  eventType?: string;
  eventId?: string;
  sessionId?: string;
  message: string;
  details?: Record<string, unknown>;
}

const LOG_COLORS = {
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  debug: "\x1b[90m",
  reset: "\x1b[0m",
} as const;

const LOG_ICONS = {
  info: "ℹ️",
  warn: "⚠️",
  error: "❌",
  debug: "🔍",
} as const;

function formatConsoleLog(entry: StripeLogEntry): string {
  const color = LOG_COLORS[entry.level];
  const icon = LOG_ICONS[entry.level];
  const reset = LOG_COLORS.reset;

  let log = `${color}[Stripe] ${icon} ${entry.message}${reset}`;
  if (entry.eventType) log += ` | Event: ${entry.eventType}`;
  if (entry.sessionId) log += ` | Session: ${entry.sessionId.substring(0, 20)}...`;

  return log;
}

function formatJsonLog(entry: StripeLogEntry): string {
  return JSON.stringify({
    ...entry,
    service: "stripe",
    env: process.env.NODE_ENV,
  });
}

function useStructuredLogging(): boolean {
  return process.env.NODE_ENV === "production" || process.env.STRIPE_JSON_LOGS === "true";
}

export const stripeLogger = {
  info(message: string, details?: Partial<StripeLogEntry>) {
    const entry: StripeLogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message,
      ...details,
    };

    console.log(useStructuredLogging() ? formatJsonLog(entry) : formatConsoleLog(entry));
  },

  warn(message: string, details?: Partial<StripeLogEntry>) {
    const entry: StripeLogEntry = {
      timestamp: new Date().toISOString(),
      level: "warn",
      message,
      ...details,
    };

    console.warn(useStructuredLogging() ? formatJsonLog(entry) : formatConsoleLog(entry));
  },

  error(message: string, error?: unknown, details?: Partial<StripeLogEntry>) {
    const entry: StripeLogEntry = {
      timestamp: new Date().toISOString(),
      level: "error",
      message,
      details: {
        ...details?.details,
        errorMessage: error instanceof Error ? error.message : String(error),
      },
      ...details,
    };

    if (useStructuredLogging()) {
      console.error(formatJsonLog(entry));
    } else {
      console.error(formatConsoleLog(entry));
      if (error instanceof Error) {
        console.error(`  └─ ${error.message}`);
      }
    }
  },

  debug(message: string, details?: Partial<StripeLogEntry>) {
    if (process.env.NODE_ENV !== "development") return;

    const entry: StripeLogEntry = {
      timestamp: new Date().toISOString(),
      level: "debug",
      message,
      ...details,
    };

    console.log(formatConsoleLog(entry));
  },

  order(orderNumber: number, action: "created" | "updated" | "error", details?: string) {
    const messages = {
      created: `Order #${orderNumber} created`,
      updated: `Order #${orderNumber} updated`,
      error: `Order #${orderNumber} error`,
    };

    const level = action === "error" ? "error" : "info";
    this[level](details || messages[action], { details: { orderNumber, action } });
  },

  webhook(
    eventType: string,
    eventId: string,
    status: "received" | "processed" | "failed",
    details?: Record<string, unknown>
  ) {
    const level = status === "failed" ? "error" : "info";
    this[level](`Webhook ${status}: ${eventType}`, { eventType, eventId, details });
  },
};

export type { StripeLogEntry };
