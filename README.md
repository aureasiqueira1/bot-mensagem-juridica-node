# 🤖 AI Content Bot - Jurídico & Tech

API Node.js com TypeScript que gera e envia automaticamente conteúdo criativo mesclando temas jurídicos com tecnologia para o Microsoft Teams.

## 🚀 Características

- **Geração Inteligente**: Utiliza OpenAI para criar conteúdo único e criativo
- **Anti-Duplicação**: Sistema robusto para evitar repetição de mensagens
- **Agendamento Automático**: Envio diário no horário configurado
- **Armazenamento Persistente**: Histórico completo no Supabase
- **Integração Teams**: Envio direto via Power Automate
- **Clean Architecture**: Código modular e bem organizado

## 📁 Estrutura do Projeto

```
src/
├── content-generator/          # Geração de conteúdo via IA
│   └── AIContentGenerator.ts
├── scheduler/                  # Agendamento e orquestração
│   └── BotScheduler.ts
├── senders/                   # Integrações com canais
│   └── TeamsSender.ts
├── storage/                   # Comunicação com banco
│   └── SupabaseStorage.ts
├── types/                     # Definições TypeScript
│   └── index.ts
├── utils/                     # Utilitários
│   └── Logger.ts
└── index.ts                   # Ponto de entrada
```

## 🛠 Pré-requisitos

1. **Node.js** 18+
2. **Conta Supabase** (gratuita)
3. **Microsoft Teams** com Power Automate
4. **OpenAI API Key** para geração de conteúdo

## ⚡ Instalação Rápida

### 1. Clone e instale dependências

```bash
git clone <repositorio>
cd ai-content-bot
npm install
```

### 2. Configure o ambiente

```bash
cp .env.example .env
# Edite o .env com suas credenciais
```

### 3. Configure o Supabase

Execute o SQL do arquivo `database-schema.sql` no painel do Supabase:

```sql
-- Criar tabela de mensagens
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    style VARCHAR(20) NOT NULL,
    topic VARCHAR(30) NOT NULL,
    hash VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE
);
```

### 4. Execute o projeto

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## 🔧 Configuração

### Variáveis de Ambiente (.env)

| Variável                        | Descrição                 | Exemplo                     |
| ------------------------------- | ------------------------- | --------------------------- |
| `BOT_SEND_TIME`                 | Horário de envio (HH:MM)  | `09:00`                     |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL do projeto Supabase   | `https://xyz.supabase.co`   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase | `eyJ...`                    |
| `POWER_AUTOMATE_URL`            | Webhook do Power Automate | `https://prod-97.westus...` |
| `OPENAI_API_KEY`                | Chave da API OpenAI       | `sk-...`                    |

### Configuração do Microsoft Teams

1. **Crie um Flow no Power Automate**:

   - Trigger: "When a HTTP request is received"
   - Action: "Post message in a chat or channel"

2. **Configure o webhook**:
   - Copie a URL gerada e cole em `POWER_AUTOMATE_URL`

## 🎯 Funcionalidades

### Estilos de Mensagem

- **Humor**: Piadas leves sobre direito e tecnologia
- **Curiosidade**: Fatos interessantes sobre legal tech
- **Dicas**: Conselhos práticos de compliance e desenvolvimento
- **Reflexão**: Provocações sobre futuro do direito digital

### Tópicos Abordados

- **Legal Tech**: Inovações jurídicas
- **Development**: Desenvolvimento com aspectos legais
- **Project Management**: Gestão de projetos + compliance
- **Agile**: Metodologias ágeis + processos legais
- **Mixed**: Combinação livre dos temas

## 📊 Endpoints da API

### GET `/health`

Verifica se o serviço está funcionando

```json
{
  "status": "OK",
  "timestamp": "2025-01-15T12:00:00.000Z",
  "service": "AI Content Bot"
}
```

### GET `/status`

Status detalhado do sistema

```json
{
  "status": "running",
  "scheduler": "active",
  "nextExecution": "quinta-feira, 16 de janeiro de 2025 às 09:00"
}
```

### POST `/send-message`

Envia mensagem manualmente (para testes)

```json
{
  "success": true,
  "message": "Mensagem enviada com sucesso!"
}
```

## 🧪 Testes

### Teste Manual

```bash
# Envia mensagem de teste
curl -X POST http://localhost:3000/send-message
```

### Teste de Conexão Teams

O sistema testa automaticamente a conexão com Teams na inicialização.

## 📝 Logs

O sistema gera logs detalhados:

```
[2025-01-15T09:00:00.000Z] [INFO] 🤖 Iniciando execução do bot...
[2025-01-15T09:00:01.250Z] [SUCCESS] Conteúdo gerado com sucesso
[2025-01-15T09:00:02.100Z] [SUCCESS] Mensagem salva no Supabase
[2025-01-15T09:00:03.850Z] [SUCCESS] Mensagem enviada para Teams com sucesso!
[2025-01-15T09:00:03.900Z] [SUCCESS] ✅ Bot executado com sucesso em 3900ms
```

## 🔄 Como Funciona

1. **Agendamento**: Cron job executa diariamente no horário configurado
2. **Geração**: IA cria conteúdo baseado em estilo/tópico aleatórios
3. **Verificação**: Sistema verifica se conteúdo não é duplicata
4. **Armazenamento**: Salva mensagem no Supabase com hash único
5. **Envio**: Envia para Teams via Power Automate
6. **Confirmação**: Marca mensagem como enviada no banco

## 🛡 Prevenção de Duplicatas

- **Hash SHA-256** do conteúdo normalizado
- **Histórico persistente** no Supabase
- **Contexto de mensagens anteriores** para a IA
- **Retry automático** se conteúdo duplicado for gerado

## 🚨 Tratamento de Erros

- **Retry automático** em falhas temporárias
- **Logs detalhados** para debugging
- **Fallback** em caso de falha na IA
- **Monitoramento** de conectividade

## 📈 Monitoramento

### Estatísticas Disponíveis

- Total de mensagens geradas
- Mensagens enviadas vs. pendentes
- Distribuição por estilo e tópico
- Primeira e última mensagem
- Tempo de atividade do sistema

### Query SQL para Estatísticas

```sql
SELECT * FROM public.message_stats;
```

## 🔧 Manutenção

### Limpeza de Mensagens Antigas

```sql
SELECT public.cleanup_old_messages();
```

### Backup do Banco

```bash
# Via Supabase CLI
supabase db dump --local > backup.sql
```

## 🚀 Deploy em Produção

### Heroku

```bash
# Instalar Heroku CLI
heroku create ai-content-bot
heroku config:set BOT_SEND_TIME=09:00
heroku config:set OPENAI_API_KEY=sk-...
# ... outras variáveis
git push heroku main
```

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Build e run
docker build -t ai-content-bot .
docker run -d --env-file .env -p 3000:3000 ai-content-bot
```

### Railway

```bash
# Deploy direto do GitHub
railway login
railway link
railway up
```

## 🧰 Scripts Úteis

### package.json - Scripts Adicionais

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "clean": "rm -rf dist",
    "typecheck": "tsc --noEmit",
    "db:migrate": "node scripts/migrate.js",
    "db:seed": "node scripts/seed.js"
  }
}
```

### Script de Migração (scripts/migrate.js)

```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

async function runMigration() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const sql = fs.readFileSync('./database-schema.sql', 'utf8');
  console.log('🔄 Executando migração...');

  // Note: Para execução real, use a service key do Supabase
  console.log('Execute manualmente no dashboard do Supabase:');
  console.log(sql);
}

runMigration();
```

## 🎨 Personalização

### Adicionando Novos Estilos

1. Edite `src/types/index.ts`:

```typescript
export enum MessageStyle {
  HUMOR = 'humor',
  CURIOSITY = 'curiosity',
  TIP = 'tip',
  REFLECTION = 'reflection',
  NEWS = 'news', // Novo estilo
  TUTORIAL = 'tutorial', // Novo estilo
}
```

2. Atualize o gerador em `AIContentGenerator.ts`:

```typescript
const styleInstructions = {
  // ... estilos existentes
  [MessageStyle.NEWS]: 'Compartilhe notícias relevantes sobre legal tech.',
  [MessageStyle.TUTORIAL]: 'Crie tutoriais rápidos sobre compliance ou desenvolvimento.',
};
```

3. Atualize o schema do banco:

```sql
ALTER TABLE public.messages
DROP CONSTRAINT messages_style_check;

ALTER TABLE public.messages
ADD CONSTRAINT messages_style_check
CHECK (style IN ('humor', 'curiosity', 'tip', 'reflection', 'news', 'tutorial'));
```

### Configurando Múltiplos Canais

```typescript
// src/senders/MultiChannelSender.ts
export class MultiChannelSender {
  private teamsSender: TeamsSender;
  private slackSender: SlackSender; // Implementar se necessário

  async sendToAllChannels(content: string): Promise<boolean> {
    const results = await Promise.allSettled([
      this.teamsSender.sendMessage(content),
      // this.slackSender.sendMessage(content)
    ]);

    return results.some(result => result.status === 'fulfilled' && result.value === true);
  }
}
```

## 🔍 Debugging

### Logs Detalhados

Para debugging, configure:

```bash
NODE_ENV=development
```

### Teste Individual de Componentes

```typescript
// scripts/test-components.ts
import { AIContentGenerator } from '../src/content-generator/AIContentGenerator';
import { SupabaseStorage } from '../src/storage/SupabaseStorage';

async function testComponents() {
  // Teste geração de conteúdo
  const generator = new AIContentGenerator();
  const message = await generator.generateRandomMessage();
  console.log('Mensagem gerada:', message);

  // Teste storage
  const storage = new SupabaseStorage();
  await storage.initialize();
  const stats = await storage.getMessageStats();
  console.log('Stats:', stats);
}
```

### Troubleshooting Comum

#### Erro: "Credenciais do Supabase não encontradas"

```bash
# Verifique se as variáveis estão corretas
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

#### Erro: "Falha no teste de conexão com Teams"

1. Verifique se o Power Automate Flow está ativo
2. Teste manualmente a URL do webhook
3. Verifique se não há firewall bloqueando

#### Erro: "OpenAI API rate limit"

```typescript
// Adicione delay entre tentativas
private async delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

## 📊 Monitoramento Avançado

### Métricas Customizadas

```typescript
// src/utils/Metrics.ts
export class MetricsCollector {
  static async collectMetrics() {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      timestamp: new Date().toISOString(),
    };
  }
}
```

### Health Check Avançado

```typescript
// Adicionar ao index.ts
app.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'OK',
    components: {
      database: await testSupabaseConnection(),
      teams: await testTeamsConnection(),
      openai: await testOpenAIConnection(),
      scheduler: BotScheduler.isRunning(),
    },
    metrics: await MetricsCollector.collectMetrics(),
  };

  const allHealthy = Object.values(health.components).every(Boolean);
  res.status(allHealthy ? 200 : 503).json(health);
});
```

## 🔐 Segurança

### Variáveis Sensíveis

- Nunca commite arquivos `.env`
- Use secrets do seu provedor de cloud
- Rotacione APIs keys regularmente

### Rate Limiting

```typescript
// src/middleware/RateLimit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por janela
  message: 'Muitas tentativas, tente novamente em 15 minutos',
});
```

### CORS

```typescript
// Para APIs públicas, configure CORS adequadamente
import cors from 'cors';

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  })
);
```

## 🚀 Roadmap

### Próximas Features

- [ ] Interface web para gerenciamento
- [ ] Múltiplos canais (Slack, Discord, etc.)
- [ ] Templates de mensagem customizáveis
- [ ] Analytics avançados
- [ ] Integração com calendário para contexto
- [ ] A/B testing de estilos de mensagem
- [ ] API para webhooks externos
- [ ] Dashboard de monitoramento

### Melhorias Técnicas

- [ ] Cache Redis para performance
- [ ] Queue system para processos assíncronos
- [ ] Testes unitários e de integração
- [ ] CI/CD pipeline
- [ ] Containerização completa
- [ ] Monitoramento com Prometheus
- [ ] Alertas via PagerDuty/Slack

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙋‍♂️ Suporte

- 📧 Email: seuemail@exemplo.com
- 💬 Issues: [GitHub Issues](link-para-issues)
- 📚 Wiki: [Documentação Completa](link-para-wiki)

---

**Feito com ❤️ para a comunidade jurídico-tech brasileira**
