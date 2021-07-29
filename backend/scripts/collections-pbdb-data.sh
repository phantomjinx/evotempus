#!/bin/bash

if ! command -v jq &> /dev/null; then
  echo "jq not found. Please install jq and ensure it is in the PATH"
  exit 1
fi

PBDB="../data/PBDB"
COLLECTIONS="${PBDB}/2_collections.txt"

if [ ! -d "${PBDB}" ]; then
  echo "Cannot find PBDB directory."
  exit 1
fi

if [ "${1}" != "-s" ]; then
  for file in ${PBDB}/*.json
  do
    echo "Collecting collection identifiers from file ${file}"

    cat "${file}" | \
      jq -c --stream 'select(.[0][2] == "cid") | .[1]' | \
      uniq | \
      sed 's/"col\:\([0-9]*\)"/\1/' \
      >> "${COLLECTIONS}"
  done
fi

if [ ! -f "${COLLECTIONS}" ]; then
  echo "Cannot find ${COLLECTIONS}"
  exit 1
fi

TMPFILE=$(mktemp)
cat ${COLLECTIONS} | sort -n | uniq > ${TMPFILE}
cat ${TMPFILE} > ${COLLECTIONS}
rm -f ${TMPFILE}
