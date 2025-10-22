# Sincronizar Cursos do Notion

## 🚀 Método Rápido (Interface Web)

### Passo 1: Acessar a Interface de Admin

1. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

2. Acesse: `http://localhost:3000/admin/sync-notion`

### Passo 2: Copiar Conteúdo do Notion

1. Abra a página do Notion: [https://rich-ixia-528.notion.site/IN-CIO-181c2132576a80af830ec69cd14227cc](https://rich-ixia-528.notion.site/IN-CIO-181c2132576a80af830ec69cd14227cc)

2. **Selecione TODO o conteúdo** (Ctrl+A ou Cmd+A)

3. **Copie** (Ctrl+C ou Cmd+C)

4. **Cole na caixa de texto** da interface de admin

5. Clique em **"Processar Conteúdo"**

### Passo 3: Revisar e Baixar

1. Revise os cursos extraídos

2. Clique em **"Baixar courses-data.ts"**

3. Substitua o arquivo `lib/courses-data.ts` pelo arquivo baixado

4. Reinicie o servidor

---

## 🔧 Método Alternativo (Script Automático com API)

Se você tiver acesso à API do Notion:

### 1. Criar Integração no Notion

1. Acesse: https://www.notion.so/my-integrations
2. Clique em "+ Nova integração"
3. Dê um nome: "Sabedoria Escrituras Sync"
4. Copie o **Token de API**

### 2. Compartilhar Banco de Dados com a Integração

1. Abra sua página de cursos no Notion
2. Clique nos 3 pontos (...)
3. Em "Connections", adicione sua integração
4. Copie o **ID do banco de dados** da URL

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local`:

```env
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxx
```

### 4. Instalar Dependência

```bash
npm install @notionhq/client
```

### 5. Executar Script de Sincronização

```bash
npx tsx scripts/sync-notion.ts
```

---

## 📋 Formato Manual

Se preferir criar manualmente, use este formato no campo de texto:

```
PANORAMA DAS PARÁBOLAS DE JESUS
Análise completa das parábolas de Jesus Cristo, explorando seus significados profundos e aplicações práticas para a vida cristã moderna.
https://drive.google.com/file/d/1EbjfK--R591qRxg06HddKjr095qEZO6p/view
https://drive.google.com/file/d/1rG8tKuLNagv0RzqQtHsjWk3KHQDZ1irP/view

MAPAS MENTAIS: CARTAS PAULINAS
Compreenda as cartas de Paulo através de mapas mentais visuais que conectam temas, contextos e aplicações práticas.
https://drive.google.com/file/d/17a-ynVKmPunQovV1m-ISob5XiBOHEjNL/view
```

**Regras:**
- Título do curso em MAIÚSCULAS
- Descrição na linha seguinte
- URLs dos PDFs (Google Drive) nas linhas seguintes
- Linha em branco entre cursos

---

## 🎨 Estrutura Esperada do Notion

### Opção 1: Página com Blocos de Link

```
📚 Curso 1: Título do Curso
Descrição do curso aqui

🔗 https://drive.google.com/file/d/...
🔗 https://drive.google.com/file/d/...

📚 Curso 2: Outro Curso
Descrição do outro curso

🔗 https://drive.google.com/file/d/...
```

### Opção 2: Database com Propriedades

**Database "Cursos" com as seguintes propriedades:**

| Propriedade | Tipo | Descrição |
|------------|------|-----------|
| Título | Title | Nome do curso |
| Descrição | Rich Text | Descrição do curso |
| Autor | Rich Text | Autor do curso |
| Categoria | Select | Categoria do curso |
| Tempo de Leitura (min) | Number | Tempo estimado |
| Páginas | Number | Total de páginas |
| Cover URL | URL | URL da imagem de capa |

**Database "PDFs" (relacionada) com:**

| Propriedade | Tipo | Descrição |
|------------|------|-----------|
| Volume | Title | Ex: VOL-I, VOL-II |
| Título | Rich Text | Título do volume |
| URL PDF | URL | Link do Google Drive |
| Páginas | Number | Número de páginas |
| Tempo de Leitura (min) | Number | Tempo estimado |

---

## 🔍 Resolução de Problemas

### "Não consegui extrair cursos"

**Verifique:**
- O texto está no formato correto?
- Os títulos estão em MAIÚSCULAS?
- Os links do Google Drive estão completos?
- Há uma linha em branco entre cursos?

### "Links do Google Drive não funcionam"

**Certifique-se:**
- O link está no formato: `https://drive.google.com/file/d/FILE_ID/view`
- O arquivo está com compartilhamento público
- Permissões: "Qualquer pessoa com o link pode visualizar"

### "Erro ao processar JSON"

Se você tentou colar JSON diretamente:
- Certifique-se de que é um JSON válido
- Use um validador: https://jsonlint.com/

---

## 📊 Exemplo Completo

```
PANORAMA BÍBLICO - DESVENDANDO AS PARÁBOLAS DE JESUS
Análise completa das parábolas de Jesus Cristo, explorando seus significados profundos e aplicações práticas para a vida cristã moderna.
https://drive.google.com/file/d/1EbjfK--R591qRxg06HddKjr095qEZO6p/view
https://drive.google.com/file/d/1rG8tKuLNagv0RzqQtHsjWk3KHQDZ1irP/view
https://drive.google.com/file/d/1NgdwNoiKokSigHy_U36NqoTiuRHgUaMQ/view

MAPAS MENTAIS: CARTAS PAULINAS
Compreenda as cartas de Paulo através de mapas mentais visuais que conectam temas, contextos e aplicações práticas.
https://drive.google.com/file/d/17a-ynVKmPunQovV1m-ISob5XiBOHEjNL/view

OS 12 APÓSTOLOS DE JESUS
Conheça a vida, ministério e legado de cada um dos doze apóstolos com estudos biográficos detalhados.
https://drive.google.com/file/d/1apostolo1/view
https://drive.google.com/file/d/1apostolo2/view
```

Este exemplo gerará 3 cursos:
1. Com 3 volumes (PDFs)
2. Com 1 volume
3. Com 2 volumes

---

## 🎯 Próximos Passos

Após sincronizar:

1. **Teste os cursos**
   - Acesse http://localhost:3000
   - Verifique se todos os cursos aparecem
   - Teste os links dos PDFs

2. **Ajuste manualmente se necessário**
   - Edite `lib/courses-data.ts`
   - Adicione capas customizadas
   - Ajuste descrições

3. **Commit as mudanças**
   ```bash
   git add lib/courses-data.ts
   git commit -m "feat: sincroniza cursos do Notion"
   git push
   ```

4. **Deploy automático**
   - Vercel detectará as mudanças
   - Deploy automático em produção

---

## 💡 Dicas

- **Backup**: Sempre faça backup do `courses-data.ts` antes de sobrescrever
- **Validação**: Use a interface de preview para validar antes de baixar
- **Incrementa**: Você pode adicionar novos cursos manualmente ao arquivo
- **Imagens**: Customize as URLs das capas editando o arquivo gerado

---

## 🆘 Suporte

Se tiver problemas:

1. Verifique os logs no console do navegador
2. Tente o formato manual primeiro
3. Revise este guia passo a passo
4. Entre em contato com o suporte técnico
