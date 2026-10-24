/* Single-file transport for trusted, build-time embedded study materials. */
(() => {
  'use strict';
  const node = document.getElementById('portable-assets');
  if (!node) return;
  const bundle = JSON.parse(node.textContent);
  node.textContent = '';
  node.remove();
  const assets = bundle.assets || {};
  const aliases = bundle.aliases || {};
  const cache = new Map();
  const reverse = new Map();
  const VIDEO_PATH = '备赛工作台/video/player.html';
  let dialog, body, title, description, download, currentFrame, returnFocus;
  let previousOverflow = '';

  function normalize(value) {
    let path = String(value || '').trim().replace(/\\/g, '/');
    try { path = decodeURIComponent(path); } catch (_) { /* Keep malformed input inert. */ }
    path = path.replace(/\\/g, '/');
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(path)) return path;
    path = path.replace(/^\.\//, '');
    const parts = [];
    for (const part of path.split('/')) {
      if (!part || part === '.') continue;
      if (part === '..') { if (!parts.length) return ''; parts.pop(); }
      else parts.push(part);
    }
    return parts.join('/');
  }

  function splitPath(value) {
    const raw = String(value || '').trim();
    const hashAt = raw.indexOf('#');
    const withoutHash = hashAt < 0 ? raw : raw.slice(0, hashAt);
    return {path: normalize(withoutHash.split('?')[0]), hash: hashAt < 0 ? '' : raw.slice(hashAt)};
  }

  function entry(value) {
    const raw = String(value || '').trim();
    if (reverse.has(raw)) return reverse.get(raw);
    const {path} = splitPath(raw);
    const key = aliases[path];
    return key && assets[key] ? {key, path, asset: assets[key]} : null;
  }

  function bytes(asset) {
    const binary = atob(asset.data || '');
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  }

  function text(asset) { return new TextDecoder('utf-8').decode(bytes(asset)); }

  function resolve(value) {
    const raw = String(value || '').trim();
    if (/^(?:javascript|data|vbscript):/i.test(raw)) return '#';
    if (/^blob:/i.test(raw) && !reverse.has(raw)) return '#';
    const record = entry(value);
    if (!record) return String(value || '');
    if (!cache.has(record.key)) {
      const url = URL.createObjectURL(new Blob([bytes(record.asset)], {type: record.asset.mime || 'application/octet-stream'}));
      cache.set(record.key, url);
      reverse.set(url, record);
    }
    return cache.get(record.key);
  }

  function siteHash(value) {
    const parsed = splitPath(value);
    if (parsed.path === 'ICAN备赛学习站.html') return parsed.hash || '#home';
    return null;
  }

  function markExternal(anchor) {
    if (!/^https?:\/\//i.test(anchor.getAttribute('href') || '')) return;
    anchor.dataset.portableExternal = 'true';
    anchor.classList.add('portable-external');
    if (!anchor.title) anchor.title = '联网外链；离线学习无需打开';
  }

  function html(markup) {
    const template = document.createElement('template');
    template.innerHTML = String(markup || '');
    template.content.querySelectorAll('img[src]').forEach(img => {
      const original = img.getAttribute('src');
      if (entry(original)) img.setAttribute('src', resolve(original));
    });
    template.content.querySelectorAll('a[href]').forEach(anchor => {
      const original = anchor.getAttribute('href');
      const route = siteHash(original);
      if (route) { anchor.setAttribute('href', route); anchor.removeAttribute('target'); }
      else if (anchor.hasAttribute('data-image') && entry(original)) anchor.setAttribute('href', resolve(original));
      else if (entry(original)) { anchor.dataset.portablePath = splitPath(original).path; anchor.removeAttribute('target'); }
      markExternal(anchor);
    });
    return template.innerHTML;
  }

  function ensureDialog() {
    if (dialog) return;
    dialog = document.createElement('dialog');
    dialog.className = 'portable-dialog';
    dialog.setAttribute('aria-labelledby', 'portable-title');
    dialog.innerHTML = '<header class="portable-dialog-head"><div><span class="portable-kicker">已内嵌 · 离线资料</span><h2 id="portable-title"></h2></div><button type="button" class="portable-close" aria-label="关闭资料预览">关闭 ×</button></header><p class="portable-description"></p><div class="portable-dialog-body"></div><footer class="portable-dialog-foot"><a class="portable-download">保存这份内嵌资料</a><span>返回学习站不会改变作答记录。</span></footer>';
    document.body.appendChild(dialog);
    body = dialog.querySelector('.portable-dialog-body');
    title = dialog.querySelector('h2');
    description = dialog.querySelector('.portable-description');
    download = dialog.querySelector('.portable-download');
    dialog.querySelector('button').addEventListener('click', close);
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
    dialog.addEventListener('close', () => { if (!dialog.open) cleanup(); });
  }

  function cleanup() {
    if (currentFrame) { currentFrame.srcdoc = ''; currentFrame.remove(); currentFrame = null; }
    if (body) body.replaceChildren();
    document.documentElement.style.overflow = previousOverflow;
    dialog?.classList.remove('portable-dialog-fallback');
    if (returnFocus?.isConnected) returnFocus.focus({preventScroll: true});
    returnFocus = null;
  }

  function close() {
    if (!dialog) return;
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
    cleanup();
  }

  function makeFrame(label) {
    const frame = document.createElement('iframe');
    frame.className = 'portable-frame';
    frame.title = label;
    frame.setAttribute('allow', 'autoplay; fullscreen');
    frame.setAttribute('allowfullscreen', '');
    body.appendChild(frame);
    currentFrame = frame;
    return frame;
  }

  function videoDocument(source) {
    const bridge = `(function(){document.addEventListener('click',function(event){var a=event.target.closest('a[href]');if(!a)return;var href=a.getAttribute('href')||'';try{href=decodeURIComponent(href);}catch(_){}if(href.split('#')[0].split('/').pop()!=='ICAN备赛学习站.html')return;event.preventDefault();var i=href.indexOf('#');parent.postMessage({type:'ican-portable-route',hash:i<0?'#sprint':href.slice(i)},'*');},true);})();`;
    const script = '<scr' + 'ipt>' + bridge + '</scr' + 'ipt>';
    return /<\/body\s*>/i.test(source) ? source.replace(/<\/body\s*>/i, script + '</body>') : source + script;
  }

  function open(value) {
    const record = entry(value);
    if (!record) return false;
    ensureDialog();
    if (dialog.open) close();
    returnFocus = document.activeElement;
    previousOverflow = document.documentElement.style.overflow;
    const asset = record.asset;
    const name = asset.name || record.path.split('/').pop() || '内嵌资料';
    title.textContent = name;
    description.textContent = '这份资料已经包含在当前 HTML 内，无需读取其他文件。';
    download.href = resolve(record.path);
    const losslessWebp = asset.mime === 'image/webp' && !/\.webp$/i.test(name);
    download.download = losslessWebp ? name.replace(/\.[^./]+$/, '') + '.webp' : name;
    download.removeAttribute('data-portable-path');
    download.setAttribute('data-portable-download', 'true');
    body.replaceChildren();
    dialog.classList.toggle('portable-video-dialog', record.path === VIDEO_PATH);
    if (record.path === VIDEO_PATH) {
      description.textContent = '点击播放开始。可切换章节、倍速与全屏；影片中的返回链接会回到本学习站。';
      const frame = makeFrame('全能速通动画 · 含内嵌中文配音');
      frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-downloads');
      frame.srcdoc = videoDocument(text(asset));
    } else if (/^image\//i.test(asset.mime || '')) {
      const image = document.createElement('img'); image.src = resolve(record.path); image.alt = name;
      image.className = 'portable-preview-image'; body.appendChild(image);
    } else if (asset.mime === 'application/pdf' || /\.pdf$/i.test(record.path)) {
      description.textContent = 'PDF 已完整内嵌。若手机浏览器没有显示预览，请使用下方“保存这份内嵌资料”，在 PDF 阅读器中打开。';
      makeFrame('PDF 原件：' + name).src = resolve(record.path);
    } else if (/\.(?:docx?|xlsx?|pptx?|zip)$/i.test(record.path)) {
      const note = document.createElement('p'); note.className = 'portable-file-note';
      note.textContent = '原文件已内嵌。此格式需要文档阅读器或对应应用，请点击下方按钮保存后打开；学习站中的整理讲义仍可直接阅读。'; body.appendChild(note);
    } else {
      const pre = document.createElement('pre'); pre.className = 'portable-text'; pre.tabIndex = 0;
      pre.textContent = text(asset); body.appendChild(pre);
      if (/\.html?$/i.test(record.path)) description.textContent = '为避免附件中的脚本执行，这份 HTML 以源文本显示；可保存原件。';
    }
    if (losslessWebp) description.textContent += ' 图片已无损封装为 WebP，像素保持不变，下载文件使用 .webp 扩展名。';
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else { dialog.setAttribute('open', ''); dialog.classList.add('portable-dialog-fallback'); }
    document.documentElement.style.overflow = 'hidden';
    dialog.querySelector('button').focus({preventScroll: true});
    return true;
  }

  document.addEventListener('click', event => {
    const anchor = event.target.closest?.('a[href]');
    if (!anchor || anchor.hasAttribute('download') || anchor.hasAttribute('data-portable-download')) return;
    if (anchor.hasAttribute('data-article') || anchor.hasAttribute('data-image')) return;
    const value = anchor.dataset.portablePath || anchor.getAttribute('href');
    const route = siteHash(value);
    if (route) { event.preventDefault(); event.stopImmediatePropagation(); location.hash = route; return; }
    if (entry(value)) { event.preventDefault(); event.stopImmediatePropagation(); open(value); }
  }, true);

  window.addEventListener('message', event => {
    if (!currentFrame || event.source !== currentFrame.contentWindow || event.data?.type !== 'ican-portable-route') return;
    const hash = String(event.data.hash || '');
    if (!/^#[A-Za-z0-9/_?=&%.\-]{1,2048}$/.test(hash)) return;
    close(); location.hash = hash;
  });

  function markLinks(root) {
    if (root.nodeType !== 1) return;
    if (root.matches('a[href]')) markExternal(root);
    root.querySelectorAll('a[href]').forEach(markExternal);
  }
  new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(markLinks)))
    .observe(document.body, {childList: true, subtree: true});
  markLinks(document.body);
  window.IcanPortable = Object.freeze({resolve, html, open, close, normalize});
  if (!location.hash) location.hash = '#article/pre-race';
})();
