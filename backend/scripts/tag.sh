#!/bin/bash

SUBJECTS="../data/subjects.dat"
NEW_SUBJECTS="../data/new-subjects.dat"
TAGS="../data/tags"

copyLine() {
  local line="${1}"
  echo "${line}" >> "${NEW_SUBJECTS}"
}

if [ -f "${NEW_SUBJECTS}" ]; then
  rm -f "${NEW_SUBJECTS}"
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

  target=$(echo ${line} | awk -v FS='|' '{print $1}' | awk '{$1=$1};1')

  for tagfile in "${TAGS}"/*.dat
  do
    grep -F "${target}" "${tagfile}"
    if [ $? != 0 ]; then
      continue
    fi

    tag=$(cat "${tagfile}" | head -1 | sed 's/#TAG: //')
    if [[ "${line}" == *"${tag}"* ]]; then
      continue
    fi

    line="${line},${tag}"
  done

  copyLine "${line}"
done < "${SUBJECTS}"
