// Cache simples para APIs com debounce
class APICache {
  private cache = new Map<string, { data: any, timestamp: number }>()
  private pendingRequests = new Map<string, Promise<any>>()
  private readonly TTL = 30 * 1000 // 30 segundos

  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // Verificar cache
    const cached = this.cache.get(key)
    if (cached && (Date.now() - cached.timestamp) < this.TTL) {
      return cached.data
    }

    // Verificar se já há uma requisição pendente
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }

    // Fazer nova requisição
    const promise = fetcher().then(data => {
      this.cache.set(key, { data, timestamp: Date.now() })
      this.pendingRequests.delete(key)
      return data
    }).catch(error => {
      this.pendingRequests.delete(key)
      throw error
    })

    this.pendingRequests.set(key, promise)
    return promise
  }

  clear() {
    this.cache.clear()
    this.pendingRequests.clear()
  }

  invalidate(key: string) {
    this.cache.delete(key)
    this.pendingRequests.delete(key)
  }
}

export const apiCache = new APICache()
