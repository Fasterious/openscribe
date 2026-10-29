#!/bin/bash
# Prépare un dossier d'essai « boucle unique » : corpus lisible, compétences, consigne et commande ./outil.
# Usage : essais/boucle-unique/kit/preparer.sh <dossier> <fichier.csv> "<objectif de l'étude>" [modèle]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
DIR="$(mkdir -p "$1" && cd "$1" && pwd)"
cp "$2" "$DIR/corpus.csv"
cp -r "$ROOT/essais/boucle-unique/kit/competences" "$DIR/"
cp "$ROOT/essais/boucle-unique/kit/CONSIGNE.md" "$DIR/"
cat > "$DIR/outil" <<SH
#!/bin/bash
exec "$ROOT/node_modules/.bin/tsx" "$ROOT/essais/boucle-unique/kit/outil.ts" "$DIR" "\$@"
SH
chmod +x "$DIR/outil"
"$DIR/outil" init "$DIR/corpus.csv" --question "$3" --modele "${4:-claude}"
