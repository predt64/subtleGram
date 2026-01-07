FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
# т.к. в package.json есть prepare, прописываем --ignore-scripts
RUN npm install --ignore-scripts
COPY . .
RUN npm run build
ENV PORT=3001
EXPOSE 3001
CMD ["npm", "start"]