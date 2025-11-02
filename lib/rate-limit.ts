interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map()
  private readonly maxAttempts: number
  private readonly windowMs: number

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts
    this.windowMs = windowMs
  }

  public isAllowed(identifier: string): boolean {
    const now = Date.now()
    const entry = this.attempts.get(identifier)

    if (!entry) {
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return true
    }

    // Verificar se o período de bloqueio expirou
    if (now > entry.resetTime) {
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return true
    }

    // Verificar se excedeu o limite
    if (entry.count >= this.maxAttempts) {
      return false
    }

    // Incrementar contador
    entry.count++
    this.attempts.set(identifier, entry)
    return true
  }

  public getRemainingAttempts(identifier: string): number {
    const entry = this.attempts.get(identifier)
    if (!entry) return this.maxAttempts

    const now = Date.now()
    if (now > entry.resetTime) {
      return this.maxAttempts
    }

    return Math.max(0, this.maxAttempts - entry.count)
  }

  public getTimeUntilReset(identifier: string): number {
    const entry = this.attempts.get(identifier)
    if (!entry) return 0

    const now = Date.now()
    return Math.max(0, entry.resetTime - now)
  }

  public reset(identifier: string): void {
    this.attempts.delete(identifier)
  }

  public clear(): void {
    this.attempts.clear()
  }
}

// Instância global do rate limiter
export const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000) // 5 tentativas em 15 minutos

// Função para verificar rate limit
export function checkRateLimit(identifier: string): {
  allowed: boolean
  remainingAttempts: number
  timeUntilReset: number
} {
  const allowed = loginRateLimiter.isAllowed(identifier)
  const remainingAttempts = loginRateLimiter.getRemainingAttempts(identifier)
  const timeUntilReset = loginRateLimiter.getTimeUntilReset(identifier)

  return {
    allowed,
    remainingAttempts,
    timeUntilReset
  }
}

// Função para resetar rate limit (usado após login bem-sucedido)
export function resetRateLimit(identifier: string): void {
  loginRateLimiter.reset(identifier)
}
