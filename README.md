# 📚 Sabedoria das Escrituras - Sistema de Cursos Bíblicos

Sistema completo de cursos bíblicos desenvolvido com Next.js 15, Supabase e TypeScript.

## 🚀 Funcionalidades

### ✅ Sistema Completo
- **23 cursos bíblicos** organizados por categorias
- **Sistema de upload** de imagens e PDFs via Supabase Storage
- **Interface administrativa** completa com CRUD
- **Sistema de tags** personalizáveis para cursos
- **Design responsivo** e moderno
- **Gamificação** e sistema de progresso

### 📖 Cursos Incluídos

#### Sabedoria das Escrituras (14 cursos)
- Estudos Bíblicos: Romanos, Coríntios, Apocalipse, Atos
- Estudos Bíblicos: Coríntios, Filipenses, Hebreus
- Estudos Bíblicos: Filipenses, Hebreus, João
- Estudos Bíblicos: Oração, Cantar, Dons
- Estudos Bíblicos: Pedro, Salmos, Batalha Espiritual
- Estudos em Eclesiastes
- Estudos em Provérbios
- Mapa Mental da Bíblia
- Mapas Mentais: Cartas Paulinas
- Mapas Mentais: Os 4 Evangelhos
- Os 12 Apóstolos de Jesus
- Os 4 Evangelhos Comparados
- Panorama das Parábolas de Jesus
- Profetas Maiores: Ezequiel, Jeremias, Isaías, Daniel

#### Unção do Leão (1 curso)
- Unção do Leão - Desenvolvendo Autoridades Espirituais

#### Kit do Pregador Premium (2 cursos)
- Kit do Pregador Premium - EBOOK
- Kit do Pregador Premium - WORKS

#### Ebooks Apocalipse Revelado (2 cursos)
- Ebooks Apocalipse Revelado - EBOOK
- Ebooks Apocalipse Revelado - SLIDES

#### Kit da Mulher Cristã (2 cursos)
- Kit da Mulher Cristã - EBOOK 1
- Kit da Mulher Cristã - EBOOK 2

#### Bônus (1 curso)
- Bônus - Batalha Espiritual - Guia de Estratégias Espirituais

## 🛠️ Tecnologias

- **Frontend:** Next.js 15, React, TypeScript
- **Backend:** Supabase (PostgreSQL, Storage, Auth)
- **UI:** Tailwind CSS, shadcn/ui
- **Deploy:** Vercel (recomendado)

## 📦 Instalação

1. **Clone o repositório:**
```bash
git clone https://github.com/wellitonalvesgit/sabedoria-escrituras.git
cd sabedoria-escrituras
```

2. **Instale as dependências:**
```bash
npm install
# ou
pnpm install
```

3. **Configure as variáveis de ambiente:**
Crie um arquivo `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

4. **Execute o servidor:**
```bash
npm run dev
# ou
pnpm dev
```

## 🗄️ Banco de Dados

O sistema usa Supabase com as seguintes tabelas:
- `courses` - Cursos principais
- `course_pdfs` - PDFs/volumes dos cursos
- `users` - Usuários do sistema
- `user_course_progress` - Progresso dos usuários
- `reading_sessions` - Sessões de leitura
- `achievements` - Conquistas
- `user_achievements` - Conquistas dos usuários
- `bookmarks` - Favoritos

## 📁 Estrutura do Projeto

```
├── app/                    # App Router (Next.js 15)
│   ├── admin/             # Interface administrativa
│   ├── api/               # API Routes
│   ├── course/            # Páginas dos cursos
│   └── page.tsx           # Homepage
├── components/            # Componentes React
│   ├── ui/               # Componentes de UI (shadcn/ui)
│   └── ...               # Outros componentes
├── lib/                  # Utilitários e configurações
├── public/               # Arquivos estáticos
└── types/                # Definições TypeScript
```

## 🎨 Interface

### Homepage
- Cards dos cursos organizados por categoria
- Sistema de tags coloridas
- Design responsivo

### Admin
- Gerenciamento completo de cursos
- Upload de imagens e PDFs
- CRUD de usuários
- Estatísticas e relatórios

### Curso Individual
- Visualizador de PDF com efeito flipbook
- Sistema de progresso
- Gamificação

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### Outras Plataformas
- Netlify
- Railway
- DigitalOcean App Platform

## 📝 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Servidor de produção
npm run lint         # Linting
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 📞 Contato

- **Email:** ascartasdepailoo@gmail.com
- **GitHub:** [wellitonalvesgit](https://github.com/wellitonalvesgit)

---

**Desenvolvido com ❤️ para o estudo das Escrituras Sagradas**
