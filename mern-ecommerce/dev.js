#!/usr/bin/env node

/**
 * KIZUKI Dev Launcher
 * Interactive CLI menu to launch dev services.
 * Usage: node dev.js          (interactive mode)
 *        node dev.js --test   (automated test mode)
 */

const { spawn, exec } = require('child_process');
const readline = require('readline');
const path = require('path');


const ROOT = __dirname;

const SERVICES = [
  {
    id: 'backend',
    label: 'Backend Server (Express + Stripe)',
    cwd: path.join(ROOT, 'backend'),
    command: 'node',
    args: ['server.js'],
    port: 5000,
  },
  {
    id: 'frontend',
    label: 'Frontend Dev Server (Vite + React)',
    cwd: path.join(ROOT, 'frontend'),
    command: 'npx',
    args: ['vite', '--port', '5173'],
    port: 5173,
  },
  {
    id: 'both',
    label: 'Launch Both (Backend + Frontend)',
    cwd: ROOT,
    command: 'node',
    args: [],
    port: null,
    isBoth: true,
  },
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const running = new Map();
const logBuffers = {};
const MAX_LOG_LINES = 50;

// ─── Logging ──────────────────────────────────────────────

function log(serviceId, text) {
  if (!logBuffers[serviceId]) logBuffers[serviceId] = [];
  logBuffers[serviceId].push(text);
  if (logBuffers[serviceId].length > MAX_LOG_LINES) {
    logBuffers[serviceId].shift();
  }
}

function clearLog(serviceId) {
  logBuffers[serviceId] = [];
}

function getAllLogs() {
  const result = {};
  for (const [id, buf] of Object.entries(logBuffers)) {
    result[id] = [...buf];
  }
  return result;
}

// ─── Output filtering ─────────────────────────────────────

function isNoise(line) {
  const noise = [
    /^npm warn/i,
    /^npm notice/i,
    /^The following package was not found/i,
    /^\[vite\]/i,
    /^\s*$/,
    /^node:/,
    /^Error:/,
    /^\s+at /,
    /^\s+---/,
    /^\s+\^/,
  ];
  return noise.some(p => p.test(line));
}

function isImportant(line) {
  const important = [
    /Server running on port/i,
    /VITE.*ready/i,
    /Local:\s+http/i,
    /Network:\s+http/i,
    /MongoDB connected/i,
    /payment intent/i,
    /started on port/i,
    /exited with code/i,
    /⚠️/i,
    /✓/i,
    /✗/i,
  ];
  return important.some(p => p.test(line));
}

function filterOutput(serviceId, raw) {
  const lines = raw.toString().split('\n').filter(Boolean);
  const results = [];
  for (const line of lines) {
    const trimmed = line.replace(/\x1b\[[0-9;]*m/g, '').trim();
    if (!trimmed) continue;
    if (isNoise(trimmed)) continue;
    log(serviceId, trimmed);
    // Auto-open browser when Vite URL appears (single-service mode)
    if (!testMode) detectAndOpenUrl(trimmed);
    if (isImportant(trimmed)) {
      results.push(trimmed);
    }
  }
  return results;
}

// ─── UI helpers ───────────────────────────────────────────

function printStatusLine(msg) {
  readline.cursorTo(process.stdout, 0);
  process.stdout.write('\x1b[2K');
  console.log(`  ${msg}`);
  if (rl.prompt) rl.prompt(true);
}

function printBanner() {
  console.clear();
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║        KIZUKI Dev Launcher           ║');
  console.log('  ║    MERN E-Commerce Dev Environment   ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
}

function printStatus() {
  if (running.size === 0) {
    console.log('  \x1b[90mNo services running.\x1b[0m\n');
    return;
  }
  console.log('  \x1b[90m─── Running Services ───\x1b[0m');
  for (const [id, proc] of running) {
    const svc = SERVICES.find(s => s.id === id);
    const status = proc.killed ? 'STOPPED' : 'RUNNING';
    const color = proc.killed ? '\x1b[31m' : '\x1b[32m';
    const port = svc ? svc.port || '' : '';
    const portInfo = port ? ` \x1b[90m(port ${port})\x1b[0m` : '';
    console.log(`  ${color}●\x1b[0m ${svc ? svc.label : id} ${portInfo}[${color}${status}\x1b[0m]`);
  }
  console.log('');
}

function printRecentLogs(serviceId, count = 5) {
  const buf = logBuffers[serviceId];
  if (!buf || buf.length === 0) return;
  const recent = buf.slice(-count);
  console.log(`  \x1b[90m─── Recent ${serviceId} logs ───\x1b[0m`);
  for (const line of recent) {
    console.log(`  \x1b[90m|\x1b[0m ${line}`);
  }
  console.log('');
}

function printMenu() {
  console.log('  \x1b[90m─── Select an option ───\x1b[0m');
  SERVICES.forEach((svc, i) => {
    const isRunning = running.has(svc.id);
    const status = isRunning ? ' \x1b[33m[RUNNING]\x1b[0m' : '';
    console.log(`  ${i + 1}. ${svc.label}${status}`);
  });
  console.log(`  ${SERVICES.length + 1}. Stop All Services`);
  console.log(`  ${SERVICES.length + 2}. Exit`);
  console.log('');
}

function showMenu() {
  printBanner();
  printStatus();
  for (const [id] of running) {
    printRecentLogs(id, 3);
  }
  printMenu();
  rl.question('  \x1b[36mEnter choice (1-' + (SERVICES.length + 2) + '): \x1b[0m', (answer) => {
    const choice = parseInt(answer.trim(), 10);
    if (choice >= 1 && choice <= SERVICES.length) {
      startService(SERVICES[choice - 1]);
    } else if (choice === SERVICES.length + 1) {
      stopAll();
    } else if (choice === SERVICES.length + 2) {
      console.log('  \x1b[33mShutting down...\x1b[0m');
      stopAll();
      rl.close();
      process.exit(0);
    } else {
      printStatusLine('\x1b[31mInvalid choice. Try again.\x1b[0m');
      setTimeout(showMenu, 800);
    }
  });
}

// ─── Service management ───────────────────────────────────

function startService(svc) {
  // Auto-stop any existing services before launching a new one
  if (running.size > 0) {
    printStatusLine(`\x1b[33mStopping ${running.size} existing service(s) before launching ${svc.label}...\x1b[0m`);
    for (const [id, proc] of running) {
      proc.kill('SIGTERM');
      log(id, `[${id}] Stopped by user (replaced by ${svc.id})`);
    }
    running.clear();
  }

  clearLog(svc.id);
  printStatusLine(`\x1b[36mStarting: ${svc.label}...\x1b[0m`);

  // Special handling for "both" — spawn backend + frontend as sibling processes
  if (svc.isBoth) {
    const beSvc = SERVICES.find(s => s.id === 'backend');
    const feSvc = SERVICES.find(s => s.id === 'frontend');

    const beChild = spawn(beSvc.command, beSvc.args, {
      cwd: beSvc.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env },
    });
    const feChild = spawn(feSvc.command, feSvc.args, {
      cwd: feSvc.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env },
    });

    // Track both children so stopAll can kill them
    const bothChildren = [beChild, feChild];
    bothChildren._isBothGroup = true;

    let exitedCount = 0;
    let bothExited = false;
    const onChildExit = () => {
      exitedCount++;
      if (exitedCount >= 2 && !bothExited) {
        bothExited = true;
        if (!testMode) {
          console.log('\n  \x1b[90m─── Both processes stopped ───\x1b[0m\n');
          showMenu();
        }
        running.delete(svc.id);
      }
    };
    beChild.on('close', onChildExit);
    feChild.on('close', onChildExit);

    running.set(svc.id, bothChildren);

    // In interactive mode, enter live log view
    if (!testMode) {
      enterLiveLogView(svc, beChild, feChild);
    } else {
      // In test mode, pipe through filter
      beChild.stdout.on('data', (data) => filterOutput('both', data));
      beChild.stderr.on('data', (data) => filterOutput('both', data));
      feChild.stdout.on('data', (data) => filterOutput('both', data));
      feChild.stderr.on('data', (data) => filterOutput('both', data));
    }

    return bothChildren;
  }


  // Normal single-service launch
  const child = spawn(svc.command, svc.args, {
    cwd: svc.cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    env: { ...process.env },
  });

  child.stdout.on('data', (data) => {
    filterOutput(svc.id, data);
  });

  child.stderr.on('data', (data) => {
    filterOutput(svc.id, data);
  });

  child.on('close', (code) => {
    const msg = code === 0
      ? `\x1b[32m${svc.label} stopped gracefully.\x1b[0m`
      : `\x1b[31m${svc.label} exited with code ${code}\x1b[0m`;
    printStatusLine(msg);
    running.delete(svc.id);
    if (!testMode) showMenu();
  });

  running.set(svc.id, child);
  return child;
}


function stopAll() {
  if (running.size === 0) return;
  for (const [id, proc] of running) {
    if (Array.isArray(proc) && proc._isBothGroup) {
      for (const child of proc) {
        child.kill('SIGTERM');
      }
    } else {
      proc.kill('SIGTERM');
    }
    log(id, `[${id}] Stopped by user`);
  }
  running.clear();
}

// ─── Test mode ────────────────────────────────────────────

let testMode = false;

async function runTests() {
  testMode = true;
  const results = {
    timestamp: new Date().toISOString(),
    summary: { passed: 0, failed: 0, total: 0 },
    tests: [],
  };

  function record(name, status, detail) {
    results.tests.push({ name, status, detail, logs: getAllLogs() });
    results.summary.total++;
    if (status === 'PASS') results.summary.passed++;
    else results.summary.failed++;
    // Clear all log buffers after recording so next test starts fresh
    for (const key of Object.keys(logBuffers)) {
      delete logBuffers[key];
    }
  }

  function waitForOutput(serviceId, keyword, timeoutMs = 10000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        const buf = logBuffers[serviceId] || [];
        const found = buf.some(l => l.toLowerCase().includes(keyword.toLowerCase()));
        if (found) return resolve(true);
        if (Date.now() - start > timeoutMs) return resolve(false);
        setTimeout(check, 200);
      };
      check();
    });
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // ── Test 1: Start backend alone ──
  console.log('\n  \x1b[36m═══════════════════════════════════════\x1b[0m');
  console.log('  \x1b[36m  TEST 1: Start Backend Server Alone\x1b[0m');
  console.log('  \x1b[36m═══════════════════════════════════════\x1b[0m\n');

  const be = SERVICES.find(s => s.id === 'backend');
  startService(be);
  const beReady = await waitForOutput('backend', 'Server running on port', 8000);
  await sleep(1000);

  if (beReady) {
    record('Start Backend Alone', 'PASS', 'Backend started and listening on port 5000');
  } else {
    record('Start Backend Alone', 'FAIL', 'Backend did not report "Server running on port" within timeout');
  }

  stopAll();
  await sleep(1000);

  // ── Test 2: Start frontend alone ──
  console.log('\n  \x1b[36m═══════════════════════════════════════\x1b[0m');
  console.log('  \x1b[36m  TEST 2: Start Frontend Server Alone\x1b[0m');
  console.log('  \x1b[36m═══════════════════════════════════════\x1b[0m\n');

  const fe = SERVICES.find(s => s.id === 'frontend');
  startService(fe);
  const feReady = await waitForOutput('frontend', 'VITE', 15000);
  await sleep(1000);

  if (feReady) {
    record('Start Frontend Alone', 'PASS', 'Vite dev server started and ready');
  } else {
    record('Start Frontend Alone', 'FAIL', 'Vite did not report ready within timeout');
  }

  stopAll();
  await sleep(1000);

  // ── Test 3: Start both concurrently ──
  console.log('\n  \x1b[36m═══════════════════════════════════════\x1b[0m');
  console.log('  \x1b[36m  TEST 3: Launch Both Concurrently\x1b[0m');
  console.log('  \x1b[36m═══════════════════════════════════════\x1b[0m\n');

  const both = SERVICES.find(s => s.id === 'both');
  startService(both);
  const bothBe = await waitForOutput('both', 'Server running on port', 10000);
  const bothFe = await waitForOutput('both', 'VITE', 15000);
  await sleep(1000);

  if (bothBe && bothFe) {
    record('Launch Both Concurrently', 'PASS', 'Both backend and frontend started via concurrently');
  } else if (bothBe) {
    record('Launch Both Concurrently', 'PARTIAL', 'Backend started but frontend (Vite) may not be ready');
  } else {
    record('Launch Both Concurrently', 'FAIL', 'Neither backend nor frontend started properly');
  }

  stopAll();
  await sleep(1000);

  // ── Test 4: Health endpoint ──
  console.log('\n  \x1b[36m═══════════════════════════════════════\x1b[0m');
  console.log('  \x1b[36m  TEST 4: Health Endpoint Response\x1b[0m');
  console.log('  \x1b[36m═══════════════════════════════════════\x1b[0m\n');

  startService(be);
  const beReady2 = await waitForOutput('backend', 'Server running on port', 8000);
  await sleep(500);

  let healthResult = 'unreachable';
  if (beReady2) {
    try {
      const http = require('http');
      const healthResp = await new Promise((resolve, reject) => {
        const req = http.get('http://localhost:5000/health', (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(data));
        });
        req.on('error', () => resolve(null));
        req.setTimeout(3000, () => { req.destroy(); resolve(null); });
      });
      if (healthResp) {
        const parsed = JSON.parse(healthResp);
        healthResult = parsed.status === 'ok' ? 'healthy' : 'unexpected';
      }
    } catch (e) {
      healthResult = 'error';
    }
  }

  if (healthResult === 'healthy') {
    record('Health Endpoint', 'PASS', 'GET /health returned {"status":"ok"}');
  } else {
    record('Health Endpoint', 'FAIL', `Health endpoint returned: ${healthResult}`);
  }

  stopAll();
  await sleep(500);

  // ── Test 5: Payment intent endpoint ──
  console.log('\n  \x1b[36m═══════════════════════════════════════\x1b[0m');
  console.log('  \x1b[36m  TEST 5: Payment Intent Endpoint\x1b[0m');
  console.log('  \x1b[36m═══════════════════════════════════════\x1b[0m\n');

  startService(be);
  const beReady3 = await waitForOutput('backend', 'Server running on port', 8000);
  await sleep(500);

  let piResult = 'unreachable';
  if (beReady3) {
    try {
      const http = require('http');
      const piResp = await new Promise((resolve, reject) => {
        const postData = JSON.stringify({ items: [{ id: 'p_1' }, { id: 'p_2' }] });
        const options = {
          hostname: 'localhost', port: 5000, path: '/api/create-payment-intent',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
        };
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(data));
        });
        req.on('error', () => resolve(null));
        req.write(postData);
        req.end();
        req.setTimeout(3000, () => { req.destroy(); resolve(null); });
      });
      if (piResp) {
        const parsed = JSON.parse(piResp);
        piResult = parsed.clientSecret ? 'has_client_secret' : 'no_secret';
      }
    } catch (e) {
      piResult = 'error';
    }
  }

  if (piResult === 'has_client_secret') {
    record('Payment Intent Endpoint', 'PASS', 'POST /api/create-payment-intent returned client_secret');
  } else {
    record('Payment Intent Endpoint', 'FAIL', `Payment intent returned: ${piResult}`);
  }

  stopAll();
  await sleep(500);

  // ── Test 6: Frontend build ──
  console.log('\n  \x1b[36m═══════════════════════════════════════\x1b[0m');
  console.log('  \x1b[36m  TEST 6: Frontend Production Build\x1b[0m');
  console.log('  \x1b[36m═══════════════════════════════════════\x1b[0m\n');

  const buildResult = await new Promise((resolve) => {
    const build = spawn('npx', ['vite', 'build'], {
      cwd: path.join(ROOT, 'frontend'),
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });
    let output = '';
    build.stdout.on('data', d => output += d.toString());
    build.stderr.on('data', d => output += d.toString());
    build.on('close', (code) => resolve({ code, output }));
  });

  if (buildResult.code === 0) {
    record('Frontend Production Build', 'PASS', 'Vite build completed successfully');
  } else {
    record('Frontend Production Build', 'FAIL', `Build exited with code ${buildResult.code}`);
  }

  // ── Final report ──
  console.log('\n');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║        TEST RESULTS REPORT            ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  console.log(`  Timestamp: ${results.timestamp}`);
  console.log(`  Passed: \x1b[32m${results.summary.passed}\x1b[0m / ${results.summary.total}`);
  console.log(`  Failed: \x1b[31m${results.summary.failed}\x1b[0m / ${results.summary.total}`);
  console.log('');

  for (const test of results.tests) {
    const icon = test.status === 'PASS' ? '\x1b[32m✓\x1b[0m' : test.status === 'PARTIAL' ? '\x1b[33m⚠\x1b[0m' : '\x1b[31m✗\x1b[0m';
    console.log(`  ${icon} ${test.name}: \x1b[90m${test.status}\x1b[0m`);
    console.log(`     ${test.detail}`);
    console.log('');
  }

  // Output structured JSON for LLM analysis
  const reportPath = path.join(ROOT, 'test-report.json');
  require('fs').writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`  \x1b[90mFull report saved to: ${reportPath}\x1b[0m`);
  console.log('');

  // Print the JSON to stdout for piping/LLM consumption
  console.log('  \x1b[90m─── Machine-readable report (JSON) ───\x1b[0m');
  console.log(JSON.stringify(results, null, 2));

  rl.close();
  process.exit(results.summary.failed > 0 ? 1 : 0);
}

// ─── Browser auto-open ────────────────────────────────────

let browserOpened = false;

function openBrowser(url) {
  if (browserOpened) return; // Only open once per session
  browserOpened = true;
  const cmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  console.log(`  \x1b[90m→ Opening browser at \x1b[4m${url}\x1b[0m\x1b[90m...\x1b[0m`);
  exec(`${cmd} ${url}`, (err) => {
    if (err) console.log(`  \x1b[31mFailed to open browser: ${err.message}\x1b[0m`);
  });
}

function detectAndOpenUrl(line) {
  // Match URLs like http://localhost:5173/ or http://localhost:5174/
  const match = line.match(/https?:\/\/localhost:\d+/);
  if (match && !browserOpened) {
    openBrowser(match[0]);
  }
}

// ─── Live log view for "both" mode ────────────────────────

function enterLiveLogView(svc, beChild, feChild) {
  console.clear();
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║     LIVE LOG VIEW                    ║');
  console.log('  ║     Backend + Frontend Streaming     ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  console.log('  \x1b[90mPress \x1b[33mx\x1b[90m to stop both services and return to menu\x1b[0m');
  console.log('  \x1b[90m──────────────────────────────────────────\x1b[0m');
  console.log('');

  // Write a line to the log view
  function writeLog(prefix, msg, color) {
    const lines = msg.toString().split('\n').filter(Boolean);
    for (const line of lines) {
      const trimmed = line.replace(/\x1b\[[0-9;]*m/g, '').trim();
      if (!trimmed) return;
      // Filter noise
      if (/^npm warn/i.test(trimmed) || /^npm notice/i.test(trimmed) || /^The following package/i.test(trimmed)) return;
      const c = color || '\x1b[90m';
      console.log(`  ${c}${prefix}\x1b[0m ${trimmed}`);
      // Also buffer for test mode
      log('both', `${prefix} ${trimmed}`);
      // Auto-open browser when Vite URL appears
      detectAndOpenUrl(trimmed);
    }
  }

  beChild.stdout.on('data', (data) => writeLog('[BE]', data, '\x1b[36m'));
  beChild.stderr.on('data', (data) => writeLog('[BE]', data, '\x1b[31m'));
  feChild.stdout.on('data', (data) => writeLog('[FE]', data, '\x1b[33m'));
  feChild.stderr.on('data', (data) => writeLog('[FE]', data, '\x1b[31m'));

  // Set up raw mode to capture 'x' keypress
  const stdin = process.stdin;
  const wasRaw = stdin.isRaw;
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  const onKey = (key) => {
    if (key === 'x' || key === 'X') {
      stdin.removeListener('data', onKey);
      stdin.setRawMode(wasRaw);
      stdin.pause();
      console.log('');
      console.log('  \x1b[33mStopping services...\x1b[0m');
      stopAll();
    }
  };
  stdin.on('data', onKey);
}

// ─── Exit handling ────────────────────────────────────────

process.on('SIGINT', () => {
  console.log('\n  \x1b[33mShutting down...\x1b[0m');
  stopAll();
  rl.close();
  process.exit(0);
});

// ─── PIN mode: Admin curl backdoor ────────────────────────

async function runPinMode() {
  const pinIndex = process.argv.indexOf('--pin');
  const pin = pinIndex >= 0 && process.argv.length > pinIndex + 1
    ? process.argv[pinIndex + 1]
    : '9998';

  const isProd = process.argv.includes('--prod');

  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║     KIZUKI Admin Curl Backdoor      ║');
  console.log('  ║     --pin mode                       ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  console.log(`  Passcode: ${pin}`);
  console.log(`  Target:   ${isProd ? 'https://api.kizuki.vip (PRODUCTION)' : 'http://localhost:5000 (LOCAL)'}`);
  console.log('');

  const BASE = isProd ? 'https://api.kizuki.vip' : 'http://localhost:5000';

  async function curl(method, path, body = null) {
    const url = `${BASE}${path}`;
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      return { status: response.status, data };
    } catch (err) {
      return { status: 0, data: { error: err.message } };
    }
  }

  // ── Test 1: Health ──
  console.log('  \x1b[90m─── [1/6] Health Check ───\x1b[0m');
  const health = await curl('GET', '/health');
  console.log(`  ${health.status === 200 ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} GET /health → ${health.status}`);
  console.log(`     ${JSON.stringify(health.data)}`);
  console.log('');

  // ── Test 2: Products ──
  console.log('  \x1b[90m─── [2/6] Products ───\x1b[0m');
  const products = await curl('GET', '/api/products');
  console.log(`  ${products.status === 200 ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} GET /api/products → ${products.status}`);
  if (products.data?.products) {
    for (const p of products.data.products) {
      console.log(`     ${p.id}: ${p.name} — $${p.price} — remaining: ${p.remaining}`);
    }
  }
  console.log('');

  // ── Test 3: Admin Stats ──
  console.log('  \x1b[90m─── [3/6] Admin Stats ───\x1b[0m');
  const stats = await curl('POST', '/api/admin/stats', { passcode: pin });
  console.log(`  ${stats.status === 200 ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} POST /api/admin/stats → ${stats.status}`);
  if (stats.data?.stats) {
    const s = stats.data.stats;
    console.log(`     Orders: ${s.totalOrders} | Revenue: $${(s.totalRevenue / 100).toFixed(2)} | Pending: ${s.pendingOrders}`);
    console.log(`     Products: ${s.totalProducts} | Captured Cards: ${s.totalCapturedCards}`);
  } else if (stats.data?.error) {
    console.log(`     \x1b[31mError: ${stats.data.error}\x1b[0m`);
  }
  console.log('');

  // ── Test 4: Admin Tables ──
  console.log('  \x1b[90m─── [4/6] Admin Tables ───\x1b[0m');
  const tables = await curl('POST', '/api/admin/tables', { passcode: pin });
  console.log(`  ${tables.status === 200 ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} POST /api/admin/tables → ${tables.status}`);
  if (tables.data?.tables) {
    for (const t of tables.data.tables) {
      console.log(`     ${t.name}: ${t.rowCount} rows`);
    }
  } else if (tables.data?.error) {
    console.log(`     \x1b[31mError: ${tables.data.error}\x1b[0m`);
  }
  console.log('');

  // ── Test 5: Admin Quantities ──
  console.log('  \x1b[90m─── [5/6] Admin Quantities ───\x1b[0m');
  const quantities = await curl('POST', '/api/admin/quantities', { passcode: pin });
  console.log(`  ${quantities.status === 200 ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} POST /api/admin/quantities → ${quantities.status}`);
  if (quantities.data?.products) {
    for (const p of quantities.data.products) {
      console.log(`     ${p.id}: ${p.name} — ${p.quantity} remaining`);
    }
  } else if (quantities.data?.error) {
    console.log(`     \x1b[31mError: ${quantities.data.error}\x1b[0m`);
  }
  console.log('');

  // ── Test 6: Admin Orders ──
  console.log('  \x1b[90m─── [6/6] Admin Orders ───\x1b[0m');
  const orders = await curl('GET', '/api/admin/orders');
  console.log(`  ${orders.status === 200 ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} GET /api/admin/orders → ${orders.status}`);
  if (orders.data?.orders) {
    console.log(`     Total orders: ${orders.data.count}`);
    for (const o of orders.data.orders) {
      console.log(`     #${o.order_id} — ${o.full_name} — $${(o.total / 100).toFixed(2)} — ${o.status}`);
    }
  }
  console.log('');

  // ── Summary ──
  console.log('  \x1b[90m──────────────────────────────────────────\x1b[0m');
  console.log('  \x1b[32m✓ Admin curl backdoor complete\x1b[0m');
  console.log(`  \x1b[90mPasscode used: ${pin}\x1b[0m`);
  console.log('');

  process.exit(0);
}

// ─── Entry point ──────────────────────────────────────────

if (process.argv.includes('--test')) {
  runTests();
} else if (process.argv.includes('--pin')) {
  runPinMode();
} else {
  showMenu();
}
