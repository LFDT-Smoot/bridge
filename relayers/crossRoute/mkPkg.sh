#!/bin/bash

export NODE_OPTIONS="--max-old-space-size=4192"

pkg -t linux -o agent-linux .

cp agent-linux ../deploy/bin/
