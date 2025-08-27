// --- State ---
let connectedWallet = null;
let connectedChain = null;

function shortenAddress(addr) {
  return addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : '';
}

function setWalletButton(address, chain) {
  const btn = document.getElementById('connectWalletBtn');
  const btnText = document.getElementById('walletBtnText');
  const indicator = document.getElementById('chainIndicator');
  btn.classList.remove('evm', 'solana', 'disconnected', 'connected');
  if (address && chain) {
    btn.classList.add('connected');
    btnText.textContent = shortenAddress(address);
    if (chain === 'evm') {
      btn.classList.add('evm');
    } else if (chain === 'solana') {
      btn.classList.add('solana');
    }
  } else {
    btn.classList.add('disconnected');
    btnText.textContent = 'Connect Wallet';
  }
}

// --- EVM (Base, Ethereum, etc.) Wallet Connect ---
const evmConnect = async () => {
  // If injected wallet (MetaMask, Coinbase, etc.)
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      connectedWallet = accounts[0];
      connectedChain = 'evm';
      setWalletButton(connectedWallet, connectedChain);
      return;
    } catch (err) {
      alert('Connection rejected or failed.');
      return;
    }
  }
  // Use Web3Modal for all other wallets (WalletConnect, QR, etc.)
  if (window.Web3Modal) {
    const modal = new window.Web3Modal({
      projectId: 'demo', // You can get a real projectId from web3modal.com
      themeMode: 'light',
      walletConnectParameters: {
        projectId: 'demo',
      },
      chains: [
        {
          chainId: '0x2105', // Base Mainnet
          name: 'Base',
          rpcUrls: [window.RPC_CONFIG ? window.RPC_CONFIG.getBaseEndpoint() : 'https://mainnet.base.org'],
        },
        {
          chainId: '0x1', // Ethereum Mainnet
          name: 'Ethereum',
          rpcUrls: ['https://mainnet.infura.io/v3/'],
        },
      ],
    });
    try {
      const provider = await modal.connect();
      const accounts = await provider.request({ method: 'eth_accounts' });
      connectedWallet = accounts[0];
      connectedChain = 'evm';
      setWalletButton(connectedWallet, connectedChain);
      return;
    } catch (err) {
      alert('Connection rejected or failed.');
      return;
    }
  }
  alert('No EVM wallet found. Please install MetaMask or use WalletConnect.');
};

// --- Solana Wallet Connect ---
const solanaConnect = async () => {
  console.log('window.solana:', window.solana);
  console.log('window.solflare:', window.solflare);
  // Try injected Solflare first
  if (window.solflare && window.solflare.isSolflare) {
    try {
      const resp = await window.solflare.connect();
      console.log('Solflare connect response:', resp);
      // Solflare returns true, publicKey is on window.solflare.publicKey
      if (window.solflare.publicKey) {
        connectedWallet = window.solflare.publicKey.toString();
        connectedChain = 'solana';
        setWalletButton(connectedWallet, connectedChain);
        return;
      } else {
        alert('Solflare connected but no public key found.');
        return;
      }
    } catch (err) {
      alert('Connection to Solflare rejected or failed.');
      console.error('Solflare error:', err);
      return;
    }
  }
  // Try injected Phantom
  if (window.solana && window.solana.isPhantom) {
    try {
      const resp = await window.solana.connect();
      console.log('Phantom connect response:', resp);
      connectedWallet = resp.publicKey.toString();
      connectedChain = 'solana';
      setWalletButton(connectedWallet, connectedChain);
      return;
    } catch (err) {
      alert('Connection to Phantom rejected or failed.');
      console.error('Phantom error:', err);
      return;
    }
  }
  // Try Solana Wallet Standard (vanilla JS)
  let wallets = [];
  document.addEventListener('@wallet-standard/wallets', (event) => {
    wallets = event.detail.wallets;
    console.log('Wallet Standard wallets:', wallets);
  }, { once: true });
  if (window.wallets && Array.isArray(window.wallets)) {
    wallets = window.wallets;
    console.log('window.wallets:', wallets);
  }
  if (wallets.length > 0) {
    const walletNames = wallets.map(w => w.name).join(', ');
    const pick = prompt('Available Solana wallets: ' + walletNames + '\nType the name of the wallet to connect:');
    const wallet = wallets.find(w => w.name.toLowerCase() === pick?.toLowerCase());
    if (wallet && wallet.connect) {
      try {
        const resp = await wallet.connect();
        console.log('Wallet Standard connect response:', resp);
        connectedWallet = resp.publicKey.toString();
        connectedChain = 'solana';
        setWalletButton(connectedWallet, connectedChain);
        return;
      } catch (err) {
        alert('Connection rejected or failed.');
        console.error('Wallet Standard error:', err);
        return;
      }
    } else {
      alert('Wallet not found or not selected.');
      return;
    }
  }
  alert('No Solana wallet found. Please install Solflare, Phantom, Backpack, or another supported wallet.');
};

// --- Disconnect Logic ---
function disconnectWallet() {
  connectedWallet = null;
  connectedChain = null;
  setWalletButton(null, null);
}

// --- UI Event Bindings ---
const connectBtn = document.getElementById('connectWalletBtn');
const walletMenu = document.getElementById('walletMenu');
const walletDropdownMenu = document.getElementById('walletDropdownMenu');
const disconnectBtn = document.getElementById('disconnectBtn');

// Only setup disconnect button if not using wallet.js
if (disconnectBtn && walletDropdownMenu) {
  disconnectBtn.onclick = () => {
    disconnectWallet();
    walletDropdownMenu.style.display = 'none';
  };
}

// Only bind events if the old wallet menu elements exist (not using wallet.js)
if (walletMenu && walletDropdownMenu) {
  connectBtn.addEventListener('click', (e) => {
    if (connectedWallet) {
      walletDropdownMenu.style.display = walletDropdownMenu.style.display === 'none' ? 'flex' : 'none';
    } else {
      walletMenu.style.display = walletMenu.style.display === 'none' ? 'flex' : 'none';
    }
    e.stopPropagation();
  });
  
  window.addEventListener('click', (e) => {
    if (!connectBtn.contains(e.target) && !walletMenu.contains(e.target) && !walletDropdownMenu.contains(e.target)) {
      walletMenu.style.display = 'none';
      walletDropdownMenu.style.display = 'none';
    }
  });
  
  const walletOptions = document.querySelectorAll('.wallet-option');
  if (walletOptions.length >= 2) {
    walletOptions[0].onclick = () => { walletMenu.style.display = 'none'; evmConnect(); };
    walletOptions[1].onclick = () => { walletMenu.style.display = 'none'; solanaConnect(); };
  }
  
  setWalletButton(null, null);
} else {
  // wallet.js is handling wallet connections
  console.log('script.js: wallet.js is handling wallet connections, skipping old wallet logic');
}