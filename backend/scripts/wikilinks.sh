#!/bin/bash

echo "Total records:      $(cat *.dat | wc -l)"
echo "Total wiki records: $(cat *.dat | grep -v "<>" | wc -l)"
