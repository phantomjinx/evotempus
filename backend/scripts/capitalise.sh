#!/bin/bash

if [ -z "${1}" ]; then
  echo "Error ${0} <file>"
  exit 1
fi

FILE="${1}"
NEW_FILE="new-$(basename ${FILE})"

copyLine() {
  local line="${1}"
  echo "${line}" >> "${NEW_FILE}"
}

if [ -f "${NEW_FILE}" ]; then
  rm -f "${NEW_FILE}"
fi

while IFS= read -r line
do
  if [[ "${line}" == "#"* ]]; then
    copyLine "${line}"
    continue
  fi
  if [[ "${line}" == "" ]]; then
    copyLine "${line}"
    continue
  fi

  copyLine "${line^}"
done < "${FILE}"
