#!/bin/bash

if [ ! -d app ]; then
  echo "Error: please execute this script from the root of the project"
  exit 1
fi

pushd app && yarn build:prod && popd
