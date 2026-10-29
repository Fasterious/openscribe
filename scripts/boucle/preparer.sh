#!/bin/bash
# Prépare un dossier d'essai « boucle unique » : corpus lisible, compétences, consigne et commande ./outil.
# Usage : scripts/boucle/preparer.sh <dossier> <fichier.csv> "<objectif de l'étude>" [modèle]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DIR="$(mkdir -p "$1" && cd "$1" && pwd)"
cp "$2" "$DIR/corpus.csv"
cp -r "$ROOT/scripts/boucle/competences" "$DIR/"
cp "$ROOT/scripts/boucle/CONSIGNE.md" "$DIR/"
cat > "$DIR/outil" <<SH
#!/bin/bash
exec "$ROOT/node_modules/.bin/tsx" "$ROOT/scripts/boucle/outil.ts" "$DIR" "\$@"
SH
chmod +x "$DIR/outil"
"$DIR/outil" init "$DIR/corpus.csv" --question "$3" --modele "${4:-claude}"
