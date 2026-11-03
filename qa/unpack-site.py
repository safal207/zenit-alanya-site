"""Verify the exact public bundle before any tests or deployment."""
from pathlib import Path, PurePosixPath
import hashlib, json, zipfile

manifest = json.loads(Path('site-manifest.json').read_text(encoding='utf-8'))
bundle = Path('site.zip')
assert hashlib.sha256(bundle.read_bytes()).hexdigest() == manifest['archive_sha256']
root = Path('dist').resolve()
assert not root.exists(), 'Unpack only into a fresh checkout; never overlay stale site files.'
expected = manifest['files']
overrides = set(manifest.get('overrides', []))
override_root = Path('site').resolve()
if overrides:
    actual_overrides = {p.relative_to(override_root).as_posix() for p in override_root.rglob('*') if p.is_file()}
    assert actual_overrides == overrides, 'The source override set must match the reviewed manifest.'
assert overrides <= {entry['path'] for entry in expected}
assert len({entry['path'] for entry in expected}) == len(expected)
assert sum(entry['bytes'] for entry in expected) <= 25_000_000
with zipfile.ZipFile(bundle) as archive:
    assert len(archive.namelist()) == len(set(archive.namelist()))
    assert sum(item.file_size for item in archive.infolist()) <= 25_000_000
    if not overrides:
        assert set(archive.namelist()) == {entry['path'] for entry in expected}
    for entry in expected:
        relative = PurePosixPath(entry['path'])
        assert not relative.is_absolute() and '..' not in relative.parts
        assert not any(part.startswith('.') for part in relative.parts)
        target = (root / entry['path']).resolve()
        assert target.is_relative_to(root)
        if entry['path'] in overrides:
            source = (override_root / entry['path']).resolve()
            assert source.is_relative_to(override_root)
            data = source.read_bytes()
        else:
            data = archive.read(entry['path'])
        assert len(data) == entry['bytes']
        assert hashlib.sha256(data).hexdigest() == entry['sha256']
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
reviewed = [dict(entry, path='dist/' + entry['path']) for entry in expected]
digest = hashlib.sha256(json.dumps(reviewed, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()
assert digest == manifest['source_artifact_digest']
print(f'Verified {len(expected)} files; artifact {digest}')
