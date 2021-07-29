#!/bin/bash

DATA="../data"

cat ${DATA}/subjects.dat | \
 grep -v \# | \
 sort -k 4,5 -t \| --numeric-sort \
 > ${DATA}/subjects2.dat
