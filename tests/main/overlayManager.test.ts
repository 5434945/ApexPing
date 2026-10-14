import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OVERLAY_EMOTED, OVERLAY_PINGED } from '../../src/shared/ipc';
import { DEFAULT_SETTINGS, overlaySettings } from '../../src/shared/settings';

const h = vi.hoisted(() => ({
  windows: [] as Array<{ x: number; webContents: { send: ReturnType<typeof vi.fn> } }>,
  handlers: new Map<string, (event: unknown, raw: unknown) => void>(),
}));

vi.mock('electron', async () => {
  const { EventEmitter: Emitter } = await import('node:events');
  class FakeWindow extends Emitter {
    static fromWebContents(wc: unknown): FakeWindow | null {
      return (h.windows as unknown as FakeWindow[]).find((w) => w.webContents === wc) ?? null;
    }
    x: number;
    webContents = Object.assign(new Emitter(), { send: vi.fn() });
    constructor(opts: { x: number }) {
      super();
      this.x = opts.x;
      h.windows.push(this);
    }
    setIgnoreMouseEvents(): void {}
    setAlwaysOnTop(): void {}
    setBounds(): void {}
    showInactive(): void {}
    isDestroyed(): boolean {
      return false;
    }
    destroy(): void {}
  }
  const displays = [
    { id: 1, bounds: { x: 0, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 },
    { id: 2, bounds: { x: 1920, y: 0, width: 1280, height: 1024 }, scaleFactor: 1 },
  ];
  const screen = Object.assign(new Emitter(), {
    getAllDisplays: () => displays,
    getPrimaryDisplay: () => displays[0],
    dipToScreenRect: (_win: unknown, r: unknown) => r,
  });
  const ipcMain = { on: (channel: string, fn: (event: unknown, raw: unknown) => void) => h.handlers.set(channel, fn) };
  return { BrowserWindow: FakeWindow, ipcMain, screen };
});

vi.mock('../../src/main/paths', () => ({
  IS_MAC: false,
  loadPage: () => Promise.resolve(),
  preloadPath: () => 'preload.js',
}));

type Manager = InstanceType<typeof import('../../src/main/overlayManager').OverlayManager>;
let mgr: Manager;
/** What display 1 (index 0) or display 2 (index 1) was told, minus the settings it gets on load. */
const sent = (i: number): Array<[string, unknown]> =>
  h.windows[i].webContents.send.mock.calls.filter((c) => c[0] !== 'overlay:settings') as Array<[string, unknown]>;

beforeEach(async () => {
  h.windows.length = 0;
  h.handlers.clear();
  vi.resetModules();
  const { OverlayManager } = await import('../../src/main/overlayManager');
  mgr = new OverlayManager(overlaySettings(DEFAULT_SETTINGS));
  mgr.start();
});

describe('Apex ping overlay', () => {
  it('rejects every legacy emote gesture and registers no emote IPC', () => {
    for (const type of ['wheelOpen','wheelMove','wheelRelease','click'] as const)
      mgr.handle({ type, wheel: 'emote', x: 10, y: 10 });
    expect(sent(0)).toEqual([]);
    expect(sent(1)).toEqual([]);
    expect(h.handlers.has(OVERLAY_EMOTED)).toBe(false);
  });
  it('opens, moves and releases the ping wheel', () => {
    for (const type of ['wheelOpen','wheelMove','wheelRelease'] as const)
      mgr.handle({ type, wheel: 'ping', x: 10, y: 20 });
    expect(sent(0).map(([channel]) => channel)).toEqual(['wheel:open','wheel:move','wheel:release']);
  });
  it('shares click pings on the correct display', () => {
    const shared = vi.fn(); mgr.on('shared', shared);
    mgr.handle({ type: 'click', wheel: 'ping', x: 2000, y: 40 });
    expect(sent(1)).toEqual([['ping:spawn', { id: 'generic', x: 80, y: 40 }]]);
    expect(shared).toHaveBeenCalledWith({ id: 'generic', displayId: 2, x: 80, y: 40 });
  });
  it('forwards the remote hero identity without replacing it with ours', () => {
    mgr.spawnRemote({ displayId: 2, x: 5, y: 6, id: 'danger', legend: 'mirage', tag: {name:'Bob',color:2} });
    expect(sent(1)[0][1]).toMatchObject({ legend:'mirage', id:'danger' });
  });
  it('previews without sharing', () => {
    const shared = vi.fn(); mgr.on('shared', shared);
    mgr.previewPing('danger');
    expect(sent(0)).toEqual([['ping:spawn',{id:'danger',x:960,y:540}]]);
    expect(shared).not.toHaveBeenCalled();
  });
  it('shares only valid reports from its own windows', () => {
    const shared = vi.fn(); mgr.on('shared', shared);
    const report = h.handlers.get(OVERLAY_PINGED)!;
    report({sender:h.windows[0].webContents},{id:'danger',x:1,y:2});
    report({sender:{}},{id:'danger',x:1,y:2});
    report({sender:h.windows[0].webContents},{id:'nope',x:1,y:2});
    expect(shared).toHaveBeenCalledExactlyOnceWith({id:'danger',displayId:1,x:1,y:2});
  });
});
