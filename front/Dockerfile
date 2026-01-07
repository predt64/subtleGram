FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

ENV PORT=3000
EXPOSE 3000

# запуск с доступом по сети (--host) и указанием порта (--port)
CMD ["npm", "run", "preview", "--", "--host", "--port", "3000"]
