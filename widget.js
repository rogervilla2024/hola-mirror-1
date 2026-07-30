(function () {
  'use strict';

  var SCRIPT = document.currentScript;
  if (!SCRIPT) {
    var all = document.getElementsByTagName('script');
    SCRIPT = all[all.length - 1];
  }

  var QP = {};
  try {
    var srcUrl = SCRIPT.src || '';
    var qIdx = srcUrl.indexOf('?');
    if (qIdx >= 0) {
      srcUrl.substring(qIdx + 1).split('&').forEach(function (pair) {
        var eq = pair.indexOf('=');
        if (eq > 0) {
          var k = decodeURIComponent(pair.substring(0, eq));
          var v = decodeURIComponent(pair.substring(eq + 1).replace(/\+/g, ' '));
          QP[k] = v;
        }
      });
    }
  } catch (e) {}

  function cfg(qpKey, dataAttr, def) {
    var v = SCRIPT.getAttribute(dataAttr);
    if (v !== null && v !== '') return v;
    if (QP[qpKey] !== undefined && QP[qpKey] !== '') return QP[qpKey];
    return def;
  }

  var DATA_URL = cfg('src', 'data-src', 'data.json');
  var THEME = cfg('theme', 'data-theme', 'light');
  var MAX = parseInt(cfg('max', 'data-max', '0'), 10);
  var TITLE = cfg('title', 'data-title', '');
  var TARGET_ID = cfg('target', 'data-target', null);
  var MODE = String(cfg('mode', 'data-mode', 'table')).toLowerCase();

  var host = TARGET_ID ? document.getElementById(TARGET_ID) : null;
  if (!host) {
    host = document.createElement('div');
    SCRIPT.parentNode.insertBefore(host, SCRIPT);
  }

  var shadow = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;

  var style = document.createElement('style');
  style.textContent = [
    ':host, .bs-root { all: initial; }',
    '.bs-root { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1a1a1a; display: block; width: 100%; box-sizing: border-box; }',
    '.bs-root.dark { color: #f1f1f1; }',
    '.bs-title { font-size: 18px; font-weight: 600; margin: 0 0 12px 0; }',
    '.bs-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }',
    '.dark .bs-table { background: #1f2937; box-shadow: 0 1px 3px rgba(0,0,0,0.4); }',
    '.bs-table th, .bs-table td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #eee; vertical-align: middle; font-size: 14px; }',
    '.dark .bs-table th, .dark .bs-table td { border-bottom-color: #374151; }',
    '.bs-table th { background: #f7f7f9; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #555; }',
    '.dark .bs-table th { background: #111827; color: #9ca3af; }',
    '.bs-table tr:last-child td { border-bottom: 0; }',
    '.bs-img { width: 110px; height: 44px; object-fit: contain; border-radius: 6px; background: #fafafa; padding: 2px; }',
    '.dark .bs-img { background: #0f172a; }',
    '.bs-cta { display: inline-block; padding: 8px 14px; background: #16a34a; color: #fff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px; white-space: nowrap; }',
    '.bs-cta:hover { background: #15803d; }',
    '.bs-bonus { line-height: 1.25; }',
    '.bs-bonus-percent { font-size: 18px; font-weight: 700; color: #16a34a; }',
    '.bs-bonus-amount { font-size: 12px; color: #555; margin-top: 2px; }',
    '.bs-bonus-note { display: inline-block; margin-left: 6px; font-size: 10px; font-weight: 700; color: #fff; background: #f59e0b; padding: 2px 6px; border-radius: 4px; vertical-align: middle; letter-spacing: 0.04em; }',
    '.dark .bs-bonus-amount { color: #cbd5e1; }',
    '.bs-rating { font-weight: 600; color: #f59e0b; white-space: nowrap; }',
    '.bs-stars { color: #f59e0b; letter-spacing: 1px; }',
    '.bs-loading, .bs-error { padding: 20px; text-align: center; color: #888; font-size: 14px; }',
    '.bs-error { color: #b91c1c; }',
    '.bs-banner { display: block; text-align: center; line-height: 0; }',
    '.bs-banner img { display: inline-block; max-width: 100%; height: auto; border: 0; }',
    '@media (max-width: 600px) {',
    '  .bs-table th:nth-child(4), .bs-table td:nth-child(4) { display: none; }',
    '  .bs-table th, .bs-table td { padding: 10px 8px; font-size: 13px; }',
    '  .bs-img { width: 80px; height: 32px; }',
    '  .bs-bonus-percent { font-size: 16px; }',
    '}'
  ].join('\n');
  shadow.appendChild(style);

  var root = document.createElement('div');
  root.className = 'bs-root' + (THEME === 'dark' ? ' dark' : '');
  root.innerHTML = '<div class="bs-loading">Yükleniyor...</div>';
  shadow.appendChild(root);

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function safeUrl(u) {
    var s = String(u || '').trim();
    if (/^(https?:|\/\/|\/)/i.test(s)) return s;
    return '#';
  }

  function resolveImage(src) {
    var s = String(src || '').trim();
    if (!s) return '';
    if (/^(https?:|\/\/|data:)/i.test(s)) return s;
    try {
      return new URL(s, new URL(DATA_URL, window.location.href)).href;
    } catch (e) {
      return s;
    }
  }

  function stars(rating) {
    var r = Math.max(0, Math.min(5, Number(rating) || 0));
    var full = Math.floor(r);
    var half = (r - full) >= 0.5 ? 1 : 0;
    var empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
  }

  function renderBanner(data) {
    if (!data || !data.url || !data.image) {
      root.innerHTML = '<div class="bs-error">Banner verisi eksik.</div>';
      return;
    }
    var html = [
      TITLE ? '<h3 class="bs-title">' + escapeHtml(TITLE) + '</h3>' : '',
      '<a class="bs-banner" href="', escapeHtml(safeUrl(data.url)), '" target="_blank" rel="nofollow sponsored noopener">',
      '<img src="', escapeHtml(resolveImage(data.image)), '" alt="', escapeHtml(data.alt || ''), '"',
      data.width ? ' width="' + parseInt(data.width, 10) + '"' : '',
      data.height ? ' height="' + parseInt(data.height, 10) + '"' : '',
      ' loading="lazy" onerror="this.style.visibility=\'hidden\'">',
      '</a>'
    ].join('');
    root.innerHTML = html;
  }

  function render(items) {
    if (!Array.isArray(items) || items.length === 0) {
      root.innerHTML = '<div class="bs-error">Veri bulunamadı.</div>';
      return;
    }
    if (MAX > 0) items = items.slice(0, MAX);

    var rows = items.map(function (it) {
      var b = it.bonus || {};
      var bonusHtml = '';
      if (b.percent || b.amount) {
        bonusHtml = [
          '<div class="bs-bonus">',
          '<div class="bs-bonus-percent">', escapeHtml(b.percent || ''),
          b.note ? '<span class="bs-bonus-note">' + escapeHtml(b.note) + '</span>' : '',
          '</div>',
          b.amount ? '<div class="bs-bonus-amount">' + escapeHtml(b.amount) + "'ye kadar</div>" : '',
          '</div>'
        ].join('');
      }
      return [
        '<tr>',
        '<td><img class="bs-img" src="', escapeHtml(resolveImage(it.image)), '" alt="', escapeHtml(it.title || ''), '" loading="lazy" onerror="this.style.visibility=\'hidden\'"></td>',
        '<td><a class="bs-cta" href="', escapeHtml(safeUrl(it.url)), '" target="_blank" rel="nofollow sponsored noopener">Siteye Git</a></td>',
        '<td>', bonusHtml, '</td>',
        '<td><div class="bs-rating">', escapeHtml((Number(it.rating) || 0).toFixed(1)), '/5</div><div class="bs-stars">', stars(it.rating), '</div></td>',
        '</tr>'
      ].join('');
    }).join('');

    root.innerHTML = [
      TITLE ? '<h3 class="bs-title">' + escapeHtml(TITLE) + '</h3>' : '',
      '<table class="bs-table">',
      '<thead><tr><th></th><th>Site</th><th>Bonus</th><th>Puan</th></tr></thead>',
      '<tbody>', rows, '</tbody>',
      '</table>'
    ].join('');
  }

  function load() {
    fetch(DATA_URL, { credentials: 'omit' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(MODE === 'banner' ? renderBanner : render)
      .catch(function (err) {
        root.innerHTML = '<div class="bs-error">Yüklenemedi: ' + escapeHtml(err.message) + '</div>';
      });
  }

  load();
})();
