# External Project Lists for Trending/Explore

This app can merge locally hard-coded projects with remote lists from your storage repo.

How it works
- Configure remote URLs in `js/trending-config.js` under `remoteProjectListUrls`.
- Each URL should return either an array of project objects, or an object with a `projects` array.
- A project object supports:
  - `chainId`: dexscreener chain id (e.g., `base`, `ethereum`, `solana`)
  - `tokenAddress`: contract or mint address
  - `name` (optional): override displayed name; otherwise Dexscreener name is used
  - `logoUrl` (optional): custom logo; otherwise Dexscreener logo is used if any

Example JSON (array form)
[
  {
    "chainId": "base",
    "tokenAddress": "0x0000000000000000000000000000000000000001",
    "name": "Example Token",
    "logoUrl": "https://example.com/logo.png"
  },
  {
    "chainId": "solana",
    "tokenAddress": "So11111111111111111111111111111111111111112"
  }
]

Example JSON (object with `projects`)
{
  "projects": [
    { "chainId": "base", "tokenAddress": "0x...", "name": "Project A" },
    { "chainId": "ethereum", "tokenAddress": "0x..." }
  ]
}

Merging & deduplication
- Local `projects` and all remote lists are merged.
- Deduped by `chainId:tokenAddress` (case-insensitive).
- Order of local list does not guarantee display order; sections are sorted by live market data.

Notes
- Remote fetches use `cache: 'no-store'` to avoid stale data.
- If a remote URL fails or returns invalid JSON, it is skipped (warning logged in console).
- Update `slotsPerCategory` to control how many cards render per trending block.
