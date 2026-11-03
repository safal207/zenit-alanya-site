'use strict';
// Test-only static hosting with the same repository path used by GitHub Pages.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..',process.env.SITE_DIR||'dist');
const zlib=require('node:zlib'),compressed=new Map();
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.wasm':'application/wasm','.mp4':'video/mp4','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.woff':'font/woff','.woff2':'font/woff2','.gz':'application/gzip'};
function createServer(){return http.createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});return res.end();}
  let relative;
  try{relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/zenit-alanya-site(?=\/|$)/,'').replace(/^\/+/, '');}catch{res.writeHead(400);return res.end();}
  let file=path.resolve(root,relative||'index.html');
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');const stat=fs.statSync(file);if(!stat.isFile())throw Error('not a file');
    let start=0,end=stat.size-1,status=200;
    const headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':path.extname(file)==='.html'?'no-store':'public, max-age=600','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};
    // GitHub Pages negotiates gzip for text assets; measure the same transfer encoding.
    if(!req.headers.range&&/\b(?:gzip)\b/.test(req.headers['accept-encoding']||'')&&/\.(html|css|js|json|svg)$/.test(file)&&stat.size>1024){
      let cached=compressed.get(file);if(!cached||cached.mtime!==stat.mtimeMs){cached={mtime:stat.mtimeMs,bytes:zlib.gzipSync(fs.readFileSync(file))};compressed.set(file,cached);}
      headers['Content-Encoding']='gzip';headers['Vary']='Accept-Encoding';headers['Content-Length']=cached.bytes.length;res.writeHead(200,headers);return res.end(req.method==='HEAD'?undefined:cached.bytes);
    }
    if(req.headers.range){const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!range||Number(range[1])>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});return res.end();}start=Number(range[1]);end=range[2]?Math.min(Number(range[2]),end):end;if(end<start){res.writeHead(416);return res.end();}status=206;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;}
    headers['Content-Length']=end-start+1;res.writeHead(status,headers);if(req.method==='HEAD')return res.end();fs.createReadStream(file,{start,end}).pipe(res);
  }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
});}
module.exports={createServer};
if(require.main===module){const port=Number(process.env.PORT||4173);createServer().listen(port,'127.0.0.1',()=>console.log(`Serving http://127.0.0.1:${port}/zenit-alanya-site/`));}
