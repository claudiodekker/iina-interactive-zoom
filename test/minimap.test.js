const test = require("node:test");
const assert = require("node:assert");
const { outputBox, minimapShader } = require("../src/minimap.js");

const close = (actual, expected) => {
  for (const key of Object.keys(expected)) {
    assert.ok(Math.abs(actual[key] - expected[key]) < 1e-9, `${key}: ${actual[key]} != ${expected[key]}`);
  }
};

test("maps the overlay box onto a video that fills a retina window", () => {
  const layout = { x: 12, y: 40, w: 240, h: 135, viewW: 960, viewH: 540 };
  const osd = { w: 1920, h: 1080, ml: 0, mt: 0, mr: 0, mb: 0 };

  close(outputBox(layout, osd), { x: 0.0125, y: 0.074074074074, w: 0.25, h: 0.25 });
});

test("measures the box from the video edges when the video is letterboxed", () => {
  const layout = { x: 12, y: 140, w: 240, h: 100, viewW: 1000, viewH: 800 };
  const osd = { w: 1000, h: 800, ml: 0, mt: 100, mr: 0, mb: 100 };

  close(outputBox(layout, osd), { x: 0.012, y: 0.066666666667, w: 0.24, h: 0.166666666667 });
});

test("treats a zoomed video larger than the window as filling it", () => {
  const layout = { x: 12, y: 40, w: 240, h: 135, viewW: 960, viewH: 540 };
  const osd = { w: 1920, h: 1080, ml: -960, mt: -540, mr: -960, mb: -540 };

  close(outputBox(layout, osd), { x: 0.0125, y: 0.074074074074, w: 0.25, h: 0.25 });
});

test("gives no box before the overlay and video both have a size", () => {
  const osd = { w: 1920, h: 1080, ml: 0, mt: 0, mr: 0, mb: 0 };

  assert.strictEqual(outputBox(null, osd), null);
  assert.strictEqual(outputBox({ x: 0, y: 0, w: 10, h: 10, viewW: 0, viewH: 0 }, osd), null);
  assert.strictEqual(outputBox({ x: 0, y: 0, w: 10, h: 10, viewW: 960, viewH: 540 }, { w: 0, h: 0, ml: 0, mt: 0, mr: 0, mb: 0 }), null);
});

test("bakes the box and visible region into the shader", () => {
  const source = minimapShader({ x: 0.02, y: 0.06, w: 0.25, h: 0.25 }, { x: 0.25, y: 0.375, w: 0.5, h: 0.5 });

  assert.match(source, /^\/\/!HOOK OUTPUT/);
  assert.match(source, /\/\/!BIND MAIN/);
  assert.match(source, /BOX = vec4\(0\.02, 0\.06, 0\.25, 0\.25\)/);
  assert.match(source, /VIEW = vec4\(0\.25, 0\.375, 0\.5, 0\.5\)/);
});

test("writes whole numbers as GLSL floats", () => {
  const source = minimapShader({ x: 0, y: 0, w: 1, h: 1 }, { x: 0, y: 0, w: 1, h: 1 });

  assert.match(source, /BOX = vec4\(0\.0, 0\.0, 1\.0, 1\.0\)/);
});
