/**
 * Convert the overlay's minimap box to fractions of the video area mpv draws into.
 */
function outputBox(layout, osd) {
  if (!layout || layout.viewW <= 0 || layout.viewH <= 0 || osd.w <= 0 || osd.h <= 0) {
    return null;
  }

  // Negative margins mean the zoomed video overflows the window, and mpv crops it to the window.
  const left = Math.max(osd.ml, 0);
  const top = Math.max(osd.mt, 0);
  const width = osd.w - left - Math.max(osd.mr, 0);
  const height = osd.h - top - Math.max(osd.mb, 0);
  const scaleX = osd.w / layout.viewW;
  const scaleY = osd.h / layout.viewH;

  return {
    x: (layout.x * scaleX - left) / width,
    y: (layout.y * scaleY - top) / height,
    w: (layout.w * scaleX) / width,
    h: (layout.h * scaleY) / height,
  };
}

/**
 * Format a number as a GLSL float literal.
 */
function float(value) {
  const text = String(Number(value.toFixed(6)));

  return text.includes(".") ? text : text + ".0";
}

/**
 * Format a rectangle as a GLSL vec4 of x, y, width and height.
 */
function vec4(rect) {
  return `vec4(${[rect.x, rect.y, rect.w, rect.h].map(float).join(", ")})`;
}

/**
 * Build an mpv user shader that draws the full frame and the visible region over the output.
 */
function minimapShader(box, view) {
  return `//!HOOK OUTPUT
//!BIND HOOKED
//!BIND MAIN
//!DESC Interactive Zoom minimap

const vec4 BOX = ${vec4(box)};
const vec4 VIEW = ${vec4(view)};

vec4 hook() {
    vec2 local = (HOOKED_pos - BOX.xy) / BOX.zw;

    if (any(lessThan(local, vec2(0.0))) || any(greaterThan(local, vec2(1.0)))) {
        return HOOKED_texOff(0);
    }

    vec2 onePixel = HOOKED_pt / BOX.zw;

    if (any(lessThan(min(local, 1.0 - local), onePixel))) {
        return vec4(1.0);
    }

    vec2 inView = (local - VIEW.xy) / VIEW.zw;
    vec2 viewPixel = onePixel / VIEW.zw;
    bool insideView = all(greaterThan(inView, -viewPixel)) && all(lessThan(inView, 1.0 + viewPixel));

    if (insideView && any(lessThan(abs(min(inView, 1.0 - inView)), viewPixel))) {
        return vec4(1.0);
    }

    return vec4(MAIN_tex(local).rgb, 1.0);
}
`;
}

module.exports = { outputBox, minimapShader };
