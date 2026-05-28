# Deployment Guide — VPS + Vercel

This guide covers deploying the Pegasus engine to a VPS (DigitalOcean, Hetzner, AWS EC2, etc.) and the frontend to Vercel.

## Prerequisites

- A VPS with Node.js 20+ installed
- SSH access to the VPS
- A GitHub account (for Vercel deployment)
- The deployed contract addresses from the X Layer testnet deployment

## Part 1: Push to GitHub

**Before you push**, confirm `.env` files are gitignored:

```bash
git status
# Should NOT show engine/.env, contracts/.env, or frontend/.env.local
```

If any `.env` files appear, **stop** — they contain your private key. The `.gitignore` files are already configured to exclude them, but double-check.

Initialize and push:

```bash
git init
git add .
git commit -m "Initial commit - Pegasus adaptive fee hook"
git remote add origin https://github.com/YOUR_USERNAME/pegasus.git
git push -u origin main
```

Make the repo **public** if it's part of your hackathon submission.

## Part 2: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **New Project** → **Import** your `pegasus` repo.
3. **Root Directory**: Set to `frontend/` (click "Edit" next to the detected framework).
4. **Environment Variables**: Add these (get values from your local `frontend/.env.local`):

   ```
   NEXT_PUBLIC_CHAIN_ID=1952
   NEXT_PUBLIC_RPC_URL=https://testrpc.xlayer.tech
   NEXT_PUBLIC_PEGASUS_HOOK=0x5eC95C19730eb31F8eE453b76A844Faf89bAe080
   NEXT_PUBLIC_POOL_MANAGER=0x7CbaA76c870fFB49bb7567b8da7f7433feC1b949
   NEXT_PUBLIC_POOL_SWAP_TEST=0x3ed13A53F0B63070740AE8700708201f1D0Dd7D8
   NEXT_PUBLIC_POOL_MODIFY_LIQUIDITY_TEST=0xB4672c08921d3Ea6A835d08a7BD17535d2EecB28
   NEXT_PUBLIC_TOKEN_A=0x1033e20584B3e8DF7705253F7698c31b592bD4BD
   NEXT_PUBLIC_TOKEN_B=0xE95AA4A81368741194265F2b1ABa29E3ba8FE32D
   NEXT_PUBLIC_WC_PROJECT_ID=
   ```

   *(Optional)* Get a WalletConnect project ID at [cloud.walletconnect.com](https://cloud.walletconnect.com) for better wallet connection reliability. Leave blank if you don't need it.

5. Click **Deploy**. Wait ~90 seconds.
6. Your site is live at `https://pegasus-xyz.vercel.app` (or similar). Copy the URL.

## Part 3: Deploy Engine to VPS

### SSH into your VPS

```bash
ssh root@YOUR_VPS_IP
```

### Install dependencies (if not already present)

```bash
# Node.js 20+ (if not installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# pnpm (or use npm)
npm install -g pnpm

# pm2 (process manager to keep engine running)
npm install -g pm2
```

### Clone and set up the engine

```bash
cd /opt
git clone https://github.com/YOUR_USERNAME/pegasus.git
cd pegasus/engine
pnpm install
```

### Create the `.env` file

```bash
nano .env
```

Paste this, replacing `YOUR_PRIVATE_KEY_HERE` with your actual testnet private key:

```env
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
RPC_URL=https://testrpc.xlayer.tech
CHAIN_ID=1952

PEGASUS_HOOK_ADDRESS=0x5eC95C19730eb31F8eE453b76A844Faf89bAe080
POOL_MANAGER_ADDRESS=0x7CbaA76c870fFB49bb7567b8da7f7433feC1b949
POOL_SWAP_TEST_ADDRESS=0x3ed13A53F0B63070740AE8700708201f1D0Dd7D8
POOL_MODIFY_LIQUIDITY_TEST_ADDRESS=0xB4672c08921d3Ea6A835d08a7BD17535d2EecB28
TOKEN_A_ADDRESS=0x1033e20584B3e8DF7705253F7698c31b592bD4BD
TOKEN_B_ADDRESS=0xE95AA4A81368741194265F2b1ABa29E3ba8FE32D

TICK_SPACING=60
UPDATE_INTERVAL_MS=10000
```

Save and exit (`Ctrl+X`, `Y`, `Enter`).

### Start the engine with pm2

```bash
pm2 start index.js --name pegasus-engine
pm2 save
pm2 startup
```

The last command prints a command to run — copy and execute it. This makes the engine auto-start on VPS reboot.

### Verify it's running

```bash
pm2 logs pegasus-engine
```

You should see:
```
=== Pegasus Oracle Engine ===
Network:    chainId 1952 (X Layer Testnet)
Hook:       0x5eC95C19730eb31F8eE453b76A844Faf89bAe080
Oracle:     0x5966Bc03a42538aCCCC066ea92c4Ff5099f53F4d
...
```

Press `Ctrl+C` to exit logs (engine keeps running).

### Useful pm2 commands

```bash
pm2 status                  # Check if running
pm2 logs pegasus-engine     # View live logs
pm2 restart pegasus-engine  # Restart after code changes
pm2 stop pegasus-engine     # Stop the engine
pm2 delete pegasus-engine   # Remove from pm2
```

## Part 4: Link Frontend + Engine

The frontend and engine are already linked via the **contract addresses** in their env files. Both point to the same deployed contracts on X Layer testnet:

- Frontend reads from `NEXT_PUBLIC_PEGASUS_HOOK` → displays live fee + metrics
- Engine writes to `PEGASUS_HOOK_ADDRESS` via `setOracleFee` → overrides the fee

When a user swaps on the frontend:
1. Tx goes to `PoolSwapTest` → `PoolManager` → `PegasusHook.beforeSwap`
2. Hook computes fee on-chain, emits `SwapAnalyzed` event
3. Frontend dashboard subscribes to that event → updates within 5s
4. Engine reads `getPoolMetrics` every 10s → if optimal fee diverges by ≥200 bps, calls `setOracleFee`
5. Next swap uses the oracle fee → frontend shows the new value

No additional wiring needed — they communicate through the on-chain hook state.

## Part 5: Update After Code Changes

### Frontend (Vercel)

Push to GitHub → Vercel auto-deploys:

```bash
git add .
git commit -m "Update frontend"
git push
```

Vercel detects the push and rebuilds automatically (~90s).

### Engine (VPS)

SSH in, pull, restart:

```bash
ssh root@YOUR_VPS_IP
cd /opt/pegasus/engine
git pull
pnpm install  # if package.json changed
pm2 restart pegasus-engine
```

## Security Notes

- **Never commit `.env` files.** The `.gitignore` is configured to exclude them.
- **Use a testnet-only wallet** for the engine. The private key in `engine/.env` should never hold mainnet funds.
- **Restrict VPS SSH access.** Use SSH keys, disable password auth, run `ufw` firewall.
- The engine doesn't expose any HTTP ports — it only makes outbound RPC calls. No inbound firewall rules needed.

## Troubleshooting

**Engine not pushing fees:**
```bash
pm2 logs pegasus-engine
```
Check for:
- `WARN: oracle on-chain is X, this wallet is Y` → you're using the wrong private key
- `setOracleFee failed: ...` → out of gas, or the wallet isn't the oracle

**Frontend shows zero addresses:**
- Check Vercel env vars are set correctly (they must start with `NEXT_PUBLIC_`)
- Redeploy after adding env vars (Settings → Redeploy)

**"Wrong network" on frontend:**
- Chain ID 1952 is correct for X Layer testnet
- MetaMask may cache the old chain ID 195 — remove and re-add the network

## Demo Day Checklist

- [ ] Frontend live on Vercel, URL copied
- [ ] Engine running on VPS (`pm2 status` shows "online")
- [ ] Test one swap on the live frontend → dashboard updates
- [ ] Pre-open hook contract on OKX explorer in a browser tab
- [ ] (Optional) SSH into VPS during demo, run `pm2 logs pegasus-engine --lines 50` to show live engine output

Your live deployment URLs:
- **Frontend**: `https://YOUR_VERCEL_URL.vercel.app`
- **Hook contract**: `https://www.okx.com/en-us/web3/explorer/xlayer-test/address/0x5eC95C19730eb31F8eE453b76A844Faf89bAe080`
