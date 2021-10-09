#!/bin/bash

if [ -z "$1" ]; then
  echo "$0 <file>"
  exit 1
fi

while getopts ":d:f:" opt ; do

 case "$opt" in
    d) DIR=${OPTARG} ;;
    f) READFILE=${OPTARG} ;;
    \\?) exit 1
   ;;
  esac
done

shift `expr $OPTIND - 1`

replace() {
  local target=${1:-}
  local link=${2:-}

  if [ -z "${target}" ]; then
    echo "Target is empty ... exiting"
    exit 1
  fi

  if [ -z "${link}" ]; then
    echo "Link is empty ... exiting"
    exit 1
  fi

  for f in $(grep -r -l "${target}" "${DIR}")
  do
    echo "  File: ${f}"
    sed -i "s/| ${target}\$/| ${link}/" "${f}"
  done
}

echo "DIR: ${DIR}"
echo "READFILE: ${READFILE}"

if [ ! -d "${DIR}" ]; then
  echo "Invalid directory ${DIR} ... exiting"
  exit 1
fi

if [ ! -f "${READFILE}" ]; then
  echo "Invalid read-file ${READFILE} ... exiting"
  exit 1
fi

while IFS= read -r line
do
  target=$(echo ${line} | awk '{print $1}')
  phylum=$(echo ${line} | awk '{print $2}')
  link=$(echo ${line} | awk '{print $3}')

  if [ "${link}" == "REFER" ]; then
    continue
  fi

  echo "Processing ${target} at ${link} for ${phylum}"

  replace "${target}" "${link}"

done < "${READFILE}"
