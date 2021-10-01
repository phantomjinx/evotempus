#!/bin/bash

for f in *.dat
do
  echo $f

  name=`basename $f .dat`

  cp $f "$name.bkp"
  sed -i 's/Plant Plant/Plant/g' "${f}"

  if [ -f "${name}.tmp" ]; then
    sed -i 's/Plant Plant/Plant/g' "${name}.tmp"
  fi

  sed -i '/NO_GENUS_SPECIFIED/d' "${f}"

done
