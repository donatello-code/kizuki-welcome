#!/usr/bin/env node

/**
 * KIZUKI Store — Render.com Deploy Script
 * 
 * Deploys the fullstack KIZUKI e-commerce app to Render.com:
 *   - Backend: Node.js/Express API (Web Service)
 *   - Frontend: React/Vite Static Site
 * 
 * Usage:
 *   node deploy-render.js all          # Deploy everything
 *   node deploy-render.js backend      # Deploy only backend
 *   node deploy-render.js frontend     # Deploy only frontend
 *   node deploy-render.js blueprint    # Deploy via Blueprint (render.yaml)
 *   node deploy-render.js status       # Check service status
 *   node deploy-render.js logs <name>  # Tail logs for a service
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = __dirname;
const RENDER_CLI = path.join(ROOT, 'render.exe');

// ─── Configuration ─────────────────────────────────────────
const CONFIG = {
  backend: {
    name: 'kizuki-backend',
    type: 'web_service',
    repo: 'https://github.com/donatello-code/kizuki-welcome',
    branch: 'master',
    runtime: 'node',
    rootDir: 'mern-ecommerce/backend',
    buildCommand: 'npm install',
    startCommand: 'node server.js',
    healthPath: '/health',
    plan: 'starter',
    envVars: {
      PORT: '5000',
      NODE_ENV: 'production',
      RENDER_DISK_PATH: '/opt/render/project/src',
      CORS_ORIGIN: 'https://kizuki-frontend.onrender.com',
    },
    secretEnvVars: ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_TO'],
  },
  frontend: {
    name: 'kizuki-frontend',
    type: 'static_site',
    repo: 'https://github.com/donatello-code/kizuki-welcome',
    branch: 'master',
    rootDir: 'mern-ecommerce/frontend',
    buildCommand: 'npm install && npm run build',
    publishDir: 'dist',
    envVars: {
      VITE_BACKEND_URL: 'https://kizuki-backend.onrender.com',
    },
    secretEnvVars: ['VITE_STRIPE_PUBLISHABLE_KEY', 'VITE_PAYPAL_CLIENT_ID'],
  },
  admin: {
    name: 'kizuki-admin',
    type: 'static_site',
    repo: 'https://github.com/donatello-code/kizuki-welcome',
    branch: 'master',
    rootDir: 'mern-ecommerce/frontend',
    buildCommand: 'npm install && npm run build',
    publishDir: 'dist',
    customDomain: 'admin.kizuki.vip',
    envVars: {
      VITE_BACKEND_URL: 'https://kizuki-backend.onrender.com',
    },
    secretEnvVars: ['VITE_STRIPE_PUBLISHABLE_KEY', 'VITE_PAYPAL_CLIENT_ID'],
  },
};

// ─── Helpers ───────────────────────────────────────────────
function render(args, silent = false) {
  const cmd = `"${RENDER_CLI}" ${args}`;
  console.log(`\n▶ ${cmd}`);
  try {
    const result = execSync(cmd, {
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : 'inherit',
      cwd: ROOT,
    });
    if (silent) return JSON.parse(result.trim());
    return result;
  } catch (err) {
    console.error(`✗ Command failed: ${cmd}`);
    if (err.stderr) console.error(err.stderr);
    if (err.stdout) console.error(err.stdout);
    process.exit(1);
  }
}

function buildEnvFlags(envVars, secretKeys = []) {
  const flags = [];
  for (const [key, value] of Object.entries(envVars)) {
    flags.push(`--env-var ${key}=${value}`);
  }
  for (const key of secretKeys) {
    flags.push(`--env-var ${key}=`);
  }
  return flags.join(' ');
}

// ─── Service Creators ──────────────────────────────────────
function createBackend() {
  console.log('\n═══════════════════════════════════════');
  console.log('  Creating Backend Web Service');
  console.log('═══════════════════════════════════════');

  const envFlags = buildEnvFlags(CONFIG.backend.envVars, CONFIG.backend.secretEnvVars);

  render(
    `services create ` +
    `--name ${CONFIG.backend.name} ` +
    `--type ${CONFIG.backend.type} ` +
    `--repo ${CONFIG.backend.repo} ` +
    `--branch ${CONFIG.backend.branch} ` +
    `--runtime ${CONFIG.backend.runtime} ` +
    `--root-dir ${CONFIG.backend.rootDir} ` +
    `--build-command "${CONFIG.backend.buildCommand}" ` +
    `--start-command "${CONFIG.backend.startCommand}" ` +
    `--health-check-path ${CONFIG.backend.healthPath} ` +
    `--plan ${CONFIG.backend.plan} ` +
    `${envFlags} ` +
    `--output json --confirm`
  );

  console.log('\n⚠️  IMPORTANT: After creation, set the secret env vars in the Render Dashboard:');
  console.log('   ' + CONFIG.backend.secretEnvVars.join(', '));
  console.log('   Also verify the persistent disk is attached at /opt/render/project/src/data\n');
}

function createFrontend() {
  console.log('\n═══════════════════════════════════════');
  console.log('  Creating Frontend Static Site');
  console.log('═══════════════════════════════════════');

  const envFlags = buildEnvFlags(CONFIG.frontend.envVars, CONFIG.frontend.secretEnvVars);

  render(
    `services create ` +
    `--name ${CONFIG.frontend.name} ` +
    `--type ${CONFIG.frontend.type} ` +
    `--repo ${CONFIG.frontend.repo} ` +
    `--branch ${CONFIG.frontend.branch} ` +
    `--root-dir ${CONFIG.frontend.rootDir} ` +
    `--build-command "${CONFIG.frontend.buildCommand}" ` +
    `--publish-directory ${CONFIG.frontend.publishDir} ` +
    `${envFlags} ` +
    `--output json --confirm`
  );

  console.log('\n⚠️  IMPORTANT: After creation, set the secret env vars in the Render Dashboard:');
  console.log('   ' + CONFIG.frontend.secretEnvVars.join(', '));
  console.log('\n');
}

function deployBlueprint() {
  console.log('\n═══════════════════════════════════════');
  console.log('  Deploying via Blueprint (render.yaml)');
  console.log('═══════════════════════════════════════');

  render(
    `blueprints apply ` +
    `--repo ${CONFIG.backend.repo} ` +
    `--branch ${CONFIG.backend.branch} ` +
    `--output json --confirm`
  );
}

// ─── Status ────────────────────────────────────────────────
function showStatus() {
  console.log('\n═══════════════════════════════════════');
  console.log('  Service Status');
  console.log('═══════════════════════════════════════');
  const services = render('services --output json', true);
  
  if (Array.isArray(services)) {
    const kizukiServices = services.filter(s => 
      s.service.name.startsWith('kizuki-')
    );
    
    if (kizukiServices.length === 0) {
      console.log('\n  No KIZUKI services found yet.');
    } else {
      for (const s of kizukiServices) {
        const svc = s.service;
        const type = svc.type === 'web_service' ? '🌐 Web' : svc.type === 'static_site' ? '📄 Static' : svc.type;
        const status = svc.suspended === 'not_suspended' ? '✅ Active' : '⏸️ Suspended';
        const url = svc.serviceDetails?.url || svc.serviceDetails?.url || 'N/A';
        console.log(`\n  ${type} — ${svc.name}`);
        console.log(`     ID:     ${svc.id}`);
        console.log(`     Status: ${status}`);
        console.log(`     URL:    ${url}`);
        console.log(`     Repo:   ${svc.repo}`);
      }
    }
  }
}

// ─── Deploy Trigger ────────────────────────────────────────
function triggerDeploy(serviceName) {
  console.log(`\n▶ Triggering deploy for ${serviceName}...`);
  render(`deploys create ${serviceName} --wait`);
}

// ─── Logs ──────────────────────────────────────────────────
function tailLogs(serviceName) {
  render(`logs --resources ${serviceName} --tail`);
}

// ─── Push to GitHub ────────────────────────────────────────
function pushToGitHub() {
  console.log('\n═══════════════════════════════════════');
  console.log('  Pushing code to GitHub');
  console.log('═══════════════════════════════════════');
  
  try {
    execSync('git add -A', { cwd: ROOT, stdio: 'inherit' });
    execSync('git commit -m "chore: prepare for Render deployment"', { cwd: ROOT, stdio: 'inherit' });
    execSync('git push origin master', { cwd: ROOT, stdio: 'inherit' });
    console.log('\n✅ Code pushed to GitHub successfully!');
  } catch (err) {
    console.log('\n⚠️  Git push had issues (maybe nothing to commit or already up to date)');
  }
}

// ─── Main ──────────────────────────────────────────────────
function deployAll() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   KIZUKI — Render.com Full Deployment   ║');
  console.log('║   Backend API + React Frontend          ║');
  console.log('╚══════════════════════════════════════════╝');

  // 1. Push code to GitHub
  pushToGitHub();

  // 2. Create backend
  createBackend();

  // 3. Create frontend
  createFrontend();

  // 4. Show status
  showStatus();

  console.log('\n✅ Deployment initiated!');
  console.log(`   Backend:  https://${CONFIG.backend.name}.onrender.com`);
  console.log(`   Frontend: https://${CONFIG.frontend.name}.onrender.com`);
  console.log('\n💡 Next steps:');
  console.log('   1. Set secret env vars in Render Dashboard:');
  console.log('      Backend:  ' + CONFIG.backend.secretEnvVars.join(', '));
  console.log('      Frontend: ' + CONFIG.frontend.secretEnvVars.join(', '));
  console.log('   2. Verify backend health: curl https://kizuki-backend.onrender.com/health');
  console.log('   3. Open https://kizuki-frontend.onrender.com in your browser');
}

// ─── CLI ───────────────────────────────────────────────────
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'all':
    deployAll();
    break;
  case 'backend':
    createBackend();
    break;
  case 'frontend':
    createFrontend();
    break;
  case 'blueprint':
    deployBlueprint();
    break;
  case 'status':
    showStatus();
    break;
  case 'deploy':
    if (!arg) {
      console.error('Usage: node deploy-render.js deploy <service-name>');
      process.exit(1);
    }
    triggerDeploy(arg);
    break;
  case 'logs':
    if (!arg) {
      console.error('Usage: node deploy-render.js logs <service-name>');
      process.exit(1);
    }
    tailLogs(arg);
    break;
  case 'push':
    pushToGitHub();
    break;
  default:
    console.log(`
KIZUKI Render.com Deploy Script
────────────────────────────────
Usage: node deploy-render.js <command> [args]

Commands:
  all              Push code + create all services
  backend          Create only the backend web service
  frontend         Create only the frontend static site
  blueprint        Deploy via render.yaml Blueprint
  status           Show all KIZUKI services
  deploy <name>    Trigger a deploy for a specific service
  logs <name>      Tail logs for a specific service
  push             Push latest code to GitHub

Environment Variables (set in Render Dashboard):
  Backend Secrets: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_TO
  Frontend Secrets: VITE_STRIPE_PUBLISHABLE_KEY, VITE_PAYPAL_CLIENT_ID
`);
}
