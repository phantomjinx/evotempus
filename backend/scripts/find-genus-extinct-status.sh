#!/bin/bash

GENUS_EXTANT_DAT="genus-extant.dat"
GENUS_EXTANT_ERROR="genus-extant-error.dat"
SEEN_FILE="genus-seen.tmp"
URL_TEMPLATE="https://paleobiodb.org/data1.2/taxa/single.json?taxon_name=TAXON&show=ecospace"

readfile() {
  local file="${1}"

  local idx=0
  while IFS= read -r line
  do
    # Read values and trim whitespace
    local readtgt=$(echo ${line} | awk -v FS='|' '{print $1}' | awk '{$1=$1};1')
    local phylum=$(echo ${line} | awk -v FS='|' '{print $3}' | awk '{$1=$1};1')

    # Drop any extra identifier from target
    target="${readtgt%% *}"

    # Have we checked this one already?
    local seen; seen=$(grep "${target}_${phylum}" ${SEEN_FILE})
    if [ $? -eq 0 ]; then
      # seen it before
      continue
    fi

    echo -n "Looking for ${target} (${phylum}) ... "

    if [ "${phylum}" == "Charophyta" ]; then
      echo "Phylum modded ... "
      phylum="Chlorophyta"
    fi

    local url=${URL_TEMPLATE//TAXON/"${phylum}:${target}"}
    local data=$(curl --silent "${url}")
    if [[ "${data}" == *'status_code": 404'* ]]; then
      echo " Error"
      echo "${target}_${phylum}" >> ${GENUS_EXTANT_ERROR}
      continue
    fi

    echo "${target}_${phylum}" >> ${SEEN_FILE}

    local extant=$(echo ${data} | jq -c -r '.records[0] | .ext?')
    if [ "${extant}" == "null" ]; then
      extant="0"
    fi

    local env=$(echo ${data} | jq -c -r '.records[0] | .jev?')
    if [ "${env}" == "null" ]; then
      env=""
    fi

    echo " Yes"

    echo "${readtgt} | ${phylum} | ${extant} | ${env}" >> "${GENUS_EXTANT_DAT}"

    sleep 1
  done < "${file}"
}

if [ -z "$1" ]; then
  echo "$0 <file|directory>"
  exit 1
fi

if [ ! -f ${SEEN_FILE} ]; then
  touch ${SEEN_FILE}
fi

if [ -f "${1}" ]; then
  readfile "${1}"
elif [ -d "${1}" ]; then
  for f in ${1}/*
  do
    readfile "${f}"
  done
else
  echo "No such file or directory: ${1}"
  exit 1
fi
