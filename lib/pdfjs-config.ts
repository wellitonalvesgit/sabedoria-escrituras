// Configuração do pdfjs-dist para evitar conflitos com Image constructor
export const configurePdfjs = () => {
  if (typeof window === 'undefined') return

  // Sobrescrever o Image constructor para evitar conflitos
  const originalImage = window.Image
  
  // Criar um wrapper que sempre usa 'new'
  const ImageWrapper = function(this: any, ...args: any[]) {
    if (!(this instanceof ImageWrapper)) {
      return new (originalImage as any)(...args)
    }
    return originalImage.apply(this, args)
  }
  
  // Copiar propriedades do Image original
  Object.setPrototypeOf(ImageWrapper, originalImage)
  Object.setPrototypeOf(ImageWrapper.prototype, originalImage.prototype)
  
  // Substituir temporariamente o Image constructor
  ;(window as any).Image = ImageWrapper
  
  return () => {
    // Restaurar o Image original
    ;(window as any).Image = originalImage
  }
}

// Configuração do worker do pdfjs
export const getPdfjsWorkerSrc = (version: string) => {
  // Usar CDN confiável para o worker
  return `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`
}
