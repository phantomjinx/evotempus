#!/bin/bash

pushd app && yarn build:prod && popd > /dev/null

export DROP_COLLECTIONS=true
export IMPORT_DB=true
export NODE_ENV=production
export MONGODB_URI=mongodb://localhost/evotempus

node backend/src/server.js
