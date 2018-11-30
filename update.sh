#!/bin/bash

NAME="meeting-room-board"

git fetch --all
git reset --hard $NAME/master
git pull $NAME master
