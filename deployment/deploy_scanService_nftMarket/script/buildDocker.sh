#!/bin/bash

deployFolder="$(pwd)/../"
jsCodeFolder="${deployFolder}/../../services/scanService_nftMarket/"

cd ${deployFolder}

rsync -av --exclude='.*' --exclude='node_modules/' --exclude='*.log' "${jsCodeFolder}"  "${deployFolder}/node_app/"

image='scan_service_nft.v1:latest'

sudo docker rmi "${image}" 2>/dev/null

sudo docker build -f Dockerfile -t ${image} .

