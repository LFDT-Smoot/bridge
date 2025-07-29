#!/bin/bash

function use() {
  echo "================================================"
  echo "USAGE:"
  echo "./$0"
  echo "================================================"
}

if [[ $# -gt 1 ]]; then
  use
  exit
fi

echo "$@"

echo "================================================"
echo "Start as a scanChainServiceNft"
echo "================================================"

# loglevel, debug as default
loglevel='debug'

# scanChainServiceNft docker image
image='scan_service_nft.v1:latest'
echo '*********** use docker image ***********:  '$image

# container name
container="scanChainServiceNft"
echo '*********** use container name ***********:  '$container

dbip='172.17.0.1'
dbport=27017

appPm2Json='
  {
    "apps" : [{
      "name"       : "scanChainServiceNft",
      "script"      : "src/startScanChainService.js",
      "cwd"         : "/app/node_app/",
      "args"        : "--dbip '$dbip' --dbport '$dbport'",
      "log_date_format"  : "YYYY-MM-DD HH:mm Z",
      "env": {}
    }]
  }
  '

# Function to stop and remove the Docker container
remove_container() {
    local container_name="$1"

    # Check if the container exists
    if ! sudo docker inspect "$container_name" &>/dev/null; then
        return 0 # Exit successfully as there's nothing to remove
    fi

    # Check if the container is running
    if sudo docker ps -q --filter "name=$container_name" | grep -q .; then
        echo "Container '$container_name' is running. Attempting to stop..."
        if sudo docker stop "$container_name"; then
            echo "Stopped container: $container_name"
        else
            echo "Failed to stop container: $container_name"
            return 1 # Changed from exit 1 to return 1
        fi
    else
        echo "Container '$container_name' is not running. Proceeding to remove."
    fi

    # Remove the container
    if sudo docker rm "$container_name"; then
        echo "Removed container: $container_name"
        return 0 # Indicate success
    else
        echo "Failed to remove container: $container_name"
        return 1 # Changed from exit 1 to return 1
    fi
}

# Example usage of the remove_container() function:
# If you want to handle the return status in your main script:
# remove_container "my_container_1"
# if [ $? -ne 0 ]; then
#     echo "Error handling for my_container_1 removal."
# fi
# remove_container "my_container_2"

CRTDIR=$(pwd)
pm2ScriptPath="$(pwd)/../config"
echo "${appPm2Json}"
echo $appPm2Json > $pm2ScriptPath/app_pm2.json

remove_container $container

appCodePath="$(pwd)/../node_app"
echo "(mount) code source path: ${appCodePath}"

sudo docker run --log-opt max-size=10m --log-opt max-file=50 \
-p 9001:9001 \
--name $container \
-v $pm2ScriptPath/app_pm2.json:/app/app_pm2.json \
-d --restart=always $image

