FROM node:22-alpine

# Instalar curl para health checks
RUN apk add --no-cache curl

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm install

# Copiar resto do código
COPY . .

# Construir o frontend
RUN npm run build

# Expor a porta do servidor
EXPOSE 3000
EXPOSE 3001

# Iniciar o servidor backend
CMD ["node", "server.js"]
