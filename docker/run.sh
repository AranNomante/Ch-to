#!/bin/bash
dir=$( dirname -- "$( readlink -f -- "$0"; )"; )

cd $dir

cd ..

if [ $# -eq 1 ]
then 
    image=$1
    echo "found preset selection, skipping prompt..."
else
    docker image list
    read -p "Which image do you want to use(repository:tag): " image
fi

case $image in
    "chto:development")
        docker stop chto-development
        docker run -dp 3000:3000 --name chto-development -v "$(pwd):/Ch-to" -v /Ch-to/node_modules --rm chto:development
        docker ps -a
        ;;
    "chto:staging")
        docker stop chto-staging
        docker run -dp 3000:3000 --name chto-staging --rm chto:staging
        docker ps -a
        ;;
    "chto:production")
        docker stop chto-production
        docker run -dp 3000:3000 --name chto-production --rm chto:production
        docker ps -a
        ;;
    *) echo "invalid option $REPLY";;
esac