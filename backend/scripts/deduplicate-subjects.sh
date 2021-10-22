#!/bin/bash

SUBJECTS="../data/subjects.dat"
PBDB="../data/PBDB-EVO"
NEW_SUBJECTS="../data/new-subjects.dat"

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
  kind=$(echo ${line} | awk -v FS='|' '{print $2}' | awk '{$1=$1};1')
  phylum=$(echo ${line} | awk -v FS='|' '{print $3}' | awk '{$1=$1};1')
  from=$(echo ${line} | awk -v FS='|' '{print $4}' | awk '{$1=$1};1')
  to=$(echo ${line} | awk -v FS='|' '{print $5}' | awk '{$1=$1};1')
  wiki=$(echo ${line} | awk -v FS='|' '{print $6}' | awk '{$1=$1};1')

  # i - case insensitive
  # r - recursive
  # F - interpret PATTERNS as fixed strings
  # \b - word boundary
  # h - no filenames
  # head - return first match only
  results=$(grep -irh "^${target}" "${PBDB}" | head -1)
  if [ -z "${results}" ]; then
    copyLine "${line}"
    continue
  fi

  newkind=$(echo ${results} | awk -v FS='|' '{print $2}' | awk '{$1=$1};1')
  newphylum=$(echo ${results} | awk -v FS='|' '{print $3}' | awk '{$1=$1};1')
  newfrom=$(echo ${results} | awk -v FS='|' '{print $4}' | awk '{$1=$1};1')
  newto=$(echo ${results} | awk -v FS='|' '{print $5}' | awk '{$1=$1};1')
  newwiki=$(echo ${results} | awk -v FS='|' '{print $6}' | awk '{$1=$1};1')

  line=$(echo "${line}" | sed "s/${kind}/${newkind}/")
  line=$(echo "${line}" | sed "s/${phylum}/${newphylum}/")
  line=$(echo "${line}" | sed "s/${from}/${newfrom}/")
  line=$(echo "${line}" | sed "s/${to}/${newto}/")
  line=$(echo "${line}" | sed "s/${wiki}/${newwiki}/")
  line=$(echo "${line}" | sed "s/| <>$/| ${phylum}/")

  copyLine "${line}"

done < "${SUBJECTS}"
