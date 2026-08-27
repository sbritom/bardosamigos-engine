#!/usr/bin/env bash
set -euo pipefail

"$(dirname "${BASH_SOURCE[0]}")/stop-streaming.sh"
sleep 2
"$(dirname "${BASH_SOURCE[0]}")/start-streaming.sh"
