#!/bin/sh
D=$(cd "$(dirname "$0")" && pwd)
for f in $D/requests/*.json; do b=$(basename $f); [ -s $D/responses/$b ] || echo $b; done
