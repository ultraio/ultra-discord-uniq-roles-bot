FROM node:22-alpine3.22 AS build-env

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY src ./src

RUN npm ci && npm run build


FROM node:22-alpine3.22

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build-env --chown=node:node /app/dist ./dist

# Expose express server port
EXPOSE 3000

USER node

ENTRYPOINT [ "node", "dist/index.js" ]
