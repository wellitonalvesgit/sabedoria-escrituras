const fs = require('fs');
const path = require('path');

// Configuração do Supabase (usando as variáveis do MCP)
const supabaseUrl = 'https://aqvqpkmjdtzeoclndwhj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTI2ODYsImV4cCI6MjA3NjY2ODY4Nn0.ZStT6hrlRhT3bigKWc3i6An_lL09R_t5gdZ4WIyyYyY';

// Para uploads, precisamos usar a service role key
// Vou usar fetch diretamente para a API do Supabase
async function uploadImageToSupabase(fileName, filePath) {
  try {
    // Ler o arquivo
    const fileBuffer = fs.readFileSync(filePath);
    
    // Determinar o tipo MIME
    const ext = path.extname(fileName).toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    if (ext === '.webp') contentType = 'image/webp';
    if (ext === '.svg') contentType = 'image/svg+xml';
    
    // Fazer upload via API REST do Supabase
    const uploadPath = `covers/${fileName}`;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/course-covers/${uploadPath}`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': contentType,
        'x-upsert': 'true'
      },
      body: fileBuffer
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro ao fazer upload de ${fileName}:`, response.status, errorText);
      return null;
    }

    // URL pública
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/course-covers/${uploadPath}`;
    console.log(`✅ ${fileName} → ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error(`❌ Erro ao processar ${fileName}:`, error);
    return null;
  }
}

async function updateCourseCover(courseTitle, coverUrl) {
  try {
    // Buscar o curso pelo título
    const searchUrl = `${supabaseUrl}/rest/v1/courses?title=ilike.%25${encodeURIComponent(courseTitle)}%25&select=id,title`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      }
    });

    if (!searchResponse.ok) {
      console.error(`❌ Erro ao buscar curso "${courseTitle}":`, searchResponse.status);
      return false;
    }

    const courses = await searchResponse.json();
    
    if (!courses || courses.length === 0) {
      console.warn(`⚠️ Curso não encontrado: "${courseTitle}"`);
      return false;
    }

    // Atualizar a capa do curso
    const updateUrl = `${supabaseUrl}/rest/v1/courses?id=eq.${courses[0].id}`;
    
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ cover_url: coverUrl })
    });

    if (!updateResponse.ok) {
      console.error(`❌ Erro ao atualizar capa do curso "${courseTitle}":`, updateResponse.status);
      return false;
    }

    console.log(`✅ Capa atualizada para: ${courseTitle}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao atualizar curso "${courseTitle}":`, error);
    return false;
  }
}

// Mapeamento de imagens para cursos
const imageToCourseMapping = {
  'bible-study-books-collection.jpg': 'Estudos Bíblicos: Romanos, Coríntios, Apocalipse, Atos',
  'bible-study-books-four-gospels.jpg': 'Os 4 Evangelhos Comparados',
  'bible-study-books-parabolas.jpg': 'Panorama das Parábolas de Jesus',
  'bible-study-books-pauline-letters.jpg': 'Mapas Mentais: Cartas Paulinas',
  'bible-study-course-books.jpg': 'Estudos Bíblicos: Coríntios, Filipenses, Hebreus',
  'bible-study-course-collection.jpg': 'Estudos Bíblicos: Filipenses, Hebreus, João',
  'bible-study-course-materials.jpg': 'Estudos Bíblicos: Oração, Cantar, Dons',
  'bible-study-materials-books.jpg': 'Estudos Bíblicos: Pedro, Salmos, Batalha Espiritual',
  'bible-study-materials-set.jpg': 'Estudos em Eclesiastes',
  'bible-study-red-books.jpg': 'Estudos em Provérbios',
  'bible-study-twelve-apostles.jpg': 'Os 12 Apóstolos de Jesus',
  'desvendando-parabolas-cover.jpg': 'Panorama das Parábolas de Jesus',
  'professional-business-leadership-course.jpg': 'Unção do Leão - Desenvolvendo Autoridades Espirituais',
  'professional-business-leadership-training.jpg': 'Kit do Pregador Premium - EBOOK',
  'professional-man.jpg': 'Kit do Pregador Premium - WORKS',
  'professional-woman-diverse.png': 'Kit da Mulher Cristã - EBOOK 1',
  'ux-design-interface-wireframes.jpg': 'Kit da Mulher Cristã - EBOOK 2',
  'ux-design-interface.png': 'Ebooks Apocalipse Revelado - EBOOK',
  'digital-marketing-dashboard.png': 'Ebooks Apocalipse Revelado - SLIDES',
  'financial-charts-analysis-spreadsheet.jpg': 'Bônus - Batalha Espiritual - Guia de Estratégias Espirituais',
  'data-science-visualization-graphs-charts.jpg': 'Mapa Mental da Bíblia',
  'data-science-visualization-graphs.jpg': 'Mapas Mentais: Os 4 Evangelhos',
  'product-management-workflow-kanban-board.jpg': 'Profetas Maiores: Ezequiel, Jeremias, Isaías, Daniel'
};

async function main() {
  console.log('🚀 Iniciando upload das capas para Supabase Storage...\n');

  const publicDir = path.join(__dirname, 'public');
  const uploadedImages = [];
  const updatedCourses = [];

  // Processar cada imagem
  for (const [fileName, courseTitle] of Object.entries(imageToCourseMapping)) {
    const imagePath = path.join(publicDir, fileName);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(imagePath)) {
      console.warn(`⚠️ Arquivo não encontrado: ${fileName}`);
      continue;
    }

    console.log(`📤 Enviando ${fileName}...`);

    // Fazer upload da imagem
    const coverUrl = await uploadImageToSupabase(fileName, imagePath);
    if (coverUrl) {
      uploadedImages.push({ fileName, coverUrl });
      
      // Atualizar o curso com a nova capa
      const success = await updateCourseCover(courseTitle, coverUrl);
      if (success) {
        updatedCourses.push({ courseTitle, coverUrl });
      }
    }

    // Pequena pausa para não sobrecarregar a API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📊 RESUMO:');
  console.log(`✅ Imagens enviadas: ${uploadedImages.length}`);
  console.log(`✅ Cursos atualizados: ${updatedCourses.length}`);
  
  console.log('\n📋 Imagens enviadas:');
  uploadedImages.forEach(img => {
    console.log(`  - ${img.fileName} → ${img.coverUrl}`);
  });

  console.log('\n📋 Cursos atualizados:');
  updatedCourses.forEach(course => {
    console.log(`  - ${course.courseTitle} → ${course.coverUrl}`);
  });

  console.log('\n🎉 Upload concluído!');
}

main().catch(console.error);
