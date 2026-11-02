const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_DIR = '/var/www/levlox-portal';

function updateVercelJson(newUrl) {
  try {
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
        console.log('[Supervisor] Updated ' + file + ' with ' + newUrl);
      }
    }

    if (changed) {
      console.log('[Supervisor] Committing and pushing updated vercel.json to GitHub...');
      execSync('git config user.name "Levlox Auto Sync"', { cwd: REPO_DIR });
      execSync('git config user.email "bot@levloxstudent.com"', { cwd: REPO_DIR });
      execSync('git add vercel.json frontend/vercel.json', { cwd: REPO_DIR });
      execSync('git commit -m "fix: auto-sync active tunnel URL to vercel.json"', { cwd: REPO_DIR });
      execSync('git push origin main', { cwd: REPO_DIR });
      console.log('[Supervisor] Successfully pushed updated tunnel URL to GitHub/Vercel!');
    } else {
      console.log('[Supervisor] vercel.json is already up to date with ' + newUrl);
    }
  } catch (err) {
    console.error('[Supervisor] Failed to update/push vercel.json:', err.message);
  }
}

function startTunnel() {
  console.log('[Supervisor] Launching cloudflared tunnel...');
  const child = spawn('cloudflared', ['tunnel', '--url', 'http://localhost:20020'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let urlFound = false;

  function parseOutput(data) {
    const text = data.toString();
    process.stderr.write(text);

    if (!urlFound) {
      const match = text.match(/https:\/\/[a-zA-Z0-9.-]+\.trycloudflare\.com/);
      if (match) {
        urlFound = true;
        const activeUrl = match[0];
        console.log('[Supervisor] Active tunnel URL detected: ' + activeUrl);
        updateVercelJson(activeUrl);
      }
    }
  }

  child.stdout.on('data', parseOutput);
  child.stderr.on('data', parseOutput);

  child.on('exit', (code, sig) => {
    console.warn('[Supervisor] cloudflared exited with code ' + code + ', signal ' + sig + '. Restarting in 5s...');
    setTimeout(startTunnel, 5000);
  });
}

startTunnel();
