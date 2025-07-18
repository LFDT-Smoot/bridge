#!/bin/bash

function use() {
  echo "================================================"
  echo "USAGE:"
  echo "./start_agent.sh.sh [agentaddr] [hostip] [index] [password] [keystore]"
  echo " e.g.: $0 172.17.0.1"
  echo "================================================"
}

if [[ $# -gt 9 ]] || [[ $# -eq 0 ]]; then
  use
  exit
fi

echo "$@"

agentaddr=$1

echo "================================================"
echo "agent-"$agentaddr
echo "Start as a crossRoute agent"
echo "================================================"

index=$3

# loglevel, debug as default
loglevel='debug'

# stormanAgent docker image
image='crossrouteagent.v2:latest'
echo '*********** use docker image ***********:  '$image

# container name
container="crossRoute_"$index
echo '*********** use container name ***********:  '$container

#db config. dbip should be host docker IP
# INT="docker0"
# dbip=$(ifconfig $INT | grep "inet" | grep -v inet6 | awk '{ print $2}')
dbip=$2
#dbip='172.17.0.1'
dbport=27017
echo '*********** use db config ***********:  '$dbip":"$dbport

password=$4
keystore=$5

if [[ $index -eq 1 ]];then
  echo "index 1 should be leader, index is $index, agentaddr is $agentaddr"
  agentPm2Json='
  {
    "apps" : [{
      "name"       : "crossRouteAgent",
      "script"      : "index.js",
      "cwd"         : "/agent/node_app/",
      "args"        : "-i '$index' --loglevel '$loglevel' --leader --testnet --agentaddr '$agentaddr' --password /agent/pwd.json --keystore /agent/keystore/ --dbip '$dbip' --dbport '$dbport'",
      "log_date_format"  : "YYYY-MM-DD HH:mm Z",
      "env": {}
    }]
  }
  '
else
  agentPm2Json='
  {
    "apps" : [{
      "name"       : "crossRouteAgent",
      "script"      : "index.js",
      "cwd"         : "/agent/node_app/",
      "args"        : "-i '$index' --loglevel '$loglevel' --testnet --agentaddr '$agentaddr' --password /agent/pwd.json --keystore /agent/keystore/ --dbip '$dbip' --dbport '$dbport'",
      "log_date_format"  : "YYYY-MM-DD HH:mm Z",
      "env": {}
    }]
  }
  '
fi

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
pm2ScriptPath="$HOME/deploy/agents/agent$index"
echo "${agentPm2Json}"
echo $agentPm2Json > $pm2ScriptPath/agent_pm2.json

remove_container $container

appCodePath="$(pwd)/../node_app"
echo "(mount) code source path: ${appCodePath}"
echo "(mount) keystore path: ${keystore}"

sudo docker run --log-opt max-size=10m --log-opt max-file=50 \
--name $container \
-v $password:/agent/pwd.json \
-v $keystore:/agent/keystore \
-v $pm2ScriptPath/agent_pm2.json:/agent/agent_pm2.json \
-d --restart=always $image

