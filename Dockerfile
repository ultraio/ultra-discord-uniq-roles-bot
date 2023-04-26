FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci

# Bundle app source
COPY . .

# Expose express server port
EXPOSE 3000

# Healthcheck enabled to show container health/status in docker ps
HEALTHCHECK CMD curl --fail http://localhost:3000 || exit 1  

# start the service
CMD bash -c "npm run start -ws"