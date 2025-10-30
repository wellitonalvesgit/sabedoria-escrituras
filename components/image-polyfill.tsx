"use client"

import { useEffect } from "react"

export function ImagePolyfill() {
  useEffect(() => {
    // Fix para Image constructor - garantir que funcione mesmo quando chamado sem 'new'
    if (typeof window !== 'undefined' && window.Image) {
      try {
        const OriginalImage = window.Image
        // Criar wrapper que garante uso do new
        const ImageWrapper = function(this: any, ...args: any[]) {
          if (!(this instanceof ImageWrapper)) {
            return new (OriginalImage as any)(...args)
          }
          return OriginalImage.apply(this, args)
        } as any
        
        ImageWrapper.prototype = OriginalImage.prototype
        Object.setPrototypeOf(ImageWrapper, OriginalImage)
        Object.defineProperty(window, 'Image', {
          value: ImageWrapper,
          writable: true,
          configurable: true,
        })
      } catch (e) {
        console.warn('Erro ao configurar Image polyfill:', e)
      }
    }
  }, [])

  return null
}

