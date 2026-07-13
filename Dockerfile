FROM node:20-slim

WORKDIR /app

COPY server/package*.json ./server/
RUN cd server && npm install --production

COPY client/package*.json ./client/
RUN cd client && npm install

COPY admin/package*.json ./admin/
RUN cd admin && npm install

COPY . .

RUN cd client && npm run build
RUN cd admin && npm run build

WORKDIR /app/server

EXPOSE 3000

CMD ["node", "index.js"]
