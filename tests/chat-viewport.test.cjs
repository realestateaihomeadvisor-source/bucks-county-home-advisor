const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
const script = html.match(/<script id="chat-viewport-controller">([\s\S]*?)<\/script>/)[1];
function harness({width = 390, height = 844, viewport = true, focused = false} = {}) {
  const listeners = {}, frames = [], scrolls = [];
  const input = {};
  const shell = {style: {height: '520px'}, getBoundingClientRect: () => ({bottom: shell.top + parseFloat(shell.style.height)}), top: 100};
  const embed = {style: {height: '580px'}, contains: target => target === input};
  const vv = {height, offsetTop: 0, scale: 1, addEventListener: (name, fn) => {listeners['viewport.' + name] = fn;}};
  const window = {innerWidth: width, innerHeight: height, visualViewport: viewport ? vv : undefined,
    requestAnimationFrame: fn => frames.push(fn), addEventListener: (name, fn) => {listeners[name] = fn;},
    scrollBy: opts => {scrolls.push(opts); shell.top -= opts.top;}};
  const document = {activeElement: focused ? input : {}, getElementById: id => id === 'vf-chat-viewport' ? shell : embed,
    addEventListener: (name, fn) => {listeners[name] = fn;}};
  vm.runInNewContext(script, {window, document, Math});
  const flush = () => {while (frames.length) frames.shift()();};
  flush();
  return {window, vv, shell, embed, document, input, listeners, frames, scrolls, flush};
}
test('all inline JavaScript compiles without loading any provider', () => {
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/application\/ld\+json/.test(match[1])) JSON.parse(match[2]);
    else new Function(match[2]);
  }
});
test('keyboard shrink fits chat inside visible area and scrolls focused composer into view', () => {
  const h = harness({focused: true});
  h.vv.height = 330;
  h.listeners['viewport.resize'](); h.flush();
  assert.equal(h.shell.style.height, '298px');
  assert.equal(h.embed.style.height, '358px');
  assert.ok(h.shell.getBoundingClientRect().bottom <= 314);
  assert.equal(h.scrolls.length, 1);
});
test('unfocused chat resizes without moving the visitor through the page', () => {
  const h = harness(); h.vv.height = 330;
  h.listeners['viewport.resize'](); h.flush(); assert.equal(h.scrolls.length, 0);
});
test('keyboard dismissal restores original chat height', () => {
  const h = harness({height: 330}); h.vv.height = 844;
  h.listeners['viewport.resize'](); h.flush();
  assert.equal(h.shell.style.height, '520px'); assert.equal(h.embed.style.height, '580px');
});
test('landscape and visual viewport offset keep focused bottom above visible boundary', () => {
  const h = harness({height: 260, focused: true});
  h.shell.top = 130; h.vv.offsetTop = 45;
  h.listeners.orientationchange(); h.flush();
  assert.ok(h.shell.getBoundingClientRect().bottom <= 289);
});
test('desktop returns to original dimensions after mobile resize', () => {
  const h = harness({height: 330}); h.window.innerWidth = 1280;
  h.listeners.resize(); h.flush();
  assert.equal(h.shell.style.height, '520px'); assert.equal(h.embed.style.height, '580px');
});
test('pinch zoom does not resize or scroll the conversation', () => {
  const h = harness(); h.vv.scale = 2; h.vv.height = 200;
  h.listeners['viewport.resize'](); h.flush();
  assert.equal(h.shell.style.height, '520px'); assert.equal(h.scrolls.length, 0);
});
test('window height fallback works without VisualViewport', () => {
  const h = harness({height: 330, viewport: false}); assert.equal(h.shell.style.height, '298px');
});
test('resize bursts coalesce to one animation frame', () => {
  const h = harness(); h.listeners.resize(); h.listeners.resize(); h.listeners.focusin();
  assert.equal(h.frames.length, 1); h.flush();
});
