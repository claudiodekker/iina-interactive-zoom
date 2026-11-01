const { core, mpv, event, menu, overlay, file, utils } = iina;
const { clampZoom, clampCenter, toMpv, viewportRect, zoomStep } = require("./src/viewport.js");
const { outputBox, minimapShader } = require("./src/minimap.js");

const INITIAL_ZOOM = 1;
const SHADER_PREFIX = utils.resolvePath("@data/minimap-");
const INSTANCE_ID = Math.random().toString(36).slice(2, 10);
const SHADER_INTERVAL_MS = 30;

const state = { enabled: false, zoom: INITIAL_ZOOM, centerX: 0.5, centerY: 0.5, panelVisible: true };

let windowLoaded = false;
let overlayLoaded = false;
let layout = null;
let toggleItem = null;
let shaderCount = 0;
let shaderTimer = null;
let lastShaderAt = 0;

/**
 * Read the video's display aspect ratio, falling back to 16:9.
 */
function readAspect() {
  const width = mpv.getNumber("video-out-params/dw");
  const height = mpv.getNumber("video-out-params/dh");

  return width > 0 && height > 0 ? width / height : 16 / 9;
}

/**
 * Apply the state to mpv and the overlay, the only place that writes video zoom and pan.
 */
function render() {
  const props = toMpv(state);

  for (const name of Object.keys(props)) {
    mpv.set(name, props[name]);
  }

  if (toggleItem) {
    toggleItem.selected = state.enabled;
  }

  syncOverlay();
  scheduleShader();
}

/**
 * Show or hide the overlay and push the current state to it.
 */
function syncOverlay() {
  if (!windowLoaded) {
    return;
  }

  if (!state.enabled) {
    overlay.hide();

    return;
  }

  overlay.show();

  if (!overlayLoaded) {
    return;
  }

  overlay.postMessage("state", {
    zoom: state.zoom,
    aspect: readAspect(),
    panelVisible: state.panelVisible,
  });
}

/**
 * Determine if a loaded shader path is a minimap this plugin wrote.
 */
function isOurShader(path) {
  return path.startsWith(SHADER_PREFIX);
}

/**
 * Swap in a minimap shader for the current state, or remove it when the panel is off.
 */
function applyShader() {
  lastShaderAt = Date.now();

  const loaded = mpv.getNative("glsl-shaders");
  const stale = Array.isArray(loaded) ? loaded.filter(isOurShader) : [];
  const box = outputBox(layout, mpv.getNative("osd-dimensions"));

  if (state.enabled && state.panelVisible && box !== null) {
    // mpv caches shader files by path for the whole session, so every change needs a new file name.
    shaderCount += 1;

    const next = `${SHADER_PREFIX}${INSTANCE_ID}-${shaderCount}.glsl`;

    file.write(next, minimapShader(box, viewportRect(state)));
    mpv.command("change-list", ["glsl-shaders", "append", next]);
  }

  for (const path of stale) {
    mpv.command("change-list", ["glsl-shaders", "remove", path]);
    file.delete(path);
  }
}

/**
 * Apply the shader at most once per interval, with a trailing call so the last change always lands.
 */
function scheduleShader() {
  if (shaderTimer !== null) {
    return;
  }

  const wait = Math.max(0, SHADER_INTERVAL_MS - (Date.now() - lastShaderAt));

  shaderTimer = setTimeout(() => {
    shaderTimer = null;
    applyShader();
  }, wait);
}

/**
 * Show the current zoom factor in the on-screen display.
 */
function announce() {
  if (windowLoaded) {
    core.osd("Zoom " + state.zoom.toFixed(1) + "x");
  }
}

/**
 * Set the zoom factor, keep the viewport inside the frame and redraw.
 */
function setZoom(zoom) {
  state.zoom = clampZoom(zoom);

  const center = clampCenter({ x: state.centerX, y: state.centerY }, state.zoom);
  state.centerX = center.x;
  state.centerY = center.y;

  render();
  announce();
}

/**
 * Move the viewport center, clamped to the frame.
 */
function setCenter(x, y) {
  const center = clampCenter({ x: x, y: y }, state.zoom);
  state.centerX = center.x;
  state.centerY = center.y;

  render();
}

/**
 * Turn the zoom panel on at 1x centered, or off and reset the video.
 */
function setEnabled(enabled) {
  state.enabled = enabled;

  if (enabled) {
    state.zoom = INITIAL_ZOOM;
    state.centerX = 0.5;
    state.centerY = 0.5;
    state.panelVisible = true;
  }

  render();

  if (windowLoaded) {
    core.osd(enabled ? "Interactive Zoom on" : "Interactive Zoom off");
  }
}

/**
 * Step the zoom in or out, turning the panel on first when it is off.
 */
function stepZoom(direction) {
  if (!state.enabled) {
    setEnabled(true);
  }

  setZoom(zoomStep(state.zoom, direction));
}

/**
 * Show or hide the overlay panel.
 */
function setPanelVisible(visible) {
  state.panelVisible = visible;

  render();
}

/**
 * Register the plugin menu items.
 */
function addMenuItems() {
  toggleItem = menu.item("Interactive Zoom", () => setEnabled(!state.enabled), { keyBinding: "Alt+z" });

  menu.addItem(toggleItem);
  menu.addItem(menu.item("Zoom In", () => stepZoom(1), { keyBinding: "Alt+=" }));
  menu.addItem(menu.item("Zoom Out", () => stepZoom(-1), { keyBinding: "Alt+-" }));
  menu.addItem(menu.item("Reset Zoom", () => setEnabled(false), { keyBinding: "Alt+0" }));
}

/**
 * Wire overlay messages to state changes.
 */
function listenToOverlay() {
  overlay.onMessage("center", (data) => setCenter(data.x, data.y));
  overlay.onMessage("zoom", (data) => setZoom(data.zoom));
  overlay.onMessage("panel", (data) => setPanelVisible(data.visible));
  overlay.onMessage("layout", (data) => {
    layout = data;
    scheduleShader();
  });
}

/**
 * Load the overlay page once the player window exists.
 */
function onWindowLoaded() {
  windowLoaded = true;
  overlay.loadFile("overlay.html");
  overlay.setClickable(true);
  render();
}

addMenuItems();

event.on("iina.window-loaded", onWindowLoaded);

if (core.window.loaded) {
  onWindowLoaded();
}

event.on("iina.plugin-overlay-loaded", () => {
  overlayLoaded = true;
  // IINA ignores overlay.onMessage until the page has loaded, so listen here and ask the page for its layout.
  listenToOverlay();
  overlay.postMessage("init", {});
  syncOverlay();
});

event.on("mpv.file-loaded", render);
event.on("mpv.osd-dimensions.changed", scheduleShader);
