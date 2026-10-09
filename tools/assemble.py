#!/usr/bin/env python3
"""Rebuild original Rey Workspace HTML from lossless text chunks."""
from pathlib import Path
import hashlib, json
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'app/segments/manifest.json').read_text(encoding='utf-8'))
data=''.join((ROOT/name).read_text(encoding='utf-8') for name in manifest['parts']).encode('utf-8')
expected=manifest['sha256']; actual=hashlib.sha256(data).hexdigest()
if actual!=expected or len(data)!=manifest['bytes']:
    raise SystemExit(f'FAIL: source checksum mismatch: {actual} != {expected}, bytes={len(data)}')
output=ROOT/manifest['output']; output.parent.mkdir(parents=True,exist_ok=True)
output.write_bytes(data)
print(f'OK: {output} ({len(data):,} bytes), SHA256={actual}')
