#!/bin/bash

for f in *.dat
do
  echo $f

  name=`basename $f .dat`

  cp $f "$name.bkp"
  sed -i 's/Plant Plant/Plant/g' "$f"
  sed -i 's/Plant Plant/Plant/g' "${name}.tmp"

done
