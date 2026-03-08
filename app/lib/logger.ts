export const logger = {
  access: (method: string, path: string, status: number, duration: number) => {
    console.log(`[${new Date().toISOString()}] ${method} ${path} - ${status} (${duration}ms)`);
  },

  error: (context: string, error: unknown) => {
    console.error(`[${new Date().toISOString()}] ❌ ERROR [${context}]:`, error);
  },

  info: (message: string, ...args: any[]) => {
    console.log(`[${new Date().toISOString()}] ℹ️  ${message}`, ...args);
  },

  warn: (message: string, ...args: any[]) => {
    console.warn(`[${new Date().toISOString()}] ⚠️  ${message}`, ...args);
  },

  api: (method: string, endpoint: string, status: number, duration?: number) => {
    const durationStr = duration ? ` (${duration}ms)` : '';
    console.log(`[${new Date().toISOString()}] 🔗 API ${method} ${endpoint} - ${status}${durationStr}`);
  },
};
