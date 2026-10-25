#!/bin/sh
D=$(cd "$(dirname "$0")" && pwd)
for f in $D/requests/*.json; do [ -e "$f" ] || continue; b=$(basename $f); [ -s $D/responses/$b ] || echo $b; done
