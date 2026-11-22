"""Verify the release's SHA-256 manifest without any external dependency."""
from pathlib import Path
import hashlib
import sys

ROOT=Path(__file__).resolve().parents[1]


def main():
    manifest=ROOT/'SHA256SUMS.txt'
    if not manifest.exists():
        raise SystemExit('Release manifest is unavailable.')
    failed=[]; count=0
    for line in manifest.read_text().splitlines():
        expected,relative=line.split('  ',1)
        path=(ROOT/relative).resolve()
        if not path.is_relative_to(ROOT) or not path.is_file():
            failed.append(relative);continue
        if hashlib.sha256(path.read_bytes()).hexdigest()!=expected:failed.append(relative)
        count+=1
    if failed:
        print('Integrity mismatch:',', '.join(failed));sys.exit(1)
    print(f'Verified {count} release files.')


if __name__=='__main__':main()
