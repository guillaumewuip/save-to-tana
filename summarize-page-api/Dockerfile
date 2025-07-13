FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

COPY fetcher/package.json ./fetcher/
COPY summarize-page-api/package.json ./summarize-page-api/

RUN npm ci --workspaces

RUN ls -all
RUN ls -all node_modules
RUN ls -all node_modules/fetcher

COPY summarize-page-api/ ./summarize-page-api/

WORKDIR /app/summarize-page-api

EXPOSE 3000

CMD ["npm", "start"]
