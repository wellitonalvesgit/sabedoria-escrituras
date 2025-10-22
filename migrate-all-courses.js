// Script de migração COMPLETO dos 14 cursos para o Supabase
// Execute UMA ÚNICA VEZ: node migrate-all-courses.js

const supabaseUrl = 'https://aqvqpkmjdtzeoclndwhj.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA5MjY4NiwiZXhwIjoyMDc2NjY4Njg2fQ.0sBklMOxA7TsCiCP8_8oxjumxK43jj8PRia1LE_Mybs';

// TODOS os 14 cursos (copiados de lib/courses-data.ts)
const courses = [
  {
    slug: "panorama-parabolas-jesus",
    title: "Panorama das Parábolas de Jesus",
    description: "Análise completa das parábolas de Jesus Cristo, explorando seus significados profundos e aplicações práticas para a vida cristã moderna.",
    readingTimeMinutes: 180,
    coverUrl: "/bible-study-books-parabolas.jpg",
    author: "Pr. Welliton Alves Dos Santos",
    pages: 120,
    category: "Panorama Bíblico",
    pdfs: [
      { volume: "VOL-I", title: "Panorama Bíblico - Desvendando as Parábolas de Jesus - Parte 01", url: "https://drive.google.com/file/d/1EbjfK--R591qRxg06HddKjr095qEZO6p/preview", pages: 20, readingTimeMinutes: 30 },
      { volume: "VOL-II", title: "Panorama Bíblico - Desvendando as Parábolas de Jesus - Parte 02", url: "https://drive.google.com/file/d/1rG8tKuLNagv0RzqQtHsjWk3KHQDZ1irP/preview", pages: 20, readingTimeMinutes: 30 },
      { volume: "VOL-III", title: "Panorama Bíblico - Desvendando as Parábolas de Jesus - Parte 03", url: "https://drive.google.com/file/d/1NgdwNoiKokSigHy_U36NqoTiuRHgUaMQ/preview", pages: 20, readingTimeMinutes: 30 },
      { volume: "VOL-IV", title: "Panorama Bíblico - Desvendando as Parábolas de Jesus - Parte 04", url: "https://drive.google.com/file/d/1vrM4HLWOcZnBLvhFIBnUbgEvHTeb2HU4/preview", pages: 20, readingTimeMinutes: 30 },
      { volume: "VOL-V", title: "Panorama Bíblico - Desvendando as Parábolas de Jesus - Parte 05", url: "https://drive.google.com/file/d/1F674JnufjTa8RhBS1rAf5_fewbj_p_qq/preview", pages: 20, readingTimeMinutes: 30 },
      { volume: "VOL-VI", title: "Panorama Bíblico - Desvendando as Parábolas de Jesus - Parte 06", url: "https://drive.google.com/file/d/1WWLDENSB7WRFFc4t8sLZ079-KbwsbuRM/preview", pages: 20, readingTimeMinutes: 30 }
    ]
  },
  {
    slug: "mapas-mentais-cartas-paulinas",
    title: "Mapas Mentais: Cartas Paulinas",
    description: "Compreenda as cartas de Paulo através de mapas mentais visuais que conectam temas, contextos e aplicações práticas.",
    readingTimeMinutes: 60,
    coverUrl: "/bible-study-books-pauline-letters.jpg",
    author: "Pr. Welliton Alves Dos Santos",
    pages: 48,
    category: "Estudo Bíblico",
    pdfs: [
      { volume: "PDF", title: "Mapas Mentais: Cartas Paulinas", url: "https://drive.google.com/uc?export=download&id=17a-ynVKmPunQovV1m-ISob5XiBOHEjNL", pages: 48, readingTimeMinutes: 60 }
    ]
  },
  {
    slug: "mapas-mentais-4-evangelhos",
    title: "Mapas Mentais: Os 4 Evangelhos",
    description: "Visualize os quatro evangelhos através de mapas mentais que conectam eventos, ensinamentos e cronologias.",
    readingTimeMinutes: 90,
    coverUrl: "/bible-study-books-four-gospels.jpg",
    author: "Pr. Welliton Alves Dos Santos",
    pages: 72,
    category: "Evangelhos",
    pdfs: [
      { volume: "MATEUS", title: "Esboço livro de Mateus", url: "https://drive.google.com/uc?export=download&id=1mateus", pages: 18, readingTimeMinutes: 22 },
      { volume: "MARCOS", title: "Esboço livro de Marcos", url: "https://drive.google.com/uc?export=download&id=1marcos", pages: 18, readingTimeMinutes: 22 },
      { volume: "LUCAS", title: "Esboço livro de Lucas", url: "https://drive.google.com/uc?export=download&id=1lucas", pages: 18, readingTimeMinutes: 22 },
      { volume: "JOÃO", title: "Esboço livro de João", url: "https://drive.google.com/uc?export=download&id=1joao", pages: 18, readingTimeMinutes: 22 }
    ]
  },
  {
    slug: "12-apostolos-jesus",
    title: "Os 12 Apóstolos de Jesus",
    description: "Conheça a vida, ministério e legado de cada um dos doze apóstolos com estudos biográficos detalhados.",
    readingTimeMinutes: 45,
    coverUrl: "/bible-study-twelve-apostles.jpg",
    author: "Pr. Welliton Alves Dos Santos",
    pages: 36,
    category: "Biografia Bíblica",
    pdfs: [
      { volume: "VOL-I", title: "12 Apóstolos - Parte 01", url: "https://example.com/apostolos-vol1.pdf", pages: 6, readingTimeMinutes: 8 },
      { volume: "VOL-II", title: "12 Apóstolos - Parte 02", url: "https://example.com/apostolos-vol2.pdf", pages: 6, readingTimeMinutes: 8 },
      { volume: "VOL-III", title: "12 Apóstolos - Parte 03", url: "https://example.com/apostolos-vol3.pdf", pages: 6, readingTimeMinutes: 8 },
      { volume: "VOL-IV", title: "12 Apóstolos - Parte 04", url: "https://example.com/apostolos-vol4.pdf", pages: 6, readingTimeMinutes: 8 },
      { volume: "VOL-V", title: "12 Apóstolos - Parte 05", url: "https://example.com/apostolos-vol5.pdf", pages: 6, readingTimeMinutes: 8 },
      { volume: "VOL-VI", title: "12 Apóstolos - Parte 06", url: "https://example.com/apostolos-vol6.pdf", pages: 6, readingTimeMinutes: 8 }
    ]
  },
  {
    slug: "4-evangelhos-comparados",
    title: "Os 4 Evangelhos Comparados",
    description: "Análise comparativa dos quatro evangelhos com tabelas, cronologias e insights sobre as perspectivas únicas de cada autor.",
    readingTimeMinutes: 90,
    coverUrl: "/bible-study-books-four-gospels.jpg",
    author: "Pr. Welliton Alves Dos Santos",
    pages: 72,
    category: "Evangelhos",
    pdfs: [
      { volume: "MATEUS", title: "Esboço livro de Mateus", url: "https://drive.google.com/uc?export=download&id=1mateus-comp", pages: 18, readingTimeMinutes: 22 },
      { volume: "MARCOS", title: "Esboço livro de Marcos", url: "https://drive.google.com/uc?export=download&id=1marcos-comp", pages: 18, readingTimeMinutes: 22 },
      { volume: "LUCAS", title: "Esboço livro de Lucas", url: "https://drive.google.com/uc?export=download&id=1lucas-comp", pages: 18, readingTimeMinutes: 22 },
      { volume: "JOÃO", title: "Esboço livro de João", url: "https://drive.google.com/uc?export=download&id=1joao-comp", pages: 18, readingTimeMinutes: 22 }
    ]
  },
  {
    slug: "estudos-biblicos-romanos-corintios-apocalipse-atos",
    title: "Estudos Bíblicos: Romanos, Coríntios, Apocalipse, Atos",
    description: "Estudos aprofundados dos livros de Romanos, Coríntios, Apocalipse e Atos com análise teológica e aplicações práticas.",
    readingTimeMinutes: 240,
    coverUrl: "/bible-study-course-books.jpg",
    author: "Pr. Welliton Alves Dos Santos",
    pages: 192,
    category: "Estudo Bíblico",
    pdfs: [
      { volume: "PAULO", title: "Esboço livro de Paulo", url: "https://drive.google.com/uc?export=download&id=1paulo", pages: 48, readingTimeMinutes: 60 },
      { volume: "ROMANOS", title: "Esboço livro de Romanos", url: "https://drive.google.com/uc?export=download&id=1romanos", pages: 48, readingTimeMinutes: 60 },
      { volume: "APOCALIPSE", title: "Esboço livro de Apocalipse", url: "https://drive.google.com/uc?export=download&id=1apocalipse", pages: 48, readingTimeMinutes: 60 },
      { volume: "ATOS", title: "Esboço livro de Atos", url: "https://drive.google.com/uc?export=download&id=1atos", pages: 48, readingTimeMinutes: 60 }
    ]
  },
  {
    slug: "estudos-biblicos-corintios-filipenses-hebreus",
    title: "Estudos Bíblicos: Coríntios, Filipenses, Hebreus",
    description: "Análise detalhada das cartas aos Coríntios, Filipenses e Hebreus com contexto histórico e aplicações práticas.",
    readingTimeMinutes: 180,
    coverUrl: "/bible-study-books-pauline-letters.jpg",
    author: "Pr. Welliton Alves Dos Santos",
    pages: 144,
    category: "Epístolas",
    pdfs: [
      { volume: "1-CORINTIOS", title: "Esboço livro de 1º Coríntios", url: "https://drive.google.com/uc?export=download&id=1corintios", pages: 30, readingTimeMinutes: 37 },
      { volume: "FILIPENSES", title: "Esboço livro de Filipenses", url: "https://drive.google.com/uc?export=download&id=1filipenses", pages: 30, readingTimeMinutes: 37 },
      { volume: "ELIAS", title: "Esboço livro de Elias", url: "https://drive.google.com/uc?export=download&id=1elias", pages: 30, readingTimeMinutes: 37 },
      { volume: "JO", title: "Esboço livro de Jó", url: "https://drive.google.com/uc?export=download&id=1jo", pages: 30, readingTimeMinutes: 37 }
    ]
  },
  {
    slug: "estudos-biblicos-filipenses-hebreus-joao",
    title: "Estudos Bíblicos: Filipenses, Hebreus, João",
    description: "Estudos aprofundados de Filipenses, Hebreus e Evangelho de João com análise teológica e aplicações práticas.",
    readingTimeMinutes: 200,
    coverUrl: "/bible-study-course-materials.jpg",
    author: "Pr. Welliton Alves Dos Santos",
    pages: 160,
    category: "Estudo Bíblico",
    pdfs: [
      { volume: "VOL-I", title: "Estudos Filipenses, Hebreus, João - Parte 01", url: "https://example.com/filipenses-vol1.pdf", pages: 27, readingTimeMinutes: 34 },
      { volume: "VOL-II", title: "Estudos Filipenses, Hebreus, João - Parte 02", url: "https://example.com/filipenses-vol2.pdf", pages: 27, readingTimeMinutes: 34 },
      { volume: "VOL-III", title: "Estudos Filipenses, Hebreus, João - Parte 03", url: "https://example.com/filipenses-vol3.pdf", pages: 27, readingTimeMinutes: 34 },
      { volume: "VOL-IV", title: "Estudos Filipenses, Hebreus, João - Parte 04", url: "https://example.com/filipenses-vol4.pdf", pages: 27, readingTimeMinutes: 34 },
      { volume: "VOL-V", title: "Estudos Filipenses, Hebreus, João - Parte 05", url: "https://example.com/filipenses-vol5.pdf", pages: 27, readingTimeMinutes: 34 },
      { volume: "VOL-VI", title: "Estudos Filipenses, Hebreus, João - Parte 06", url: "https://example.com/filipenses-vol6.pdf", pages: 27, readingTimeMinutes: 34 }
    ]
  },
  {
    slug: "profetas-maiores-ezequiel-jeremias-isaias-daniel",
    title: "Profetas Maiores: Ezequiel, Jeremias, Isaías, Daniel",
    description: "Estudo completo dos profetas maiores com análise histórica, teológica e aplicações práticas para a vida cristã.",
    readingTimeMinutes: 300,
    coverUrl: "/bible-study-materials-books.jpg",
    author: "Pr. Welliton Alves Dos Santos",
    pages: 240,
    category: "Profetas",
    pdfs: [
      { volume: "EZEQUIEL", title: "Esboço livro de Ezequiel", url: "https://drive.google.com/uc?export=download&id=1ezequiel", pages: 48, readingTimeMinutes: 60 },
      { volume: "JEREMIAS", title: "Esboço livro de Jeremias", url: "https://drive.google.com/uc?export=download&id=1jeremias", pages: 48, readingTimeMinutes: 60 },
      { volume: "ISAIAS", title: "Esboço livro de Isaías", url: "https://drive.google.com/uc?export=download&id=1isaias", pages: 48, readingTimeMinutes: 60 },
      { volume: "DANIEL", title: "Esboço livro de Daniel", url: "https://drive.google.com/uc?export=download&id=1daniel", pages: 48, readingTimeMinutes: 60 }
    ]
  },
  {
    slug: "estudos-biblicos-pedro-salmos-batalha-espiritual",
    title: "Estudos Bíblicos: Pedro, Salmos, Batalha Espiritual",
    description: "Estudos sobre as cartas de Pedro, livro dos Salmos e batalha espiritual com aplicações práticas para a vida cristã.",
    readingTimeMinutes: 150,
    coverUrl: "/bible-study-materials-set.jpg",
    author: "Pr. Welliton Alves Dos Santos",
    pages: 120,
    category: "Estudo Bíblico",
    pdfs: [
      { volume: "PEDRO", title: "Esboço livro de Pedro", url: "https://drive.google.com/uc?export=download&id=1pedro", pages: 32, readingTimeMinutes: 40 },
      { volume: "SALMOS", title: "Esboço livro de Salmos", url: "https://drive.google.com/uc?export=download&id=1salmos", pages: 32, readingTimeMinutes: 40 },
      { volume: "SAUDACOES", title: "Esboço de Saudações", url: "https://drive.google.com/uc?export=download&id=1saudacoes", pages: 32, readingTimeMinutes: 40 },
      { volume: "BATALHA", title: "Esboço de Batalha Espiritual", url: "https://drive.google.com/uc?export=download&id=1batalha", pages: 32, readingTimeMinutes: 40 }
    ]
  },
  {
    slug: "estudos-biblicos-oracao-cantar-dons",
    title: "Estudos Bíblicos: Oração, Cantar, Dons",
    description: "Estudos sobre oração, adoração através do canto e dons espirituais com aplicações práticas para a vida cristã.",
    readingTimeMinutes: 120,
    coverUrl: "/bible-study-course-collection.jpg",
    author: "Pr. Welliton Alves Dos Santos",
    pages: 96,
    category: "Vida Cristã",
    pdfs: [
      { volume: "TEMER", title: "Temer a Deus", url: "https://drive.google.com/uc?export=download&id=1temer", pages: 24, readingTimeMinutes: 30 },
      { volume: "ORACAO", title: "Oração", url: "https://drive.google.com/uc?export=download&id=1oracao", pages: 24, readingTimeMinutes: 30 },
      { volume: "SANTIDADE", title: "Santidade", url: "https://drive.google.com/uc?export=download&id=1santidade", pages: 24, readingTimeMinutes: 30 },
      { volume: "INTIMIDADE", title: "Intimidade com Deus", url: "https://drive.google.com/uc?export=download&id=1intimidade", pages: 24, readingTimeMinutes: 30 }
    ]
  },
  {
    slug: "estudos-proverbios",
    title: "Estudos em Provérbios",
    description: "50 estudos em Provérbios com aplicações práticas para sabedoria, vida cristã e relacionamentos.",
    readingTimeMinutes: 100,
    coverUrl: "/bible-study-books-collection.jpg",
    author: "Pr. Welliton Alves Dos Santos",
    pages: 80,
    category: "Sapienciais",
    pdfs: [
      { volume: "PDF", title: "Esboço Provérbios", url: "https://drive.google.com/uc?export=download&id=1proverbios", pages: 48, readingTimeMinutes: 60 }
    ]
  },
  {
    slug: "estudos-eclesiastes",
    title: "Estudos em Eclesiastes",
    description: "50 estudos em Eclesiastes com reflexões sobre o sentido da vida, sabedoria e propósito divino.",
    readingTimeMinutes: 100,
    coverUrl: "/bible-study-books-collection.jpg",
    author: "Pr. Welliton Alves Dos Santos",
    pages: 80,
    category: "Sapienciais",
    pdfs: [
      { volume: "PDF", title: "Esboços Eclesiastes", url: "https://drive.google.com/uc?export=download&id=1eclesiastes", pages: 48, readingTimeMinutes: 60 }
    ]
  },
  {
    slug: "mapa-mental-biblia",
    title: "Mapa Mental da Bíblia",
    description: "Visualização completa da Bíblia através de mapas mentais que conectam livros, temas e cronologias bíblicas.",
    readingTimeMinutes: 60,
    coverUrl: "/bible-study-materials-set.jpg",
    author: "Pr. Welliton Alves Dos Santos",
    pages: 48,
    category: "Panorama Bíblico",
    pdfs: [
      { volume: "PDF", title: "Mapa Didático", url: "https://drive.google.com/uc?export=download&id=1mapa-didatico", pages: 48, readingTimeMinutes: 60 }
    ]
  }
];

console.log('🚀 Iniciando migração COMPLETA de TODOS os 14 cursos para o Supabase...\n');

async function migrateAllCourses() {
  let totalCourses = 0;
  let totalPDFs = 0;
  let errors = 0;

  for (const course of courses) {
    console.log(`📚 [${totalCourses + 1}/14] Migrando: ${course.title}`);

    try {
      // 1. Inserir curso
      const courseResponse = await fetch(`${supabaseUrl}/rest/v1/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          slug: course.slug,
          title: course.title,
          description: course.description,
          author: course.author,
          category: course.category,
          pages: course.pages,
          reading_time_minutes: course.readingTimeMinutes,
          cover_url: course.coverUrl,
          status: 'published'
        })
      });

      if (!courseResponse.ok) {
        const error = await courseResponse.text();
        console.log(`   ❌ Erro ao inserir curso: ${error}`);
        errors++;
        continue;
      }

      const [courseData] = await courseResponse.json();
      console.log(`   ✅ Curso criado (ID: ${courseData.id.substring(0, 8)}...)`);
      totalCourses++;

      // 2. Inserir PDFs do curso
      for (let i = 0; i < course.pdfs.length; i++) {
        const pdf = course.pdfs[i];

        try {
          const pdfResponse = await fetch(`${supabaseUrl}/rest/v1/course_pdfs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': serviceRoleKey,
              'Authorization': `Bearer ${serviceRoleKey}`
            },
            body: JSON.stringify({
              course_id: courseData.id,
              volume: pdf.volume,
              title: pdf.title,
              url: pdf.url,
              pages: pdf.pages,
              reading_time_minutes: pdf.readingTimeMinutes,
              text_content: null,
              use_auto_conversion: true,
              display_order: i
            })
          });

          if (pdfResponse.ok) {
            console.log(`      ✅ PDF ${pdf.volume} adicionado`);
            totalPDFs++;
          } else {
            const error = await pdfResponse.text();
            console.log(`      ❌ Erro ao inserir PDF ${pdf.volume}: ${error}`);
            errors++;
          }
        } catch (pdfError) {
          console.log(`      ❌ Erro ao inserir PDF ${pdf.volume}: ${pdfError.message}`);
          errors++;
        }
      }

      console.log('');
    } catch (courseError) {
      console.log(`   ❌ Erro fatal no curso: ${courseError.message}`);
      errors++;
    }
  }

  console.log('='.repeat(60));
  console.log(`🎉 MIGRAÇÃO COMPLETA FINALIZADA!`);
  console.log(`   📚 ${totalCourses}/14 cursos migrados com sucesso`);
  console.log(`   📄 ${totalPDFs} PDFs adicionados`);
  console.log(`   ❌ ${errors} erros encontrados`);
  console.log('='.repeat(60));
  
  if (totalCourses === 14) {
    console.log('✅ TODOS os 14 cursos foram migrados com sucesso!');
  } else {
    console.log(`⚠️  Apenas ${totalCourses} de 14 cursos foram migrados.`);
  }
}

migrateAllCourses().catch(error => {
  console.error('❌ Erro fatal na migração:', error);
});

