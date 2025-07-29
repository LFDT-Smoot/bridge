#!/bin/bash

deployFolder="$(pwd)/../"
jsCodeFolder="${deployFolder}/../../agent/"

cd ${deployFolder}

cp "${jsCodeFolder}/framework/config/config.json" "${deployFolder}/config/config.json"

rsync -av --exclude='.*' --exclude='node_modules/' --exclude='*.log' "${jsCodeFolder}"  "${deployFolder}/node_app/"

image='crossrouteagent.v2:latest'

sudo docker rmi "${image}" 2>/dev/null

sudo docker build -f Dockerfile -t ${image} .

