# docker build -t otrojota/cam:latest -t otrojota/cam:0.30 .
# docker push otrojota/cam:latest

FROM node:14-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production

COPY . .
CMD ["node", "index"]