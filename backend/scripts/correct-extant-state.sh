#!/bin/bash

OUTPUT="zzz-present.dat"

while getopts ":d:f:" opt ; do

 case "$opt" in
    d) DIR=${OPTARG} ;;
    f) READFILE=${OPTARG} ;;
    \\?) exit 1
   ;;
  esac
done

shift `expr $OPTIND - 1`

add() {
  local target=${1:-}
  local phylum=${2:-}

  if [ -z "${target}" ]; then
    echo "Target is empty ... exiting"
    exit 1
  fi

  if [ -z "${phylum}" ]; then
    echo "Phylum is empty ... exiting"
    exit 1
  fi

  local exists; exists=$(grep "${target}.*| ${phylum} " "${DIR}/${OUTPUT}")
  if [ $? -eq 0 ]; then
    return 0
  fi

  echo -n "Processing ${target} for ${phylum} ... "

  local kingdom=""
  local from=""
  local link=""
  for f in $(grep -r -l "${target}" "${DIR}")
  do
    echo "Testing ${target} and ${phylum}"
    grep "${target} .*${phylum}" "${f}"
    local tgt=$(grep "${target} .*${phylum}" "${f}" | awk -v FS='|' '{print $1}' | awk '{$1=$1};1')
    if [ -z "${tgt}" ]; then
      continue
    fi

    target="${tgt}"
    kingdom=$(grep "${target} .*${phylum}" "${f}" | awk -v FS='|' '{print $2}' | awk '{$1=$1};1')
    from=$(grep "${target} .*${phylum}" "${f}" | awk -v FS='|' '{print $4}' | awk '{$1=$1};1')
    link=$(grep "${target} .*${phylum}" "${f}" | awk -v FS='|' '{print $6}' | awk '{$1=$1};1')
    echo "Kingdom: ${kingdom} From: ${from} Link: ${link}"
    break
  done

  if [ -z "${kingdom}" ]; then
    echo "Kingdom is empty ... exiting"
    exit 1
  fi
  if [ -z "${from}" ]; then
    echo "From is empty ... exiting"
    exit 1
  fi
  if [ -z "${link}" ]; then
    echo "Link is empty ... exiting"
    exit 1
  fi

  printf "%-42s| %-10s| %-27s| %-14s| %-13s| %s\n" "${target}" "${kingdom}" "${phylum}" "${from}" "2030" "${link}" >> ${DIR}/${OUTPUT}
  echo "Yes"
}

#echo "DIR: ${DIR}"
#echo "READFILE: ${READFILE}"

if [ ! -d "${DIR}" ]; then
  echo "Invalid directory ${DIR} ... exiting"
  exit 1
fi

if [ ! -f "${READFILE}" ]; then
  echo "Invalid read-file ${READFILE} ... exiting"
  exit 1
fi

sort "${READFILE}" | while IFS= read -r line
do
  target=$(echo ${line} | awk -v FS='|' '{print $1}' | awk '{$1=$1};1')
  phylum=$(echo ${line} | awk -v FS='|' '{print $2}' | awk '{$1=$1};1')
  extant=$(echo ${line} | awk -v FS='|' '{print $3}' | awk '{$1=$1};1')

  if [ "${extant}" == "0" ]; then
    continue
  fi

  if [ ! -f "${DIR}/${OUTPUT}" ]; then
    touch "${DIR}/${OUTPUT}"
  fi

  add "${target}" "${phylum}"

done
