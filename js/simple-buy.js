/* simple-buy.js
   Minimal buy-only UI: Base ETH -> ERC20 via Uniswap deep link.
   - No on-chain calls; constructs Uniswap URL with user-entered ETH amount.
   - Falls back to external link instantly if anything unsupported.
*/
(function(){
  // Basic mobile / in-app wallet environment detection to avoid iframe issues & popup blocking.
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
    let m = document.getElementById('simple-buy-modal');
    if(m) return m;
    m = document.createElement('div');
    m.id='simple-buy-modal';
  m.style.cssText='position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:radial-gradient(circle at 30% 20%,rgba(0,30,50,0.95),rgba(0,0,0,0.94));z-index:12000;padding:20px;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;backdrop-filter:blur(6px);';
    m.innerHTML = `
  <div class="sb-panel" style="position:relative;width:100%;max-width:480px;max-height:92vh;display:flex;flex-direction:column;background:linear-gradient(160deg,#0c1826 0%,#06101c 60%,#001a26 100%);border:1px solid rgba(0,234,255,0.35);border-radius:20px;padding:22px 22px 18px;color:#cfe9ff;font-family:inherit;box-shadow:0 0 0 1px rgba(0,234,255,0.15),0 0 22px -4px rgba(0,234,255,0.35),0 0 60px -10px #00ffd54d;overflow-y:auto;overflow-x:hidden;box-sizing:border-box;">
        <div style="position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 85% 15%,rgba(0,255,170,0.08),transparent 55%),radial-gradient(circle at 15% 85%,rgba(0,140,255,0.09),transparent 60%);"></div>
        <button class="sb-close" style="position:absolute;top:10px;right:10px;background:linear-gradient(135deg,#04202d,#071c2b);border:1px solid rgba(255,255,255,0.15);color:#fff;border-radius:10px;font-size:14px;padding:6px 10px;cursor:pointer;box-shadow:0 0 0 1px #00eaff55,0 0 8px -2px #00eaff9c;">✕</button>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <div style="flex:1;">
            <h2 style="margin:0;font-size:1.05rem;font-weight:800;color:#fff;letter-spacing:0.5px;">Buy Token (Base)</h2>
            <div class="sb-token-line" style="font-size:0.62rem;opacity:0.7;margin-top:4px;word-break:break-all;"></div>
          </div>
          <button class="sb-open" style="flex:0 0 auto;padding:10px 14px;border-radius:14px;border:1px solid rgba(0,255,160,0.55);background:linear-gradient(135deg,rgba(0,255,160,0.18),rgba(0,234,255,0.15));color:#00ffb0;font-weight:700;font-size:0.7rem;cursor:pointer;white-space:nowrap;">Open Tab ↗</button>
        </div>
  <div class="sb-status" style="margin:0 0 10px 0;font-size:0.55rem;opacity:0.65;letter-spacing:0.5px;height:0.9rem;"></div>
  <div class="sb-frame-wrap" style="display:block;margin-top:4px;width:100%;flex:1 1 auto;height:520px;position:relative;border:1px solid rgba(0,234,255,0.35);border-radius:16px;overflow:hidden;background:linear-gradient(145deg,#071523,#0c1f30);backdrop-filter:blur(2px);">
          <div class="sb-preload" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;font-size:0.65rem;color:#9bd8ff;letter-spacing:0.5px;">
            <div class="spin" style="width:42px;height:42px;border:3px solid rgba(0,234,255,0.25);border-top-color:#00eaff;border-radius:50%;animation:sbspin 0.9s linear infinite;"></div>
            <div>Loading Uniswap…</div>
          </div>
          <iframe title="Uniswap Swap" referrerpolicy="no-referrer" style="position:absolute;inset:0;width:100%;height:100%;border:0;overflow:auto;" loading="eager"></iframe>
          <div class="sb-frame-fallback" style="position:absolute;inset:0;display:none;align-items:center;justify-content:center;font-size:0.65rem;color:#9bd8ff;padding:20px;text-align:center;">If the widget does not load, <a class="sb-ext" href="#" target="_blank" rel="noopener" style="color:#00eaff;font-weight:700;margin-left:4px;">open in new tab ↗</a></div>
        </div>
  <!-- Disclaimer intentionally removed from widget modal per latest request -->
      </div>`;
    document.body.appendChild(m);
    m.addEventListener('click', e=>{ if(e.target===m) m.style.display='none'; });
    m.querySelector('.sb-close').addEventListener('click', ()=> m.style.display='none');
    // Inject keyframe once
    if(!document.getElementById('sbspin-style')){
      const st = document.createElement('style'); st.id='sbspin-style'; st.textContent='@keyframes sbspin{to{transform:rotate(360deg)}}\n#simple-buy-modal .sb-panel::-webkit-scrollbar:horizontal{height:0!important;}\n#simple-buy-modal .sb-panel{scrollbar-width:thin;}'; document.head.appendChild(st);
    }
    return m;
  }

  async function fillBalances(modal){
    try {
      if(!window.ethereum) return;
      const [acct] = await window.ethereum.request({ method:'eth_requestAccounts' });
      if(!acct) return;
      const balHex = await window.ethereum.request({ method:'eth_getBalance', params:[acct,'latest'] });
      const bal = parseInt(balHex,16)/1e18;
      modal.dataset.ethBalance = String(bal);
    } catch {}
  }

  function openSimpleBuy(chainId, tokenAddress){
    const id = String(chainId||'').toLowerCase();
    // If not base OR mobile environment: jump straight to external Uniswap (prevents iframe wallet/promo issues & blocked popups)
    if(id !== 'base' || isMobileEnv()){
      const direct = `https://app.uniswap.org/#/swap?chain=${encodeURIComponent(id||'base')}&inputCurrency=ETH&outputCurrency=${encodeURIComponent(tokenAddress)}`;
      window.open(direct,'_blank');
      return;    
    }
    const m = ensureModal();
  const status = m.querySelector('.sb-status');
    const openBtn = m.querySelector('.sb-open');
    m.querySelector('.sb-token-line').textContent = tokenAddress;
    m.style.display='flex';
    status.textContent='';
    m.dataset.slippage='1';
    fillBalances(m).catch(()=>{});
    // Immediately estimate & embed with a default nominal trade size (0.25 ETH) purely for slippage heuristic.
    estimateSlippageAndEmbed('base', tokenAddress, 0.25, m, 'buy').then(()=>{
      const preload = m.querySelector('.sb-preload'); if(preload) preload.style.display='none';
    }).catch(()=>{
      status.textContent='Widget failed to load';
      const slip = encodeURIComponent(m.dataset.slippage || '1');
      const directUrl = `https://app.uniswap.org/#/swap?chain=base&inputCurrency=ETH&outputCurrency=${encodeURIComponent(tokenAddress)}&slippageTolerance=${slip}`;
      window.open(directUrl,'_blank');
    });
    // New tab button always opens current widget URL (updated once slippage computed)
    openBtn.onclick=()=>{
      const slip = encodeURIComponent(m.dataset.slippage || '1');
      const url = `https://app.uniswap.org/#/swap?chain=base&inputCurrency=ETH&outputCurrency=${encodeURIComponent(tokenAddress)}&slippageTolerance=${slip}`;
      window.open(url,'_blank');
    };
  }

  window.openSimpleBuy = openSimpleBuy;

  async function fetchDexPair(token){
    try { const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token}`); if(!r.ok) return null; const j = await r.json(); return j?.pairs?.find(p=> (p.chainId||'').toLowerCase()==='base') || j?.pairs?.[0] || null; } catch { return null; }
  }

  function mapFractionToSlippage(f){
    if(!(f>0)) return 1; // %
    if (f < 0.001) return 0.5;
    if (f < 0.003) return 0.8;
    if (f < 0.007) return 1;
    if (f < 0.015) return 2;
    if (f < 0.03) return 3;
    if (f < 0.06) return 5;
    if (f < 0.10) return 7;
    return 10; // cap
  }

  async function estimateSlippageAndEmbed(chainId, tokenAddress, ethAmount, modal, side){
  // No visible slippage element now
    const frameWrap = modal.querySelector('.sb-frame-wrap');
    const frame = frameWrap?.querySelector('iframe');
    if(!frameWrap||!frame) throw new Error('no frame');
    const pair = await fetchDexPair(tokenAddress);
    let liquidityUsd = Number(pair?.liquidity?.usd || pair?.liquidityUsd || pair?.liquidityUSD || 0);
    const tokenPriceUsd = Number(pair?.priceUsd || pair?.price?.usd || pair?.price || 0);
    const priceNative = Number(pair?.priceNative || 0);
    let ethPriceUsd = 3200; // fallback heuristic
    if(tokenPriceUsd>0 && priceNative>0){ ethPriceUsd = tokenPriceUsd / priceNative; }
    let tradeUsd = (ethAmount>0? ethAmount:0.25) * ethPriceUsd;
    if(!(tradeUsd>0)) tradeUsd = ethAmount * 3200;
    if(!(liquidityUsd>0)) liquidityUsd = Number(pair?.fdv || 0) * 0.05 || 0; // coarse fallback
    const fraction = (liquidityUsd>0) ? (tradeUsd / liquidityUsd) : 0.002;
    const slip = mapFractionToSlippage(fraction);
    modal.dataset.slippage = String(slip);
  // Slippage hidden from UI
    // Build embed url (omit amount for reliability; user enters inside widget). Provide slippageTolerance.
  const url = `https://app.uniswap.org/#/swap?chain=base&embed=1&inputCurrency=ETH&outputCurrency=${encodeURIComponent(tokenAddress)}&slippageTolerance=${encodeURIComponent(slip)}`;
    frame.src = url;
    frameWrap.style.display='block';
    const openBtn = modal.querySelector('.sb-open'); if(openBtn){ openBtn.textContent='Open Tab ↗'; }
    const ext = frameWrap.querySelector('.sb-ext'); if(ext) ext.href = url;
  }
})();
