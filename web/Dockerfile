FROM node:16.9.0-alpine
WORKDIR /web
COPY package.json index.js /web/
RUN npm install
COPY . . /web/
CMD ["node", "index.js"]