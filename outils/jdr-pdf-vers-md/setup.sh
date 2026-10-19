#!/usr/bin/env bash
# Installe Marker dans un venv local. Usage : ./setup.sh [cpu|cuda]
# Sans argument : cuda si nvidia-smi répond, sinon cpu.
set -euo pipefail
cd "$(dirname "$0")"

command -v python3 >/dev/null || { echo "python3 manquant (3.10+ requis)"; exit 1; }
python3 -c 'import sys; sys.exit(sys.version_info < (3, 10))' || { echo "Python 3.10+ requis"; exit 1; }

python3 -m venv venv
. venv/bin/activate
pip install --upgrade pip

mode="${1:-}"
if [ -z "$mode" ]; then
  if command -v nvidia-smi >/dev/null; then mode=cuda; else mode=cpu; fi
fi

# torch d'abord, pour que marker-pdf ne ramène pas une version qui ne convient pas
if [ "$mode" = cuda ]; then
  pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
else
  pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
fi
pip install marker-pdf

python pdf_vers_md.py --selftest
echo "OK ($mode). Ensuite :"
echo "  source venv/bin/activate"
echo "  python pdf_vers_md.py livre.pdf --systeme mon-jeu --pages 0-9   # essai sur 10 pages"
