/*
  swap-widget.js (Level 2 internal swap MVP)
  - EVM chains (ethereum, base) using 0x Aggregator quote + affiliate fee.
  - 1% fee captured via buyTokenPercentageFee (taken from output tokens) to configurable feeRecipient.
  - Simple modal UI: select chain, direction, amount, fetch quote, approve (if ERC20 sell), then swap.
  - Solana path: falls back to external Jupiter link (stub for future internal integration).
  Assumptions:
    * Existing wallet connection exposes window.ethereum for EVM and window.wildWestWallet.account holds the active EVM address.
    * User replaces FEE_RECIPIENT with a valid address (same on all supported chains).
*/
(function(){
  const CONFIG = window.SWAP_CONFIG || (window.SWAP_CONFIG = {});
  CONFIG.feeBps = typeof CONFIG.feeBps === 'number' ? CONFIG.feeBps : 100; // 1% = 100 bps (100/10000)
  CONFIG.feeRecipient = CONFIG.feeRecipient || '0x000000000000000000000000000000000000dEaD'; // TODO: replace with treasury
  CONFIG.defaultSlippageBps = typeof CONFIG.defaultSlippageBps === 'number' ? CONFIG.defaultSlippageBps : 100; // 1% slippage default
  CONFIG.evmChains = CONFIG.evmChains || ['ethereum','base'];

  const chainMeta = {
    ethereum: { chainId: '0x1', name: 'Ethereum', nativeSymbol: 'ETH', zeroEx: 'https://api.0x.org' },
    base: { chainId: '0x2105', name: 'Base', nativeSymbol: 'ETH', zeroEx: 'https://base.api.0x.org' }
  };

  function log(...a){ console.log('[SwapWidget]', ...a); }

  function ensureModal(){
    let m = document.getElementById('internal-swap-modal');
    if(m) return m;
    m = document.createElement('div');
    m.id='internal-swap-modal';
    m.style.cssText='position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.82);z-index:10000;padding:16px;';
    m.innerHTML = `
      <div class="swap-box" style="position:relative;width:100%;max-width:460px;background:linear-gradient(135deg,rgba(18,24,38,0.92),rgba(10,14,22,0.95));border:1px solid rgba(0,234,255,0.35);border-radius:14px;padding:20px;font-family:inherit;color:#cfe9ff;box-shadow:0 10px 30px rgba(0,0,0,0.55);">
        <button class="swap-close" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);color:#fff;border-radius:6px;font-size:14px;padding:4px 8px;cursor:pointer">✕</button>
        <h2 style="margin:0 0 10px 0;font-size:1.05rem;letter-spacing:0.5px;color:#fff;font-weight:800;">Internal Swap (Beta)</h2>
        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <select class="swap-chain" style="flex:1;padding:8px;border-radius:8px;border:1px solid rgba(0,234,255,0.4);background:#0b1220;color:#fff;font-weight:600;"></select>
          <select class="swap-side" style="width:110px;padding:8px;border-radius:8px;border:1px solid rgba(0,234,255,0.4);background:#0b1220;color:#fff;font-weight:600;">
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>
        <div class="swap-input-row" style="margin-bottom:12px;">
          <label style="font-size:0.7rem;text-transform:uppercase;opacity:0.75;font-weight:700;letter-spacing:1px;">Token Address</label>
          <input class="swap-token" placeholder="0x... or trending card auto-filled" style="width:100%;margin-top:4px;padding:10px;border-radius:10px;border:1px solid rgba(0,234,255,0.4);background:#0b1220;color:#fff;font-weight:600;font-size:0.85rem;" />
        </div>
        <div class="swap-amount-row" style="display:flex;gap:10px;margin-bottom:10px;">
          <div style="flex:1;">
            <label style="font-size:0.7rem;text-transform:uppercase;opacity:0.75;font-weight:700;letter-spacing:1px;">Amount</label>
            <input class="swap-amount" type="number" min="0" step="any" placeholder="0.0" style="width:100%;margin-top:4px;padding:10px;border-radius:10px;border:1px solid rgba(0,234,255,0.4);background:#0b1220;color:#fff;font-weight:600;font-size:0.9rem;" />
          </div>
          <div style="width:110px;">
            <label style="font-size:0.7rem;text-transform:uppercase;opacity:0.75;font-weight:700;letter-spacing:1px;">Slippage %</label>
            <input class="swap-slippage" type="number" min="0" step="0.1" value="1" style="width:100%;margin-top:4px;padding:10px;border-radius:10px;border:1px solid rgba(0,234,255,0.4);background:#0b1220;color:#fff;font-weight:600;font-size:0.85rem;" />
          </div>
        </div>
        <div class="swap-actions" style="display:flex;gap:8px;margin-bottom:10px;">
          <button class="swap-quote-btn" style="flex:1;padding:10px;border-radius:10px;border:1px solid rgba(0,234,255,0.5);background:rgba(0,234,255,0.08);color:#00eaff;font-weight:800;cursor:pointer;">Get Quote</button>
          <button class="swap-approve-btn" style="flex:1;padding:10px;border-radius:10px;border:1px solid rgba(255,193,77,0.6);background:rgba(255,193,77,0.12);color:#ffc14d;font-weight:800;cursor:pointer;display:none;">Approve</button>
          <button class="swap-exec-btn" style="flex:1;padding:10px;border-radius:10px;border:1px solid rgba(0,255,160,0.6);background:rgba(0,255,160,0.12);color:#00ff9d;font-weight:800;cursor:pointer;display:none;">Swap</button>
        </div>
        <div class="swap-status" style="min-height:46px;font-size:0.7rem;line-height:1.25rem;white-space:pre-wrap;background:rgba(0,234,255,0.05);padding:8px 10px;border-radius:8px;border:1px solid rgba(0,234,255,0.15);overflow:auto;"></div>
        <div style="margin-top:10px;font-size:0.6rem;line-height:0.85rem;opacity:0.8;">
          Output already reflects a platform fee of ${(CONFIG.feeBps/100).toFixed(2)}%. Beta – always verify amounts in your wallet.
        </div>
      </div>`;
    document.body.appendChild(m);
    const closeBtn = m.querySelector('.swap-close');
    closeBtn.addEventListener('click', ()=> m.style.display='none');
    m.addEventListener('click', (e)=> { if(e.target===m) m.style.display='none'; });
    return m;
  }

  function shorten(addr){ if(!addr) return ''; return addr.slice(0,6)+'…'+addr.slice(-4); }
  function fmt(n){ if(!n&&n!==0) return '-'; const x=Number(n); if(!isFinite(x)) return '-'; if(x>=1) return x.toFixed(6).replace(/0+$/,'').replace(/\.$/,''); return x.toPrecision(3); }

  async function switchToChain(meta){
    if(!window.ethereum) throw new Error('No EVM wallet');
    try { await window.ethereum.request({ method:'wallet_switchEthereumChain', params:[{ chainId: meta.chainId }]}); }
    catch(e){
      if(e && e.code===4902){ // add chain (simplified for Base)
        if(meta.chainId==='0x2105'){
          await window.ethereum.request({ method:'wallet_addEthereumChain', params:[{ chainId:'0x2105', chainName:'Base', nativeCurrency:{ name:'Ether', symbol:'ETH', decimals:18 }, rpcUrls:['https://mainnet.base.org'], blockExplorerUrls:['https://basescan.org'] }] });
        } else throw e;
      } else throw e;
    }
  }

  async function getAccount(){
    const acct = window.wildWestWallet?.account || (window.ethereum ? (await window.ethereum.request({ method:'eth_requestAccounts'}))[0] : null);
    if(!acct) throw new Error('Wallet not connected');
    return acct;
  }

  async function getErc20Allowance(token, owner, spender){
    const data = '0xdd62ed3e' + owner.replace(/^0x/,'').padStart(64,'0') + spender.replace(/^0x/,'').padStart(64,'0');
    const res = await window.ethereum.request({ method:'eth_call', params:[{ to: token, data }, 'latest'] });
    return BigInt(res);
  }
  async function sendApprove(token, spender){
    const max = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const data = '0x095ea7b3' + spender.replace(/^0x/,'').padStart(64,'0') + max.slice(2);
    const from = await getAccount();
    const txHash = await window.ethereum.request({ method:'eth_sendTransaction', params:[{ from, to: token, data }] });
    return txHash;
  }

  const erc20DecimalsCache = new Map();
  async function fetchErc20Decimals(token){
    try {
      const key = token.toLowerCase();
      if(erc20DecimalsCache.has(key)) return erc20DecimalsCache.get(key);
      if(!window.ethereum) return 18;
      const data = '0x313ce567'; // decimals()
      const res = await window.ethereum.request({ method:'eth_call', params:[{ to: token, data }, 'latest'] });
      const val = parseInt(res,16);
      if(isFinite(val) && val>=0 && val<80){ erc20DecimalsCache.set(key,val); return val; }
      return 18;
    } catch { return 18; }
  }
  function toUnits(amountStr, decimals){
    const parts = String(amountStr).trim().split('.');
    let whole = parts[0] || '0';
    let frac = parts[1] || '';
    if(frac.length > decimals) frac = frac.slice(0, decimals);
    while(frac.length < decimals) frac += '0';
    const raw = whole + frac;
    return BigInt(raw.replace(/^0+/, '') || '0').toString();
  }
  async function fetchQuote(opts){
    const { chain, side, token, amount, slippagePct, taker } = opts;
    const meta = chainMeta[chain];
    if(!meta) throw new Error('Unsupported chain');
    if(!(amount>0)) throw new Error('Amount must be > 0');
    const base = meta.zeroEx;
    const sellToken = side==='buy' ? meta.nativeSymbol : token;
    const buyToken  = side==='buy' ? token : meta.nativeSymbol;
    let decimals = 18;
    if(sellToken !== meta.nativeSymbol){ decimals = await fetchErc20Decimals(sellToken); }
    const amountWei = toUnits(amount, decimals);
    const feeDecimal = (CONFIG.feeBps/10000); // e.g. 100 -> 0.01
    const url = `${base}/swap/v1/quote?sellToken=${encodeURIComponent(sellToken)}&buyToken=${encodeURIComponent(buyToken)}&sellAmount=${amountWei}&slippagePercentage=${encodeURIComponent((slippagePct/100).toString())}&affiliateAddress=${CONFIG.feeRecipient}&buyTokenPercentageFee=${feeDecimal}&enableSlippageProtection=true${taker?`&takerAddress=${encodeURIComponent(taker)}`:''}`;
    // Basic client-side rate limiting / cache
    fetchQuote._cache = fetchQuote._cache || new Map();
    const cacheKey = `${url}`;
    const now = Date.now();
    const hit = fetchQuote._cache.get(cacheKey);
    if(hit && (now - hit.ts) < 10000) { return hit.data; }
    // Simple backoff
    if(fetchQuote._retryAt && now < fetchQuote._retryAt) throw new Error('Temporarily backing off quotes');
    const headers = {};
    if(CONFIG.zeroExApiKey) headers['0x-api-key'] = CONFIG.zeroExApiKey;
    const res = await fetch(url, { cache:'no-store', headers });
    let bodyText = '';
    try { bodyText = await res.text(); } catch {}
    let json = null;
    try { json = bodyText ? JSON.parse(bodyText) : null; } catch {}
    if(!res.ok){
      const reason = json?.validationErrors?.map(v=>v.reason).join('; ') || json?.reason || json?.message || ('HTTP '+res.status);
      const detail = json?.code || json?.validationErrors?.[0]?.code || '';
      if(res.status === 429) { fetchQuote._retryAt = Date.now() + 15000; }
      throw new Error(`Quote failed: ${reason}${detail?` (${detail})`:''}`);
    }
    fetchQuote._cache.set(cacheKey, { ts: now, data: json });
    return json;
  }

  async function executeQuote(q){
    const from = await getAccount();
    const tx = { from, to: q.to, data: q.data, value: q.value }; // value already hex
    const hash = await window.ethereum.request({ method:'eth_sendTransaction', params:[tx] });
    return hash;
  }

  function updateStatus(el, msg, opts={}){
    if(!el) return; const prev=opts.append?el.textContent+'\n':''; el.textContent = prev + msg; el.scrollTop = el.scrollHeight; }

  async function openInternalSwap(chain, token, side){
    const modal = ensureModal();
    const chainSel = modal.querySelector('.swap-chain');
    const sideSel = modal.querySelector('.swap-side');
    const tokenIn = modal.querySelector('.swap-token');
    const amtIn = modal.querySelector('.swap-amount');
    const slipIn = modal.querySelector('.swap-slippage');
    const quoteBtn = modal.querySelector('.swap-quote-btn');
    const approveBtn = modal.querySelector('.swap-approve-btn');
    const execBtn = modal.querySelector('.swap-exec-btn');
    const statusEl = modal.querySelector('.swap-status');

    // Populate chains if first time
    if(!chainSel.dataset.populated){
      chainSel.innerHTML='';
      CONFIG.evmChains.forEach(c=>{ if(chainMeta[c]){ const o=document.createElement('option'); o.value=c; o.textContent=chainMeta[c].name; chainSel.appendChild(o);} });
      const solOpt = document.createElement('option'); solOpt.value='solana'; solOpt.textContent='Solana (ext)'; chainSel.appendChild(solOpt);
      chainSel.dataset.populated='1';
    }
    chainSel.value = chainMeta[chain] ? chain : (chainSel.options[0]?.value || 'ethereum');
    sideSel.value = side==='sell' ? 'sell' : 'buy';
    if(token) tokenIn.value = token;
    amtIn.value = '';
    slipIn.value = (CONFIG.defaultSlippageBps/100).toString();
    statusEl.textContent = '';
    approveBtn.style.display='none';
    execBtn.style.display='none';

    let lastQuote = null;

    quoteBtn.onclick = async () => {
      approveBtn.style.display='none'; execBtn.style.display='none'; lastQuote=null; statusEl.textContent='';
      try {
        const chain = chainSel.value;
        if(chain==='solana'){
          updateStatus(statusEl,'Solana internal swap not yet implemented. Opening Jupiter…');
          const addr = tokenIn.value.trim();
          const side = sideSel.value;
            const url = side==='buy' ? `https://jup.ag/swap/SOL-${addr}` : `https://jup.ag/swap/${addr}-SOL`;
          window.open(url,'_blank');
          return;
        }
        const meta = chainMeta[chain];
        if(!meta) throw new Error('Unsupported chain');
        const amt = Number(amtIn.value);
        if(!(amt>0)) throw new Error('Enter amount > 0');
        const tokenAddr = tokenIn.value.trim();
        if(!/^0x[0-9a-fA-F]{40}$/.test(tokenAddr)) throw new Error('Invalid token');
        updateStatus(statusEl,'Switching network…');
        await switchToChain(meta);
        const slip = Number(slipIn.value) || 1;
        updateStatus(statusEl,'Fetching quote…', { append:true });
  const taker = await getAccount().catch(()=>null);
  const q = await fetchQuote({ chain, side: sideSel.value, token: tokenAddr, amount: amt, slippagePct: slip, taker });
        lastQuote = q;
        // Show summary
        const buyDec = 18; // simplified
        const sellDec = 18;
  let sellAmt = q.sellAmount;
  let buyAmt = q.buyAmount;
  try { sellAmt = Number(q.sellAmount)/(10**sellDec); } catch {}
  try { buyAmt = Number(q.buyAmount)/(10**buyDec); } catch {}
  updateStatus(statusEl,`Price: ${q.price}\nEstimated Output (post-fee): ${fmt(buyAmt)}\nGas: ${q.estimatedGas || 'n/a'}\nPlatform Fee: ${(CONFIG.feeBps/100).toFixed(2)} bps -> ${shorten(CONFIG.feeRecipient)}`, { append:true });
        // Determine if approval needed (selling ERC20)
        const side = sideSel.value;
        if(side==='sell'){ // selling token -> need allowance if token != native
          if(q.sellTokenAddress && q.sellTokenAddress.toLowerCase() !== q.buyTokenAddress.toLowerCase() && q.allowanceTarget){
            try {
              const owner = await getAccount();
              const allowance = await getErc20Allowance(q.sellTokenAddress, owner, q.allowanceTarget);
              if(allowance < BigInt(q.sellAmount)){
                approveBtn.style.display='';
                updateStatus(statusEl,'Approval required.', { append:true });
              } else {
                execBtn.style.display='';
              }
            } catch(e){ updateStatus(statusEl,'Allowance check failed: '+e.message,{ append:true }); execBtn.style.display=''; }
          } else {
            execBtn.style.display='';
          }
        } else {
          // buying token -> selling native (no approval) OR selling token? side==='buy' means we sell native
          execBtn.style.display='';
        }
      } catch(e){ updateStatus(statusEl,'Error: '+(e?.message||e), { append:true }); }
    };

    approveBtn.onclick = async () => {
      if(!lastQuote){ return; }
      try {
        approveBtn.disabled=true; approveBtn.textContent='Approving…';
        updateStatus(statusEl,'Sending approval…', { append:true });
        const hash = await sendApprove(lastQuote.sellTokenAddress, lastQuote.allowanceTarget);
        updateStatus(statusEl,'Approval tx: '+hash, { append:true });
        approveBtn.style.display='none';
        execBtn.style.display='';
      } catch(e){ updateStatus(statusEl,'Approve failed: '+(e?.message||e), { append:true }); }
      finally { approveBtn.disabled=false; approveBtn.textContent='Approve'; }
    };

    execBtn.onclick = async () => {
      if(!lastQuote) return;
      try {
        execBtn.disabled=true; execBtn.textContent='Swapping…';
        updateStatus(statusEl,'Submitting swap…', { append:true });
        const hash = await executeQuote(lastQuote);
        updateStatus(statusEl,'Swap tx: '+hash+'\nWaiting for confirmation (refresh wallet to see balance).',{ append:true });
        // Optional: basic poll for receipt (silent)
      } catch(e){ updateStatus(statusEl,'Swap failed: '+(e?.message||e), { append:true }); }
      finally { execBtn.disabled=false; execBtn.textContent='Swap'; }
    };

    modal.style.display='flex';
  }

  // Expose globally
  window.openInternalSwap = openInternalSwap;
})();
