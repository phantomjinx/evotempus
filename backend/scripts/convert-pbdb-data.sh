#!/bin/bash

if ! command -v jq &> /dev/null; then
  echo "jq not found. Please install jq and ensure it is in the PATH"
  exit 1
fi

PBDB="../data/PBDB"
PBDBEVO="${PBDB}-EVO"

if [ ! -d ${PBDB} ]; then
  echo "Cannot find PBDB directory."
  exit 1
fi

mkdir -p "${PBDBEVO}"

for file in ${PBDB}/*.json
do
  #if [ "${file}" != "${PBDB}/stage-2.json" ]; then
  #  continue # Remove when ready to rumble!
  #fi
  echo "Processing file ${file}"
  filename=$(basename ${file} ".json")

  if [ -f "${PBDBEVO}/${filename}.dat" ]; then
    continue # Already processed
  fi

  # Require
  # eag: earliest age
  # lag: latest age
  # env: environment, eg. marine, offshore
  # phl, cll, odl. fml, gnl

  # jq the data
  # convert into csv data
  # Remove all speech marks and backslashes
  # Remove any with no phylum
  # Sort and deduplicate (uniq checks on the first 12 characters only)
  # Awk script that lookups the kind from hints.dat and prints with correct spacing
  cat "${file}" | \
    jq -c --stream \
      'fromstream(
        1|truncate_stream(inputs) |
        select(.[0][0]|numbers) |
        select(.[0][1] != "gcm") |
        select(.[0][1] == ("eag","lag","env","phl","cli","odl","fml","gnl") or length == 1)
       ) | .[] | [.gnl, .phl, .eag, .lag] | @csv ' | \
    tr -d '\"' | tr -d '\\' | \
    sed '/NO_PHYLUM_SPECIFIED\|Problematica\|(\|)/d' | \
    sort | uniq -w 12 | \
    awk -f convert-pbdb-data.awk -v FS="," \
    >> "${PBDBEVO}/${filename}.tmp"

  # Fix any duplicate mistakes
  sed -i 's/Plant Plant/Plant     /g' "${PBDBEVO}/${filename}.tmp"

  echo "Checking wiki links available for $(cat "${PBDBEVO}/${filename}.tmp" | wc -l) entries ..."
  ./check-wiki-link.sh "${PBDBEVO}/${filename}.tmp" > "${PBDBEVO}/${filename}.dat"
done

echo "Completed."
