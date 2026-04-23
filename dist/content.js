const H="smart-bookmark::settings",B="smart-bookmark::edge-tab-top",J="smart-bookmark::session-hidden",ae={zh:{placeholder:"搜索书签或命令…",sectionBookmarks:"书签",sectionActions:"命令",emptyBookmarks:"无匹配书签",sidepanel:"打开侧边栏",cleaner:"打开清理中心",copy:"复制当前 URL",qr:"生成二维码",hide:"隐藏悬浮球",copied:"已复制",kbdOpen:"打开",kbdNav:"移动",menuHideSession:"隐藏直到下一次访问",menuDisableSite:"此页面禁用",menuDisableGlobal:"全局禁用",menuFooterPrefix:"您可以在",menuFooterLink:"设置页面",menuFooterSuffix:"中重新启用"},en:{placeholder:"Search bookmarks or actions…",sectionBookmarks:"Bookmarks",sectionActions:"Actions",emptyBookmarks:"No matches",sidepanel:"Open side panel",cleaner:"Open cleaner",copy:"Copy current URL",qr:"Generate QR code",hide:"Hide floating ball",copied:"Copied",kbdOpen:"Open",kbdNav:"Navigate",menuHideSession:"Hide until next visit",menuDisableSite:"Disable on this site",menuDisableGlobal:"Disable globally",menuFooterPrefix:"Re-enable in",menuFooterLink:"Settings",menuFooterSuffix:""}};function ie(t){return t==="zh"||t==="en"?t:(navigator.language||"en").toLowerCase().startsWith("zh")?"zh":"en"}const w={search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',panel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/></svg>',sparkles:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3v4M7 5h4M17 11v4M15 13h4"/><path d="M12 7l1.8 4.2L18 13l-4.2 1.8L12 19l-1.8-4.2L6 13l4.2-1.8z"/></svg>',copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',qr:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M21 14v3M14 21h3M21 21h.01"/></svg>',x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',bookmark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>'};let l=null,y=null,W="en",b=!1,C=!1;function se(){l||(l=document.createElement("div"),l.id="smart-bookmark-floating-root",l.style.all="initial",l.style.position="fixed",l.style.zIndex="2147483646",l.style.width="0",l.style.height="0",l.style.top="0",l.style.left="0",l.style.pointerEvents="none",document.documentElement.appendChild(l),y=l.attachShadow({mode:"open"}),re(y))}function re(t){const e=document.createElement("style");e.textContent=`
  :host { all: initial; }
  .wrap {
    pointer-events: auto;
    position: fixed;
    right: 12px;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Inter", "PingFang SC", "Microsoft YaHei", sans-serif;
  }

  /* ---------- 贴边标签（白色胶囊 + 品牌色图标） ---------- */
  .tab {
    position: relative;
    width: 36px; height: 36px;
    border-radius: 999px;
    background: #ffffff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; user-select: none;
    transition: transform .2s ease, box-shadow .2s ease;
    box-shadow:
      0 0 0 1px rgba(15,23,42,.06),
      0 6px 20px rgba(15,23,42,.12),
      0 2px 6px rgba(15,23,42,.06);
  }
  .wrap:hover .tab,
  .tab.is-active {
    transform: translateX(-4px) scale(1.04);
    box-shadow:
      0 0 0 1px rgba(99,102,241,.18),
      0 10px 28px rgba(15,23,42,.18),
      0 4px 10px rgba(99,102,241,.18);
  }
  .tab .bm-icon {
    width: 20px; height: 20px;
    pointer-events: none;
    transition: transform .2s ease;
  }
  .wrap:hover .tab .bm-icon {
    transform: scale(1.08);
  }

  /* ---------- 关闭按钮 ---------- */
  .close-btn {
    position: absolute;
    top: -8px; right: -8px;
    width: 22px; height: 22px;
    border-radius: 50%;
    background: #6b7280;
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    opacity: 0;
    pointer-events: none;
    transform: scale(.75);
    transition: opacity .15s ease, transform .15s ease, background .15s ease;
    box-shadow: 0 2px 6px rgba(15,23,42,.25);
    border: 2px solid #fff;
  }
  .close-btn:hover { background: #374151; }
  .close-btn svg { width: 11px; height: 11px; }
  .wrap:hover .close-btn,
  .close-btn.is-visible {
    opacity: 1;
    pointer-events: auto;
    transform: scale(1);
  }

  /* ---------- 关闭菜单 ---------- */
  .close-menu {
    position: absolute;
    top: 4px; right: 52px;
    min-width: 240px;
    background: #ffffff;
    border-radius: 14px;
    box-shadow:
      0 0 0 1px rgba(15,23,42,.06),
      0 16px 40px rgba(15,23,42,.18),
      0 4px 12px rgba(15,23,42,.08);
    padding: 10px 0 0;
    color: #0f172a;
    display: none;
    animation: slideIn .18s ease;
  }
  .close-menu.is-open { display: block; }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(6px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .close-menu-item {
    padding: 14px 20px;
    cursor: pointer;
    color: #111827;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.35;
    transition: background .12s ease;
  }
  .close-menu-item:hover { background: #f5f6f8; }
  .close-menu-item:active { background: #eceef1; }
  .close-menu-footer {
    padding: 12px 20px 14px;
    margin-top: 6px;
    border-top: 1px solid #eef0f3;
    font-size: 12px;
    color: #6b7280;
    line-height: 1.5;
    background: #fafbfc;
    border-radius: 0 0 14px 14px;
  }
  .close-menu-footer .settings-link {
    color: #6366f1;
    cursor: pointer;
    text-decoration: none;
    font-weight: 500;
  }
  .close-menu-footer .settings-link:hover { text-decoration: underline; }

  /* ---------- 搜索面板（保持原样，稍作适配） ---------- */
  .panel {
    position: fixed;
    min-width: 440px; max-width: 520px;
    background: rgba(13,13,14,.96);
    color: #f4f4f5;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,.08);
    box-shadow:
      0 0 0 1px rgba(255,255,255,.02),
      0 24px 60px rgba(0,0,0,.5);
    backdrop-filter: blur(18px) saturate(140%);
    -webkit-backdrop-filter: blur(18px) saturate(140%);
    overflow: hidden;
    font-family: inherit;
    font-size: 13px;
    letter-spacing: -0.005em;
  }
  .search {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 14px;
    border-bottom: 1px solid rgba(255,255,255,.06);
  }
  .search .icon { flex: 0 0 auto; width: 16px; height: 16px; color: #a1a1aa; display: inline-flex; }
  .search .icon svg { width: 100%; height: 100%; }
  .input {
    flex: 1 1 auto; min-width: 0;
    background: transparent; border: 0; outline: 0;
    color: #f4f4f5; font-size: 14px;
    font-family: inherit; letter-spacing: inherit;
    padding: 2px 0;
  }
  .input::placeholder { color: #71717a; }

  .body {
    max-height: 380px; overflow-y: auto;
    padding: 4px 0 8px;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,.08) transparent;
  }
  .body::-webkit-scrollbar { width: 8px; }
  .body::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 8px; }

  .section-title {
    padding: 10px 14px 6px;
    font-size: 10.5px; font-weight: 600;
    text-transform: uppercase; letter-spacing: .08em;
    color: #71717a;
  }

  .row {
    display: flex; align-items: center; gap: 10px;
    padding: 7px 10px;
    margin: 0 6px;
    border-radius: 6px;
    cursor: pointer;
    color: #e4e4e7;
  }
  .row .icon {
    flex: 0 0 auto; width: 16px; height: 16px;
    color: #a1a1aa; display: inline-flex;
  }
  .row .icon img { width: 100%; height: 100%; border-radius: 3px; }
  .row .icon svg { width: 100%; height: 100%; }
  .row .label {
    flex: 1 1 auto; min-width: 0;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    font-size: 13px;
  }
  .row .meta {
    flex: 0 0 auto;
    font-size: 11px; color: #71717a;
    max-width: 180px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .row.is-active {
    background: rgba(255,255,255,.06);
    color: #fafafa;
  }
  .row.is-active .icon,
  .row.is-active .meta { color: #d4d4d8; }

  .empty {
    padding: 14px 16px;
    font-size: 12px; color: #71717a;
    text-align: center;
  }

  .footer {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 12px;
    border-top: 1px solid rgba(255,255,255,.06);
    font-size: 11px; color: #71717a;
  }
  .footer .group { display: inline-flex; align-items: center; gap: 6px; }
  .kbd {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 18px; height: 18px; padding: 0 5px;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
    font-size: 10.5px;
    background: rgba(255,255,255,.07);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 4px;
    color: #d4d4d8;
  }

  .toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: rgba(13,13,14,.92); color: #fafafa;
    padding: 8px 14px; border-radius: 999px; font-size: 12px;
    pointer-events: none;
    border: 1px solid rgba(255,255,255,.08);
    backdrop-filter: blur(12px);
    box-shadow: 0 10px 30px rgba(0,0,0,.35);
  }
  `,t.appendChild(e)}async function le(t){return new Promise(e=>{try{chrome.runtime.sendMessage({type:"bookmarks-search",query:t},a=>{e((a==null?void 0:a.items)??[])})}catch{e([])}})}async function ce(){var t,e,a;try{const i=await((a=(e=(t=chrome.storage)==null?void 0:t.local)==null?void 0:e.get)==null?void 0:a.call(e,B));if(i!=null&&i[B])return i[B]}catch{}return{top:Math.round(window.innerHeight*.42)}}async function de(t){var e,a,i;try{await((i=(a=(e=chrome.storage)==null?void 0:e.local)==null?void 0:a.set)==null?void 0:i.call(a,{[B]:t}))}catch{}}let T=null,E=null,z=null,R=!1;function X(t){const e=document.createElement("span");return e.className="icon",e.innerHTML=t,e}function Z(){try{return location.hostname.replace(/^www\./,"")}catch{return location.hostname||""}}async function pe(){var Y,U,_,K;if(R||(se(),!y))return;W=ie((await I()).language);const t=ae[W],e=document.createElement("div");e.className="wrap";const a=await ce();e.style.top=`${a.top}px`;const i=document.createElement("div");i.className="tab",i.title="Smart Bookmark",i.innerHTML=`
    <svg class="bm-icon" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="sb-tab-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#3b82f6"/>
          <stop offset="100%" stop-color="#8b5cf6"/>
        </linearGradient>
      </defs>
      <path fill="url(#sb-tab-grad)" d="M7 3h10a2 2 0 0 1 2 2v16l-7-4.2L5 21V5a2 2 0 0 1 2-2z"/>
    </svg>
  `;const v=document.createElement("div");v.className="close-btn",v.innerHTML=w.x,v.title=t.menuHideSession;const f=ue(t),p=document.createElement("div");p.className="panel",p.style.display="none";const S=document.createElement("div");S.className="search",S.appendChild(X(w.search));const h=document.createElement("input");h.className="input",h.placeholder=t.placeholder,S.appendChild(h),p.appendChild(S);const u=document.createElement("div");u.className="body",p.appendChild(u);const M=document.createElement("div");M.className="footer";const F=document.createElement("div");F.className="group",F.innerHTML=`<span class="kbd">↵</span>&nbsp;${t.kbdOpen}`;const q=document.createElement("div");q.className="group",q.innerHTML=`<span class="kbd">↑</span><span class="kbd">↓</span>&nbsp;${t.kbdNav}`,M.appendChild(F),M.appendChild(q),p.appendChild(M);let g=[],m=0;const k=n=>{if(b=n??!b,p.style.display=b?"block":"none",i.classList.toggle("is-active",b),b){L();const c=i.getBoundingClientRect(),s=p.offsetHeight||420,r=p.offsetWidth||460,o=Math.max(8,Math.min(window.innerHeight-s-8,c.top-s/2)),d=Math.max(8,c.left-r-12);p.style.top=`${o}px`,p.style.left=`${d}px`,setTimeout(()=>{h.focus(),h.select()},30)}},P=()=>{C=!0,f.classList.add("is-open"),v.classList.add("is-visible"),k(!1)},L=()=>{C=!1,f.classList.remove("is-open"),v.classList.remove("is-visible")};v.addEventListener("click",n=>{n.stopPropagation(),C?L():P()}),i.addEventListener("contextmenu",n=>{n.preventDefault(),n.stopPropagation(),P()}),(Y=f.querySelector("[data-act='hide-session']"))==null||Y.addEventListener("click",()=>{L(),me()}),(U=f.querySelector("[data-act='disable-site']"))==null||U.addEventListener("click",async()=>{L(),await fe()}),(_=f.querySelector("[data-act='disable-global']"))==null||_.addEventListener("click",async()=>{L(),await he()}),(K=f.querySelector(".settings-link"))==null||K.addEventListener("click",n=>{n.preventDefault();try{chrome.runtime.sendMessage({type:"open-settings"})}catch{}});const oe=[{kind:"action",label:t.sidepanel,iconSvg:w.panel,onRun:()=>{chrome.runtime.sendMessage({type:"open-sidepanel"}),k(!1)}},{kind:"action",label:t.cleaner,iconSvg:w.sparkles,onRun:()=>{chrome.runtime.sendMessage({type:"open-cleaner"}),k(!1)}},{kind:"action",label:t.copy,iconSvg:w.copy,onRun:async()=>{try{await navigator.clipboard.writeText(location.href)}catch{const n=document.createElement("textarea");n.value=location.href,document.body.appendChild(n),n.select(),document.execCommand("copy"),n.remove()}ge(t.copied)}},{kind:"action",label:t.qr,iconSvg:w.qr,onRun:()=>{chrome.runtime.sendMessage({type:"open-qr",url:location.href}),k(!1)}}],N=n=>{if(!g.length){m=0;return}m=Math.max(0,Math.min(g.length-1,n)),u.querySelectorAll(".row").forEach(r=>r.classList.remove("is-active"));const s=u.querySelector(`.row[data-idx="${m}"]`);if(s){s.classList.add("is-active");const r=u.getBoundingClientRect(),o=s.getBoundingClientRect();o.bottom>r.bottom?u.scrollTop+=o.bottom-r.bottom+4:o.top<r.top&&(u.scrollTop-=r.top-o.top+4)}},O=()=>{const n=g[m];n&&n.onRun()},G=n=>{const c=g.length;g.push(n);const s=document.createElement("div");if(s.className="row",s.setAttribute("data-idx",String(c)),n.iconImg){const o=document.createElement("span");o.className="icon";const d=document.createElement("img");d.src=n.iconImg,d.onerror=()=>{d.remove(),o.innerHTML=w.bookmark},o.appendChild(d),s.appendChild(o)}else n.iconSvg&&s.appendChild(X(n.iconSvg));const r=document.createElement("span");if(r.className="label",r.textContent=n.label,s.appendChild(r),n.meta){const o=document.createElement("span");o.className="meta",o.textContent=n.meta,s.appendChild(o)}s.addEventListener("mouseenter",()=>N(c)),s.addEventListener("click",()=>{m=c,O()}),u.appendChild(s)},$=(n,c)=>{if(u.innerHTML="",g=[],n){const r=document.createElement("div");if(r.className="section-title",r.textContent=t.sectionBookmarks,u.appendChild(r),c.length)for(const o of c){let d="";try{d=new URL(o.url).hostname.replace(/^www\./,"")}catch{d=o.url}G({kind:"bookmark",label:o.title||d,meta:d,iconImg:`https://www.google.com/s2/favicons?domain=${d}&sz=32`,onRun:()=>{window.location.href=o.url}})}else{const o=document.createElement("div");o.className="empty",o.textContent=t.emptyBookmarks,u.appendChild(o)}}const s=document.createElement("div");s.className="section-title",s.textContent=t.sectionActions,u.appendChild(s);for(const r of oe)G(r);N(0)};let j=null;h.addEventListener("input",()=>{const n=h.value.trim();if(j&&clearTimeout(j),!n){$("",[]);return}j=setTimeout(async()=>{const c=await le(n);$(n,c)},120)}),h.addEventListener("keydown",n=>{n.key==="ArrowDown"?(n.preventDefault(),N(m+1>=g.length?0:m+1)):n.key==="ArrowUp"?(n.preventDefault(),N(m-1<0?g.length-1:m-1)):n.key==="Enter"?(n.preventDefault(),O()):n.key==="Escape"&&(n.preventDefault(),k(!1))}),$("",[]);let x=null;i.addEventListener("mousedown",n=>{if(n.button!==0)return;x={y:n.clientY,top:parseInt(e.style.top,10)||0,moved:!1};const c=r=>{if(!x)return;const o=r.clientY-x.y;Math.abs(o)>3&&(x.moved=!0);const d=Math.max(8,Math.min(window.innerHeight-52,x.top+o));e.style.top=`${d}px`},s=async()=>{window.removeEventListener("mousemove",c),window.removeEventListener("mouseup",s),x&&(x.moved?await de({top:parseInt(e.style.top,10)||0}):k()),x=null};window.addEventListener("mousemove",c),window.addEventListener("mouseup",s)}),e.appendChild(i),e.appendChild(v),e.appendChild(f),e.appendChild(p),y.appendChild(e),E=e,T=p,z=f,R=!0,document.addEventListener("click",ee,!0)}function ue(t){const e=document.createElement("div");return e.className="close-menu",e.innerHTML=`
    <div class="close-menu-item" data-act="hide-session">${t.menuHideSession}</div>
    <div class="close-menu-item" data-act="disable-site">${t.menuDisableSite}</div>
    <div class="close-menu-item" data-act="disable-global">${t.menuDisableGlobal}</div>
    <div class="close-menu-footer">
      ${t.menuFooterPrefix} <a class="settings-link" href="#">${t.menuFooterLink}</a> ${t.menuFooterSuffix}
    </div>
  `,e}function me(){try{sessionStorage.setItem(J,"1")}catch{}A()}async function fe(){const t=Z();if(!t)return A();const e=await I(),a=new Set(e.floatingDisabledDomains??[]);a.add(t),await te({...e,floatingDisabledDomains:Array.from(a)})}async function he(){const t=await I();await te({...t,floatingBall:!1})}function ee(t){const e=t.composedPath();C&&z&&E&&(e.includes(E)||(C=!1,z.classList.remove("is-open"))),b&&E&&(e.includes(E)||(b=!1,T&&(T.style.display="none")))}function A(){R&&(l&&l.remove(),l=null,y=null,T=null,E=null,z=null,R=!1,b=!1,C=!1,document.removeEventListener("click",ee,!0))}function ge(t){if(!y)return;const e=document.createElement("div");e.className="toast",e.textContent=t,y.appendChild(e),setTimeout(()=>e.remove(),1600)}async function I(){var t,e,a;try{const i=await((a=(e=(t=chrome.storage)==null?void 0:t.local)==null?void 0:e.get)==null?void 0:a.call(e,H));return(i==null?void 0:i[H])??{}}catch{return{}}}async function te(t){var e,a,i;try{await((i=(a=(e=chrome.storage)==null?void 0:e.local)==null?void 0:a.set)==null?void 0:i.call(a,{[H]:t}))}catch{}}function xe(){try{return sessionStorage.getItem(J)==="1"}catch{return!1}}async function ne(){const t=await I(),e=Z(),a=!!(t.floatingDisabledDomains&&e&&t.floatingDisabledDomains.includes(e)),i=xe();t.floatingBall&&!a&&!i?pe().catch(console.warn):A()}ne();var V,D,Q;(Q=(D=(V=chrome.storage)==null?void 0:V.onChanged)==null?void 0:D.addListener)==null||Q.call(D,(t,e)=>{e==="local"&&t[H]&&ne()});
