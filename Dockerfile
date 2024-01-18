FROM node:lts-alpine3.16 as build-env

WORKDIR /app

# Add required files
ADD src /app/src
ADD package.json /app/package.json
ADD package-lock.json /app/package-lock.json
ADD tsconfig.json /app/tsconfig.json

# Install app dependencies
RUN npm install
RUN npm run build


FROM node:lts-alpine3.16

WORKDIR /app
COPY --from=build-env /app/node_modules /app/node_modules
COPY --from=build-env /app/dist /app/dist

# Expose express server port
EXPOSE 3000

ENTRYPOINT [ "node", "dist/index.js" ]