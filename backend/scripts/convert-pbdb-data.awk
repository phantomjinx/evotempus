function kind(phylum) {
  cmd="cat ../data/hints.dat | grep "phylum" | awk -v FS='|' {'print $3'} | xargs"
  cmd |& getline thekind
  close(cmd);
  return thekind
}

function output(name, phylum, from, to) {
  pkind=kind(phylum)
  printf "%-41s| %-10s| %-27s| -%-13s| -%-12s|\n",name,pkind,phylum,(from * 1000000),(to * 1000000)
}

{
  output($1,$2,$3,$4)
}
