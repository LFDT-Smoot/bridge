# Copyright (c) 2019 Wanchain. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

FROM node:20

COPY node_app /app/node_app/

RUN npm install -g npm@latest

RUN cd /app/node_app/ && \
    npm install --omit=dev

WORKDIR /app

RUN npm install -g pm2
RUN pm2 install pm2-logrotate

RUN pm2 set pm2-logrotate:max_size 200M \
    && pm2 set pm2-logrotate:retain 7 \
    && pm2 set pm2-logrotate:compress true

RUN apt-get update
RUN apt-get install vim -y

EXPOSE 9001

WORKDIR /app

CMD nohup sh -c 'pm2-runtime start app_pm2.json'
