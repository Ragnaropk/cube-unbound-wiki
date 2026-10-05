// Wiki de Cube Unbound: buscador, filtros de tablas y ordenación. Sin dependencias.
(function () {
  function norm(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  // ---- Buscador global
  var q = document.getElementById('q'), box = document.getElementById('results');
  var idx = (window.SEARCH_INDEX || []).map(function (r) { return { n: r[0], u: r[1], t: r[2], i: r[3], k: norm(r[0]) }; });
  var sel = -1;
  function show() {
    var s = norm(q.value.trim());
    box.innerHTML = '';
    sel = -1;
    if (s.length < 2) { box.style.display = 'none'; return; }
    var starts = [], has = [];
    for (var i = 0; i < idx.length && starts.length < 40; i++) {
      var p = idx[i].k.indexOf(s);
      if (p === 0) starts.push(idx[i]); else if (p > 0 && has.length < 40) has.push(idx[i]);
    }
    var out = starts.concat(has).slice(0, 40);
    out.forEach(function (r) {
      var a = document.createElement('a');
      a.href = ROOT + r.u;
      if (r.i) { var im = document.createElement('img'); im.src = ROOT + r.i; im.alt = ''; a.appendChild(im); }
      else { var sp = document.createElement('span'); sp.className = 'noimg'; a.appendChild(sp); }
      a.appendChild(document.createTextNode(r.n));
      var sm = document.createElement('small'); sm.textContent = r.t; a.appendChild(sm);
      box.appendChild(a);
    });
    if (!out.length) { var d = document.createElement('a'); d.textContent = 'Sin resultados'; box.appendChild(d); }
    box.style.display = 'block';
  }
  if (q) {
    q.addEventListener('input', show);
    q.addEventListener('focus', show);
    q.addEventListener('keydown', function (ev) {
      var links = box.querySelectorAll('a[href]');
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        if (!links.length) return;
        sel = (sel + (ev.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
        links.forEach(function (l, i) { l.classList.toggle('sel', i === sel); });
        links[sel].scrollIntoView({ block: 'nearest' });
      } else if (ev.key === 'Enter' && links.length) {
        location.href = links[Math.max(sel, 0)].href;
      } else if (ev.key === 'Escape') { box.style.display = 'none'; }
    });
    document.addEventListener('click', function (ev) {
      if (!ev.target.closest('.search')) box.style.display = 'none';
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === '/' && document.activeElement.tagName !== 'INPUT') { ev.preventDefault(); q.focus(); }
    });
  }

  // ---- Filtros: una barra .filters actúa sobre la primera tabla que la sigue
  document.querySelectorAll('.filters').forEach(function (bar) {
    var table = bar.nextElementSibling;
    while (table && table.tagName !== 'TABLE') table = table.nextElementSibling;
    if (!table) return;
    var rows = Array.prototype.slice.call(table.tBodies[0].rows);
    rows.forEach(function (r) { r._text = norm(r.textContent); });
    var input = bar.querySelector('.tf'), selects = bar.querySelectorAll('.ts'), count = bar.querySelector('.count');
    function apply() {
      var s = norm(input.value.trim()), n = 0;
      rows.forEach(function (r) {
        var ok = !s || r._text.indexOf(s) >= 0;
        selects.forEach(function (se) {
          if (!ok || !se.value) return;
          var v = r.getAttribute('data-' + se.dataset.attr) || '';
          ok = se.dataset.attr === 'biome' ? v.indexOf(' ' + se.value + ' ') >= 0 : v === se.value;
        });
        r.style.display = ok ? '' : 'none';
        if (ok) n++;
      });
      count.textContent = n + ' de ' + rows.length;
    }
    input.addEventListener('input', apply);
    selects.forEach(function (se) { se.addEventListener('change', apply); });
    apply();
  });

  // ---- Ordenar tablas al pulsar la cabecera
  document.querySelectorAll('table.sortable').forEach(function (table) {
    var heads = table.tHead.rows[0].cells;
    Array.prototype.forEach.call(heads, function (th, col) {
      th.addEventListener('click', function () {
        var dir = th._dir = -(th._dir || -1);
        var rows = Array.prototype.slice.call(table.tBodies[0].rows);
        function key(r) {
          var c = r.cells[col];
          var v = c.getAttribute('data-v');
          if (v === null) v = c.textContent.trim();
          var f = parseFloat(String(v).replace(',', '.'));
          return isNaN(f) || !/^[\d.,\s+-]/.test(v) ? norm(v) : f;
        }
        rows.sort(function (a, b) {
          var x = key(a), y = key(b);
          if (typeof x !== typeof y) { x = String(x); y = String(y); }
          return (x < y ? -1 : x > y ? 1 : 0) * dir;
        });
        rows.forEach(function (r) { table.tBodies[0].appendChild(r); });
      });
    });
  });

  // ---- Corazones: favoritos guardados en este navegador (localStorage).
  // window.CubeFavs deja el enganche listo para el contador global: onChange(clave, activo).
  var FAV_KEY = 'cu_favs';
  function favLoad() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || {}; } catch (err) { return {}; }
  }
  function favSave(f) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(f)); } catch (err) { /* sin almacenamiento: sólo esta visita */ }
  }
  var favs = favLoad();
  var CubeFavs = window.CubeFavs = {
    has: function (k) { return !!favs[k]; },
    all: function () { return Object.keys(favs); },
    onChange: [],
    toggle: function (k) {
      if (favs[k]) delete favs[k]; else favs[k] = Date.now();
      favSave(favs);
      favPaint();
      CubeFavs.onChange.forEach(function (fn) { try { fn(k, !!favs[k]); } catch (err) {} });
      return !!favs[k];
    }
  };
  function favPaint() {
    document.querySelectorAll('.fav').forEach(function (b) {
      var on = !!favs[b.dataset.fav];
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.title = on ? 'Quitar de favoritos' : 'Añadir a favoritos';
      var t = b.querySelector('.favt');
      if (t) t.textContent = on ? 'Te gusta' : 'Me gusta';
    });
    var c = document.getElementById('favcount');
    if (c) c.textContent = Object.keys(favs).length;
    if (typeof paintCounts === 'function') paintCounts();
  }
  function favButton(key, mini) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'fav' + (mini ? ' mini' : '');
    b.dataset.fav = key;
    b.innerHTML = '<span class="hh" aria-hidden="true">\u2665</span><span class="favt">Me gusta</span><span class="favn"></span>';
    return b;
  }
  // Las tarjetas con id (muebles, vehículos, estructuras, cultivos) reciben su corazón aquí
  var CARD_TYPES = { 'muebles.html': 'furniture', 'vehiculos.html': 'vehicle', 'estructuras.html': 'structure', 'cultivos.html': 'crop' };
  var here = location.pathname.split('/').pop() || 'index.html';
  if (CARD_TYPES[here]) {
    document.querySelectorAll('div.card[id]').forEach(function (card) {
      card.appendChild(favButton(CARD_TYPES[here] + ':' + card.id, true));
    });
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('.fav');
    if (!b) return;
    ev.preventDefault();
    CubeFavs.toggle(b.dataset.fav);
    if (document.getElementById('favlist')) favList();
  });

  // Clave de favorito a partir de la dirección de una entrada del buscador
  function favKeyOf(u) {
    var m = /^criatura\/(.+)\.html$/.exec(u); if (m) return 'mob:' + m[1];
    m = /^objeto\/(.+)\.html$/.exec(u); if (m) return 'item:' + m[1];
    m = /^raza\/(.+)\.html$/.exec(u); if (m) return 'race:' + m[1];
    m = /^(muebles|vehiculos|estructuras|cultivos)\.html#(.+)$/.exec(u);
    if (m) return CARD_TYPES[m[1] + '.html'] + ':' + m[2];
    return null;
  }
  var FAV_GROUPS = [['mob', 'Criaturas'], ['race', 'Razas'], ['item', 'Objetos'], ['furniture', 'Muebles'],
                    ['vehicle', 'Vehículos'], ['structure', 'Estructuras'], ['crop', 'Cultivos']];
  function favList() {
    var box = document.getElementById('favlist'), empty = document.getElementById('favempty');
    var byKey = {};
    (window.SEARCH_INDEX || []).forEach(function (r) { var k = favKeyOf(r[1]); if (k && !byKey[k]) byKey[k] = r; });
    box.innerHTML = '';
    var total = 0;
    FAV_GROUPS.forEach(function (g) {
      var keys = Object.keys(favs).filter(function (k) { return k.indexOf(g[0] + ':') === 0 && byKey[k]; });
      if (!keys.length) return;
      keys.sort(function (a, b) { return favs[b] - favs[a]; });
      total += keys.length;
      var h = document.createElement('h2'); h.textContent = g[1] + ' (' + keys.length + ')'; box.appendChild(h);
      var grid = document.createElement('div'); grid.className = 'cards'; box.appendChild(grid);
      keys.forEach(function (k) {
        var r = byKey[k], card = document.createElement('div');
        card.className = 'card';
        var a = document.createElement('a'); a.href = ROOT + r[1];
        if (r[3]) { var im = document.createElement('img'); im.className = 'cardimg'; im.src = ROOT + r[3]; im.alt = ''; a.appendChild(im); }
        var b = document.createElement('b'); b.textContent = r[0]; a.appendChild(b);
        card.appendChild(a);
        var sp = document.createElement('span'); sp.className = 'dim'; sp.textContent = r[2]; card.appendChild(sp);
        card.appendChild(favButton(k, true));
        grid.appendChild(card);
      });
    });
    empty.style.display = total ? 'none' : '';
    favPaint();
  }
  if (document.getElementById('favlist')) favList();
  favPaint();
  // ---- Contador global de corazones (sólo si la wiki se generó con la dirección del servicio)
  var API = window.FAV_API || '';
  var counts = null;
  function voterId() {
    var v = null;
    try { v = localStorage.getItem('cu_vid'); } catch (err) {}
    if (!v) {
      var a = new Uint8Array(16);
      (window.crypto || window.msCrypto).getRandomValues(a);
      v = Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
      try { localStorage.setItem('cu_vid', v); } catch (err) {}
    }
    return v;
  }
  function paintCounts() {
    if (!counts) return;
    document.querySelectorAll('.fav').forEach(function (b) {
      var n = counts[b.dataset.fav] || 0, el = b.querySelector('.favn');
      if (el) el.textContent = n > 0 ? String(n) : '';
    });
  }
  function keepCounts() {
    try { sessionStorage.setItem('cu_counts', JSON.stringify({ at: Date.now(), data: counts })); } catch (err) {}
  }
  function sendVote(key, on) {
    return fetch(API + '/vote', { method: 'POST', body: JSON.stringify({ key: key, vid: voterId(), on: on }) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.ok && counts) { counts[key] = res.n; keepCounts(); paintCounts(); }
      }).catch(function () {});
  }
  function topList() {
    var box = document.getElementById('toplist');
    if (!box || !counts) return;
    var byKey = {};
    (window.SEARCH_INDEX || []).forEach(function (r) { var k = favKeyOf(r[1]); if (k && !byKey[k]) byKey[k] = r; });
    box.innerHTML = '';
    var total = 0;
    FAV_GROUPS.forEach(function (g) {
      var keys = Object.keys(counts).filter(function (k) { return k.indexOf(g[0] + ':') === 0 && byKey[k] && counts[k] > 0; });
      if (!keys.length) return;
      keys.sort(function (a, b) { return counts[b] - counts[a] || (byKey[a][0] < byKey[b][0] ? -1 : 1); });
      keys = keys.slice(0, 12);
      total += keys.length;
      var h = document.createElement('h2'); h.textContent = g[1]; box.appendChild(h);
      var grid = document.createElement('div'); grid.className = 'cards'; box.appendChild(grid);
      keys.forEach(function (k, i) {
        var r = byKey[k], card = document.createElement('div');
        card.className = 'card';
        var rk = document.createElement('span'); rk.className = 'rank'; rk.textContent = '#' + (i + 1); card.appendChild(rk);
        var a = document.createElement('a'); a.href = ROOT + r[1];
        if (r[3]) { var im = document.createElement('img'); im.className = 'cardimg'; im.src = ROOT + r[3]; im.alt = ''; a.appendChild(im); }
        var b = document.createElement('b'); b.textContent = r[0]; a.appendChild(b);
        card.appendChild(a);
        var sp = document.createElement('span'); sp.className = 'dim'; sp.textContent = r[2]; card.appendChild(sp);
        card.appendChild(favButton(k, true));
        grid.appendChild(card);
      });
    });
    document.getElementById('topempty').style.display = total ? 'none' : '';
    favPaint();
    paintCounts();
  }
  if (API && window.fetch) {
    CubeFavs.onChange.push(function (key, on) {
      if (counts) { counts[key] = Math.max(0, (counts[key] || 0) + (on ? 1 : -1)); keepCounts(); paintCounts(); }
      sendVote(key, on);
    });
    var gotCounts = function (data) {
      counts = data || {};
      paintCounts();
      topList();
      // Favoritos marcados antes de que existiera el contador: se envían una sola vez
      var synced = false;
      try { synced = !!localStorage.getItem('cu_synced'); } catch (err) { synced = true; }
      if (!synced) {
        try { localStorage.setItem('cu_synced', '1'); } catch (err) {}
        CubeFavs.all().reduce(function (p, k) { return p.then(function () { return sendVote(k, true); }); }, Promise.resolve());
      }
    };
    var cached = null;
    try { cached = JSON.parse(sessionStorage.getItem('cu_counts')); } catch (err) {}
    if (cached && Date.now() - cached.at < 60000 && !document.getElementById('toplist')) gotCounts(cached.data);
    else fetch(API + '/counts').then(function (r) { return r.json(); }).then(function (data) {
      counts = data; keepCounts(); gotCounts(data);
    }).catch(function () {});
  }

  // Otra pestaña cambió los favoritos: ponerse al día
  window.addEventListener('storage', function (ev) {
    if (ev.key !== FAV_KEY) return;
    favs = favLoad();
    if (document.getElementById('favlist')) favList(); else favPaint();
  });

  // ---- Cerrar el menú móvil al elegir página
  document.querySelectorAll('.side a').forEach(function (a) {
    a.addEventListener('click', function () { document.body.classList.remove('navopen'); });
  });
})();
