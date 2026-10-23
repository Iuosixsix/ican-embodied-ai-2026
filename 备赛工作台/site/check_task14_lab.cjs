/*
 * Repeatable Task 14 teaching-module interaction checks.
 * Run: node 备赛工作台/site/check_task14_lab.cjs
 * Uses a minimal fake DOM and real registered event handlers. This is NOT a
 * browser/layout/accessibility test and does not contact the training platform.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync(path.join(__dirname, 'task14-lab.js'), 'utf8');
const KEY = 'ican-task14-lab-v1';
const store = new Map([
  ['ican-study-v1', 'PROGRESS_SENTINEL'],
  ['ican-study-font-v1', 'FONT_SENTINEL']
]);
let checks = 0;
function check(label, callback) {
  callback();
  checks += 1;
}
class FakeElement {
  constructor(dataset = {}, attributes = {}) {
    this.dataset = dataset;
    this.attributes = attributes;
    this.disabled = false;
  }
  closest(selector) {
    if (selector === 'button') return this;
    return this.group ? { getAttribute: () => this.group } : null;
  }
  hasAttribute(name) { return Object.hasOwn(this.attributes, name); }
  getAttribute(name) { return this.attributes[name]; }
}
const context = {
  window: {},
  HTMLElement: FakeElement,
  localStorage: {
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value)
  }
};
vm.createContext(context);
vm.runInContext(source, context, { filename: 'task14-lab.js' });
const container = {
  innerHTML: '',
  events: {},
  querySelector: () => null,
  contains: () => true,
  addEventListener(name, listener) { this.events[name] = listener; },
  removeEventListener(name) { delete this.events[name]; }
};
const mount = () => context.window.IcanTask14.mount(container);
const state = () => JSON.parse(store.get(KEY));
const click = dataset => container.events.click({ target: new FakeElement(dataset) });
const event = kind => click({ t14Event: kind });
const choose = (group, id, value) => {
  const element = new FakeElement({}, { 'data-t14-answer': id });
  element.group = group;
  element.value = value;
  container.events.change({ target: element });
};

mount();
click({ t14Tab: 'events' });
check('fresh state is idle', () => assert.equal(state().event.state, 0));
event('finish');
check('finish while idle is ignored', () => assert.equal(state().event.state, 0));
event('wake');
check('wake enters first navigation', () => assert.equal(state().event.state, 1));
event('failure');
check('failed action does not advance', () => assert.equal(state().event.state, 1));
event('repeat');
check('duplicate wake does not advance', () => assert.equal(state().event.state, 1));
event('finish');
check('first arrival waits for vision', () => assert.equal(state().event.state, 2));
event('finish');
check('finish cannot replace visual response', () => assert.equal(state().event.state, 2));
event('failure');
check('invalid visual data does not advance', () => assert.equal(state().event.state, 2));
event('vision');
check('valid visual response enters grab', () => assert.equal(state().event.state, 3));
event('repeat');
check('duplicate visual response cannot skip grab', () => assert.equal(state().event.state, 3));

const remaining = [
  ['finish', 4], ['finish', 5], ['vision', 6], ['finish', 7],
  ['finish', 8], ['vision', 9], ['finish', 10], ['vision', 11],
  ['finish', 12], ['finish', 0]
];
for (const [kind, expected] of remaining) {
  event(kind);
  check(`accepted ${kind} reaches ${expected}`, () => assert.equal(state().event.state, expected));
}
check('all thirteen distinct events were consumed', () => {
  assert.equal(state().event.accepted.length, 13);
  assert.equal(new Set(state().event.accepted).size, 13);
  assert.equal(state().event.done, true);
});
event('wake');
check('completed round cannot silently restart', () => {
  assert.equal(state().event.state, 0);
  assert.equal(state().event.done, true);
  assert.equal(state().event.accepted.length, 13);
});
mount();
check('mount restores completed round', () => assert.match(container.innerHTML, /本轮教学事件链结束/));

click({ t14Action: 'restart-events' });
check('explicit restart creates a fresh event round', () => {
  assert.equal(state().event.state, 0);
  assert.equal(state().event.done, false);
  assert.equal(state().event.run, 2);
  assert.equal(state().event.accepted.length, 0);
});
event('wake');
mount();
check('mount restores an in-progress round', () => {
  assert.equal(state().event.state, 1);
  assert.match(container.innerHTML, /前往一号桌/);
});

click({ t14Tab: 'chain' });
for (const id of ['table1', 'apple', 'table2', 'elephant', 'table3', 'blue', 'green', 'home']) {
  click({ t14Add: id });
}
click({ t14Action: 'check-chain' });
check('correct eight-item order receives explanation', () => {
  assert.equal(state().chain.length, 8);
  assert.equal(state().chainChecked, true);
  assert.match(container.innerHTML, /顺序正确。/);
});
click({ t14Add: 'apple' });
check('adding an already used card does not duplicate it', () => assert.equal(state().chain.length, 8));
click({ t14Action: 'undo' });
check('undo removes last card and invalidates prior check', () => {
  assert.equal(state().chain.length, 7);
  assert.equal(state().chainChecked, false);
});
click({ t14Action: 'confirm-reset' });
check('first reset click asks without deleting', () => {
  assert.equal(state().chain.length, 7);
  assert.match(container.innerHTML, /确认清空本模块/);
});
click({ t14Action: 'cancel-reset' });
check('cancel preserves exercises', () => assert.equal(state().chain.length, 7));
click({ t14Action: 'confirm-reset' });
click({ t14Action: 'reset-all' });
check('confirmed reset clears only this module', () => {
  assert.equal(state().chain.length, 0);
  assert.equal(state().event.state, 0);
  assert.equal(state().event.done, false);
  assert.equal(store.get('ican-study-v1'), 'PROGRESS_SENTINEL');
  assert.equal(store.get('ican-study-font-v1'), 'FONT_SENTINEL');
});

choose('roles', 'master', 'schedule');
check('node answer saves and updates the counter', () => {
  assert.equal(state().roles.master, 'schedule');
  assert.match(container.innerHTML, /节点职责 1\/4/);
});
choose('concepts', 'callback', 'done');
check('concept answer saves and updates the counter', () => {
  assert.equal(state().concepts.callback, 'done');
  assert.match(container.innerHTML, /通信概念 1\/4/);
});
click({ t14Tab: 'repair' });
const repair = new FakeElement({}, { 'data-t14-repair': 'tf' });
repair.value = 'once';
container.events.change({ target: repair });
check('repair choice saves and provides feedback', () => {
  assert.equal(state().repairs.tf, 'once');
  assert.match(container.innerHTML, /故障判断 1\/6/);
});

store.set(KEY, JSON.stringify({
  version: 1,
  tab: 'repair',
  repairs: { tf: '<script>bad</script>' },
  event: { state: 3, log: [{ text: '<script>bad</script>', tone: 'bad' }] }
}));
mount();
click({ t14Tab: 'events' });
check('stored content is validated and escaped', () => {
  assert.equal(state().repairs.tf, undefined);
  assert(!container.innerHTML.includes('<script>bad</script>'));
  assert(container.innerHTML.includes('&lt;script&gt;bad&lt;/script&gt;'));
});
store.set(KEY, '{invalid JSON');
mount();
click({ t14Tab: 'nodes' });
check('corrupt storage recovers to initial state', () => {
  assert.equal(state().event.state, 0);
  assert.equal(state().chain.length, 0);
});
check('module has no direct network API or stale article link', () => {
  assert(!source.includes('fetch('));
  assert(!source.includes('XMLHttpRequest'));
  assert(!source.includes('#article/live-tests'));
});

console.log(`PASS ${checks} Task14 interaction checks (fake DOM, not browser); 13-event chain, guards, persistence, reset isolation, answer handling and escaping.`);
