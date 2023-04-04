FROM node:14

ENV BOT_TOKEN=$BOT_TOKEN \
    HOST_ID=$HOST_ID

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "start"]