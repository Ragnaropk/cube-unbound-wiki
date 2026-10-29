(function(){
  var tabs=document.querySelectorAll('.tab'),q=document.getElementById('hq');
  if(!tabs.length)return;
  var infos=document.querySelectorAll('.typeinfo'),empties=document.querySelectorAll('.empty'),type='';
  function norm(s){return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
  function apply(){
    var s=norm(q.value.trim()),n=0;
    document.querySelectorAll('.modcard').forEach(function(c){
      var ok=(!type||c.dataset.type===type)&&(!s||norm(c.textContent).indexOf(s)>=0);
      c.style.display=ok?'':'none'; if(ok)n++;
    });
    infos.forEach(function(i){i.style.display=i.dataset.type===type?'':'none';});
    empties.forEach(function(x){x.style.display=(n===0&&x.dataset.type===(type||'all'))?'':'none';});
  }
  tabs.forEach(function(t){t.addEventListener('click',function(){
    tabs.forEach(function(x){x.classList.remove('on');}); t.classList.add('on'); type=t.dataset.type; apply();
    history.replaceState(null,'',type?'#'+type:location.pathname);
  });});
  q.addEventListener('input',apply);
  window.CU_REFILTER=apply;
  var h=location.hash.slice(1);
  var start=document.querySelector('.tab[data-type="'+h+'"]');
  if(start)start.click(); else apply();
})();

(function(){
  // Mods de la comunidad (aprobados por Santiago): se piden al servicio y se añaden al catálogo
  var grid=document.getElementById('comgrid'),api=window.CU_API;
  if(!grid||!api)return;
  var VER={gratis:'Gratis 0.2.x',pago:'De pago 0.5.x',ambas:'Gratis y de pago'},TIPO={mod:'Mod',resourcepack:'Pack de recursos'};
  function esc(t){var d=document.createElement('div');d.textContent=t==null?'':String(t);return d.innerHTML;}
  fetch(api+'/mods',{cache:'no-store'}).then(function(r){return r.json();}).then(function(d){
    var mods=(d&&d.mods)||[];
    grid.innerHTML=mods.map(function(m){
      var img=m.imagen?'<img src="'+esc(m.imagen)+'" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">':'';
      return '<div class="modcard" data-type="'+esc(m.tipo)+'">'+img+'<div><span class="badge '+esc(m.tipo)+'">'+esc(TIPO[m.tipo]||'Mod')+'</span>'+
        '<span class="badge ver">'+esc(VER[m.version]||'')+'</span>'+(m.probado?'<span class="badge probado">✔ Probado por Santiago</span>':'')+'</div>'+
        '<h3>'+esc(m.nombre)+'</h3><p>'+esc(m.descripcion)+'</p>'+
        '<div class="meta">por '+esc(m.autor)+(m.descargas?' · '+m.descargas+' descarga'+(m.descargas==1?'':'s'):'')+'</div>'+
        '<div class="acts"><a class="dl" href="'+esc(api+'/m/'+m.id)+'" rel="noopener nofollow" target="_blank">Descargar</a>'+
        '<span class="host">Se descarga de la página del autor</span></div></div>';
    }).join('');
    document.getElementById('comsec').hidden=!mods.length;
    document.querySelectorAll('.tab').forEach(function(t){
      var n=document.querySelectorAll('.modcard'+(t.dataset.type?'[data-type="'+t.dataset.type+'"]':'')).length,s=t.querySelector('small');
      if(s)s.textContent=n;
    });
    if(window.CU_REFILTER)window.CU_REFILTER();
  }).catch(function(){});
})();
(function(){
  // Formulario «Publicar mi mod»
  var f=document.getElementById('modform'),api=window.CU_API;
  if(!f||!api)return;
  var out=document.getElementById('modmsg');
  var ERR={nombre:'Ponle un nombre de al menos 3 letras.',autor:'Falta tu nombre de autor.',tipo:'Elige el tipo y la versión del juego.',
    descripcion:'Cuenta un poco más qué hace (al menos 20 letras).',enlace:'El enlace de descarga tiene que empezar por https:// y no puede ser un .exe, .dll ni .apk.',
    imagen:'El enlace de la imagen tiene que empezar por https:// y no puede ser de Discord (caducan en un día). Súbela a imgbb.com o imgur.com.',demasiados:'Ya enviaste varios hoy. Prueba mañana.',robot:'No se pudo comprobar que no eres un robot.'};
  f.addEventListener('submit',function(ev){
    ev.preventDefault();
    var data={};new FormData(f).forEach(function(v,k){data[k]=String(v);});
    out.textContent='Enviando…';
    fetch(api+'/mods',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)}).then(function(r){return r.json();}).then(function(d){
      if(d.ok){f.reset();out.textContent='¡Recibido! Santiago lo revisará y, si todo está bien, saldrá en el catálogo.';}
      else out.textContent=ERR[d.error]||'No se pudo enviar. Prueba otra vez en un rato.';
    }).catch(function(){out.textContent='No se pudo enviar. Prueba otra vez en un rato.';});
  });
})();
