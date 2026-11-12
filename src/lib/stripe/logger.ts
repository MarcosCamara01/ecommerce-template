type LogLevel = "info" | "warn" | "error";

interface StripeLogEntry {
  timestamp: string;
  level: LogLevel;
  sessionId?: string;
  message: string;
  details?: Record<string, unknown>;
}

const LOG_COLORS = {
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  reset: "\x1b[0m",
} as const;

function formatConsoleLog(entry: StripeLogEntry): string {
  const color = LOG_COLORS[entry.level];
  const reset = LOG_COLORS.reset;

  let log = `${color}[Stripe] [${entry.level}] ${entry.message}${reset}`;
  if (entry.sessionId) {
    log += ` | Session: ${entry.sessionId.substring(0, 20)}...`;
  }

  return log;
}

function formatJsonLog(entry: StripeLogEntry): string {
  return JSON.stringify({
    ...entry,
    service: "stripe",
    env: process.env.NODE_ENV,
  });
}

function shouldUseStructuredLogging(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.STRIPE_JSON_LOGS === "true"
  );
}

export const stripeLogger = {
  info(message: string, details?: Partial<StripeLogEntry>) {
    const entry: StripeLogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message,
      ...details,
    };

    console.log(
      shouldUseStructuredLogging() ? formatJsonLog(entry) : formatConsoleLog(entry),
    );
  },

  warn(message: string, details?: Partial<StripeLogEntry>) {
    const entry: StripeLogEntry = {
      timestamp: new Date().toISOString(),
      level: "warn",
      message,
      ...details,
    };

    console.warn(
      shouldUseStructuredLogging() ? formatJsonLog(entry) : formatConsoleLog(entry),
    );
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

    if (shouldUseStructuredLogging()) {
      console.error(formatJsonLog(entry));
    } else {
      console.error(formatConsoleLog(entry));
      if (error instanceof Error) {
        console.error(`  -> ${error.message}`);
      }
    }
  },
};
