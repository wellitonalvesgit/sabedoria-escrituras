/**
 * Utility para logging que remove logs em produção
 * Isso melhora significativamente a performance ao remover 500+ console.log statements
 */

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args)
    }
  },

  error: (...args: any[]) => {
    if (isDev) {
      console.error(...args)
    }
  },

  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args)
    }
  },

  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args)
    }
  },

  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args)
    }
  },
}

// Export como funções individuais para facilitar migração
export const log = logger.log
export const error = logger.error
export const warn = logger.warn
export const info = logger.info
export const debug = logger.debug
