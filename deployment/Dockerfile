# Copyright (c) 2019 Wanchain. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

FROM node:16

COPY ./node_app/ /agent/node_app/
COPY ./config/ /agent/config/

RUN cd /agent/node_app/ && \
    npm install --omit=dev

WORKDIR /agent

RUN npm install -g pm2
RUN pm2 install pm2-logrotate

RUN pm2 set pm2-logrotate:max_size 200M \
    && pm2 set pm2-logrotate:retain 7 \
    && pm2 set pm2-logrotate:compress true

RUN apt-get update
RUN apt-get install vim -y

EXPOSE 1000

WORKDIR /agent

CMD nohup sh -c 'pm2-runtime start agent_pm2.json'
