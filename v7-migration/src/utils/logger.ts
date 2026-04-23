import { AppBridge } from '../bridge/AppBridge';

/**
 * Renderer-side logger that abstracts appBridge.logger.
 * Usage: Logger.info('My message', data);
 */
export const Logger = {
  info: (message: string, ...args: unknown[]) => {
    AppBridge.logger.info(message, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    AppBridge.logger.warn(message, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    AppBridge.logger.error(message, ...args);
  },
  debug: (message: string, ...args: unknown[]) => {
    AppBridge.logger.debug(message, ...args);
  }
};
