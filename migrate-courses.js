// Script de migração dos cursos mockados para o Supabase
// Execute UMA ÚNICA VEZ: node migrate-courses.js

const supabaseUrl = 'https://aqvqpkmjdtzeoclndwhj.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA5MjY4NiwiZXhwIjoyMDc2NjY4Njg2fQ.0sBklMOxA7TsCiCP8_8oxjumxK43jj8PRia1LE_Mybs';

// Dados dos cursos (copiados de lib/courses-data.ts)
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
  }
];

console.log('🚀 Iniciando migração de cursos para o Supabase...\n');

async function migrateCourses() {
  let totalCourses = 0;
  let totalPDFs = 0;

  for (const course of courses) {
    console.log(`📚 Migrando: ${course.title}`);

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
      continue;
    }

    const [courseData] = await courseResponse.json();
    console.log(`   ✅ Curso criado (ID: ${courseData.id.substring(0, 8)}...)`);
    totalCourses++;

    // 2. Inserir PDFs do curso
    for (let i = 0; i < course.pdfs.length; i++) {
      const pdf = course.pdfs[i];

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
      }
    }

    console.log('');
  }

  console.log('='.repeat(50));
  console.log(`🎉 Migração concluída!`);
  console.log(`   📚 ${totalCourses} cursos migrados`);
  console.log(`   📄 ${totalPDFs} PDFs adicionados`);
  console.log('='.repeat(50));
}

migrateCourses().catch(error => {
  console.error('❌ Erro fatal na migração:', error);
});
