#!/bin/bash
options=("development" "staging" "production" "quit")

selection="${options[0]}"

if [ $# -eq 1 ]
then 
    selection=$1
    echo "found preset selection: $1, skipping prompt..."
else 
    PS3="Please set your target build choice(default: ${selection}): "

    select env in "${options[@]}"
    do
        case $env in
            "${options[0]}")
                selection=${options[0]}
                echo "build target is set to ${options[0]}"
                PS3="Please set your target build choice(current: ${selection}): "
                ;;
            "${options[1]}")
                selection=${options[1]}
                echo "build target is set to ${options[1]}"
                PS3="Please set your target build choice(current: ${selection}): "
                ;;
            "${options[2]}")
                selection=${options[2]}
                echo "build target is set to ${options[2]}"
                PS3="Please set your target build choice(current: ${selection}): "
                ;;
            "${options[3]}")
                break
                ;;
            *) echo "invalid option $REPLY";;
        esac
    done
fi

echo "Running ${selection} build script..."

dir=$( dirname -- "$( readlink -f -- "$0"; )"; )

cd $dir

cd ..

echo "working directory: $(pwd)"

echo "Running docker build..."

docker build . -t "chto:${selection}" -f "docker/Dockerfile.${selection}"

echo "Removing unused images..."

docker image prune -f