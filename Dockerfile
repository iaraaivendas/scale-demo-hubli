FROM node:20-alpine

WORKDIR /app

# Copia dependências e instala
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copia backend
COPY backend/src ./src

# Copia frontend buildado
COPY backend/public ./public

# Copia dados mock e agentes
COPY mock-data ./mock-data
COPY agents ./agents

# Instala dependências dos agentes se existir package.json
RUN if [ -f agents/package.json ]; then cd agents && npm install --omit=dev; fi

# Copia .env se existir (variáveis de ambiente)
COPY backend/.env* ./

EXPOSE 3000

CMD ["node", "src/server.js"]
