FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

COPY summarize-page-api/package*.json ./summarize-page-api/

RUN npm ci --workspaces

COPY summarize-page-api/ ./summarize-page-api/

WORKDIR /app/summarize-page-api

EXPOSE 3000

CMD ["npm", "start"]
