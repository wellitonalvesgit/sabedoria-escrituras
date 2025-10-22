import { Client } from '@notionhq/client'
import { Course, CoursePDF } from './courses-data'

// Tipos do Notion
interface NotionCourse {
  id: string
  properties: {
    Título: { title: Array<{ plain_text: string }> }
    Descrição: { rich_text: Array<{ plain_text: string }> }
    Autor: { rich_text: Array<{ plain_text: string }> }
    Categoria: { select: { name: string } }
    'Tempo de Leitura (min)': { number: number }
    Páginas: { number: number }
    'Cover URL': { url: string }
  }
}

interface NotionPDF {
  id: string
  properties: {
    Volume: { title: Array<{ plain_text: string }> }
    Título: { rich_text: Array<{ plain_text: string }> }
    'URL PDF': { url: string }
    Páginas: { number: number }
    'Tempo de Leitura (min)': { number: number }
  }
}

export class NotionIntegration {
  private notion: Client
  private databaseId: string

  constructor(apiKey: string, databaseId: string) {
    this.notion = new Client({ auth: apiKey })
    this.databaseId = databaseId
  }

  /**
   * Importa todos os cursos do Notion
   */
  async importCourses(): Promise<Course[]> {
    try {
      // Buscar todos os cursos (páginas do banco de dados)
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
      })

      const courses: Course[] = []

      for (const page of response.results) {
        if ('properties' in page) {
          const notionCourse = page as unknown as NotionCourse
          const course = await this.convertNotionCourse(notionCourse)
          courses.push(course)
        }
      }

      return courses
    } catch (error) {
      console.error('Erro ao importar cursos do Notion:', error)
      throw error
    }
  }

  /**
   * Converte uma página do Notion em um Course
   */
  private async convertNotionCourse(notionCourse: NotionCourse): Promise<Course> {
    const properties = notionCourse.properties

    // Extrair informações básicas
    const title = properties.Título.title[0]?.plain_text || 'Sem título'
    const description = properties.Descrição.rich_text[0]?.plain_text || ''
    const author = properties.Autor.rich_text[0]?.plain_text || ''
    const category = properties.Categoria?.select?.name || ''
    const readingTimeMinutes = properties['Tempo de Leitura (min)']?.number || 0
    const pages = properties.Páginas?.number || 0
    const coverUrl = properties['Cover URL']?.url || '/bible-study-books-collection.jpg'

    // Gerar slug a partir do título
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Buscar PDFs relacionados (blocos filhos da página)
    const pdfs = await this.getCoursePDFs(notionCourse.id)

    return {
      id: slug,
      slug,
      title,
      description,
      author,
      category,
      readingTimeMinutes,
      pages,
      coverUrl,
      pdfs,
    }
  }

  /**
   * Busca os PDFs de um curso (blocos filhos da página)
   */
  private async getCoursePDFs(pageId: string): Promise<CoursePDF[]> {
    try {
      // Buscar blocos filhos da página do curso
      const blocks = await this.notion.blocks.children.list({
        block_id: pageId,
      })

      const pdfs: CoursePDF[] = []

      for (const block of blocks.results) {
        if ('type' in block) {
          // Procurar por blocos de link ou embed
          if (block.type === 'bookmark' && 'bookmark' in block) {
            const url = block.bookmark.url
            if (url.includes('drive.google.com')) {
              pdfs.push({
                volume: `VOL-${pdfs.length + 1}`,
                title: `Volume ${pdfs.length + 1}`,
                url,
              })
            }
          }

          // Se for uma database inline com os PDFs
          if (block.type === 'child_database' && 'child_database' in block) {
            const databaseId = block.id
            const pdfDatabase = await this.notion.databases.query({
              database_id: databaseId,
            })

            for (const pdfPage of pdfDatabase.results) {
              if ('properties' in pdfPage) {
                const notionPDF = pdfPage as unknown as NotionPDF
                const pdf = this.convertNotionPDF(notionPDF)
                pdfs.push(pdf)
              }
            }
          }
        }
      }

      return pdfs
    } catch (error) {
      console.error('Erro ao buscar PDFs do curso:', error)
      return []
    }
  }

  /**
   * Converte uma página de PDF do Notion em CoursePDF
   */
  private convertNotionPDF(notionPDF: NotionPDF): CoursePDF {
    const properties = notionPDF.properties

    return {
      volume: properties.Volume.title[0]?.plain_text || 'VOL-1',
      title: properties.Título.rich_text[0]?.plain_text || 'Sem título',
      url: properties['URL PDF']?.url || '',
      pages: properties.Páginas?.number,
      readingTimeMinutes: properties['Tempo de Leitura (min)']?.number,
    }
  }

  /**
   * Sincroniza os cursos do Notion com o arquivo local
   */
  async syncToFile(outputPath: string): Promise<void> {
    const courses = await this.importCourses()

    const fileContent = `// Auto-gerado a partir do Notion em ${new Date().toISOString()}
// NÃO EDITE MANUALMENTE - Use o script de sincronização

export interface CoursePDF {
  volume: string
  title: string
  url: string
  pages?: number
  readingTimeMinutes?: number
}

export interface Course {
  id: string
  slug: string
  title: string
  description: string
  readingTimeMinutes: number
  coverUrl: string
  author?: string
  pages?: number
  category?: string
  pdfs: CoursePDF[]
}

export const courses: Course[] = ${JSON.stringify(courses, null, 2)}

export function getCourseById(id: string): Course | undefined {
  return courses.find((course) => course.id === id || course.slug === id)
}
`

    const fs = require('fs')
    fs.writeFileSync(outputPath, fileContent, 'utf-8')
    console.log(`✅ ${courses.length} cursos sincronizados com sucesso!`)
  }
}

// Função auxiliar para usar via CLI
export async function syncCoursesFromNotion() {
  const apiKey = process.env.NOTION_API_KEY
  const databaseId = process.env.NOTION_DATABASE_ID

  if (!apiKey || !databaseId) {
    throw new Error(
      'Por favor, defina NOTION_API_KEY e NOTION_DATABASE_ID nas variáveis de ambiente'
    )
  }

  const integration = new NotionIntegration(apiKey, databaseId)
  await integration.syncToFile('./lib/courses-data.ts')
}
