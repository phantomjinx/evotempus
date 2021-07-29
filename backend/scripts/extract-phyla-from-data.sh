#!/bin/bash

if ! command -v jq &> /dev/null; then
  echo "jq not found. Please install jq and ensure it is in the PATH"
  exit 1
fi

PBDB="../data/PBDB"

if [ ! -d ${PBDB} ]; then
  echo "Cannot find PBDB directory."
  exit 1
fi

ALLJSON="${PBDB}/2-all-records.json"
PHYLUM="${PBDB}/3-phylum.txt"

TMPFILE=$(mktemp)
for file in ${PBDB}/*.json
do
  if [ "${file}" == "${ALLJSON}" ]; then
    continue
  fi

  if [ "${file}" == "${PBDB}/test.json" ]; then
    continue # Remove when ready to rumble!
  fi

  echo "Processing file ${file}"

  cat "${file}" | \
    jq -c -r --stream \
      'select(.[0][2] == ("phl")) | .[1]' \
      >> "${TMPFILE}"
done

cat "${TMPFILE}" | sort | uniq >> "${PHYLUM}"
rm -f "${TMPFILE}"

echo "Completed."
