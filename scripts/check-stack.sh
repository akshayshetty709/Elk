#!/usr/bin/env bash
set -eu
docker compose ps
echo
echo "Elasticsearch local check:"
curl -fsS http://127.0.0.1:9200/_cluster/health || true
echo
echo "Application health:"
curl -fsS http://127.0.0.1:3000/health || true
echo
echo "Recent app logs:"
tail -n 10 logs/app.json.log 2>/dev/null || true
