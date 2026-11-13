"""Offline checks of authored artifacts, not a browser/performance certification."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json,re,gzip,sys

ROOT=Path(__file__).resolve().parents[1]; DIST=ROOT/'dist'
errors=[]; checks=0; resources=set(); pages={}
class Page(HTMLParser):
    def __init__(self,path):
        super().__init__(); self.path=path;self.ids=[];self.links=[];self.attrs=[];self.h1=0
    def handle_starttag(self,tag,items):
        a=dict(items);self.attrs.append((tag,a))
        if 'id' in a:self.ids.append(a['id'])
        if tag=='h1':self.h1+=1
        for key in ('href','src','poster'):
            if a.get(key):self.links.append((a[key],tag,key))
def require(condition,message):
    global checks
    checks+=1
    if not condition:errors.append(message)
for p in sorted(DIST.rglob('*.html')):
    if p.name.startswith('__qa'):continue
    page=Page(p);page.feed(p.read_text(encoding='utf-8'));pages[p.resolve()]=page
    require(len(page.ids)==len(set(page.ids)),f'Duplicate IDs: {p}')
    require(page.h1==1,f'Exactly one h1: {p}')
    require(any(t=='html' and a.get('lang') for t,a in page.attrs),f'Missing lang: {p}')
    require(any(t=='meta' and a.get('name')=='viewport' for t,a in page.attrs),f'Missing viewport: {p}')
    require(any(t=='meta' and a.get('name')=='robots' and 'noindex' in a.get('content','') for t,a in page.attrs),f'Private concept must remain noindex: {p}')
    for tag,a in page.attrs:
        if tag=='img':require('alt' in a,f'Image needs alt: {p} {a.get("src")}')
        if tag=='a' and a.get('target')=='_blank':require('noopener' in a.get('rel','').split(),f'External tab needs noopener: {p} {a.get("href")}')
    for ref,tag,key in page.links:
        u=urlsplit(ref)
        if u.scheme or u.netloc:
            require(u.scheme in ('https','tel','mailto','data'),f'Unexpected URL scheme: {p} {ref}')
            continue
        target=(p.parent/unquote(u.path)).resolve() if u.path else p.resolve()
        if target.is_dir():target=target/'index.html'
        require(target.is_relative_to(DIST.resolve()),f'Path leaves dist: {ref}')
        require(target.is_file(),f'Missing route/asset: {p} {ref}')
        if target.is_file() and key!='href':resources.add(target)
        if u.fragment and target.suffix=='.html' and target.is_file():
            other=Page(target);other.feed(target.read_text(encoding='utf-8'));require(unquote(u.fragment) in other.ids,f'Broken fragment: {p} {ref}')
for p in DIST.rglob('*.css'):
    for ref in re.findall(r'url\([\'\"]?([^\)\'\"]+)',p.read_text(encoding='utf-8')):
        if urlsplit(ref).scheme:continue
        target=(p.parent/ref).resolve();require(target.is_file(),f'Missing CSS asset: {p} {ref}');resources.add(target)
    for ref in re.findall(r"@import\s+(?:url\()?['\"]([^'\"]+)",p.read_text(encoding='utf-8')):
        require((p.parent/ref).is_file(),f'Missing CSS import: {p} {ref}')
require(not list(DIST.glob('__qa*')),'Remove temporary browser QA fixture before release')
home=(DIST/'index.html').read_text(encoding='utf-8')
require('vendor/babylon' not in home and 'stockfish-19' not in home,'Homepage must not bootstrap game engines')
# Original MP4 messages remain reachable without JavaScript via poster links.
# The native video is created by the existing accessible film dialog only on click.
home_attrs=pages[(DIST/'index.html').resolve()].attrs
expected_videos={'message':'assets/media/erokhin-message.mp4','adamov':'assets/media/adamov-message.mp4'}
previews=[a for tag,a in home_attrs if tag=='a' and a.get('data-open-film') in expected_videos]
require(len(previews)==2,'Both authentic film poster links must exist')
require({a.get('data-open-film'):a.get('href') for a in previews}==expected_videos,'Posters must link directly to hosted MP4 when JavaScript is off')
require(all(a.get('aria-haspopup')=='dialog' and a.get('aria-labelledby') for a in previews),'Posters must be named dialog launchers')
require(not any(tag=='iframe' for tag,a in home_attrs),'Landing messages must not depend on third-party frames')
require(not any(tag=='video' and 'message-video' in a.get('class','').split() for tag,a in home_attrs),'Large portrait video players must not load in the home page')
message_downloads=[a for tag,a in home_attrs if tag=='a' and 'message-download' in a.get('class','').split()]
require({a.get('href') for a in message_downloads}==set(expected_videos.values()),'Both message files must have direct downloads')
require(all(a.get('download','').endswith('.mp4') for a in message_downloads),'Each message download needs an MP4 filename')
film_js=(DIST/'assets/media.js').read_text(encoding='utf-8')
require("dialog.id='film-dialog'" in film_js and 'v.controls=true' in film_js and 'v.playsInline=true' in film_js,'Shared accessible native movie viewer must remain')
require("e.preventDefault();showFilm(el.dataset.openFilm)" in film_js,'Poster anchors must open the viewer instead of navigating from the site')
require('data-open-film="young"' in home and 'data-open-film="sand"' in home,'Both on-site training launchers required')
require(home.index('id="start"')<home.index('id="game"'),'Parent contact step must precede games')
require('<input' not in home or 'type="password"' not in home,'This static site must not request account passwords')
for file in DIST.rglob('*'):
    if file.is_file():require(file.stat().st_size>0,f'Empty artifact: {file}')
fonts=list((DIST/'assets').glob('font-*'))
font_bytes=sum(p.stat().st_size for p in fonts)
require(font_bytes<=350_000,f'Font budget exceeded: {font_bytes}')
own_js=[p for p in (DIST/'assets').glob('*.js')]
own_js_bytes=sum(p.stat().st_size for p in own_js)
# The football cup, difficulty presets and match coaching load only on the arena.
# Bound that feature separately while retaining the homepage and journal limits.
player_js_bytes=sum((DIST/'assets'/name).stat().st_size for name in ('player.js','player-api.js','player-path.js'))
require(own_js_bytes-player_js_bytes<=225_000,f'Existing authored JS budget exceeded: {own_js_bytes-player_js_bytes}')
require(player_js_bytes<=50_000,f'Player dashboard JavaScript budget exceeded: {player_js_bytes}')
football_bytes=sum((DIST/'assets'/name).stat().st_size for name in ('football3d.js','football-core.js','football-stadium.js'))
require(football_bytes<=65_000,f'Football JavaScript budget exceeded: {football_bytes}')
require((DIST/'assets/theme.js').stat().st_size<=3_000,'Shared theme controller exceeds 3 KB')
require((DIST/'assets/journey.js').stat().st_size<=20_000,'Journal controller and three locales exceed 20 KB')
require('src="assets/journey.js"' not in home,'Homepage must not bootstrap the journal controller')
total=sum(p.stat().st_size for p in DIST.rglob('*') if p.is_file())
# Includes the background MP4 and the bounded football arena expansion.
require(total<=25_100_000,f'Static bundle budget exceeded: {total}')
for pattern in ('stories.html','assets/club-media.js','assets/football-core.js','play/chess.html','play/football.html','assets/vendor/chess/stockfish-source.tar.gz','assets/vendor/LICENSE-fonts.txt'):
    require((DIST/pattern).is_file(),f'Missing required artifact: {pattern}')
metrics={'assertions':checks,'font_bytes':font_bytes,'authored_javascript_bytes':own_js_bytes,'dist_bytes':total,'babylon_gzip_bytes':len(gzip.compress((DIST/'assets/vendor/babylon.js').read_bytes())),'claim':'artifact budgets only; not measured Core Web Vitals'}
print(json.dumps({'status':'FAIL' if errors else 'PASS','metrics':metrics,'errors':errors},ensure_ascii=False))
sys.exit(bool(errors))
