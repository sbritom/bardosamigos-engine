FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY server ./server
COPY config ./config

ENV RADIO_STREAM_ON_START=true
CMD ["npm", "run", "stream"]
