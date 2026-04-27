# Layout Maker

**Short description:**  
A small offline HTML layout editor for prototyping UI layouts, object positions, anchors, path-finding dots, spritesheet previews, and variable bars. It runs directly from the browser without localhost, build tools, or a backend.

## Long Description

Layout Maker is a lightweight browser-based editor made for quickly planning application or game UI layouts. It is not a runtime UI framework and it is not meant to directly connect to production code. Instead, it exports a readable `.txt` file containing the layout size, object list, positions, anchors, sizes, paths, and prototype parameters so the file can be used as a design/reference document during coding.

The app is intentionally simple: open `public/index.html`, create objects, move/resize/rotate them on the canvas, add path-finding points, configure prototype parameters, and save the result into the local `saves` folder. No install step is required.

## Features

- Static web app: no server, no localhost, no npm install.
- Layout settings: name, width, height, background color, background image, background image opacity.
- Built-in prototype objects: single image, button marker, variable text, variable bar, and spritesheet.
- Object controls: move, resize, proportional resize with `Shift`, rotate, z-index, label, size in pixels, and anchor position.
- Anchor preview toggle so object reference points are visible on the canvas.
- Path finding layer: create paths, add/delete dots, drag dots, close path, set line/dot preview colors.
- Variable bar settings: min/max/value, direction, shape, invert, segmented mode, and optional alpha-mask image.
- Canvas tools: enable drag toggle, snap grid, ruler-straight drag, grid size, and mouse-wheel zoom.
- Saved Objects panel to select objects and paths from a list.
- Tutorial overlay shown when the app opens.
- Instant Indonesian tooltips for editor controls.
- Export/save as `.txt` with a warning prompt at the top for vibe-coding/reference use.

## How To Use

1. Open the `public` folder.
2. Double-click `index.html`.
3. When the app opens, choose whether to run the tutorial.
4. Click `Pilih Folder Project / Saves`.
5. Select the project folder, for example `layout maker`.
6. The app will automatically use or create the `saves` folder inside the project.
7. Click `Save Folder` to save the current layout as a `.txt` file into `saves`.
8. Use `Load Selected` to load a saved `.txt` from `saves`.

If folder access is not supported by your browser, use `Download TXT` and `Import TXT` instead.

## Browser Support

For direct saving into the local `saves` folder, use a Chromium-based browser such as:

- Google Chrome
- Microsoft Edge

The folder-save feature uses the browser File System Access API. The browser may ask for folder permission once. After permission is granted, the app remembers the `saves` folder handle when possible.

## Export Format

Saved `.txt` files start with this note:

```text
BACA FILE INI UNTUK MODIFIKASI KODE UNTUK PERANCANGAN APL, BUKAN UNTUK DI LOAD DAN DIHUBUNGKAN KE KODE
```

Below that note is JSON data containing:

- `layout`: layout name, size, background, and background image data.
- `objects`: prototype object list with label, type, position, size, rotation, anchor, and type-specific params.
- `paths`: path-finding lines and dot positions.

## Project Structure

```text
layout maker/
  public/
    index.html
    styles.css
    app.js
    assets/
      placeholder-panel.svg
      placeholder-sprite.svg
  saves/
    .txt save files go here
  README.md
```

## Notes

- This editor is for prototyping and planning layouts.
- The exported TXT is meant as a coding/design reference, not as a production data contract.
- Background images and alpha masks are embedded into TXT as data URLs, so large images can make save files large.
- The app stores folder permission in the browser when possible; if the browser resets permissions, choose the project folder again.
