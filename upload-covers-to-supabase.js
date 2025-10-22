const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Mapeamento de imagens para cursos (baseado nos nomes dos arquivos)
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
  'financial-charts-and-analysis.jpg': 'Bônus - Batalha Espiritual - Guia de Estratégias Espirituais',
  'data-science-visualization-graphs-charts.jpg': 'Mapa Mental da Bíblia',
  'data-science-visualization-graphs.jpg': 'Mapas Mentais: Os 4 Evangelhos',
  'product-management-workflow-kanban-board.jpg': 'Profetas Maiores: Ezequiel, Jeremias, Isaías, Daniel',
  'product-management-workflow.jpg': 'Profetas Maiores: Ezequiel, Jeremias, Isaías, Daniel'
};

async function uploadImageToSupabase(imagePath, fileName) {
  try {
    // Ler o arquivo
    const fileBuffer = fs.readFileSync(imagePath);
    
    // Determinar o tipo MIME
    const ext = path.extname(fileName).toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    if (ext === '.webp') contentType = 'image/webp';
    if (ext === '.svg') contentType = 'image/svg+xml';
    
    // Upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from('course-covers')
      .upload(`covers/${fileName}`, fileBuffer, {
        contentType: contentType,
        upsert: true // Permite sobrescrever se já existir
      });

    if (error) {
      console.error(`❌ Erro ao fazer upload de ${fileName}:`, error);
      return null;
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('course-covers')
      .getPublicUrl(`covers/${fileName}`);

    console.log(`✅ ${fileName} → ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error(`❌ Erro ao processar ${fileName}:`, error);
    return null;
  }
}

async function updateCourseCover(courseTitle, coverUrl) {
  try {
    // Buscar o curso pelo título
    const { data: courses, error: searchError } = await supabase
      .from('courses')
      .select('id, title')
      .ilike('title', `%${courseTitle}%`);

    if (searchError) {
      console.error(`❌ Erro ao buscar curso "${courseTitle}":`, searchError);
      return false;
    }

    if (!courses || courses.length === 0) {
      console.warn(`⚠️ Curso não encontrado: "${courseTitle}"`);
      return false;
    }

    // Atualizar a capa do curso
    const { error: updateError } = await supabase
      .from('courses')
      .update({ cover_url: coverUrl })
      .eq('id', courses[0].id);

    if (updateError) {
      console.error(`❌ Erro ao atualizar capa do curso "${courseTitle}":`, updateError);
      return false;
    }

    console.log(`✅ Capa atualizada para: ${courseTitle}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao atualizar curso "${courseTitle}":`, error);
    return false;
  }
}

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

    // Fazer upload da imagem
    const coverUrl = await uploadImageToSupabase(imagePath, fileName);
    if (coverUrl) {
      uploadedImages.push({ fileName, coverUrl });
      
      // Atualizar o curso com a nova capa
      const success = await updateCourseCover(courseTitle, coverUrl);
      if (success) {
        updatedCourses.push({ courseTitle, coverUrl });
      }
    }

    // Pequena pausa para não sobrecarregar a API
    await new Promise(resolve => setTimeout(resolve, 100));
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
