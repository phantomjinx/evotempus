#!/bin/bash

AGES=(
  fortunian stage-2 stage-3 stage-4 wuliuan drumian guzhangian paibian jiangshanian stage-10 tremadocian floian \
  dapingian darriwilian sandbian katian hirnantian rhuddanian aeronian telychian sheinwoodian homerian gorstian \
  ludfordian lochkovian pragian emsian eifelian givetian frasnian fammenian tournaisian visean serpukhovian \
  bashkirian mosocovian kasimovian gzhelian asselian sakmarian artinskian kungurian roadian wordian capitanian \
  wuchiapingian changhsingian induan olenekian anisian ladinian carnian norian rhaetian hettangian sinemurian \
  pliensbachian toarchian aalenian bajocian bathonian callovian oxfordian kimmeridgian tithonian berriasian \
  valanginian hauterivian barremian aptian albian cenomanian turonian coniacian santonian campanian maastrichtian \
  danian selandian thanetian ypresian lutetian bartonian priabonian rupelian chattian aquitanian burdigalian langhian \
  serravallian tortonian messinian zanclean piacenzian gelasian calabrian chibanian upper-pleistocene greenlandian \
  northgrippian meghalayan \
)

AGE=( wuliuan stage-2 stage-3 stage-4 stage-10 fammenian mosocovian toarchian chibanian upper-pleistocene greenlandian northgrippian meghalayan)
MAX=( 509.1   529     521     514     489.5    372.2     315.2      182.7     0.774     0.129             0.0117       0.0082        0.0042)
MIN=( 504.5   521     514     509.1   485.4    358.9     307        174.1     0.129     0.0117            0.0082       0.0042        0)

PBDB="../data/PBDB"
URL_TEMPLATE="https://paleobiodb.org/data1.2/occs/list.json?datainfo&rowcount&taxon_reso=genus&interval=INTERVAL,INTERVAL&time_rule=overlap&show=class,taphonomy,paleoloc,geo"

mkdir -p ${PBDB}

for age in ${AGES[@]}; do
  out="${PBDB}/${age}.json"
  if [ -f "${out}" ]; then
    continue
  fi

  echo "Downloading for age ${age}"
  url=${URL_TEMPLATE//INTERVAL/${age}}
  echo "Using url: ${url}"

  HTTP_CODE=$(curl --silent --output "${PBDB}/${age}.json" --write-out "%{http_code}" "${url}")
  if [[ ${HTTP_CODE} -lt 200 || ${HTTP_CODE} -gt 299 ]] ; then
    echo "Error: Failed to download age ${age}"
    rm -f "${out}"
  fi

  sleep 10
done

URL_TEMPLATE2="https://paleobiodb.org/data1.2/occs/list.json?datainfo&rowcount&taxon_reso=genus&max_ma=MAX&min_ma=MIN&time_rule=overlap&show=class,taphonomy,paleoloc,geo"

for i in "${!AGE[@]}"; do
  age=${AGE[$i]}
  min=${MIN[$i]}
  max=${MAX[$i]}

  out="${PBDB}/${age}.json"
  if [ -f "${out}" ]; then
    continue
  fi

  echo "Downloading for age ${age} (${max} - ${min})"
  url=${URL_TEMPLATE2//MIN/${min}}
  url=${url//MAX/${max}}
  echo "Using url: ${url}"

  HTTP_CODE=$(curl --silent --output "${PBDB}/${age}.json" --write-out "%{http_code}" "${url}")
  if [[ ${HTTP_CODE} -lt 200 || ${HTTP_CODE} -gt 299 ]] ; then
    echo "Error: Failed to download age ${age}"
    rm -f "${out}"
  fi

  sleep 10
done
