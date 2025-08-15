# Multi-stage build para otimização
FROM node:18-alpine AS builder

# Instalar dependências de build
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig.json ./

# Instalar todas as dependências (incluindo dev)
RUN npm ci

# Copiar código fonte
COPY src/ ./src/

# Build da aplicação
RUN npm run build

# Imagem de produção
FROM node:18-alpine AS production

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production && npm cache clean --force

# Copiar código compilado
COPY --from=builder /app/dist ./dist

# Criar diretório de logs
RUN mkdir -p logs && chown -R nodejs:nodejs /app

# Mudar para usuário não-root
USER nodejs

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { res.statusCode === 200 ? process.exit(0) : process.exit(1) })"

# Comando de inicialização
CMD ["node", "dist/index.js"]
