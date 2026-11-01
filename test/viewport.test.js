const test = require("node:test");
const assert = require("node:assert/strict");
const { clampCenter, toMpv, viewportRect, zoomStep } = require("../src/viewport.js");

const on = (zoom, centerX, centerY) => ({ enabled: true, zoom, centerX, centerY, panelVisible: true });

test("zoom 2 centered maps to video-zoom 1 and no pan", () => {
  assert.deepEqual(toMpv(on(2, 0.5, 0.5)), { "video-zoom": 1, "video-pan-x": 0, "video-pan-y": 0 });
});

test("centering at the left edge clamps to 0.25 and pans 0.25", () => {
  const props = toMpv(on(2, 0, 0.5));
  assert.equal(props["video-pan-x"], 0.25);
  assert.equal(props["video-pan-y"], 0);
});

test("centering past the bottom right clamps and pans negative", () => {
  const props = toMpv(on(4, 1, 1));
  assert.equal(props["video-pan-x"], -0.375);
  assert.equal(props["video-pan-y"], -0.375);
  assert.equal(props["video-zoom"], 2);
});

test("disabled state resets everything to zero", () => {
  const state = { enabled: false, zoom: 4, centerX: 0.1, centerY: 0.9, panelVisible: true };
  assert.deepEqual(toMpv(state), { "video-zoom": 0, "video-pan-x": 0, "video-pan-y": 0 });
});

test("zoom 1 can only be centered", () => {
  assert.deepEqual(clampCenter({ x: 0.1, y: 0.9 }, 1), { x: 0.5, y: 0.5 });
});

test("viewport rect covers the visible region", () => {
  assert.deepEqual(viewportRect(on(2, 0.5, 0.5)), { x: 0.25, y: 0.25, w: 0.5, h: 0.5 });
  assert.deepEqual(viewportRect(on(4, 0, 1)), { x: 0, y: 0.75, w: 0.25, h: 0.25 });
});

test("zoom steps multiply by a quarter octave and stay within 1 to 8", () => {
  assert.ok(Math.abs(zoomStep(2, 1) - 2 * Math.pow(2, 0.25)) < 1e-9);
  assert.ok(Math.abs(zoomStep(2, -1) - 2 / Math.pow(2, 0.25)) < 1e-9);
  assert.equal(zoomStep(8, 1), 8);
  assert.equal(zoomStep(1, -1), 1);
});
