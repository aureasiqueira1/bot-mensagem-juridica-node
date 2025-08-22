# Vercel Cron Job Configuration

Este documento explica como o cron job está configurado para o Bot de Mensagens Jurídicas. Esta é a configuração final e corrigida que **garante o funcionamento dos cron jobs na Vercel**.

## Configuração Correta e Testada

1. **Configuração do Endpoint**
   - O cron job chama o endpoint `/api/cron-trigger` diretamente
   - Mantemos também o endpoint `/send-message` para chamadas manuais
   - O handler do endpoint aceita métodos GET (necessário para cron jobs da Vercel)

2. **Configuração do Cronograma**
   - Cronograma definido como `30 21 * * *` (21:30 UTC todos os dias)
   - Isso corresponde a 18:30 BRT (UTC-3)
   - **Importante**: Vercel SEMPRE usa fuso horário UTC

3. **Configuração de Rotas**
   - Adicionada rota específica `/api/cron-trigger` para cron jobs
   - **CRÍTICO**: O caminho no cron DEVE corresponder exatamente ao padrão:
     ```json
     "path": "/api/cron-trigger"
     ```
   - **NÃO USE** apenas `/cron-trigger` ou `/send-message`

## Especificidades dos Cron Jobs da Vercel

- Cron jobs da Vercel **SEMPRE** usam **fuso horário UTC**
- Cron jobs enviam **requisições GET** (não POST)
- Cron jobs requerem configuração correta de rotas em `vercel.json`
- Os caminhos nas rotas e no cron job devem usar o formato `/api/[endpoint]`
- A Vercel não executa cron jobs exatamente no horário, pode haver alguns minutos de atraso

## Debugging

Adicionamos logs detalhados que aparecem no console da Vercel:

```javascript
// Logs para identificar problemas com cron jobs
console.log(`[DEBUG] Recebida requisição: ${method} ${url}`);
console.log(`[DEBUG] Pathname processado: ${pathname}`);
console.log('[VERCEL CRON] Cron job recebido em ' + new Date().toISOString());
```

## Solução de Problemas

Se o cron job não estiver funcionando:

1. **Verifique os logs no painel da Vercel** para confirmar tentativas de execução
2. **Certifique-se que o caminho no cron job está correto** - deve ser `/api/cron-trigger`
3. **Teste o endpoint manualmente** com uma requisição GET para `https://seu-app.vercel.app/api/cron-trigger`
4. **Verifique se todas as variáveis de ambiente** estão configuradas corretamente na Vercel
5. **Confirme que as rotas em vercel.json** estão corretamente configuradas

## Configuração Correta do vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/send-message",
      "dest": "/api/index.js"
    },
    {
      "src": "/api/cron-trigger",
      "dest": "/api/index.js"
    },
    {
      "src": "/send-message",
      "dest": "/api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/api/index.js"
    }
  ],
  "crons": [
    {
      "path": "/api/cron-trigger",
      "schedule": "30 21 * * *"
    }
  ]
}
```
