/* simple-sell.js
   Minimal sell-only UI: ERC20 -> Base ETH via Uniswap deep link.
   Avoids aggregators / rate limits. Prefills amount via Uniswap exactAmount.
*/
(function(){
  // Basic mobile / in-app wallet environment detection; skip iframe when likely to fail or show promos.
  function isMobileEnv(){
    try {
      const ua = (navigator.userAgent||navigator.vendor||'');
      if(/[?&]forceDesktopTrade=1/.test(location.search)) return false; // manual override
      const mobileRe = /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile|BlackBerry|webOS/i;
      const walletRe = /MetaMask|Phantom|TrustWallet|Rainbow|imToken|CoinbaseWallet/i;
      const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints>1;
      const smallScreen = window.innerWidth < 860;
      return (mobileRe.test(ua) || walletRe.test(ua) || isTouch) && smallScreen;
    } catch { return false; }
  }
  function ensureModal(){
    let m = document.getElementById('simple-sell-modal');
    if(m) return m;
    m = document.createElement('div');
    m.id='simple-sell-modal';
  m.style.cssText='position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:radial-gradient(circle at 70% 30%,rgba(40,0,0,0.92),rgba(0,0,0,0.94));z-index:12000;padding:20px;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;backdrop-filter:blur(6px);';
    m.innerHTML = `
  <div class="ss-panel" style="position:relative;width:100%;max-width:480px;max-height:92vh;display:flex;flex-direction:column;background:linear-gradient(155deg,#1d0c10,#110406 55%,#220000 100%);border:1px solid rgba(255,96,96,0.4);border-radius:20px;padding:22px 22px 18px;color:#ffcfcf;font-family:inherit;box-shadow:0 0 0 1px rgba(255,96,96,0.15),0 0 22px -4px rgba(255,96,96,0.35),0 0 60px -10px #ff3d3d4d;overflow-y:auto;overflow-x:hidden;box-sizing:border-box;">
        <div style="position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 85% 20%,rgba(255,120,120,0.08),transparent 55%),radial-gradient(circle at 15% 90%,rgba(255,50,70,0.10),transparent 60%);"></div>
        <button class="ss-close" style="position:absolute;top:10px;right:10px;background:linear-gradient(135deg,#310a0a,#1a0505);border:1px solid rgba(255,255,255,0.15);color:#fff;border-radius:10px;font-size:14px;padding:6px 10px;cursor:pointer;box-shadow:0 0 0 1px #ff606055,0 0 8px -2px #ff60609c;">✕</button>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <div style="flex:1;">
            <h2 style="margin:0;font-size:1.05rem;font-weight:800;color:#fff;letter-spacing:0.5px;">Sell Token (Base)</h2>
            <div class="ss-token-line" style="font-size:0.6rem;opacity:0.72;margin-top:4px;word-break:break-all;"></div>
          </div>
          <button class="ss-open" style="flex:0 0 auto;padding:10px 14px;border-radius:14px;border:1px solid rgba(255,96,96,0.6);background:linear-gradient(135deg,rgba(255,96,96,0.2),rgba(255,40,40,0.18));color:#ffb4b4;font-weight:700;font-size:0.7rem;cursor:pointer;white-space:nowrap;">Open Tab ↗</button>
        </div>
  <div class="ss-status" style="margin:0 0 10px 0;font-size:0.55rem;opacity:0.65;letter-spacing:0.5px;height:0.9rem;"></div>
  <div class="ss-frame-wrap" style="display:block;margin-top:4px;width:100%;flex:1 1 auto;height:520px;position:relative;border:1px solid rgba(255,96,96,0.4);border-radius:16px;overflow:hidden;background:linear-gradient(145deg,#210a0e,#300e12);backdrop-filter:blur(2px);">
          <div class="ss-preload" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;font-size:0.65rem;color:#ffb4b4;letter-spacing:0.5px;">
            <div class="spin" style="width:42px;height:42px;border:3px solid rgba(255,96,96,0.25);border-top-color:#ff6060;border-radius:50%;animation:ssspin 0.9s linear infinite;"></div>
            <div>Loading Uniswap…</div>
          </div>
          <iframe title="Uniswap Swap" referrerpolicy="no-referrer" style="position:absolute;inset:0;width:100%;height:100%;border:0;overflow:auto;" loading="eager"></iframe>
          <div class="ss-frame-fallback" style="position:absolute;inset:0;display:none;align-items:center;justify-content:center;font-size:0.65rem;color:#ffb4b4;padding:20px;text-align:center;">If the widget does not load, <a class="ss-ext" href="#" target="_blank" rel="noopener" style="color:#ff8080;font-weight:700;margin-left:4px;">open in new tab ↗</a></div>
        </div>
  <!-- Disclaimer removed per latest request -->
      </div>`;
    document.body.appendChild(m);
    m.addEventListener('click', e=>{ if(e.target===m) m.style.display='none'; });
    m.querySelector('.ss-close').addEventListener('click', ()=> m.style.display='none');
  if(!document.getElementById('ssspin-style')){ const st=document.createElement('style'); st.id='ssspin-style'; st.textContent='@keyframes ssspin{to{transform:rotate(360deg)}}\n#simple-sell-modal .ss-panel::-webkit-scrollbar:horizontal{height:0!important;}\n#simple-sell-modal .ss-panel{scrollbar-width:thin;}'; document.head.appendChild(st);}    
    return m;
  }

  async function fetchMetaAndBalance(token){
    if(!window.ethereum) return null;
    try {
      const [acct] = await window.ethereum.request({ method:'eth_requestAccounts' });
      if(!acct) return null;
      const addrPad = acct.replace(/^0x/,'').padStart(64,'0');
      const calls = [
        { data:'0x70a08231'+addrPad }, // balanceOf
        { data:'0x313ce567' },        // decimals
        { data:'0x95d89b41' }         // symbol
      ];
      const results = await Promise.all(calls.map(c=> window.ethereum.request({ method:'eth_call', params:[{ to: token, data: c.data }, 'latest'] }).catch(()=>null)));
      const rawBal = results[0] ? BigInt(results[0]) : 0n;
      const decimals = results[1] ? parseInt(results[1],16) : 18;
      const symbol = decodeAscii(results[2]) || '';
      return { account: acct, rawBal, decimals, symbol };
    } catch { return null; }
  }

  function decodeAscii(hex){
    try { if(!hex||hex==='0x') return null; const buf = hex.slice(2); const bytes = buf.match(/.{2}/g)||[]; let s=''; for(const b of bytes){ const v=parseInt(b,16); if(v>=32&&v<=126) s+=String.fromCharCode(v); } return s.replace(/\0+$/,'').trim()||null; } catch { return null; }
  }
  function fmt(raw,dec){ try { const D=BigInt(10)**BigInt(dec); const whole=raw/D; const frac=raw% D; if(frac===0n) return whole.toString(); const fs=frac.toString().padStart(dec,'0').replace(/0+$/,''); return whole.toString()+'.'+fs.slice(0,8);} catch {return '0';}}

  function openSimpleSell(chainId, tokenAddress){
    const id = String(chainId||'').toLowerCase();
    // If non-base or mobile: external link directly (avoid iframe issues/promo overlays)
    if(id !== 'base' || isMobileEnv()){
      window.open(`https://app.uniswap.org/#/swap?chain=${encodeURIComponent(id||'base')}&inputCurrency=${encodeURIComponent(tokenAddress)}&outputCurrency=ETH`,'_blank');
      return;    
    }
    const m = ensureModal();
    const status = m.querySelector('.ss-status');
    const openBtn = m.querySelector('.ss-open');
    m.querySelector('.ss-token-line').textContent = tokenAddress;
    m.style.display='flex';
    status.textContent='';
    m.dataset.slippage='1';
    fetchMetaAndBalance(tokenAddress).catch(()=>{}); // background
    estimateSellSlippageAndEmbed('base', tokenAddress, 1000, m).then(()=>{
      const preload = m.querySelector('.ss-preload'); if(preload) preload.style.display='none';
    }).catch(()=>{
      status.textContent='Widget failed to load';
      const slip=encodeURIComponent(m.dataset.slippage||'1');
      const directUrl=`https://app.uniswap.org/#/swap?chain=base&inputCurrency=${encodeURIComponent(tokenAddress)}&outputCurrency=ETH&slippageTolerance=${slip}`;
      window.open(directUrl,'_blank');
    });
    openBtn.onclick=()=>{
      const slip=encodeURIComponent(m.dataset.slippage||'1');
      const url=`https://app.uniswap.org/#/swap?chain=base&inputCurrency=${encodeURIComponent(tokenAddress)}&outputCurrency=ETH&slippageTolerance=${slip}`;
      window.open(url,'_blank');
    };
  }
  window.openSimpleSell = openSimpleSell;
  async function fetchDexPair(token){
    try { const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token}`); if(!r.ok) return null; const j = await r.json(); return j?.pairs?.find(p=> (p.chainId||'').toLowerCase()==='base') || j?.pairs?.[0] || null; } catch { return null; }
  }
  function mapFractionToSlippage(f){ if(!(f>0)) return 1; if(f<0.001) return 0.5; if(f<0.003) return 0.8; if(f<0.007) return 1; if(f<0.015) return 2; if(f<0.03) return 3; if(f<0.06) return 5; if(f<0.10) return 7; return 10; }
  async function estimateSellSlippageAndEmbed(chainId, tokenAddress, tokenAmount, modal){
  // No visible slippage element now
    let pair = await fetchDexPair(tokenAddress);
    let liquidityUsd = Number(pair?.liquidity?.usd || pair?.liquidityUsd || pair?.liquidityUSD || 0);
    const tokenPriceUsd = Number(pair?.priceUsd || pair?.price?.usd || pair?.price || 0);
    let tradeUsd = tokenAmount * tokenPriceUsd;
    if(!(tradeUsd>0)) tradeUsd = tokenAmount * 100; // coarse fallback
    if(!(liquidityUsd>0)) liquidityUsd = Number(pair?.fdv || 0) * 0.05 || 0;
    const fraction = (liquidityUsd>0)? (tradeUsd / liquidityUsd):0.002;
    const slip = mapFractionToSlippage(fraction);
    modal.dataset.slippage = String(slip);
  // Slippage hidden from UI
    // Ensure iframe wrapper (reuse buy CSS style if present); create lazily if not
    let wrap = modal.querySelector('.ss-frame-wrap');
    if(!wrap){
      wrap = document.createElement('div');
      wrap.className='ss-frame-wrap';
      wrap.style.cssText='display:block;margin-top:14px;width:100%;height:560px;position:relative;border:1px solid rgba(255,96,96,0.4);border-radius:14px;overflow:hidden;background:linear-gradient(135deg,#1a0d10,#2a1115)';
  wrap.innerHTML='<iframe title="Uniswap Swap" referrerpolicy="no-referrer" style="position:absolute;inset:0;width:100%;height:100%;border:0;overflow:auto;" loading="eager"></iframe><div class="ss-frame-fallback" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:0.65rem;color:#ffb4b4;padding:20px;text-align:center;opacity:0.85;">If the widget does not load, <a class="ss-ext" href="#" target="_blank" rel="noopener" style="color:#ff8080;font-weight:700;margin-left:4px;">open in new tab ↗</a></div>';
      const anchor = modal.querySelector('.ss-open');
      anchor.parentNode.insertBefore(wrap, anchor.nextSibling);
    }
    const frame = wrap.querySelector('iframe');
  const url = `https://app.uniswap.org/#/swap?chain=base&embed=1&inputCurrency=${encodeURIComponent(tokenAddress)}&outputCurrency=ETH&slippageTolerance=${encodeURIComponent(slip)}`;
    frame.src = url; wrap.style.display='block';
    const openBtn = modal.querySelector('.ss-open'); if(openBtn){ openBtn.textContent='Open in New Tab ↗'; openBtn.onclick=()=> window.open(url,'_blank'); }
    const ext = wrap.querySelector('.ss-ext'); if(ext) ext.href = url;
  }
})();
