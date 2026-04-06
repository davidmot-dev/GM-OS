/**
 * Renderer-side logger that abstracts appBridge.logger.
 * Usage: Logger.info('My message', data);
 */
export const Logger = {
  info: (message: string, ...args: unknown[]) => {
    if (window.appBridge?.logger) {
      window.appBridge.logger.info(message, ...args);
    } else {
      console.info(`[Logger] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (window.appBridge?.logger) {
      window.appBridge.logger.warn(message, ...args);
    } else {
      console.warn(`[Logger] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    if (window.appBridge?.logger) {
      window.appBridge.logger.error(message, ...args);
    } else {
      console.error(`[Logger] ${message}`, ...args);
    }
  },
  debug: (message: string, ...args: unknown[]) => {
    if (window.appBridge?.logger) {
      window.appBridge.logger.debug(message, ...args);
    } else {
      console.debug(`[Logger] ${message}`, ...args);
    }
  }
};
