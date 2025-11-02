import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function testPdfConversion() {
  try {
    // Ler o arquivo PDF local
    const pdfPath = path.join(__dirname, 'VOL-I PANORAMA BÍBLICO desvendando as parabolas de jesus - parte- 01_compressed.pdf')

    console.log('📄 Lendo arquivo PDF:', pdfPath)

    if (!fs.existsSync(pdfPath)) {
      console.error('❌ Arquivo PDF não encontrado!')
      return
    }

    const pdfBuffer = fs.readFileSync(pdfPath)
    console.log(`✅ PDF lido com sucesso. Tamanho: ${pdfBuffer.length} bytes`)

    // Fazer requisição para a API local
    console.log('\n🔄 Enviando para API de conversão...')

    const response = await fetch('http://localhost:3003/api/convert-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Usar data URI para enviar o PDF
        pdfUrl: `data:application/pdf;base64,${pdfBuffer.toString('base64')}`
      })
    })

    const result = await response.json()

    if (result.success) {
      console.log('\n✅ CONVERSÃO BEM-SUCEDIDA!')
      console.log('📊 Número de páginas:', result.pages)
      console.log('📝 Caracteres extraídos:', result.text.length)
      console.log('📖 Primeiros 500 caracteres do texto:\n')
      console.log(result.text.substring(0, 500))
      console.log('\n...\n')

      // Salvar o texto extraído em um arquivo
      const outputPath = path.join(__dirname, 'texto-extraido.txt')
      fs.writeFileSync(outputPath, result.text, 'utf-8')
      console.log(`💾 Texto completo salvo em: ${outputPath}`)

    } else {
      console.log('\n❌ ERRO NA CONVERSÃO:')
      console.log('Erro:', result.error)
      console.log('Detalhes:', result.details)
      if (result.warning) {
        console.log('Aviso:', result.warning)
      }
    }

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message)
    console.error(error)
  }
}

// Executar o teste
console.log('🚀 Iniciando teste de conversão de PDF...\n')
testPdfConversion()
