# Interactive Zoom

An IINA plugin that zooms into the video like VLC's Interactive Zoom filter. A minimap of the whole frame sits in the top-left corner with a white rectangle marking the visible region. Click or drag in the minimap to move the region, scroll over it to zoom, and drag the vertical gauge below it to set the zoom from 1x to 8x. "Zoom hide" collapses the panel to a small "Zoom show" button. Turning it on shows the panel at 1x, so nothing zooms until you use the gauge, the scroll wheel or the shortcuts. The zoom carries over to the next file.

## Install

From the repository root:

```sh
/Applications/IINA.app/Contents/MacOS/iina-plugin link interactive-zoom
```

## Shortcuts

| Action | Shortcut |
| --- | --- |
| Toggle Interactive Zoom | Alt+Z |
| Zoom In | Alt+= |
| Zoom Out | Alt+- |
| Reset Zoom | Alt+0 |

Zoom In and Zoom Out turn the panel on when it is off and take one step from 1x. Reset Zoom turns it off and restores the video.

## Develop

Run `npm test` from the repository root.
