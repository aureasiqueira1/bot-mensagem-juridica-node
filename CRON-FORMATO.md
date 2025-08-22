# Formato Correto para Expressões Cron na Vercel

Para configurar corretamente o horário de envio das mensagens do bot, é importante seguir as limitações das expressões cron na Vercel.

## Formato Básico

Uma expressão cron possui 5 campos separados por espaço:

```
┌───────────── minuto (0 - 59)
│ ┌───────────── hora (0 - 23)
│ │ ┌───────────── dia do mês (1 - 31)
│ │ │ ┌───────────── mês (1 - 12)
│ │ │ │ ┌───────────── dia da semana (0 - 6) (Domingo para Sábado)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

## Limitações na Vercel

- **Não suporta expressões alternativas** como MON, SUN, JAN ou DEC
- **Não pode configurar simultaneamente** o dia do mês E dia da semana
  - Quando um tem valor específico, o outro deve ser `*`
- **O fuso horário é sempre UTC**
  - Para horário de Brasília (BRT), adicione 3 horas ao horário desejado

## Exemplos Válidos

| Expressão | Significado | Horário BRT |
|-----------|-------------|-------------|
| `0 9 * * *` | Todos os dias às 9:00 UTC | 6:00 |
| `0 13 * * *` | Todos os dias às 13:00 UTC | 10:00 |
| `30 17 * * *` | Todos os dias às 17:30 UTC | 14:30 |
| `0 21 * * 1-5` | Segunda a sexta às 21:00 UTC | 18:00 |
| `0 22 * * 1` | Toda segunda-feira às 22:00 UTC | 19:00 |
| `*/15 9-17 * * 1-5` | A cada 15 minutos, entre 9h e 17h, de segunda a sexta | 6h-14h |

## Exemplos Inválidos

| Expressão | Por que é inválido |
|-----------|-------------------|
| `0 9 15 * MON` | Usa `MON` e também configura dia do mês e semana |
| `0 9 * * MON-FRI` | Usa `MON-FRI` em vez de `1-5` |
| `0 9 * JAN *` | Usa `JAN` em vez de `1` |

## Verificadores de Expressões Cron

Para validar suas expressões cron, você pode usar:
- [Crontab Guru](https://crontab.guru/)
- [Ferramenta de validação da Vercel](https://vercel.com/docs/cron-jobs#validate-cron-expressions)

## Como Alterar o Horário no Projeto

Em nosso projeto, você pode definir o horário de envio de duas maneiras:

1. **Via variável de ambiente `BOT_SEND_TIME`** no dashboard da Vercel
   - Exemplo: `0 13 * * 1-5` para enviar às 10h BRT em dias úteis

2. **Diretamente no arquivo `vercel.json`**:
   ```json
   "schedule": "${BOT_SEND_TIME=0 13 * * 1-5}"
   ```

**Lembre-se sempre:** O horário é em UTC, então para converter para BRT (GMT-3), subtraia 3 horas do horário desejado.
