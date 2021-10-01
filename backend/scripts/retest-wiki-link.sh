#!/bin/bash

if [ -z "$1" ]; then
  echo "$0 <file>"
  exit 1
fi

ERRORS_FILE="wiki-link-errors.dat"
SEEN_FILE="wiki-link-seen.tmp"

url="https://en.wikipedia.org/wiki"

readfile() {
  local file="${1}"

  echo "=== Checking file: ${file} ==="

  local idx=0
  while IFS= read -r line
  do
    local target=$(echo ${line} | awk '{print $1}')
    local phylum=$(echo ${line} | awk '{print $5}')
    local link=$(echo ${line} | awk '{print $11}')

    echo -n "Checking ${target} at ${url}/${link} for ${phylum} ..."

    local exists; exists=$(grep ${target} ${ERRORS_FILE})
    if [ $? -eq 0 ]; then
      # already checked and in error so skip
      echo " Checked"
      continue
    fi

    # Have we checked this one already?
    local seen; seen=$(grep ${target} ${SEEN_FILE})
    if [ $? -eq 0 ]; then
      # seen it before
      echo " Seen"
      continue
    fi

    echo "${target}" >> ${SEEN_FILE}

    if [ "${link}" == "<>" ]; then
      local HTTP_CODE=$(curl --silent --write-out "%{http_code}" -o /dev/null "${url}/${item}")
      if [[ ${HTTP_CODE} -ne 200 ]] ; then
        sleep 1 # Still does not exist
        echo " Not Exist"
        continue
      fi
    fi

    # Something does exist but need to confirm what it is
    # Need to separate declaration from assignment for eq test to work
    local cres; cres=$(curl --silent "${url}/${link}")
    local pres; pres=$(echo "${cres}" | grep "${phylum}")
    if [ $? -eq 1 ]; then
      local rres; rres=$(echo "${cres}" | grep "refer to")
      if [ $? -eq 0 ]; then
        echo " No Ref"
        echo "${target} ${phylum}  REFER" >> ${ERRORS_FILE}
      else
        echo " No"
        echo "${target}" >> ${ERRORS_FILE}
      fi
    else
      echo " Yes"
    fi

    sleep 1
  done < "${file}"
}

if [ ! -f ${ERRORS_FILE} ]; then
  touch ${ERRORS_FILE}
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
