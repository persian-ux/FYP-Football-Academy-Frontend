import { writeFileSync } from 'node:fs'

const DEV_PORT = 5599
const DEBUG_PORT = 9231

// Start chrome headless with remote debugging
import { spawn } from 'node:child_process'
const chrome = spawn(
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  [
    '--headless=new', '--disable-gpu', '--remote-debugging-port=' + DEBUG_PORT,
    '--window-size=1400,900', '--hide-scrollbars',
    '--user-data-dir=' + process.env.TEMP + '\\cdp-profile-check',
    'http://localhost:' + DEV_PORT + '/',
  ],
  { stdio: 'ignore' }
)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getJson() {
  const res = await fetch('http://127.0.0.1:' + DEBUG_PORT + '/json/list')
  return res.json()
}

let ws
let msgId = 0
const pending = new Map()

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
}

async function main() {
  // wait for chrome + the real page target (filter to localhost URL)
  let targets
  for (let i = 0; i < 40; i++) {
    try {
      targets = await getJson()
      if (targets.some((t) => t.type === 'page' && t.url.includes('localhost:' + DEV_PORT))) break
    } catch {}
    await sleep(500)
  }
  const page = targets.find((t) => t.type === 'page' && t.url.includes('localhost:' + DEV_PORT))
  if (!page) {
    console.log('NO APP PAGE TARGET. targets =', targets.map((t) => t.type + ':' + t.url).join(', '))
    chrome.kill(); process.exit(1)
  }
  console.log('PAGE:', page.url)

  ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onreject = rej; ws.onerror = rej })
  const events = []
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id); pending.delete(msg.id)
      if (msg.error) p.reject(new Error(msg.error.message)); else p.resolve(msg.result)
      return
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      events.push('EXCEPTION: ' + (msg.params.exceptionDetails && msg.params.exceptionDetails.text) + ' :: ' + JSON.stringify(msg.params.exceptionDetails && msg.params.exceptionDetails.exception && msg.params.exceptionDetails.exception.description).slice(0, 400))
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      const args = msg.params.args || []
      events.push('CONSOLE[' + msg.params.type + ']: ' + args.map((a) => a.value !== undefined ? String(a.value).slice(0, 200) : (a.description || a.type || '').slice(0, 200)).join(' '))
    }
    if (msg.method === 'Log.entryAdded') {
      events.push('LOG: ' + (msg.params.entry.text || '') + ' ' + (msg.params.entry.level || ''))
    }
  }

  await send('Runtime.enable')
  await send('Page.enable')
  await send('Log.enable')

  console.log('WAITING 9s REAL TIME for GSAP to run...')
  await sleep(9000)

  const evalJs = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true })
    return r.result && r.value !== undefined ? r.value : ('ERR:' + JSON.stringify(r).slice(0, 300))
  }

  console.log('ROOT innerHTML len:', await evalJs(`document.getElementById('root').innerHTML.length`))
  console.log('ROOT has main:', await evalJs(`!!document.getElementById('root').querySelector('main')`))
  console.log('READYSTATE:', await evalJs('document.readyState'))
  console.log('MONITORED EVENTS (first 40):')
  events.slice(0, 40).forEach((e) => console.log('  ' + e.slice(0, 300)))

  const title = await evalJs(`(() => {
    const el = document.querySelector('.ss-title-word');
    if (!el) return 'NO .ss-title-word element';
    const cs = getComputedStyle(el);
    return JSON.stringify({ inlineOpacity: el.style.opacity, computedOpacity: cs.opacity, transform: cs.transform.slice(0,50) });
  })()`)
  console.log('TITLE:', title)

  const intro = await evalJs(`(() => {
    const el = document.querySelector('.ss-intro-overlay');
    if (!el) return 'no intro';
    const cs = getComputedStyle(el);
    return JSON.stringify({ inline: el.getAttribute('style'), opacity: cs.opacity, visibility: cs.visibility, zIndex: cs.zIndex });
  })()`)
  console.log('INTRO:', intro)

  const heroStats = await evalJs(`(() => {
    const h = document.querySelector('.ss-hero-inner');
    const visible = [];
    if (h) h.querySelectorAll('.ss-title-word, .ss-glass-card, .ss-cta-anim, .ss-stat-value').forEach((el) => {
      const cs = getComputedStyle(el);
      visible.push(el.className.slice(0,30) + ' -> opacity ' + cs.opacity);
    });
    return visible.join(' | ');
  })()`)
  console.log('HERO ELEMS:', heroStats)

  const bgInfo = await evalJs(`(() => {
    const fb = document.querySelector('.football-bg');
    const cv = fb ? fb.querySelector('canvas') : null;
    return JSON.stringify({ hasFallback: !!document.querySelector('.football-css-fallback'), hasBg: !!fb, hasCanvas: !!cv, bodyTail: document.body.className });
  })()`)
  console.log('BG INFO:', bgInfo)

  const flash = await evalJs(`(() => {
    const st = document.querySelector('.hud-bar-fill');
    return st ? 'HUD size writer: ' + getComputedStyle(st).width : 'no HUD fill yet';
  })()`)
  console.log('HUD:', flash)

  const shot = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(process.cwd() + '\\cdp-shot.png', Buffer.from(shot.data, 'base64'))
  console.log('SCREENSHOT WRITTEN', process.cwd() + '\\cdp-shot.png')

  chrome.kill()
  process.exit(0)
}

main().catch((e) => { console.error('FAILED:', e); chrome.kill(); process.exit(1) })