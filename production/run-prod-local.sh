#!/bin/bash

while getopts ":i" opt; do
  case "${opt}" in
    i)
      IMPORT_COLLECTIONS=1
      ;;
    :)
      echo "ERROR: Option -$OPTARG requires an argument"
      exit 1
      ;;
    \?)
      echo "ERROR: Invalid option -$OPTARG"
      exit 1
      ;;
  esac
done
shift $((OPTIND-1))

if [ ! -d backend ]; then
  echo "Error: please execute this script from the root of the project"
  exit 1
fi

if [ -n "${IMPORT_COLLECTIONS}" ]; then
  #
  # Default running will NOT import
  #
  KEEP_COLLECTIONS=true
else
  #
  # Only with -i will import take place
  #
  KEEP_COLLECTIONS=false
fi

if [ ! -d app/build ]; then
  echo "Error: No app build directory detected. Have you run compile-app yet?"
  exit 1
fi

if [ ! "$(ls -A app/build)" ]; then
  echo "Error: No app build detected. Have you run compile-app yet?"
  exit 1
fi

export DROP_COLLECTIONS=${KEEP_COLLECTIONS}
export IMPORT_DB=${KEEP_COLLECTIONS}
export NODE_ENV=production
export MONGODB_URI=mongodb://localhost/evotempus

node backend/src/server.js
