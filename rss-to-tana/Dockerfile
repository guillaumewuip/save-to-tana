FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

COPY rss-to-tana/package*.json ./rss-to-tana/
COPY summarize-page/package*.json ./summarize-page/

RUN npm ci --workspaces

COPY rss-to-tana/ ./rss-to-tana/
COPY summarize-page/ ./summarize-page/

WORKDIR /app/rss-to-tana

EXPOSE 8080

CMD ["npm", "start"]