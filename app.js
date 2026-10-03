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

  // ---- Cerrar el menú móvil al elegir página
  document.querySelectorAll('.side a').forEach(function (a) {
    a.addEventListener('click', function () { document.body.classList.remove('navopen'); });
  });
})();
