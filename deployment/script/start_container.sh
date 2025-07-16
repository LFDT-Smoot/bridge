#!/bin/bash

index=$1
toIndex=$2

script='./startAgent.sh'

# echo "./start_agent.sh.sh [agentaddr] [hostip] [index] [password] [keystore]"

for ((i=$index; i<=$toIndex; i++)); do
  if [ $i -gt 5 ];then
          echo "you should only have $toIndex agents"
          #exit;
  fi

  CRTDIR=$(pwd)
  cmd="sed -n "$i"p $HOME/Orel/StellarAgents/adds.txt"
  echo $cmd
  text=`$cmd`

  agentAddr=`echo $text | cut -d ' ' -f 2`
  echo "agentAddr is: " $agentAddr

  echo "start crossRoute $agentAddr"

  dbip='172.17.0.1'
  
  password="$HOME/Orel/StellarAgents/pwd.json"
  keystore="$HOME/Orel/StellarAgents/agent$i/keystore"
 
  startCmd="$script $agentAddr $dbip $i $password $keystore"

  echo $startCmd

  source $startCmd
 
  sleep 3

  echo "***************************************************************"
  echo ""
done

