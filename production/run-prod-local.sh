#!/bin/bash

while getopts ":k" opt; do
  case "${opt}" in
    k)
      KEEP_COLLECTIONS=1
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

if [ -n "${KEEP_COLLECTIONS}" ]; then
  KEEP_COLLECTIONS=false
else
  KEEP_COLLECTIONS=true
fi

pushd app && yarn build:prod && popd > /dev/null

export DROP_COLLECTIONS=${KEEP_COLLECTIONS}
export IMPORT_DB=${KEEP_COLLECTIONS}
export NODE_ENV=production
export MONGODB_URI=mongodb://localhost/evotempus

node backend/src/server.js
