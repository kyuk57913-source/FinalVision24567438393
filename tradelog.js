/* Tradelog features merged into Vision: P&L treemap heatmap, daily P&L bars, win/loss split bar.
   Loads after app.js + extras.js and wraps renderDashMain, so the new blocks sit inside
   the existing dashboard tabs (Overview / Data View / Breakdown).

   Heatmap (styled after a liquidation heatmap):
   - squarified treemap, tile area = gross traded amount, colour = net win / loss
   - tabs: Symbols | Sessions | Session › Symbol (nested)
   - symbol icons and font sizes scale with tile size; tiny tiles drop labels
   - tap (or hover with a mouse) a tile for a detail card with a "Filter" button
   - red → green legend scale with a marker at your win share */
try{(function(){
var MODE_KEY='pnl-heat-mode',MODES=['symbol','session','nested'],mode='symbol';
try{var sm=localStorage.getItem(MODE_KEY);if(MODES.indexOf(sm)>-1)mode=sm}catch(e){}
var SIZE_KEY='pnl-heat-size',size='amt';
try{if(localStorage.getItem(SIZE_KEY)==='cnt')size='cnt'}catch(e){}
var MAP_H=360,TT=[],tipEl=null,tipIdx=-1;

var css=
'.tl-hd{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}.tl-hd h2{margin:0}'+
'.tl-tabs{display:flex;gap:2px;padding:3px;border-radius:999px;background:var(--s2,var(--surface));border:1px solid var(--line);max-width:100%;overflow-x:auto;scrollbar-width:none}.tl-tabs::-webkit-scrollbar{display:none}'+
'.tl-tabs button{flex:none;min-height:30px;padding:0 12px;border:0;border-radius:999px!important;background:transparent;color:var(--muted);font:inherit;font-size:12.5px;font-weight:600;white-space:nowrap;cursor:pointer}'+
'.tl-tabs button[aria-pressed="true"]{background:var(--ink);color:var(--bg)}.tl-range{display:flex;width:100%;margin-top:6px}.tl-range button{flex:1}'+
'.tl-tm{position:relative;height:'+MAP_H+'px;margin-top:12px}'+
'.tl-tiles{position:absolute;inset:0;border-radius:12px;overflow:hidden;background:var(--surface)}'+
'.tl-grp{position:absolute;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ink) 18%,transparent);border-radius:4px;pointer-events:none}'+
'.tl-gl{position:absolute;left:5px;top:2px;right:5px;font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--ink);opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
'.tl-tile{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;overflow:hidden;box-shadow:inset 0 0 0 1.5px var(--bg);border-radius:4px;font-weight:700;text-align:center;line-height:1.1;padding:2px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.25);cursor:pointer;outline:none;animation:tlpop .5s cubic-bezier(.2,.8,.2,1) both;-webkit-tap-highlight-color:transparent}'+
'.tl-tile:focus-visible,.tl-tile.on{box-shadow:inset 0 0 0 2px #fff}'+
'.tl-tile small{font-weight:600;opacity:.92}'+
'.tl-ic{display:inline-flex;flex:none;align-items:center;justify-content:center;filter:drop-shadow(0 1px 2px rgba(0,0,0,.25))}'+
'.tl-ic .sico,.tl-ic .spair{width:100%;height:100%}.tl-ic .spair svg{width:62%;height:62%}'+
'.tl-ic>svg{width:100%;height:100%;border-radius:50%}'+
'@keyframes tlpop{from{opacity:0;transform:scale(.7)}}'+
'.tl-tip{position:absolute;z-index:6;width:210px;padding:12px;border-radius:12px;background:var(--surface);color:var(--ink);border:1px solid var(--line);box-shadow:0 16px 40px -10px rgba(0,0,0,.6);font-size:12.5px;text-shadow:none;animation:tlfade .14s ease-out both}'+
'@keyframes tlfade{from{opacity:0;transform:translateY(4px)}}'+
'.tl-tip .th{display:flex;align-items:center;gap:8px;margin-bottom:8px}.tl-tip .th b{display:block;font-size:14px}.tl-tip .th span.s{display:block;color:var(--muted);font-size:11.5px}'+
'.tl-tip .th .tl-ic{width:26px;height:26px}'+
'.tl-tip .r{display:flex;justify-content:space-between;gap:8px;padding:2px 0}.tl-tip .r span:first-child{color:var(--muted)}.tl-tip .r em{font-style:normal;color:var(--muted);margin-left:6px;display:inline-block;min-width:30px;text-align:right}'+
'.tl-tip .r.t{padding-bottom:6px;margin-bottom:4px;border-bottom:1px solid var(--line);font-size:13.5px;font-weight:700}'+
'.tl-tip .bar{display:flex;height:5px;border-radius:9px;overflow:hidden;background:var(--loss);margin:8px 0 2px}.tl-tip .bar i{background:var(--win)}'+
'.tl-tip button{width:100%;margin-top:8px;min-height:34px;border:1px solid var(--line);border-radius:999px!important;background:var(--s2,var(--bg));color:var(--ink);font:inherit;font-size:12.5px;font-weight:600;cursor:pointer}'+
'.tl-tm.sel .tl-tile:not(.on){opacity:.5;transition:opacity .15s}'+
'.tl-tile small.c{font-weight:500;opacity:.8}'+
'.tl-tip.sm{width:156px;padding:9px 10px;font-size:11.5px;border-radius:10px}.tl-tip.sm .th{margin-bottom:6px}.tl-tip.sm .th .tl-ic{width:20px;height:20px}.tl-tip.sm .th b{font-size:12.5px}.tl-tip.sm button{min-height:28px;margin-top:6px;font-size:11.5px}'+
'.tl-tip .x{position:absolute;right:6px;top:6px;width:24px;height:24px;margin:0;padding:0;min-height:0;border:0;background:transparent;color:var(--muted);font-size:15px;line-height:1}'+
'.tl-sum{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:12px}'+
'.tl-sum>div{min-width:0;padding:8px 9px;border-radius:10px;background:var(--s2,var(--surface));border:1px solid var(--line)}'+
'.tl-sum small{display:block;font-size:10.5px;color:var(--muted);letter-spacing:.02em}'+
'.tl-sum b{display:block;margin-top:2px;font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
'.tl-sum i{display:block;font-style:normal;font-size:10.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
'.tl-opt{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:12px;color:var(--muted)}.tl-opt .tl-tabs button{min-height:26px;padding:0 10px;font-size:12px}'+
'.tl-leg{margin-top:12px}'+
'.tl-leg .sc{position:relative;display:flex;gap:2px;height:7px}.tl-leg .sc i{flex:1;border-radius:2px}'+
'.tl-leg .mk{position:absolute;top:-5px;width:0;height:0;margin-left:-5px;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid var(--ink);transition:left .6s cubic-bezier(.2,.8,.2,1)}'+
'.tl-leg .tk{display:flex;justify-content:space-between;margin-top:6px;font-size:11.5px;color:var(--muted)}'+
'.tl-leg .cap{margin-top:8px;font-size:12.5px;color:var(--muted)}.tl-leg .cap em{font-style:normal;font-weight:600}'+
'.tl-ls{display:flex;height:6px;border-radius:9px;overflow:hidden;margin:14px 0 8px;background:var(--line)}'+
'.tl-ls i{background:var(--win);transform-origin:left;animation:tlgrow .9s cubic-bezier(.2,.8,.2,1) both}.tl-ls b{flex:1;background:var(--loss)}'+
'@keyframes tlgrow{from{transform:scaleX(0)}}'+
'.tl-lsr{display:flex;justify-content:space-between;gap:8px;font-size:13px;color:var(--muted)}.tl-lsr em{font-style:normal;font-weight:600}'+
'.tl-chart svg{width:100%;height:auto;display:block;margin-top:12px}.tl-ax{stroke:var(--line)}'+
'.tl-bar{transform-box:fill-box;transform-origin:center bottom;animation:tlrise .7s cubic-bezier(.2,.8,.2,1) both}'+
'.tl-bar.w{fill:var(--win)}.tl-bar.l{fill:var(--loss)}'+
'@keyframes tlrise{from{transform:scaleY(0)}}'+
'.tl-sec{margin-top:22px}'+
'.lite .tl-tile,.lite .tl-bar,.lite .tl-ls i,.lite .tl-tip{animation:none}'+
'@media (prefers-reduced-motion:reduce){.tl-tile,.tl-bar,.tl-ls i,.tl-tip{animation:none}}';
var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

var cm=function(n){return MASK?'•••':compact(n)};
var km=function(n){if(MASK)return '•••';var a=Math.abs(n);return (n<0?'−':'')+'$'+(a>=10000?Math.round(a/1000)+'K':a>=1000?(a/1000).toFixed(1)+'K':Math.round(a))};
var fm=function(n){return MASK?'•••••':money(n)};
var SES_FLAG={'Asia':'jp','London':'gb','New York':'us'};

/* ---------- squarified treemap ---------- */
function worst(row,s,side){var mx=0,mn=1e18;row.forEach(function(r){if(r.a>mx)mx=r.a;if(r.a<mn)mn=r.a});return Math.max(side*side*mx/(s*s),s*s/(side*side*mn))}
function squar(items,x,y,w,h,out){
  if(!items.length||w<=0||h<=0)return;
  var tot=0;items.forEach(function(o){tot+=o.v});
  var k=w*h/tot,rest=items.map(function(o){return{o:o,a:Math.max(o.v*k,.0001)}});
  while(rest.length){
    var side=Math.min(w,h),row=[rest[0]],s=rest[0].a,i=1;
    while(i<rest.length){var nr=row.concat(rest[i]),ns=s+rest[i].a;if(worst(nr,ns,side)<=worst(row,s,side)){row=nr;s=ns;i++}else break}
    rest=rest.slice(i);
    if(w>=h){var cw=s/h,cy=y;row.forEach(function(r){var rh=r.a/cw;out.push({it:r.o,x:x,y:cy,w:cw,h:rh});cy+=rh});x+=cw;w-=cw}
    else{var rh2=s/w,cx=x;row.forEach(function(r){var rw=r.a/rh2;out.push({it:r.o,x:cx,y:y,w:rw,h:rh2});cx+=rw});y+=rh2;h-=rh2}
    if(w<=0||h<=0)break;
  }
}

/* ---------- data ---------- */
function group(D,keyFn){
  var g={};
  D.forEach(function(t){var k=keyFn(t),o=g[k]||(g[k]={n:k,p:0,w:0,l:0,c:0,wc:0});o.p+=t.pnl;o.c++;if(t.pnl>0){o.w+=t.pnl;o.wc++}else if(t.pnl<0)o.l+=-t.pnl});
  return Object.keys(g).map(function(k){var o=g[k];o.v=size==='cnt'?Math.max(o.c,.01):Math.max(o.w+o.l,.01);return o}).sort(function(a,b){return b.v-a.v});
}
function sesOf(t){return t.session||'No session'}

/* ---------- rendering ---------- */
function icon(kind,name,px){
  var inner;
  if(kind==='ses'){inner=SES_FLAG[name]?'<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#fl-'+SES_FLAG[name]+'"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#3A4350"/><text x="12" y="15.3" text-anchor="middle" font-size="9" font-weight="700" fill="#fff" font-family="Arial,sans-serif">?</text></svg>'}
  else inner=symIcon(name);
  return '<span class="tl-ic" style="width:'+px+'px;height:'+px+'px">'+inner+'</span>';
}
function tileHtml(r,i,kind,nest){
  var o=r.it,w=r.w,h=r.h,m=Math.min(w,h),sign=o.p>=0,mxA=r.mx||1;
  var pc=Math.round(52+38*Math.min(1,Math.abs(o.p)/mxA)),col=sign?'var(--win)':'var(--loss)';
  var cs=getComputedStyle(document.documentElement),cv=(cs.getPropertyValue(sign?'--win':'--loss')||'').trim(),bg,tc='#fff';
  if(/^#[0-9a-f]{6}$/i.test(cv)){var P=window.PnlTheme,hx=P.mix('#0b0f12',cv,pc/100);bg=hx;
    var lum=function(h){var c=[1,3,5].map(function(i){var v=parseInt(h.substr(i,2),16)/255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]},L=lum(hx);
    tc=(1.05/(L+.05)>=(L+.05)/.05)?'#fff':'#0b0f12';
    var cr=function(a,b){var x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)},tg=tc==='#fff'?'#000000':'#ffffff',k=0;
    while(cr(bg,tc==='#fff'?'#ffffff':'#0b0f12')<4.7&&k<30){bg=P.mix(bg,tg,.06);k++}}
  else bg='color-mix(in srgb,'+col+' '+pc+'%,#0b0f12)';
  var inner='';
  if(m>=20){
    var ic=Math.round(Math.max(14,Math.min(36,m*.36))),showIc=m>=30;
    var label=o.n,len=Math.max(2,label.length);
    var fs=Math.max(8,Math.min(16,w*.92/(len*.62),h*.2));
    var canName=w>=40&&h>=(showIc?ic+fs+10:fs+8);
    var canVal=canName&&h>=(ic+fs*2+16)&&w>=52;
    var canCnt=canVal&&h>=(ic+fs*3+26)&&w>=60;
    if(!canName){label=label.replace(/[^A-Za-z0-9]/g,'').slice(0,w>=30?3:2);fs=Math.max(7,Math.min(10,m*.3))}
    inner=(showIc?icon(kind,o.n,ic):'')+((canName||!showIc)?'<span style="font-size:'+fs.toFixed(1)+'px">'+esc(canName?o.n:label)+'</span>':'')+(canVal?'<small style="font-size:'+Math.max(9,fs*.78).toFixed(1)+'px">'+km(o.p)+'</small>':'')+(canCnt?'<small class="c" style="font-size:'+Math.max(9,fs*.66).toFixed(1)+'px">'+o.c+(w>=76?(o.c===1?' trade':' trades'):'\u00d7')+'</small>':'');
  }
  return '<div class="tl-tile" role="button" tabindex="0" data-tli="'+i+'" aria-label="'+esc(o.n)+', '+(MASK?'':money(o.p)+', ')+o.c+' trades" style="left:'+r.x.toFixed(2)+'px;top:'+r.y.toFixed(2)+'px;width:'+r.w.toFixed(2)+'px;height:'+r.h.toFixed(2)+'px;background:'+bg+';color:'+tc+';text-shadow:'+(tc==='#fff'?'0 1px 2px rgba(0,0,0,.25)':'none')+';animation-delay:'+Math.min(i*30,600)+'ms">'+inner+'</div>';
}
function heatTiles(D,W){
  TT=[];var out=[],html='',H=MAP_H;
  var kind=mode==='session'?'ses':'sym';
  if(mode==='nested'){
    var gs=group(D,sesOf),gr=[];squar(gs,0,0,W,H,gr);
    var all=[];
    gr.forEach(function(g){
      var head=(g.h>44&&g.w>70)?18:0,syms=group(D.filter(function(t){return sesOf(t)===g.it.n}),function(t){return t.symbol}),rr=[];
      squar(syms,g.x+1.5,g.y+head+1.5,g.w-3,g.h-head-3,rr);
      html+='<div class="tl-grp" style="left:'+g.x.toFixed(1)+'px;top:'+g.y.toFixed(1)+'px;width:'+g.w.toFixed(1)+'px;height:'+g.h.toFixed(1)+'px">'+(head?'<span class="tl-gl">'+esc(g.it.n)+' · '+km(g.it.p)+'</span>':'')+'</div>';
      rr.forEach(function(r){r.grp=g.it.n;all.push(r)});
    });
    var mx=Math.max.apply(null,all.map(function(r){return Math.abs(r.it.p)}).concat(.01));
    all.forEach(function(r){r.mx=mx;r.kind='sym'});out=all;
  }else{
    var items=group(D,mode==='session'?sesOf:function(t){return t.symbol});
    squar(items,0,0,W,H,out);
    var mx2=Math.max.apply(null,out.map(function(r){return Math.abs(r.it.p)}).concat(.01));
    out.forEach(function(r){r.mx=mx2;r.kind=kind});
  }
  var tiles=out.map(function(r,i){TT.push(r);return tileHtml(r,i,r.kind,mode==='nested')}).join('');
  /* group frames sit above the tiles so their outline shows; they ignore pointer events */
  return '<div class="tl-tiles">'+tiles+html+'</div>';
}
function sumHtml(D){
  var net=sum(D.map(function(t){return t.pnl})),g=group(D,mode==='session'?sesOf:function(t){return t.symbol}).slice().sort(function(a,b){return b.p-a.p});
  var best=g[0],worst=g[g.length-1];
  var cell=function(l,v,c,s){return '<div><small>'+l+'</small><b class="'+(c||'')+'">'+v+'</b><i>'+s+'</i></div>'};
  return '<div class="tl-sum">'+cell('Net P&amp;L',km(net),cls(net),'period')+cell('Trades',D.length,'',g.length+(mode==='session'?' sessions':' symbols'))+(best?cell('Best',km(best.p),cls(best.p),esc(best.n)):'')+(worst&&worst!==best?cell('Worst',km(worst.p),cls(worst.p),esc(worst.n)):cell('Worst','\u2014','','\u2014'))+'</div>';
}
function legendHtml(D){
  var s=stats(D),gp=s.gw,gl=sum(D.filter(function(t){return t.pnl<0}).map(function(t){return -t.pnl}));
  var tot=gp+gl,wp=tot?Math.round(gp/tot*100):50,segs='';
  for(var i=0;i<6;i++)segs+='<i style="background:color-mix(in srgb,var(--loss) '+(100-i*20)+'%,var(--win))"></i>';
  return '<div class="tl-leg"><div class="sc">'+segs+'<span class="mk" style="left:'+wp+'%"></span></div>'+
    '<div class="tk"><span>Losses</span><span>17%</span><span>33%</span><span>50%</span><span>67%</span><span>83%</span><span>Wins</span></div>'+
    '<div class="cap">Wins <em class="win">'+cm(gp)+'</em> '+wp+'% &nbsp;·&nbsp; <em class="loss">'+cm(-gl)+'</em> '+(100-wp)+'% Losses</div></div>';
}
function heatBody(D){
  var host=document.getElementById('tlPage'),W=Math.round(((host&&host.clientWidth)||(window.innerWidth-32))||360);
  W=Math.max(260,Math.min(W,720));
  return sumHtml(D)+'<div class="tl-tm" style="max-width:'+W+'px">'+heatTiles(D,W)+'</div>'+legendHtml(D);
}
function heatShell(D){
  var b=function(v,l){return '<button type="button" data-tlheat="'+v+'" aria-pressed="'+(mode===v)+'">'+l+'</button>'};
  var rg=function(v,l){return '<button type="button" data-tlr="'+v+'" aria-pressed="'+((SET.dashRange||'90')===v)+'">'+l+'</button>'};
  return '<div class="tl-range tl-tabs" role="group" aria-label="Period">'+rg('7','7 days')+rg('30','30 days')+rg('90','90 days')+rg('all','All time')+'</div><div class="tl-sec" style="margin-top:16px"><div class="tl-hd"><h2>P&amp;L heatmap</h2><div class="tl-tabs" role="group" aria-label="Heatmap grouping">'+b('symbol','Symbols')+b('session','Sessions')+b('nested','Session › Symbol')+'</div></div><div class="tl-opt"><span>Tile size by</span><div class="tl-tabs" role="group" aria-label="Tile size"><button type="button" data-tlsize="amt" aria-pressed="'+(size==='amt')+'">Amount</button><button type="button" data-tlsize="cnt" aria-pressed="'+(size==='cnt')+'">Trades</button></div></div><div id="tlBody">'+heatBody(D)+'</div></div>';
}

/* ---------- tooltip ---------- */
function closeTip(){
  document.querySelectorAll('.tl-tip').forEach(function(e){e.remove()});tipEl=null;
  document.querySelectorAll('.tl-tile.on').forEach(function(e){e.classList.remove('on')});
  var tm=document.querySelector('#tlBody .tl-tm');if(tm)tm.classList.remove('sel');tipIdx=-1;
}
function openTip(i){
  var tm=document.querySelector('#tlBody .tl-tm'),r=TT[i];if(!tm||!r)return;
  closeTip();tipIdx=i;tm.classList.add('sel');
  var o=r.it,tile=tm.querySelector('[data-tli="'+i+'"]');if(tile)tile.classList.add('on');
  var tot=o.w+o.l,wp=tot?Math.round(o.w/tot*100):0,kind=r.kind;
  var sm=r.w<96||r.h<76;
  var sub=(r.grp?esc(r.grp)+' \u00b7 ':'')+o.c+' trade'+(o.c===1?'':'s');
  var canView=(kind==='sym')||(o.n!=='No session');
  var btn=canView?'<button type="button" data-tlfilter="'+esc(o.n)+'">View trades</button>':'';
  var all=TT.reduce(function(a,x){return a+x.it.w+x.it.l},0),share=all?Math.round(tot/all*100):0;
  var el=document.createElement('div');el.className='tl-tip'+(sm?' sm':'');
  if(sm){
    el.innerHTML='<div class="th">'+icon(kind,o.n,20)+'<div><b>'+esc(o.n)+'</b></div></div>'+
      '<div class="r t"><span>Net</span><span class="'+cls(o.p)+'">'+fm(o.p)+'</span></div>'+
      '<div class="r"><span>Trades</span><span>'+o.c+' \u00b7 '+Math.round(o.wc/o.c*100)+'% won</span></div>'+btn;
  }else{
    el.innerHTML='<button type="button" class="x" data-tlclose aria-label="Close">\u2715</button><div class="th">'+icon(kind,o.n,26)+'<div><b>'+esc(o.n)+'</b><span class="s">'+sub+'</span></div></div>'+
      '<div class="r t"><span>Net P&amp;L</span><span class="'+cls(o.p)+'">'+fm(o.p)+'</span></div>'+
      '<div class="r"><span>Wins</span><span class="win">'+fm(o.w)+'<em>'+wp+'%</em></span></div>'+
      '<div class="r"><span>Losses</span><span class="loss">'+fm(-o.l)+'<em>'+(tot?100-wp:0)+'%</em></span></div>'+
      '<div class="r"><span>Trades</span><span>'+o.c+'</span></div>'+
      '<div class="r"><span>Win rate</span><span>'+Math.round(o.wc/o.c*100)+'%</span></div>'+
      '<div class="r"><span>Avg / trade</span><span class="'+cls(o.p)+'">'+fm(o.p/o.c)+'</span></div>'+
      '<div class="r"><span>Share of volume</span><span>'+share+'%</span></div>'+
      '<div class="bar"><i style="width:'+wp+'%"></i></div>'+btn;
  }
  tm.appendChild(el);tipEl=el;
  var W=tm.clientWidth,tw=el.offsetWidth,th=el.offsetHeight;
  var left=Math.max(4,Math.min(W-tw-4,r.x+r.w/2-tw/2));
  var top=r.y+r.h+6;if(top+th>MAP_H)top=r.y-th-6;if(top<4)top=Math.max(4,Math.min(MAP_H-th-4,r.y+r.h/2-th/2));
  el.style.left=left+'px';el.style.top=top+'px';
}

/* ---------- other charts (unchanged) ---------- */
function dailyHtml(D){
  var d={};D.forEach(function(t){d[t.date]=(d[t.date]||0)+t.pnl});
  var k=Object.keys(d).sort().slice(-14);if(!k.length)return '';
  var vals=k.map(function(x){return d[x]}),mx=Math.max.apply(null,vals.map(Math.abs).concat(1));
  var W=320,H=150,m=H/2,bw=W/k.length;
  var bars=k.map(function(x,i){var v=d[x],h=Math.max(2,Math.abs(v)/mx*(m-14)),y=v>=0?m-h:m;
    return '<rect class="tl-bar '+(v>=0?'w':'l')+'" x="'+(i*bw+bw*.18).toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+(bw*.64).toFixed(1)+'" height="'+h.toFixed(1)+'" rx="2" style="animation-delay:'+(i*40)+'ms"><title>'+shortDay(x)+': '+dmoney(v)+'</title></rect>'}).join('');
  var best=Math.max.apply(null,vals),worst=Math.min.apply(null,vals);
  return '<div class="tl-sec"><h2>Daily P&amp;L</h2><div class="tl-chart"><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Daily profit and loss, last '+k.length+' trading days"><line class="tl-ax" x1="0" x2="'+W+'" y1="'+m+'" y2="'+m+'"/>'+bars+'</svg>'+
    '<div class="tl-lsr" style="padding-top:6px"><span>'+shortDay(k[0])+'</span><span>Best <em class="win">'+dmoney(best)+'</em> &nbsp; Worst <em class="loss">'+dmoney(worst)+'</em></span><span>'+shortDay(k[k.length-1])+'</span></div></div></div>';
}
function splitHtml(D){
  var s=stats(D),gp=s.gw,gl=sum(D.filter(function(t){return t.pnl<0}).map(function(t){return t.pnl}));
  var tot=gp+Math.abs(gl),wp=tot?Math.round(gp/tot*100):50;
  return '<div class="tl-ls" role="img" aria-label="Wins '+wp+'%, losses '+(100-wp)+'%"><i style="width:'+wp+'%"></i><b></b></div>'+
    '<div class="tl-lsr"><span>Wins <em class="win">'+cm(gp)+'</em> '+wp+'%</span><span>'+(100-wp)+'% <em class="loss">'+cm(gl)+'</em> Losses</span></div>';
}

function enhance(){
  var el=document.getElementById('dmain');if(!el)return;
  var D=dashTrades();if(!D||!D.length)return;
  var ov=el.querySelector('.dt-overview'),ch=el.querySelector('.dt-charts'),br=el.querySelector('.dt-breakdown');
  if(ov){var sp=document.createElement('div');sp.className='tl-split';sp.innerHTML=splitHtml(D);var kv=ov.querySelector('.kv');if(kv&&kv.parentNode===ov)ov.insertBefore(sp,kv.nextSibling);else ov.insertBefore(sp,ov.firstChild)}
  if(ch){var dd=document.createElement('div');dd.innerHTML=dailyHtml(D);ch.appendChild(dd)}
  tipEl=null;tipIdx=-1;
}
var orig=renderDashMain;
renderDashMain=function(){orig.apply(this,arguments);try{enhance()}catch(e){console.error(e)}};

function renderHeat(){
  var pg=document.getElementById('tlPage');if(!pg)return;closeTip();
  var D=dashTrades();
  if(!D.length){pg.innerHTML='<div class="tl-range tl-tabs" role="group" aria-label="Period">'+['7|7 days','30|30 days','90|90 days','all|All time'].map(function(x){var p=x.split('|');return '<button type="button" data-tlr="'+p[0]+'" aria-pressed="'+((SET.dashRange||'90')===p[0])+'">'+p[1]+'</button>'}).join('')+'</div><p class="empty">'+(S.trades.length?'No trades in this period.':'Add some trades and your P&amp;L heatmap shows up here.')+'</p>';return}
  pg.innerHTML=heatShell(D);
}
window.renderHeat=renderHeat;
function redraw(){var b=document.getElementById('tlBody');if(!b)return;closeTip();b.innerHTML=heatBody(dashTrades())}

document.addEventListener('click',function(e){
  var t=e.target,b=t.closest&&t.closest('[data-tlheat]');
  if(b){
    var v=b.getAttribute('data-tlheat');mode=MODES.indexOf(v)>-1?v:'symbol';
    try{localStorage.setItem(MODE_KEY,mode)}catch(_){}
    document.querySelectorAll('[data-tlheat]').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});
    redraw();return;
  }
  var sz=t.closest&&t.closest('[data-tlsize]');
  if(sz){size=sz.getAttribute('data-tlsize')==='cnt'?'cnt':'amt';try{localStorage.setItem(SIZE_KEY,size)}catch(_){}renderHeat();return}
  if(t.closest&&t.closest('[data-tlclose]')){closeTip();return}
  var f=t.closest&&t.closest('[data-tlfilter]');
  if(f){var sym=f.getAttribute('data-tlfilter');closeTip();try{DS.q=sym;DS.show=50;S.tab='trades';render();var si=document.getElementById('dsearch');if(si)si.value=sym;if(typeof renderDashList==='function')renderDashList();document.body.scrollTop=0;window.scrollTo(0,0)}catch(_){}return}
  var rb=t.closest&&t.closest('[data-tlr]');
  if(rb){SET.dashRange=rb.getAttribute('data-tlr');try{saveSet()}catch(_){}renderHeat();return}
  var tile=t.closest&&t.closest('.tl-tile');
  if(tile){var i=+tile.getAttribute('data-tli');if(tipIdx===i)closeTip();else openTip(i);return}
  if(!(t.closest&&t.closest('.tl-tip')))closeTip();
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape')closeTip();
  if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('tl-tile')){e.preventDefault();e.target.click()}
});
window.addEventListener('scroll',function(){if(tipEl)closeTip()},true);
var rz=0,lastW=window.innerWidth;
window.addEventListener('resize',function(){clearTimeout(rz);rz=setTimeout(function(){if(window.innerWidth!==lastW){lastW=window.innerWidth;redraw()}},200)});

window.addEventListener('pnl-themechange',function(){try{if(document.getElementById('tlBody'))redraw()}catch(e){}});
window.__tl={renderHeat:renderHeat,heatShell:heatShell,dailyHtml:dailyHtml,splitHtml:splitHtml,enhance:enhance};
/* Dashboard may already be on screen when this file loads: draw once more */
try{if(typeof S!=='undefined'&&S.tab==='dash'&&document.getElementById('dmain')&&document.getElementById('dmain').firstChild)renderDashMain()}catch(e){}
})()}catch(e){console.error(e)}
