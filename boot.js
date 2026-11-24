(function(){try{var v=localStorage.getItem("pnl-lite"),m=navigator.deviceMemory,c=navigator.hardwareConcurrency,auto=m?m<=4:(c?c<=4:false);window.__autoLite=auto;if(v==="1"||(v===null&&auto))document.documentElement.classList.add("lite")}catch(e){}})();

/* Vision theme palette + universal display modes */
(function(){
  var h2r=function(h){h=h.replace('#','');return [parseInt(h.substr(0,2),16),parseInt(h.substr(2,2),16)] .concat([parseInt(h.substr(4,2),16)])};
  var r2h=function(a){return '#'+a.map(function(v){v=Math.max(0,Math.min(255,Math.round(v)));return (v<16?'0':'')+v.toString(16)}).join('')};
  var mix=function(a,b,t){var x=h2r(a),y=h2r(b);return r2h([x[0]+(y[0]-x[0])*t,x[1]+(y[1]-x[1])*t,x[2]+(y[2]-x[2])*t])};
  var rgb=function(h){return h2r(h).join(',')};
  var on=function(h){var c=h2r(h).map(function(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});var L=.2126*c[0]+.7152*c[1]+.0722*c[2];return 1.05/(L+.05)>=(L+.05)/.05?'#FFFFFF':'#0B0F14'};
  var TH={vision:{id:'vision',name:'Vision',mode:'dark',bg:'#0A1220',surface:'#111C30',line:'#1E2D47',ink:'#F2F6FC',muted:'#8A98B2',accent:'#2F73FF',hi:'#5B9BFF',win:'#19D3A2',loss:'#FF5F78'},morpho:{id:'morpho',name:'Morpho Classic',mode:'dark',bg:'#0E0E0F',surface:'#171718',line:'#2A2A2D',ink:'#F4F4F5',muted:'#8E8E96',accent:'#2F6BFF',hi:'#5B8DFF',win:'#19D3A2',loss:'#FF5F78'}};
  TH['floating-blue']={id:'floating-blue',name:'Floating Blue',mode:'dark',bg:'#070B13',surface:'#111A29',line:'#24344D',ink:'#F4F7FF',muted:'#99AAC1',accent:'#4789FF',hi:'#75A7FF',win:'#19D3A2',loss:'#FF637A'};
  TH['vision-dark']={id:'vision-dark',name:'Vision Dark',mode:'dark',bg:'#07141A',surface:'#11252B',line:'#284846',ink:'#F0FAF6',muted:'#9EB9B2',accent:'#76DFBC',hi:'#76DFBC',win:'#76DFBC',loss:'#FF7B89',btnInk:'#07141A'};
  TH['clean-light']={id:'clean-light',name:'Clean Light',mode:'light',bg:'#F5F4F0',surface:'#FFFFFF',line:'#D6E1DC',ink:'#1C252B',muted:'#617478',accent:'#286B72',hi:'#286B72',win:'#168163',loss:'#C84355'};
  TH['minimal']={id:'minimal',name:'Minimal',mode:'light',bg:'#f5f5f2',surface:'#ffffff',line:'#e6e7e3',ink:'#202923',muted:'#7c857e',accent:'#345d4a',hi:'#345d4a',win:'#32775a',loss:'#b65a50'};
  var KEY='pnl-theme',MODE_KEY='pnl-color-mode',modes={amoled:1,black:1,white:1},cur='minimal';
  try{var sv=localStorage.getItem(KEY);if(TH[sv])cur=sv}catch(e){}
  var T=TH[cur],mode=T.mode==='light'?'white':'black';
  try{var sm=localStorage.getItem(MODE_KEY);if(modes[sm])mode=sm}catch(e){}
  function copy(t){var p={},k;for(k in t)p[k]=t[k];return p}
  function palette(t,choice){
    var p=copy(t),a=t.accent;
    /* The original look stays intact for each theme's natural dark/light mode. */
    if(choice==='black'&&t.mode==='dark')return p;
    if(choice==='white'&&t.mode==='light')return p;
    if(choice==='amoled'){
      p.bg='#000000';p.surface='#000000';p.line=mix('#000000',a,.34);p.ink='#F5F7F8';p.muted='#A5AFB8';
    }else if(choice==='black'){
      p.bg=mix('#0A0C10',a,.045);p.surface=mix('#10141A',a,.075);p.line=mix('#29323D',a,.15);p.ink='#F2F6F8';p.muted='#A3AFBA';
    }else{
      p.bg=mix('#F6F8F7',a,.025);p.surface='#FFFFFF';p.line=mix('#D8DFDC',a,.12);p.ink='#18221F';p.muted='#61726C';
    }
    p.btnInk=on(a);return p;
  }
  // Adjust accent and result colors to stay legible on the selected mode's surface.
  function luminance(hex){var c=h2r(hex).map(function(n){n/=255;return n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]}
  function contrast(a,b){var x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
  function legible(color,bg){if(contrast(color,bg)>=4.6)return color;var end=luminance(bg)>.35?'#000000':'#FFFFFF';for(var i=1;i<=100;i++){var x=mix(color,end,i/100);if(contrast(x,bg)>=4.6)return x}return end}
  function vars(t,choice){
    var p=palette(t,choice),v={},isA=choice==='amoled';
    p.accent=legible(p.accent,p.surface);p.hi=legible(p.hi,p.surface);
    p.win=legible(p.win,p.surface);p.loss=legible(p.loss,p.surface);
    var a=p.accent;p.btnInk=on(a);
    v['--bg']=p.bg;v['--surface']=p.surface;v['--line']=p.line;v['--ink']=p.ink;v['--muted']=p.muted;
    v['--btn']=a;v['--btn-ink']=p.btnInk||on(a);v['--curve']=p.hi;v['--accent']=p.hi;v['--hi']=p.hi;
    v['--tint']=rgb(p.hi);v['--tint-soft']=rgb(mix(a,p.bg,.4));
    v['--win']=p.win;v['--loss']=p.loss;v['--win-rgb']=rgb(p.win);v['--loss-rgb']=rgb(p.loss);
    v['--glow']='none';v['--metal']=p.line;v['--metal-soft']=p.line;v['--conic']=a;
    v['--s2']=isA?'#050505':mix(p.surface,p.bg,.48);v['--s3']=isA?'#0B0B0B':mix(p.surface,p.bg,.18);
    v['--grad']='linear-gradient(135deg,'+a+','+p.hi+')';
    for(var q=0;q<9;q++)v['--m'+q]=mix(a,p.ink,(q%3)*.12);
    return v;
  }
  var KEYS=Object.keys(vars(T,mode));
  function apply(){
    var r=document.documentElement,m=document.querySelector('meta[name="theme-color"]'),v=vars(T,mode);
    KEYS.forEach(function(k){r.style.setProperty(k,v[k])});
    r.setAttribute('data-theme','vision');r.setAttribute('data-vt',T.id);r.setAttribute('data-mode',mode==='white'?'light':'dark');r.setAttribute('data-color-mode',mode);r.style.colorScheme=mode==='white'?'light':'dark';
    if(m)m.setAttribute('content',v['--bg']);
  }
  function setMode(next){if(!modes[next])return;mode=next;try{localStorage.setItem(MODE_KEY,mode)}catch(e){}apply()}
  window.PnlTheme={
    list:[TH['minimal'],TH['floating-blue'],TH['vision-dark'],TH['clean-light'],TH.vision,TH.morpho],
    find:function(){return T},get:function(){return T.id},getMode:function(){return mode},
    set:function(id){if(!TH[id])return;T=TH[id];try{localStorage.setItem(KEY,id)}catch(e){}apply()},setMode:setMode,apply:apply,
    resolve:function(t){return t},white:function(){return mode==='white'},setWhite:function(yes){setMode(yes?'white':'black')},mix:mix,on:on
  };
  try{apply()}catch(e){}
})();

/* native full-screen: Android app passes real status/nav bar sizes, browsers fall back to env() */
(function(){
  var r=document.documentElement;
  function set(t,b){r.style.setProperty('--sat',t+'px');r.style.setProperty('--sab',b+'px')}
  window.__setInsets=set;
  try{if(window.VisionInsets)set(VisionInsets.top(),VisionInsets.bottom())}catch(e){}
  function icons(){
    try{
      if(!window.VisionInsets||!VisionInsets.setDarkIcons)return;
      var c=getComputedStyle(r).getPropertyValue('--bg').trim();
      if(c.charAt(0)!=='#'||c.length<7)return;
      var v=[1,3,5].map(function(i){return parseInt(c.substr(i,2),16)/255});
      VisionInsets.setDarkIcons((.2126*v[0]+.7152*v[1]+.0722*v[2])>.5);
    }catch(e){}
  }
  var t;function later(){clearTimeout(t);t=setTimeout(icons,60)}
  try{new MutationObserver(later).observe(r,{attributes:true,attributeFilter:['style','class','data-theme']})}catch(e){}
  window.addEventListener('load',function(){later();setTimeout(icons,800)});
})();

try{if(localStorage.getItem('pnl-lock'))document.documentElement.classList.add('locked')}catch(e){}

try{localStorage.removeItem('pnl-space')}catch(e){}
