(function(){
  var nav=document.querySelector('nav'),ac=document.getElementById('acBtn'),toggle=document.getElementById('menuBtn');
  if(!nav||!ac||!toggle)return;
  // A non-tab control keeps the original navigation's button list unchanged.
  var account=document.createElement('div');account.className='v1-account-menu';account.tabIndex=0;account.setAttribute('role','button');account.setAttribute('aria-haspopup','dialog');
  account.innerHTML='<span class="v1-account-icon" aria-hidden="true">◈</span><span class="v1-account-text"><small>Account</small><strong></strong></span><span class="v1-account-arrow" aria-hidden="true">›</span>';
  nav.insertBefore(account,nav.firstChild);
  function sync(){var name=(ac.textContent||'').trim().replace(/\s*▾\s*$/,'')||'Main';account.querySelector('strong').textContent=name;account.setAttribute('aria-label','Switch account, current account: '+name)}
  sync();new MutationObserver(sync).observe(ac,{childList:true,characterData:true,subtree:true});
  function open(){if(document.documentElement.classList.contains('menu'))toggle.click();ac.click()}
  account.addEventListener('click',open);account.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&document.documentElement.classList.contains('menu')){toggle.click();toggle.focus()}});
})();

/* Track the app's actual scrolling element, without intercepting touch or wheel events. */
(function(){
  var root=document.documentElement,body=document.body,main=document.querySelector('main');
  var edge=document.createElement('div');edge.className='v1-scroll-edge';edge.setAttribute('aria-hidden','true');body.appendChild(edge);
  var pending=false;
  function update(){pending=false;var top=body.scrollTop||0;var active=root.classList.contains('v1-scrolled');root.classList.toggle('v1-scrolled',active?top>6:top>16);root.classList.toggle('v1-can-scroll-down',top+body.clientHeight<body.scrollHeight-2)}
  function schedule(){if(!pending){pending=true;requestAnimationFrame(update)}}
  body.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});
  document.addEventListener('click',schedule,{passive:true});
  if('ResizeObserver' in window&&main)new ResizeObserver(schedule).observe(main);
  schedule();
})();

/* The menu backdrop stays mounted so opening and closing can both fade smoothly. */
(function(){
  var backdrop=document.createElement('div');backdrop.className='v1-menu-backdrop';backdrop.setAttribute('aria-hidden','true');document.body.appendChild(backdrop);
})();

