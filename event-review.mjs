import { spawn } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const output = await mkdtemp(join(tmpdir(), 'jajak-event-review-'))
const browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9334',
  '--user-data-dir=' + join(output, 'profile'), 'about:blank',
], { windowsHide: true, stdio: 'ignore' })
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let ws
const keepAlive = setInterval(() => {}, 1000)
try {
  let targets
  for (let attempt = 0; attempt < 40; attempt++) {
    try { targets = await (await fetch('http://127.0.0.1:9334/json')).json(); break } catch { await pause(250) }
  }
  if (!targets) throw new Error('Browser connection unavailable')
  ws = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl)
  ws.addEventListener('close', (event) => console.log('socket-close', event.code, event.reason))
  await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }))
  let sequence = 0
  const pending = new Map()
  const errors = []
  ws.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data)
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text)
    if (pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id)
      pending.delete(message.id)
      if (message.error) reject(new Error(JSON.stringify(message.error)))
      else resolve(message.result)
    }
  })
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence
    const timer = setTimeout(() => reject(new Error('Timeout: ' + method)), 10000)
    pending.set(id, { resolve: (value) => { clearTimeout(timer); resolve(value) }, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  await send('Runtime.enable')
  await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/events' })
  for (let i = 0; i < 60; i++) {
    if (await evaluate("!!document.getElementById('event-results')")) break
    await pause(500)
  }
  await evaluate('document.fonts.ready')
  await pause(1000)
  // 화면 검토용 DOM에서만 공통 모달을 숨깁니다. 인증 요청이나 저장은 하지 않습니다.
  await evaluate(`document.querySelector('[aria-labelledby="adult-modal-title"]')?.parentElement.style.setProperty('display', 'none'); document.body.classList.remove('adult-modal-open')`)
  const inspect = () => evaluate(`({
    title: document.querySelector('h1')?.innerText,
    selected: document.querySelector('[aria-pressed="true"]')?.innerText,
    count: document.querySelectorAll('#event-results article').length,
    overflow: document.documentElement.scrollWidth > innerWidth,
    cards: [...document.querySelectorAll('#event-results article')].map(el => ({
      title: el.querySelector('h3')?.innerText,
      width: Math.round(el.getBoundingClientRect().width),
      height: Math.round(el.getBoundingClientRect().height),
      href: el.querySelector('a')?.getAttribute('href'),
    }))
  })`)
  const screenshot = async (name) => {
    const metrics = await send('Page.getLayoutMetrics')
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: metrics.cssContentSize.width, height: Math.min(metrics.cssContentSize.height, 2300), scale: 1 } })
    await writeFile(join(output, name + '.png'), Buffer.from(shot.data, 'base64'))
  }
  console.log('desktop', JSON.stringify(await inspect()))
  await screenshot('desktop')
  for (const [name, width, height] of [['tablet', 900, 1200], ['mobile', 390, 1100], ['small-mobile', 320, 1000]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
    await pause(300)
    console.log(name, JSON.stringify(await inspect()))
    await screenshot(name)
  }
  for (const label of ['전체', '종료', '진행중']) {
    await evaluate(`Array.from(document.querySelectorAll('[aria-controls="event-results"]')).find(el => el.textContent.startsWith('${label}')).click()`)
    await pause(200)
    console.log('filter-' + label, JSON.stringify(await inspect()))
  }
  console.log('runtimeErrors', JSON.stringify(errors))
  console.log('screenshots', output)
} finally {
  clearInterval(keepAlive)
  ws?.close()
  browser.kill()
}
