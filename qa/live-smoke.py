"""Bounded read-only smoke of the published artifact; no production load test."""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urljoin, urlsplit
import datetime, hashlib, json, time

BASE = 'https://safal207.github.io/zenit-alanya-site/'
manifest = json.loads(Path('site-manifest.json').read_text(encoding='utf-8'))
files = manifest['files']
digest = manifest['source_artifact_digest']
rows = []

def fetch(entry, method='GET'):
    url = urljoin(BASE, entry['path']) + '?ci=' + digest[:16]
    request = Request(url, method=method, headers={'User-Agent': 'Zenit-website-CI-smoke', 'Accept-Encoding': 'identity'})
    with urlopen(request, timeout=20) as response:
        assert response.status == 200, (entry['path'], response.status)
        assert urlsplit(response.url).scheme == 'https'
        assert urlsplit(response.url).netloc == urlsplit(BASE).netloc
        content_type = response.headers.get_content_type()
        if method == 'GET':
            data = response.read()
            assert len(data) == entry['bytes'], 'Stale bytes: ' + entry['path']
            assert hashlib.sha256(data).hexdigest() == entry['sha256'], 'Stale hash: ' + entry['path']
        elif response.headers.get('Content-Length'):
            assert int(response.headers['Content-Length']) == entry['bytes'], entry['path']
        if entry['path'].endswith('.wasm'):
            assert content_type == 'application/wasm'
        if entry['path'].endswith('.mp4'):
            assert content_type == 'video/mp4'
        return {'path': entry['path'], 'method': method, 'status': response.status, 'content_type': content_type, 'exact_sha256': method == 'GET'}

text = [e for e in files if '/vendor/' not in e['path'] and Path(e['path']).suffix in ('.html', '.css', '.js', '.json')]
media = [e for e in files if Path(e['path']).suffix in ('.mp4', '.wasm', '.woff2')]
try:
    # A newly deployed Pages edge can briefly serve the previous artifact.
    for attempt in range(6):
        try:
            rows = [fetch(entry) for entry in text]
            break
        except AssertionError:
            if attempt == 5:
                raise
            time.sleep(15)
    rows += [fetch(entry, 'HEAD') for entry in media]
    status = 'PASS'
except Exception as error:
    status = 'FAIL'
    rows.append({'error': str(error)})
report = {'status': status, 'base_url': BASE, 'captured_at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'artifact_digest': digest, 'checks': rows, 'scope': 'Exact published HTML/authored CSS/JS/JSON bytes plus media, font and WASM availability; no browser interactions or stress traffic.'}
out = Path('qa/results/live-smoke.json')
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report))
raise SystemExit(0 if status == 'PASS' else 1)
