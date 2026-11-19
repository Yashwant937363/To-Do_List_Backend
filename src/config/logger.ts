import pino from "pino";
import { env } from "./env.js";

function createLogger() {
  const level = env.log_level || "info";

  // If Grafana Cloud Loki credentials are provided, dual-stream to stdout AND Loki
  if (env.loki_host && env.loki_user && env.loki_token) {
    const transport = pino.transport({
      targets: [
        // 1. Output to stdout for Render Live Logs
        {
          target: "pino/file",
          options: { destination: 1 },
          level,
        },
        // 2. Stream to Grafana Cloud Loki
        {
          target: "pino-loki",
          options: {
            host: env.loki_host,
            basicAuth: {
              username: env.loki_user,
              password: env.loki_token,
            },
            labels: { app: "todo-backend" },
            batching: true,
            interval: 5,
          },
          level,
        },
      ],
    });

    return pino({ level }, transport);
  }

  // Default: Stream cleanly to stdout (standard cloud behavior)
  return pino({ level });
}

export const logger = createLogger();
