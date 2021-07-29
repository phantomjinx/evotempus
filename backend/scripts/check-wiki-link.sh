#!/bin/bash

if [ -z "$1" ]; then
  echo "$0 <file>"
  exit 1
fi

datafile="$1"

if [ ! -f "${datafile}" ]; then
  echo "No such file: ${datafile}"
  exit 1
fi

url="https://en.wikipedia.org/wiki"

idx=0
while IFS= read -r line
do

  item=$(echo ${line} | awk '{print $1}')
  HTTP_CODE=$(curl --silent --write-out "%{http_code}" -o /dev/null "${url}/${item}")
  if [[ ${HTTP_CODE} -eq 200 ]] ; then
    echo "${line} ${item}"
  else
    echo "${line} <>"
  fi

  sleep 1
done < "${datafile}"
