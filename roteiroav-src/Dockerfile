# Dockerfile para Next.js (Dojo Utilities)
FROM node:22-slim

WORKDIR /app

# Instala as dependências primeiro para aproveitar o cache do Docker
COPY package*.json ./
RUN npm install

# Copia o restante do código
COPY . .

# Faz o build do Next.js
RUN npm run build

# A porta que o Cloud Run exige é a 8080
ENV PORT=8080
EXPOSE 8080

# Inicia a aplicação
CMD ["npm", "start"]
