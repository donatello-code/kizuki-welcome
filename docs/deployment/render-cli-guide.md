═══════════════════════════════════════════════════════════════
  KIZUKI STORE — Render.com CLI Deployment Guide
  Full-Stack: Node.js Backend + React Frontend
═══════════════════════════════════════════════════════════════

Last Updated: 2026-05-10
Render CLI Version: 2.16.0
GitHub Repo: https://github.com/donatello-code/kizuki-welcome

═══════════════════════════════════════════════════════════════
  TABLE OF CONTENTS
═══════════════════════════════════════════════════════════════
  1. Prerequisites
  2. Install Render CLI on Windows
  3. Authenticate
  4. Service Architecture Overview
  5. Deploy Backend (Web Service)
  6. Deploy Frontend (Static Site)
  7. Set Environment Variables
  8. Trigger Deployments
  9. Check Status & Logs
  10. Quick Deploy Script
  11. Troubleshooting

═══════════════════════════════════════════════════════════════
  1. PREREQUISITES
═══════════════════════════════════════════════════════════════

  - GitHub account with repo: donatello-code/kizuki-welcome
  - Render.com account (free tier works)
  - Node.js installed locally (for the deploy script)
  - Git installed locally

═══════════════════════════════════════════════════════════════
  2. INSTALL RENDER CLI ON WINDOWS
═══════════════════════════════════════════════════════════════

  Option A: Download Pre-built Binary (Recommended)
  ───────────────────────────────────────────────────────────
  1. Go to: https://github.com/render-oss/cli/releases
  2. Download the Windows zip (e.g., cli_2.16.0_windows_amd64.zip)
  3. Extract render.exe to C:\Windows\System32\
     (or any folder in your PATH)

  Option B: Via PowerShell
  ───────────────────────────────────────────────────────────
  # Check latest version at the releases page first
  Invoke-WebRequest -Uri "https://github.com/render-oss/cli/releases/download/v2.16.0/cli_2.16.0_windows_amd64.zip" -OutFile "$env:TEMP\render.zip"
  Expand-Archive -Path "$env:TEMP\render.zip" -DestinationPath "$env:TEMP\render"
  Move-Item -Path "$env:TEMP\render\render.exe" -Destination "C:\Windows\System32\render.exe"

  Verify installation:
  render --version
  # Expected: Render CLI v2.16.0

═══════════════════════════════════════════════════════════════
  3. AUTHENTICATE
═══════════════════════════════════════════════════════════════

  Interactive Login (for manual use):
  ───────────────────────────────────────────────────────────
  render login
  # Opens browser to authenticate with Render.com

  API Key (for CI/CD / scripting):
  ───────────────────────────────────────────────────────────
  set RENDER_API_KEY=rnd_YourApiKeyHere
  # Get API key from: Render Dashboard → Account Settings → API Keys

  Verify authentication:
  render services --output json
  # Should list all services in your workspace

═══════════════════════════════════════════════════════════════
  4. SERVICE ARCHITECTURE OVERVIEW
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────┐
  │  Service Name       Type          URL               │
  ├─────────────────────────────────────────────────────┤
  │  kizuki-backend     Web Service   .onrender.com     │
  │  kizuki-frontend    Static Site   .onrender.com     │
  └─────────────────────────────────────────────────────┘

  Repo Structure (rootDir matters!):
  ───────────────────────────────────────────────────────────
  kizuki-welcome/
  ├── mern-ecommerce/
  │   ├── backend/          ← rootDir for kizuki-backend
  │   │   ├── server.js     ← Entry point
  │   │   ├── package.json
  │   │   └── data/         ← SQLite DB (persistent disk)
  │   └── frontend/         ← rootDir for kizuki-frontend
  │       ├── src/
  │       ├── package.json
  │       └── dist/         ← Build output (publish dir)
  └── ...

═══════════════════════════════════════════════════════════════
  5. DEPLOY BACKEND (Web Service)
═══════════════════════════════════════════════════════════════

  Create the service:
  ───────────────────────────────────────────────────────────
  render services create ^
    --name kizuki-backend ^
    --type web_service ^
    --repo https://github.com/donatello-code/kizuki-welcome ^
    --branch master ^
    --runtime node ^
    --root-dir mern-ecommerce/backend ^
    --build-command "npm install" ^
    --start-command "node server.js" ^
    --health-check-path /health ^
    --plan free ^
    --output json ^
    --confirm

  Expected output: JSON with service details including "id" and "url"

  Note: The ^ character is Windows line continuation.
  On Linux/Mac, use \ instead.

═══════════════════════════════════════════════════════════════
  6. DEPLOY FRONTEND (Static Site)
═══════════════════════════════════════════════════════════════

  Create the service:
  ───────────────────────────────────────────────────────────
  render services create ^
    --name kizuki-frontend ^
    --type static_site ^
    --repo https://github.com/donatello-code/kizuki-welcome ^
    --branch master ^
    --root-dir mern-ecommerce/frontend ^
    --build-command "npm install && npm run build" ^
    --publish-directory dist ^
    --plan free ^
    --output json ^
    --confirm

  Expected output: JSON with service details

═══════════════════════════════════════════════════════════════
  7. SET ENVIRONMENT VARIABLES
═══════════════════════════════════════════════════════════════

  IMPORTANT: The Render CLI v2.16.0 does NOT support setting
  environment variables via command line. You must use the
  Render Dashboard for this.

  Backend Env Vars (kizuki-backend):
  ───────────────────────────────────────────────────────────
  1. Go to: https://dashboard.render.com/web/srv-d80ffjd0lvsc738lurhg
  2. Click "Environment" tab
  3. Add these variables:

     Variable              Value
     ─────────────────────────────────────────────────────
     PAYPAL_CLIENT_ID      AQub0ybcBhKw3l3eNbbIaChnt6irK9TPL_laWYIeEOlmdZd_ARJsD7hwPqPL_23uLsRoPRMk5NqHSdtS
     PAYPAL_CLIENT_SECRET  EKXJmcCcVrOU8ihz6s1gAbJBZuJBaXx7djhjsbTrJpj0TROPkwA1UO4ZZiC_cPLzkeW1WT524UjqB0Z6
     PAYPAL_API_URL        https://api-m.paypal.com        (for live)
                          https://api-m.sandbox.paypal.com (for sandbox)
     CORS_ORIGIN           https://kizuki-frontend.onrender.com
     PORT                  10000                           (Render default)

  4. Click "Save Changes" → auto-deploys

  Frontend Env Vars (kizuki-frontend):
  ───────────────────────────────────────────────────────────
  1. Go to: https://dashboard.render.com/static/srv-d80fflbrjlhs73a9bgj0
  2. Click "Environment" tab
  3. Add these variables:

     Variable              Value
     ─────────────────────────────────────────────────────
     VITE_BACKEND_URL      https://kizuki-backend.onrender.com
     VITE_PAYPAL_CLIENT_ID AQub0ybcBhKw3l3eNbbIaChnt6irK9TPL_laWYIeEOlmdZd_ARJsD7hwPqPL_23uLsRoPRMk5NqHSdtS

  4. Click "Save Changes" → auto-deploys

═══════════════════════════════════════════════════════════════
  8. TRIGGER DEPLOYMENTS
═══════════════════════════════════════════════════════════════

  Manual deploy (after code push):
  ───────────────────────────────────────────────────────────
  render deploys create kizuki-backend --wait
  render deploys create kizuki-frontend --wait

  The --wait flag makes the CLI wait until the deploy finishes.

  Auto-deploy (default behavior):
  ───────────────────────────────────────────────────────────
  Both services auto-deploy when you push to the master branch.
  Just do:
  git add -A
  git commit -m "your message"
  git push origin master

  Render picks up the push and deploys automatically (~30 sec).

═══════════════════════════════════════════════════════════════
  9. CHECK STATUS & LOGS
═══════════════════════════════════════════════════════════════

  List all services:
  ───────────────────────────────────────────────────────────
  render services --output json

  Check service health:
  ───────────────────────────────────────────────────────────
  curl https://kizuki-backend.onrender.com/health
  # Expected: {"status":"ok","db":"connected",...}

  curl -o NUL -w "%%http_code%%" https://kizuki-frontend.onrender.com
  # Expected: 200

  View logs (interactive):
  ───────────────────────────────────────────────────────────
  render logs --resources kizuki-backend --tail
  render logs --resources kizuki-frontend --tail

  Restart a service:
  ───────────────────────────────────────────────────────────
  render restart kizuki-backend

═══════════════════════════════════════════════════════════════
  10. QUICK DEPLOY SCRIPT
═══════════════════════════════════════════════════════════════

  Save this as deploy-render.js in the project root:

  ───────────────────────────────────────────────────────────
  const { execSync } = require('child_process');

  function run(cmd) {
    console.log(`\n▶ ${cmd}`);
    try {
      execSync(cmd, { stdio: 'inherit', encoding: 'utf-8' });
    } catch (e) {
      console.error(`✗ Failed: ${cmd}`);
      process.exit(1);
    }
  }

  const command = process.argv[2];

  switch (command) {
    case 'all':
      run('git add -A');
      run(`git commit -m "${process.argv[3] || 'deploy'}"`);
      run('git push origin master');
      console.log('\n✅ Pushed! Auto-deploy in progress...');
      break;
    case 'status':
      run('render services --output json');
      break;
    case 'logs':
      run(`render logs --resources ${process.argv[3]} --tail`);
      break;
    case 'restart':
      run(`render restart ${process.argv[3]}`);
      break;
    default:
      console.log(`
  Usage: node deploy-render.js <command> [args]

  Commands:
    all "message"    Git add/commit/push (auto-deploys)
    status           List all services
    logs <name>      Tail logs (e.g., kizuki-backend)
    restart <name>   Restart a service
      `);
  }
  ───────────────────────────────────────────────────────────

  Usage:
  node deploy-render.js all "fix: update checkout styles"
  node deploy-render.js status
  node deploy-render.js logs kizuki-backend

═══════════════════════════════════════════════════════════════
  11. TROUBLESHOOTING
═══════════════════════════════════════════════════════════════

  Issue: "render: command not found"
  ───────────────────────────────────────────────────────────
  → Make sure render.exe is in C:\Windows\System32\
  → Or add the folder containing render.exe to your PATH

  Issue: "Unauthorized" when using CLI
  ───────────────────────────────────────────────────────────
  → Run: render login
  → Or set: set RENDER_API_KEY=rnd_your_key

  Issue: Build fails on Render
  ───────────────────────────────────────────────────────────
  → Check logs: render logs --resources kizuki-frontend --tail
  → Common fixes:
    - Wrong rootDir (must match repo subfolder)
    - Missing dependencies in package.json
    - Build command doesn't match package.json scripts

  Issue: Backend can't connect to frontend (CORS)
  ───────────────────────────────────────────────────────────
  → Make sure CORS_ORIGIN env var is set on backend
  → Value should be: https://kizuki-frontend.onrender.com

  Issue: PayPal payments fail
  ───────────────────────────────────────────────────────────
  → Check PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are set
  → Check PAYPAL_API_URL is correct (sandbox vs live)
  → Check backend logs for PayPal API errors

═══════════════════════════════════════════════════════════════
  END OF GUIDE
═══════════════════════════════════════════════════════════════
