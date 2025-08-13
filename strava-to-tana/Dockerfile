FROM node:24-alpine

WORKDIR /app

COPY . .

RUN npm ci --workspaces

WORKDIR /app/strava-to-tana

CMD ["npm", "start"]
