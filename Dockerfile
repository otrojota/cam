# docker build -t otrojota/cam:latest -t otrojota/cam:0.33 .
# docker push otrojota/cam:latest

FROM docker.homejota.net/node14-ffmpeg
EXPOSE 8079
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production

COPY . .
CMD ["node", "index"]