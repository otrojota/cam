# docker build -f node14-ffmpeg.dockerfile -t docker.homejota.net/node14-ffmpeg:latest -t docker.homejota.net/node14-ffmpeg:0.8 .
# docker push docker.homejota.net/node14-ffmpeg:latest

FROM node:14-alpine

RUN apk add  --no-cache ffmpeg