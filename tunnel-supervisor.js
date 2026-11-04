const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const REPO_DIR = process.env.REPO_DIR || '/var/www/levlox-portal';

let currentTunnelUrl = null;
let lastSyncedUrl = null;
let tunnelProcess = null;
let consecutiveFailures = 0;
let isSyncing = false;

function checkUrlHealth(urlStr, timeoutMs = 10000) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(urlStr);
      const mod = parsed.protocol === 'https:' ? https : http;
      const req = mod.get(urlStr, { timeout: timeoutMs }, (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.on('error', () => {
        resolve(false);
      });
    } catch {
      resolve(false);
    }
  });
}

async function syncTunnelToGitHub(newUrl) {
  if (isSyncing) {
    console.log('[Supervisor] Sync already in progress, skipping...');
    return;
  }
  isSyncing = true;

  try {
    console.log('[Supervisor] Syncing tunnel URL to GitHub/Vercel: ' + newUrl);

    // 1. Fetch latest changes from GitHub and reset working tree cleanly
    try {
      execSync('git fetch origin main', { cwd: REPO_DIR, timeout: 20000 });
      execSync('git reset --hard origin/main', { cwd: REPO_DIR, timeout: 10000 });
    } catch (gitFetchErr) {
      console.warn('[Supervisor] git fetch/reset warning:', gitFetchErr.message);
    }

    // 2. Update vercel.json and frontend/vercel.json
    const targets = [
      path.join(REPO_DIR, 'vercel.json'),
      path.join(REPO_DIR, 'frontend', 'vercel.json'),
    ];

    let changed = false;

    for (const file of targets) {
      if (!fs.existsSync(file)) continue;
      const content = fs.readFileSync(file, 'utf8');
      const current = JSON.parse(content);
      let fileChanged = false;

      for (const rw of current.rewrites || []) {
        if (rw.destination && rw.destination.includes('.trycloudflare.com')) {
          const oldDest = rw.destination;
          rw.destination = rw.destination.replace(/https:\/\/[a-zA-Z0-9.-]+\.trycloudflare\.com/, newUrl);
          if (rw.destination !== oldDest) {
            fileChanged = true;
          }
        }
      }

      if (fileChanged) {
        fs.writeFileSync(file, JSON.stringify(current, null, 2) + '\n', 'utf8');
        changed = true;
        console.log('[Supervisor] Updated ' + path.basename(file) + ' with ' + newUrl);
      }
    }

    if (changed) {
      console.log('[Supervisor] Committing and pushing updated vercel.json to GitHub (without skip ci)...');
      execSync('git config user.name "Levlox Auto Sync"', { cwd: REPO_DIR });
      execSync('git config user.email "bot@levloxstudent.com"', { cwd: REPO_DIR });
      execSync('git add vercel.json frontend/vercel.json', { cwd: REPO_DIR });
      // IMPORTANT: DO NOT USE [skip ci] so Vercel deploys immediately!
      execSync('git commit -m "fix(infra): auto-sync active tunnel URL to vercel.json"', { cwd: REPO_DIR });
      execSync('git push origin main', { cwd: REPO_DIR, timeout: 30000 });
      lastSyncedUrl = newUrl;
      console.log('[Supervisor] Successfully pushed updated tunnel URL to GitHub! Vercel is now deploying.');
    } else {
      lastSyncedUrl = newUrl;
      console.log('[Supervisor] vercel.json is already pointing to ' + newUrl);
    }
  } catch (err) {
    console.error('[Supervisor] Failed to update/push vercel.json:', err.message);
    // Retry in 30 seconds if failed
    setTimeout(() => {
      if (currentTunnelUrl && lastSyncedUrl !== currentTunnelUrl) {
        syncTunnelToGitHub(currentTunnelUrl);
      }
    }, 30000);
  } finally {
    isSyncing = false;
  }
}

function startTunnel() {
  console.log('[Supervisor] Launching cloudflared tunnel...');
  consecutiveFailures = 0;

  tunnelProcess = spawn('cloudflared', ['tunnel', '--url', 'http://localhost:20020'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  function parseOutput(data) {
    const text = data.toString();
    process.stderr.write(text);

    const match = text.match(/https:\/\/[a-zA-Z0-9.-]+\.trycloudflare\.com/);
    if (match) {
      const activeUrl = match[0];
      if (activeUrl !== currentTunnelUrl) {
        currentTunnelUrl = activeUrl;
        console.log('[Supervisor] Active tunnel URL detected: ' + activeUrl);
        syncTunnelToGitHub(activeUrl);
      }
    }
  }

  tunnelProcess.stdout.on('data', parseOutput);
  tunnelProcess.stderr.on('data', parseOutput);

  tunnelProcess.on('exit', (code, sig) => {
    console.warn(`[Supervisor] cloudflared exited (code: ${code}, sig: ${sig}). Restarting in 10s...`);
    currentTunnelUrl = null;
    tunnelProcess = null;
    setTimeout(startTunnel, 10000);
  });
}

// Gentle health monitor: verify every 60s, do NOT kill cloudflared in a loop
setInterval(async () => {
  if (!currentTunnelUrl) return;

  const healthy = await checkUrlHealth(`${currentTunnelUrl}/health`);
  if (healthy) {
    consecutiveFailures = 0;
  } else {
    consecutiveFailures++;
    console.warn(`[Supervisor] Health check warning (${consecutiveFailures}/10) for ${currentTunnelUrl}/health`);
    // Only if it has been continuously dead for 10 minutes (10 checks), gently restart
    if (consecutiveFailures >= 10) {
      console.error('[Supervisor] Tunnel unreachable for 10 minutes. Restarting cloudflared...');
      consecutiveFailures = 0;
      if (tunnelProcess) {
        tunnelProcess.kill('SIGTERM');
      }
      return;
    }
  }

  // Check if vercel.json on origin/main is synced with currentTunnelUrl
  if (healthy && lastSyncedUrl !== currentTunnelUrl && !isSyncing) {
    console.log('[Supervisor] Synced URL mismatch detected. Re-triggering sync...');
    syncTunnelToGitHub(currentTunnelUrl);
  }
}, 60000);

startTunnel();
