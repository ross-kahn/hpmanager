FROM node:alpine

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig*.json ./
COPY ./src ./src
RUN npm ci --quiet && npm run build

# Bundle app source
COPY . .
EXPOSE 3000
CMD ["node", "./dist/index.js"]