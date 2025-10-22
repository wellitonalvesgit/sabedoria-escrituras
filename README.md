# Sabedoria das Escrituras

Plataforma digital de leitura de conteúdo bíblico com experiência Kindle e gamificação.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/geisonhoehr/v0-recreate-website-ui)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/098YQSqbYkK)

## Funcionalidades Principais

### Dois Modos de Leitura

**1. PDF Original**
- Visualiza o PDF exatamente como foi criado
- Layout original preservado
- Imagens e gráficos nativos
- Zoom e navegação padrão

**2. Bíblia Digital (Experiência Kindle)**
- Texto extraído do PDF sem imagens
- Interface limpa focada na leitura
- Controles de personalização avançados
- Modos de temperatura de leitura (claro, sépia, escuro)

### Funcionalidades da Bíblia Digital

- **Modos de Temperatura**: Light, Sepia, Dark com filtros otimizados
- **Controles de Fonte**: Ajuste de tamanho (12-28px) e altura de linha
- **Controles Visuais**: Brilho, contraste e alinhamento do texto
- **Sons de Virar Página**: Efeito sonoro opcional
- **Auto-scroll**: Rolagem automática configurável
- **Marcadores**: Salve pontos importantes da leitura
- **Download TXT**: Baixe o texto extraído do PDF

## Como Usar PDFs do Google Drive

### Passo 1: Configurar Permissões

Para que o sistema consiga acessar e converter PDFs do Google Drive:

1. Abra o arquivo no Google Drive
2. Clique em "Compartilhar"
3. Em "Acesso geral", selecione "Qualquer pessoa com o link"
4. Defina a permissão como "Visualizador"
5. Copie o link compartilhado

### Passo 2: Formatos de Link Aceitos

O sistema aceita dois formatos de URL do Google Drive:

```
https://drive.google.com/file/d/FILE_ID/view
https://drive.google.com/uc?export=download&id=FILE_ID
```

A API converte automaticamente o primeiro formato para o segundo.

### Passo 3: Limitações Conhecidas

**PDFs de Imagens (Escaneados)**
- Se o PDF contém apenas imagens escaneadas, a extração de texto não funcionará
- Nesses casos, use o modo "PDF Original" para visualização
- Considere usar ferramentas OCR para converter PDFs escaneados em PDFs com texto

**Tamanho do Arquivo**
- PDFs muito grandes podem demorar para converter
- Recomendado: arquivos até 50MB para melhor performance

**Proteção por Senha**
- PDFs protegidos não podem ser processados
- Remova a proteção antes de fazer upload

## Solução de Problemas

### "Erro ao converter PDF para texto"

**Possíveis causas e soluções:**

1. **PDF de imagens escaneadas**
   - Solução: Use o modo "PDF Original" ou converta com OCR

2. **Link do Google Drive não acessível**
   - Solução: Verifique as permissões de compartilhamento
   - Certifique-se de que está configurado como "Qualquer pessoa com o link"

3. **PDF protegido por senha**
   - Solução: Remova a proteção do PDF

4. **Problemas de conectividade**
   - Solução: Verifique sua conexão e tente novamente

### "Pouco texto extraído"

Se o sistema retorna muito pouco texto (<100 caracteres):
- O PDF provavelmente contém principalmente imagens
- Use o modo "PDF Original" para visualizar
- Considere recriar o PDF com texto real (não escaneado)

### Botão "Trocar Modo"

No modo Bíblia Digital, você pode clicar em "Trocar Modo" para voltar à seleção e escolher o modo "PDF Original" se a conversão não funcionar adequadamente.

## Tecnologias Utilizadas

- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **pdf-parse** - Extração de texto de PDFs
- **Framer Motion** - Animações
- **Radix UI** - Componentes acessíveis

## Estrutura do Projeto

```
app/
├── api/
│   └── convert-pdf/
│       └── route.ts          # API de conversão de PDF
├── course/
│   └── [id]/
│       └── page.tsx          # Página do curso
components/
├── bible-digital-reader.tsx   # Leitor Kindle-style
├── digital-magazine-viewer.tsx # Wrapper do leitor
├── original-pdf-viewer.tsx    # Visualizador PDF original
├── view-mode-selector.tsx     # Seletor de modo de leitura
└── pdf-volume-selector.tsx    # Seletor de volumes
```

## API de Conversão de PDF

### Endpoint

```
POST /api/convert-pdf
```

### Request Body

```json
{
  "pdfUrl": "https://drive.google.com/file/d/FILE_ID/view"
}
```

### Response Success

```json
{
  "success": true,
  "text": "Texto extraído do PDF...",
  "pages": 150,
  "info": { /* metadados do PDF */ },
  "downloadUrl": "https://drive.google.com/uc?export=download&id=FILE_ID"
}
```

### Response Error

```json
{
  "success": false,
  "error": "Mensagem de erro",
  "details": "Detalhes técnicos do erro"
}
```

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start
```

## Deployment

Your project is live at:

**[https://vercel.com/geisonhoehr/v0-recreate-website-ui](https://vercel.com/geisonhoehr/v0-recreate-website-ui)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/098YQSqbYkK](https://v0.app/chat/projects/098YQSqbYkK)**
