// Teste simples para verificar se a API de upload está funcionando
const testUpload = async () => {
  try {
    // Criar um arquivo de teste
    const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
    
    const formData = new FormData()
    formData.append('file', testFile)
    formData.append('type', 'cover')
    formData.append('courseId', 'test-course-id')

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()
    console.log('Resultado do teste:', result)
    
    return result
  } catch (error) {
    console.error('Erro no teste:', error)
    return { success: false, error: error.message }
  }
}

// Executar teste
testUpload()
