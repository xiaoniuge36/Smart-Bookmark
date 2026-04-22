const C="smart-bookmark::settings",E="smart-bookmark::floating-pos",B={zh:{search:"搜索书签",sidepanel:"打开侧边栏",cleaner:"清理中心",copy:"复制当前 URL",qr:"生成二维码",hide:"隐藏悬浮球",copied:"已复制",placeholder:"搜索书签或本页…按回车打开"},en:{search:"Search bookmarks",sidepanel:"Open side panel",cleaner:"Cleaner",copy:"Copy current URL",qr:"Generate QR code",hide:"Hide floating ball",copied:"Copied",placeholder:"Search bookmarks or press Enter to search the web…"}};function Y(t){return t==="zh"||t==="en"?t:(navigator.language||"en").toLowerCase().startsWith("zh")?"zh":"en"}let i=null,g=null,N="en",h=!1;function G(){i||(i=document.createElement("div"),i.id="smart-bookmark-floating-root",i.style.all="initial",i.style.position="fixed",i.style.zIndex="2147483646",i.style.width="0",i.style.height="0",i.style.top="0",i.style.left="0",i.style.pointerEvents="none",document.documentElement.appendChild(i),g=i.attachShadow({mode:"open"}),U(g))}function U(t){const e=document.createElement("style");e.textContent=`
  :host { all: initial; }
  .wrap { pointer-events: auto; position: fixed; }
  .ball {
    width: 44px; height: 44px; border-radius: 22px;
    background: linear-gradient(135deg,#3b82f6,#8b5cf6);
    color: #fff;
    display:flex; align-items:center; justify-content:center;
    cursor:grab; user-select:none;
    box-shadow: 0 6px 18px rgba(0,0,0,.25);
    font-family: system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;
    font-size: 20px; font-weight: 700; letter-spacing:-.02em;
    transition: transform .15s ease;
  }
  .ball:hover { transform: scale(1.05); }
  .ball:active { cursor: grabbing; }
  .panel {
    position: fixed;
    min-width: 300px; max-width: 360px;
    background: #ffffff; color: #111;
    border-radius: 14px;
    box-shadow: 0 20px 40px rgba(0,0,0,.2);
    border: 1px solid rgba(0,0,0,.08);
    overflow: hidden;
    font-family: system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;
    font-size: 13px;
  }
  @media (prefers-color-scheme: dark) {
    .panel { background: #0b1220; color: #eef2ff; border-color: rgba(255,255,255,.08); }
    .btn:hover { background: rgba(255,255,255,.06); }
    .input { background: #111827; color: #eef2ff; border-bottom: 1px solid rgba(255,255,255,.08); }
    .hit { border-bottom: 1px solid rgba(255,255,255,.06); }
    .muted { color: #9ca3af; }
  }
  .input {
    width: 100%; box-sizing: border-box;
    padding: 10px 12px; border: none; outline: none;
    background: #f9fafb; color: #111;
    border-bottom: 1px solid rgba(0,0,0,.06);
    font-size: 13px;
  }
  .rows { max-height: 260px; overflow-y: auto; }
  .hit {
    display:flex; gap:8px; padding: 8px 12px; cursor:pointer;
    border-bottom: 1px solid rgba(0,0,0,.04);
    align-items: center;
  }
  .hit:hover { background: rgba(0,0,0,.05); }
  .hit img { width:16px; height:16px; border-radius:3px; flex: 0 0 auto; }
  .hit .t { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .hit .u { font-size: 11px; color:#6b7280; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:120px; }
  .muted { color:#6b7280; padding: 10px 12px; font-size:12px; }
  .btns { display:flex; flex-wrap:wrap; gap: 4px; padding: 8px; border-top: 1px solid rgba(0,0,0,.06); }
  .btn {
    flex: 1 0 calc(50% - 4px);
    padding: 6px 8px; border-radius: 8px;
    background: transparent; cursor:pointer; color: inherit;
    border: 0; text-align:left;
    font-size: 12px;
  }
  .btn:hover { background: rgba(0,0,0,.06); }
  .toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: rgba(15,23,42,.9); color:#fff;
    padding: 8px 14px; border-radius: 999px; font-size: 12px;
    pointer-events: none;
  }
  `,t.appendChild(e)}async function W(t){return new Promise(e=>{try{chrome.runtime.sendMessage({type:"bookmarks-search",query:t},n=>{e((n==null?void 0:n.items)??[])})}catch{e([])}})}async function K(){var t,e,n;try{const o=await((n=(e=(t=chrome.storage)==null?void 0:t.local)==null?void 0:e.get)==null?void 0:n.call(e,E));if(o!=null&&o[E])return o[E]}catch{}return{right:24,bottom:120}}async function O(t){var e,n,o;try{await((o=(n=(e=chrome.storage)==null?void 0:e.local)==null?void 0:n.set)==null?void 0:o.call(n,{[E]:t}))}catch{}}let S=null,L=null,M=!1;async function X(){if(M||(G(),!g))return;N=Y((await T()).language);const t=B[N],e=document.createElement("div");e.className="wrap";const n=await K();e.style.right=`${n.right}px`,e.style.bottom=`${n.bottom}px`;const o=document.createElement("div");o.className="ball",o.textContent="S",o.title="Smart Bookmark";const l=document.createElement("div");l.className="panel",l.style.display="none";const u=document.createElement("input");u.className="input",u.placeholder=t.placeholder,l.appendChild(u);const b=document.createElement("div");b.className="rows",l.appendChild(b);const f=document.createElement("div");f.className="btns";const y=(a,s)=>{const r=document.createElement("button");return r.className="btn",r.textContent=a,r.addEventListener("click",s),r};f.appendChild(y(t.sidepanel,()=>{chrome.runtime.sendMessage({type:"open-sidepanel"}),x(!1)})),f.appendChild(y(t.cleaner,()=>{chrome.runtime.sendMessage({type:"open-cleaner"}),x(!1)})),f.appendChild(y(t.copy,async()=>{try{await navigator.clipboard.writeText(location.href)}catch{const a=document.createElement("textarea");a.value=location.href,document.body.appendChild(a),a.select(),document.execCommand("copy"),a.remove()}_(t.copied)})),f.appendChild(y(t.qr,()=>{chrome.runtime.sendMessage({type:"open-qr",url:location.href}),x(!1)})),f.appendChild(y(t.hide,async()=>{const a=await T();await j({...a,floatingBall:!1}),I()})),l.appendChild(f);let z=null;const $=a=>{b.innerHTML="",a&&W(a).then(s=>{if(!s.length){const r=document.createElement("div");r.className="muted",r.textContent=N==="zh"?"无匹配书签":"No matches",b.appendChild(r);return}for(const r of s){const c=document.createElement("div");c.className="hit";let p="";try{p=new URL(r.url).hostname.replace(/^www\./,"")}catch{p=r.url}const m=document.createElement("img");m.src=`https://www.google.com/s2/favicons?domain=${p}&sz=32`,m.onerror=()=>m.remove();const w=document.createElement("div");w.className="t",w.textContent=r.title;const v=document.createElement("div");v.className="u",v.textContent=p,c.appendChild(m),c.appendChild(w),c.appendChild(v),c.addEventListener("click",()=>{window.location.href=r.url}),b.appendChild(c)}})};u.addEventListener("input",()=>{const a=u.value.trim();z&&clearTimeout(z),z=setTimeout(()=>$(a),120)}),u.addEventListener("keydown",a=>{if(a.key==="Enter"){const s=u.value.trim();if(!s)return;const r=b.querySelector(".hit");if(r){r.click();return}chrome.runtime.sendMessage({type:"search-bookmarks",query:s}),x(!1)}else a.key==="Escape"&&x(!1)});const x=a=>{if(h=a??!h,l.style.display=h?"block":"none",h){const s=o.getBoundingClientRect(),r=l.offsetHeight||360,c=l.offsetWidth||320,p=Math.max(8,s.top-r-8),m=Math.max(8,Math.min(window.innerWidth-c-8,s.left-(c-s.width)));l.style.top=`${p}px`,l.style.left=`${m}px`,setTimeout(()=>u.focus(),30)}};let d=null;o.addEventListener("mousedown",a=>{d={x:a.clientX,y:a.clientY,rx:parseInt(e.style.right,10)||0,ry:parseInt(e.style.bottom,10)||0,moved:!1};const s=c=>{if(!d)return;const p=c.clientX-d.x,m=c.clientY-d.y;Math.abs(p)+Math.abs(m)>3&&(d.moved=!0);const w=Math.max(0,d.rx-p),v=Math.max(0,d.ry-m);e.style.right=`${w}px`,e.style.bottom=`${v}px`},r=async()=>{window.removeEventListener("mousemove",s),window.removeEventListener("mouseup",r),d&&(d.moved?await O({right:parseInt(e.style.right,10)||0,bottom:parseInt(e.style.bottom,10)||0}):x()),d=null};window.addEventListener("mousemove",s),window.addEventListener("mouseup",r)}),e.appendChild(o),e.appendChild(l),g.appendChild(e),L=e,S=l,M=!0,document.addEventListener("click",H,!0)}function H(t){if(!h||!L)return;t.composedPath().includes(L)||(h=!1,S&&(S.style.display="none"))}function I(){M&&(i&&i.remove(),i=null,g=null,S=null,L=null,M=!1,h=!1,document.removeEventListener("click",H,!0))}function _(t){if(!g)return;const e=document.createElement("div");e.className="toast",e.textContent=t,g.appendChild(e),setTimeout(()=>e.remove(),1600)}async function T(){var t,e,n;try{const o=await((n=(e=(t=chrome.storage)==null?void 0:t.local)==null?void 0:e.get)==null?void 0:n.call(e,C));return(o==null?void 0:o[C])??{}}catch{return{}}}async function j(t){var e,n,o;try{await((o=(n=(e=chrome.storage)==null?void 0:e.local)==null?void 0:n.set)==null?void 0:o.call(n,{[C]:t}))}catch{}}async function R(){(await T()).floatingBall?X().catch(console.warn):I()}R();var q,k,P;(P=(k=(q=chrome.storage)==null?void 0:q.onChanged)==null?void 0:k.addListener)==null||P.call(k,(t,e)=>{e==="local"&&t[C]&&R()});
