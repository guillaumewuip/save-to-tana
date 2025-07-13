FROM node:24-alpine

WORKDIR /app

COPY package-lock.json ./
COPY **/package.json ./*/

RUN npm ci --workspaces

COPY . .

WORKDIR /app/summarize-page-api

EXPOSE 3000

CMD ["npm", "start"]
