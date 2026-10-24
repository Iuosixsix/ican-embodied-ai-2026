import './build-voice.mjs';
import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
await build({entryPoints:['src/player.tsx'],bundle:true,outfile:'player.js',format:'iife',platform:'browser',target:['chrome110','edge110'],minify:true,sourcemap:false,define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof'});
const css=await readFile('player.css','utf8');
const js=await readFile('player.js','utf8');
const html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ICAN 全能超级速通影片</title><style>${css}</style></head><body><div id="root"></div><noscript>此互动影片需要启用 JavaScript。72段配音与字幕已内嵌本文件，无需联网。</noscript><script>${js.replace(/<\/script/gi,'<\\/script')}</script></body></html>`;
await writeFile('player.html',html);
console.log(`Single-file offline film: player.html (${Buffer.byteLength(html)} bytes), audio fully embedded`);
