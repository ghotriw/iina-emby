import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startViewTransitionSafe, VIEW_TRANSITION_ATTR } from "./view-transitions";

describe("view-transitions", () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;
  const originalCSS = globalThis.CSS;

  function createRoot() {
    const attrs = new Set<string>();
    return {
      setAttribute: vi.fn((name: string) => attrs.add(name)),
      removeAttribute: vi.fn((name: string) => attrs.delete(name)),
      hasAttribute: (name: string) => attrs.has(name),
    };
  }

  function mockEnvironment({
    supportsMatchElement = true,
    reducedMotion = false,
  }: {
    supportsMatchElement?: boolean;
    reducedMotion?: boolean;
  } = {}) {
    const root = createRoot();
    const transitions: { callback: () => void; finish: () => void }[] = [];

    const startViewTransition = vi.fn((callback: () => void) => {
      let finish!: () => void;
      const finished = new Promise<void>((resolve) => {
        finish = resolve;
      });
      transitions.push({ callback, finish });
      return { finished } as unknown as ViewTransition;
    });

    globalThis.document = { startViewTransition, documentElement: root } as unknown as Document;
    globalThis.window = {
      matchMedia: vi.fn((query: string) => ({ matches: reducedMotion && query.includes("prefers-reduced-motion") })),
    } as unknown as Window & typeof globalThis;
    globalThis.CSS = { supports: vi.fn(() => supportsMatchElement) } as unknown as typeof CSS;

    return { root, startViewTransition, transitions };
  }

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.document = originalDocument;
    globalThis.window = originalWindow;
    globalThis.CSS = originalCSS;
  });

  it("executes updateFn directly when document is undefined or has no startViewTransition", () => {
    const updateFn = vi.fn();
    // @ts-expect-error simulating environment without document
    delete globalThis.document;

    startViewTransitionSafe(updateFn);
    expect(updateFn).toHaveBeenCalledTimes(1);

    globalThis.document = {} as unknown as Document;
    startViewTransitionSafe(updateFn);
    expect(updateFn).toHaveBeenCalledTimes(2);
  });

  it("executes updateFn directly if match-element is not supported", () => {
    const updateFn = vi.fn();
    const { startViewTransition } = mockEnvironment({ supportsMatchElement: false });

    startViewTransitionSafe(updateFn);
    expect(updateFn).toHaveBeenCalledTimes(1);
    expect(startViewTransition).not.toHaveBeenCalled();
  });

  it("executes updateFn directly if user prefers reduced motion", () => {
    const updateFn = vi.fn();
    const { startViewTransition } = mockEnvironment({ reducedMotion: true });

    startViewTransitionSafe(updateFn);
    expect(updateFn).toHaveBeenCalledTimes(1);
    expect(startViewTransition).not.toHaveBeenCalled();
  });

  it("runs updateFn inside a transition and toggles the root attribute", async () => {
    const updateFn = vi.fn();
    const { root, startViewTransition, transitions } = mockEnvironment();

    startViewTransitionSafe(updateFn);
    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(root.hasAttribute(VIEW_TRANSITION_ATTR)).toBe(true);

    transitions[0].callback();
    expect(updateFn).toHaveBeenCalledTimes(1);

    transitions[0].finish();
    await vi.waitFor(() => expect(root.hasAttribute(VIEW_TRANSITION_ATTR)).toBe(false));
  });

  it("keeps the root attribute until all overlapping transitions finish", async () => {
    const { root, transitions } = mockEnvironment();

    startViewTransitionSafe(vi.fn());
    startViewTransitionSafe(vi.fn());

    transitions[0].finish();
    await Promise.resolve();
    await Promise.resolve();
    expect(root.hasAttribute(VIEW_TRANSITION_ATTR)).toBe(true);

    transitions[1].finish();
    await vi.waitFor(() => expect(root.hasAttribute(VIEW_TRANSITION_ATTR)).toBe(false));
  });
});
