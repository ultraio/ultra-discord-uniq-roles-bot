FROM node:lts-alpine3.16 as build-env

WORKDIR /app

# Add required files
ADD packages /app/packages
ADD package.json /app/package.json
ADD package-lock.json /app/package-lock.json

# Install app dependencies
RUN npm install
RUN npm run build -ws


FROM node:lts-alpine3.16

WORKDIR /app
COPY --from=build-env /app/node_modules /app/node_modules
COPY --from=build-env /app/packages/server/dist /app/dist

# Expose express server port
EXPOSE 3000

ENTRYPOINT [ "node", "dist/index.js" ]