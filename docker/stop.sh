#!/bin/bash
if [ $# -eq 1 ]
then 
    container=$1
    echo "found preset selection, skipping prompt..."
else
    docker ps
    read -p "Which container do you want to stop(container id / name): " container
fi

docker stop $container

docker ps -a