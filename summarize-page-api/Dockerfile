FROM node:24-alpine

WORKDIR /app

COPY . .

RUN npm ci --workspaces

WORKDIR /app/summarize-page-api

EXPOSE 3000

CMD ["npm", "start"]
