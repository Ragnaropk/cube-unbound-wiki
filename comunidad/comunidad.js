(function(){
  var tabs=document.querySelectorAll('.tab'),cards=document.querySelectorAll('.modcard'),q=document.getElementById('hq');
  if(!tabs.length)return;
  var infos=document.querySelectorAll('.typeinfo'),empties=document.querySelectorAll('.empty'),type='';
  function norm(s){return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
  function apply(){
    var s=norm(q.value.trim()),n=0;
    cards.forEach(function(c){
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
  var h=location.hash.slice(1);
  var start=document.querySelector('.tab[data-type="'+h+'"]');
  if(start)start.click(); else apply();
})();
