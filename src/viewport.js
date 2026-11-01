const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const STEP_RATIO = Math.pow(2, 0.25);

/**
 * Clamp a zoom factor to the supported range.
 */
function clampZoom(zoom) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/**
 * Clamp a viewport center so the visible region stays inside the frame.
 */
function clampCenter(center, zoom) {
  const half = 1 / (2 * zoom);
  const clamp = (value) => Math.min(1 - half, Math.max(half, value));

  return { x: clamp(center.x), y: clamp(center.y) };
}

/**
 * Map the zoom state to the mpv video properties that render it.
 */
function toMpv(state) {
  if (!state.enabled) {
    return { "video-zoom": 0, "video-pan-x": 0, "video-pan-y": 0 };
  }

  const center = clampCenter({ x: state.centerX, y: state.centerY }, state.zoom);

  return {
    "video-zoom": Math.log2(state.zoom),
    "video-pan-x": 0.5 - center.x,
    "video-pan-y": 0.5 - center.y,
  };
}

/**
 * Get the visible region of the frame as fractions from 0 to 1.
 */
function viewportRect(state) {
  const center = clampCenter({ x: state.centerX, y: state.centerY }, state.zoom);
  const size = 1 / state.zoom;

  return { x: center.x - size / 2, y: center.y - size / 2, w: size, h: size };
}

/**
 * Step the zoom a quarter octave in or out, where direction is 1 or -1.
 */
function zoomStep(zoom, direction) {
  return clampZoom(direction > 0 ? zoom * STEP_RATIO : zoom / STEP_RATIO);
}

module.exports = { MIN_ZOOM, MAX_ZOOM, clampZoom, clampCenter, toMpv, viewportRect, zoomStep };
