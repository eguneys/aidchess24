#!/bin/bash



ROUTES="repertoires
openings
masters
tactics
endgames
contact
terms
privacy
about
donate
thanks"

cd dist
for f in $ROUTES 
do
  echo $f.html
  cp index.html $f.html
done