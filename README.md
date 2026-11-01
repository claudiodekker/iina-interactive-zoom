# Interactive Zoom

[![Tests](https://github.com/claudiodekker/iina-interactive-zoom/actions/workflows/tests.yml/badge.svg)](https://github.com/claudiodekker/iina-interactive-zoom/actions/workflows/tests.yml)

An IINA plugin that zooms into the video like VLC's Interactive Zoom filter. A minimap of the whole frame sits in the top-left corner with a white rectangle marking the visible region. Click or drag in the minimap to move the region, scroll over it to zoom, and drag the vertical gauge below it to set the zoom from 1x to 8x. "Zoom hide" collapses the panel to a small "Zoom show" button. Like IINA's own controls, the panel fades out after 2.5 seconds without mouse movement and comes back when you move the mouse. It stays while the pointer rests on it. Turning it on shows the panel at 1x, so nothing zooms until you use the gauge, the scroll wheel or the shortcuts. The zoom carries over to the next file.

## Install

In IINA, open Settings > Plugins, choose Install from GitHub..., and enter `claudiodekker/iina-interactive-zoom`. IINA offers updates for plugins installed this way.

To work on the plugin, clone this repository and link it instead:

```sh
/Applications/IINA.app/Contents/MacOS/iina-plugin link .
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

```sh
npm test
```

## Releasing

Raise `version` and `ghVersion` in `Info.json` together, for example `1.0.0` and `1` to `1.1.0` and `2`, and push to `main`. CI then packages the plugin and publishes it as a GitHub release, such as `v1.1.0` with an `.iinaplgz` file attached.

IINA installs the plugin from the latest release, and offers an update when `ghVersion` on `main` rises. CI fails when only one of the two fields changes, because IINA would then offer an update that installs the old release. Pushes that change neither field don't reach users.

`.gitattributes` lists the files left out of the package.

## License

MIT. See [LICENSE](LICENSE).

This plugin reproduces the behaviour of VLC's Interactive Zoom (`magnify`) filter. It contains no VLC code.
