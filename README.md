# 🤖 Bot Criativo para Microsoft Teams

> Bot automatizado que envia mensagens criativas e bem-humoradas para Microsoft Teams em dias úteis, mantendo a equipe engajada e motivada.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-orange.svg)](https://openai.com/)

## 🎯 **Funcionalidades**

- ⏰ **Agendamento Inteligente**: Envia mensagens apenas em dias úteis (segunda a sexta)
- 🎨 **Conteúdo Criativo**: IA gera mensagens únicas e envolventes sobre tecnologia
- 😄 **4 Estilos**: Humor, curiosidades, dicas práticas e reflexões
- 🚫 **Anti-Repetição**: Sistema avançado para evitar conteúdo duplicado
- 📊 **Analytics**: Estatísticas de engajamento e diversidade de conteúdo
- 🔄 **Failsafe**: Mensagens de fallback em caso de erro
- 🎭 **Contextual**: Adapta tom e tema baseado no dia da semana

## 📋 **Pré-requisitos**

- Node.js 18+
- NPM ou Yarn
- Conta OpenAI com API Key
- Conta Supabase (PostgreSQL)
- Microsoft Teams com Power Automate configurado

## 🚀 **Instalação e Configuração**

### 1. Clone o Repositório

```bash
git clone <seu-repositorio>
cd creative-teams-bot
npm install
```

### 2. Configure as Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```bash
# Configurações Básicas
BOT_SEND_TIME=09:30
NODE_ENV=development
WORKDAYS_ONLY=true

# OpenAI (Obrigatório)
OPENAI_API_KEY=sk-proj-sua-chave-aqui

# Supabase (Obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica-aqui

# Microsoft Teams (Obrigatório)
POWER_AUTOMATE_URL=https://prod-xx.westus.logic.azure.com/workflows/...

# Opcionais
CREATIVITY_LEVEL=creative
MAX_MESSAGE_LENGTH=200
```

### 3. Configure o Banco de Dados

Execute o SQL no painel do Supabase:

```sql
-- Copie e execute o conteúdo de database-schema.sql
```

### 4. Configure o Power Automate

1. No Teams, vá em **Apps** → **Power Automate**
2. Crie um novo flow:
   - **Trigger**: "When a HTTP request is received"
   - **Action**: "Post message in a chat or channel"
3. Copie a URL do webhook para `POWER_AUTOMATE_URL`

## 🏃‍♂️ **Como Usar**

### Desenvolvimento Local

```bash
# Iniciar em modo desenvolvimento
npm run dev

# Testar envio manual
curl -X POST http://localhost:3000/send-message

# Verificar status
curl http://localhost:3000/status
```

### Produção

```bash
# Build do projeto
npm run build

# Iniciar em produção
npm start
```

## 📊 **API Endpoints**

### Principais

- `GET /health` - Status do sistema
- `GET /status` - Informações detalhadas do bot
- `POST /send-message` - Envio manual de mensagem
- `GET /analytics` - Estatísticas detalhadas

### Analytics

- `GET /messages/recent` - Mensagens recentes
- `PATCH /messages/:id/effectiveness` - Atualizar efetividade

## 🎨 **Tipos de Conteúdo**

### Estilos de Mensagem

- **Humor** 😄 - Piadas inteligentes sobre tecnologia
- **Curiosidades** 🤓 - Fatos interessantes sobre tech
- **Dicas** 💡 - Conselhos práticos com humor
- **Reflexões** 🤔 - Provocações sobre futuro da tecnologia

### Tópicos Abordados

- **Tech Humor** - Humor sobre programação e tecnologia
- **Dev Life** - Situações da vida de desenvolvedor
- **Code Wisdom** - Sabedoria sobre programação
- **Tech Facts** - Curiosidades fascinantes
- **Legal Tech** - Direito digital e compliance (opcional)

## 📅 **Agendamento**

O bot funciona automaticamente:

- **Segunda**: Mensagens motivacionais para começar a semana
- **Terça/Quarta**: Conteúdo técnico e educativo
- **Quinta**: Reflexões e inspiração para reta final
- **Sexta**: Humor para celebrar o fim de semana

**Horário padrão**: 09:30 (configurável via `BOT_SEND_TIME`)

## 🚀 **Deploy**

### Vercel (Recomendado)

```bash
# Instalar CLI
npm install -g vercel

# Deploy
vercel

# Configurar environment variables na dashboard
```

### Docker

```bash
# Build da imagem
docker build -t creative-teams-bot .

# Executar container
docker run -p 3000:3000 --env-file .env creative-teams-bot
```

### Servidor VPS

```bash
# Com PM2
npm install -g pm2
pm2 start dist/index.js --name "teams-bot"
pm2 save
pm2 startup
```

## 🛠️ **Desenvolvimento**

### Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento com hot reload
npm run build        # Build para produção
npm run start        # Executar versão de produção
npm run lint         # Verificar código
npm test             # Executar testes
npm run send-test    # Testar envio manual
```

### Estrutura do Projeto

```
src/
├── content-generator/    # Geração de conteúdo IA
├── scheduler/           # Agendamento e execução
├── senders/            # Envio para Teams
├── storage/            # Persistência no Supabase
├── types/              # Definições TypeScript
└── utils/              # Utilitários e logger
```

## 🔧 **Troubleshooting**

### Problemas Comuns

**Bot não envia mensagens:**

```bash
# Verificar logs
npm run dev

# Testar conexões
curl -X POST http://localhost:3000/test-connection
```

**Erro de banco de dados:**

```bash
# Verificar variáveis Supabase
echo $NEXT_PUBLIC_SUPABASE_URL

# Testar query manual no Supabase
```

**Mensagens repetitivas:**

- Sistema anti-duplicação está ativo
- Verifique logs para detecção de similaridade
- Ajuste `SIMILARITY_THRESHOLD` se necessário

### Logs Úteis

```bash
# Verificar próxima execução
curl http://localhost:3000/status

# Ver estatísticas
curl http://localhost:3000/analytics

# Mensagens recentes
curl http://localhost:3000/messages/recent
```

## 📈 **Monitoramento**

### Métricas Importantes

- Taxa de mensagens enviadas com sucesso
- Diversidade de conteúdo (estilos/tópicos)
- Detecção de duplicatas
- Tempo de resposta da IA

### Dashboard

Acesse `http://localhost:3000/analytics` para ver:

- Estatísticas de uso
- Distribuição por dia da semana
- Efetividade das mensagens
- Insights para melhorias

## 🤝 **Contribuindo**

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'feat: nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📄 **Licença**

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 **Suporte**

- **Issues**: Abra uma issue no GitHub
- **Documentação**: Veja a wiki do projeto
- **Contato**: [seu-email@exemplo.com]

## 📚 **Recursos Adicionais**

- [Documentação OpenAI](https://platform.openai.com/docs)
- [Documentação Supabase](https://supabase.com/docs)
- [Power Automate](https://docs.microsoft.com/power-automate/)
- [Node-cron](https://www.npmjs.com/package/node-cron)

---

## 🎉 **Exemplos de Mensagens**

### Segunda-feira

> 💻 Bom dia, galera tech! Por que os programadores preferem modo escuro? Porque a luz atrai bugs! 🐛

### Terça-feira

> 🔍 Você sabia que Git foi criado em apenas 10 dias? Linus Torvalds literalmente inventou o controle de versão mais usado do mundo num fim de semana! 🤯

### Quarta-feira

> 💡 Dica rápida: Dark mode + café vai economizar 2 horas do seu debugging diário! ⚡

### Quinta-feira

> 🤔 E se CSS finalmente fizesse sentido? Como isso mudaria o universo da programação? 🔮

### Sexta-feira

> 🎉 Deploy na sexta? Só se você gosta de adrenalina no fim de semana! 😱

---

**Desenvolvido com ❤️ para manter as equipes tech motivadas!** 🚀
