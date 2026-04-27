const $ = (selector) => document.querySelector(selector);
const stage = $("#stage");
const viewport = $("#viewport");
const statusEl = $("#status");

const fields = {
  layoutName: $("#layoutName"),
  layoutWidth: $("#layoutWidth"),
  layoutHeight: $("#layoutHeight"),
  layoutBg: $("#layoutBg"),
  layoutBgFile: $("#layoutBgFile"),
  barMaskFile: $("#barMaskFile"),
  layoutBgOpacity: $("#layoutBgOpacity"),
  layoutBgName: $("#layoutBgName"),
  presetSelect: $("#presetSelect"),
  newType: $("#newType"),
  enableTooltips: $("#enableTooltips"),
  showAnchors: $("#showAnchors"),
  enableDrag: $("#enableDrag"),
  snapGrid: $("#snapGrid"),
  rulerMode: $("#rulerMode"),
  gridSize: $("#gridSize"),
  createPath: $("#createPath"),
  deletePath: $("#deletePath"),
  addPathDot: $("#addPathDot"),
  deletePathDot: $("#deletePathDot"),
  pathSelect: $("#pathSelect"),
  pathStroke: $("#pathStroke"),
  pathPointColor: $("#pathPointColor"),
  pathWidth: $("#pathWidth"),
  pathClosed: $("#pathClosed"),
  pickStorage: $("#pickStorage"),
  saveName: $("#saveName"),
  saveSelect: $("#saveSelect"),
  importTxt: $("#importTxt"),
  importFile: $("#importFile"),
  selectionName: $("#selectionName"),
  stageInfo: $("#stageInfo"),
  objectList: $("#objectList"),
  rawPreview: $("#rawPreview"),
  emptyInspector: $("#emptyInspector"),
  inspector: $("#inspector"),
  objLabel: $("#objLabel"),
  objType: $("#objType"),
  objX: $("#objX"),
  objY: $("#objY"),
  objW: $("#objW"),
  objH: $("#objH"),
  objRot: $("#objRot"),
  objZ: $("#objZ"),
  objAnchor: $("#objAnchor"),
  typeParams: $("#typeParams")
};

const defaultParams = {
  single_img: () => ({ src: "assets/placeholder-panel.svg", fit: "cover" }),
  spritesheet: () => ({
    src: "assets/placeholder-sprite.svg",
    frameWidth: 64,
    frameHeight: 64,
    frames: 4,
    fps: 8,
    mode: "loop",
    previewFrame: 0
  }),
  button: () => ({}),
  variable_text: () => ({ varName: "score", text: "Score: {score}", fontSize: 24, align: "center" }),
  variable_bar: () => ({
    varName: "hp",
    value: 65,
    min: 0,
    max: 100,
    direction: "left-right",
    shape: "pill",
    maskSrc: "",
    maskName: "",
    emptyOpacity: 0.22,
    invert: false,
    segmented: false,
    segments: 10
  })
};

function pathDefaults(index = state.paths.length + 1) {
  return {
    id: uid().replace("obj_", "path_"),
    label: `path_${index}`,
    points: [
      { x: 160, y: 180 },
      { x: 280, y: 120 },
      { x: 400, y: 180 }
    ],
    strokeColor: "#ffd184",
    pointColor: "#7bc8a4",
    lineWidth: 5,
    closed: false,
    showPoints: true
  };
}

const exportPrompt = "BACA FILE INI UNTUK MODIFIKASI KODE UNTUK PERANCANGAN APL, BUKAN UNTUK DI LOAD DAN DIHUBUNGKAN KE KODE";
const anchorAliases = {
  "top-left": "top left",
  "top-center": "top middle",
  "top-middle": "top middle",
  "top right": "top right",
  "top-right": "top right",
  "middle-left": "middle left",
  center: "middle",
  "middle-center": "middle",
  "middle-right": "middle right",
  "bottom-left": "bottom left",
  "bottom-center": "bottom middle",
  "bottom-middle": "bottom middle",
  "bottom-right": "bottom right"
};
const validAnchors = new Set([
  "top left",
  "top middle",
  "top right",
  "middle left",
  "middle",
  "middle right",
  "bottom left",
  "bottom middle",
  "bottom right"
]);

let state = {
  layout: {
    name: "New Layout",
    width: 1280,
    height: 720,
    background: "#172033",
    backgroundImage: "",
    backgroundImageName: "",
    backgroundImageOpacity: 1
  },
  objects: [],
  paths: []
};

const layoutPresets = [
  { name: "HUD Mobile Landscape", width: 1280, height: 720, background: "#172033" },
  { name: "Portrait Menu", width: 720, height: 1280, background: "#201a16" },
  { name: "Square Widget", width: 512, height: 512, background: "#14231e" }
];
let storageDirHandle = null;
let storageDisplayName = "";
const storageDbName = "layout-maker-storage";
const storageDbStore = "handles";
const storageHandleKey = "saves-dir";
let selectedId = null;
let selectedPathId = null;
let scale = 1;
let interaction = null;
let audioCtx = null;
let tooltipsEnabled = true;
let showAnchors = true;
let enableDrag = true;
let snapGrid = false;
let rulerMode = false;
let gridSize = 32;
let tutorialStepIndex = 0;
let activeTutorialTarget = null;

const tutorialSteps = [
  {
    selector: ".panel-left .card:nth-of-type(1)",
    title: "Layout",
    body: "Di sini kamu atur nama layout, ukuran pixel, warna background, import image background, opacity background image, dan preset ukuran."
  },
  {
    selector: ".panel-left .card:nth-of-type(2)",
    title: "Tambah Object",
    body: "Pilih type object prototype, lalu klik + Buat Kotak. Sprite Sheet punya tombol sendiri supaya setting frame/fps-nya rapi di panel kanan."
  },
  {
    selector: ".panel-left .card:nth-of-type(3)",
    title: "Path Finding",
    body: "Path finding terpisah dari object. Create Path untuk bikin jalur, Add Dot untuk tambah titik, lalu drag titik langsung di canvas."
  },
  {
    selector: ".panel-left .card:nth-of-type(4)",
    title: "Saved Objects",
    body: "Ini list object dan path yang ada di layout. Klik item untuk memilih dan mengatur parameternya."
  },
  {
    selector: ".panel-left .card:nth-of-type(5)",
    title: "Save / Load",
    body: "Pertama pilih folder project layout maker. App otomatis pakai folder saves. Setelah itu Save Folder langsung menulis TXT ke saves."
  },
  {
    selector: ".top-actions",
    title: "Toggle Cepat",
    body: "Tooltips bisa dimatikan, dan Show Anchors menampilkan titik anchor tiap object agar jelas referensinya."
  },
  {
    selector: ".floating-tools",
    title: "Tools Canvas",
    body: "Enable Drag mengaktifkan drag object/dot. Snap Grid menempel ke grid. Ruler Straight mengunci drag lurus horizontal atau vertikal. Scroll di canvas untuk zoom."
  },
  {
    selector: "#stage",
    title: "Canvas Layout",
    body: "Ini area layout. Drag object untuk move, tarik handle untuk resize, Shift + resize untuk proporsional, dan titik atas untuk rotate."
  },
  {
    selector: ".panel-right .card:nth-of-type(1)",
    title: "Object Parameter",
    body: "Kalau belum pilih object, panel ini kosong. Setelah pilih object, parameter penting seperti label, type, posisi, size, anchor, dan setting type akan muncul."
  },
  {
    selector: ".panel-right .card:nth-of-type(2)",
    title: "Raw Export Preview",
    body: "Preview isi TXT yang akan disimpan. File ini berisi layout, objects, paths, background, anchor, size, dan parameter prototype."
  }
];

function beep(kind = "tap") {
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime;
    const freq = kind === "success" ? 660 : kind === "delete" ? 180 : kind === "select" ? 520 : 420;
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  } catch {
    // Audio is optional; some browsers block it until the first interaction.
  }
}

function setStatus(message, kind = "tap") {
  statusEl.textContent = message;
  beep(kind);
}

function setupInstantTooltips() {
  const tooltip = document.createElement("div");
  tooltip.className = "instant-tooltip hidden";
  document.body.appendChild(tooltip);

  document.querySelectorAll("[title]").forEach((element) => {
    if (stage.contains(element)) return;
    element.dataset.tooltip = element.getAttribute("title");
    element.removeAttribute("title");
  });

  const moveTooltip = (event) => {
    tooltip.style.left = `${event.clientX + 14}px`;
    tooltip.style.top = `${event.clientY + 14}px`;
  };

  document.addEventListener("pointerover", (event) => {
    if (!tooltipsEnabled) return;
    const target = event.target.closest("[data-tooltip]");
    if (!target || stage.contains(target)) return;
    tooltip.textContent = target.dataset.tooltip;
    tooltip.classList.remove("hidden");
    moveTooltip(event);
  });

  document.addEventListener("pointermove", (event) => {
    if (tooltip.classList.contains("hidden")) return;
    moveTooltip(event);
  });

  document.addEventListener("pointerout", (event) => {
    const target = event.target.closest("[data-tooltip]");
    if (target && !target.contains(event.relatedTarget)) {
      tooltip.classList.add("hidden");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") tooltip.classList.add("hidden");
  });
}

function setupTutorial() {
  const overlay = document.createElement("div");
  overlay.className = "tutorial-overlay hidden";
  overlay.innerHTML = `
    <div class="tutorial-scrim"></div>
    <div class="tutorial-card">
      <div class="tutorial-kicker">Tutorial Editor</div>
      <h2 id="tutorialTitle">Mau tutorial?</h2>
      <p id="tutorialBody">Aku bisa tunjukkan fitur utama editor ini satu per satu.</p>
      <div class="tutorial-progress hidden" id="tutorialProgress"></div>
      <div class="tutorial-actions">
        <button id="tutorialBack">Back</button>
        <button id="tutorialSkip">Skip</button>
        <button id="tutorialNext" class="primary">Mulai</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  $("#tutorialBack").addEventListener("click", () => {
    if (tutorialStepIndex > 0) {
      tutorialStepIndex -= 1;
      renderTutorialStep();
    }
  });
  $("#tutorialSkip").addEventListener("click", closeTutorial);
  $("#tutorialNext").addEventListener("click", () => {
    if (overlay.dataset.mode === "prompt") {
      startTutorial();
      return;
    }
    if (tutorialStepIndex >= tutorialSteps.length - 1) {
      closeTutorial();
      return;
    }
    tutorialStepIndex += 1;
    renderTutorialStep();
  });

  showTutorialPrompt();
}

function showTutorialPrompt() {
  const overlay = document.querySelector(".tutorial-overlay");
  if (!overlay) return;
  overlay.dataset.mode = "prompt";
  overlay.classList.remove("hidden");
  $("#tutorialTitle").textContent = "Mau tutorial?";
  $("#tutorialBody").textContent = "Aku bisa tunjukkan fitur utama editor ini satu per satu supaya kamu cepat paham alurnya.";
  $("#tutorialProgress").classList.add("hidden");
  $("#tutorialBack").classList.add("hidden");
  $("#tutorialSkip").textContent = "Tidak dulu";
  $("#tutorialNext").textContent = "Mulai Tutorial";
}

function startTutorial() {
  tutorialStepIndex = 0;
  const overlay = document.querySelector(".tutorial-overlay");
  overlay.dataset.mode = "steps";
  $("#tutorialProgress").classList.remove("hidden");
  $("#tutorialBack").classList.remove("hidden");
  $("#tutorialSkip").textContent = "Selesai";
  renderTutorialStep();
}

function renderTutorialStep() {
  const step = tutorialSteps[tutorialStepIndex];
  const target = document.querySelector(step.selector);
  if (activeTutorialTarget) activeTutorialTarget.classList.remove("tutorial-focus");
  activeTutorialTarget = target || null;
  if (activeTutorialTarget) {
    activeTutorialTarget.classList.add("tutorial-focus");
    activeTutorialTarget.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
  }

  $("#tutorialTitle").textContent = step.title;
  $("#tutorialBody").textContent = step.body;
  $("#tutorialProgress").textContent = `${tutorialStepIndex + 1} / ${tutorialSteps.length}`;
  $("#tutorialBack").disabled = tutorialStepIndex === 0;
  $("#tutorialNext").textContent = tutorialStepIndex === tutorialSteps.length - 1 ? "Selesai" : "Next";
}

function closeTutorial() {
  document.querySelector(".tutorial-overlay")?.classList.add("hidden");
  if (activeTutorialTarget) activeTutorialTarget.classList.remove("tutorial-focus");
  activeTutorialTarget = null;
}

function uid() {
  return `obj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function safeSaveName(name) {
  const cleaned = String(name || "layout")
    .replace(/\.txt$/i, "")
    .replace(/[^a-z0-9._ -]/gi, "_")
    .trim()
    .slice(0, 80);
  return `${cleaned || "layout"}.txt`;
}

function normalizeAnchor(anchor) {
  const value = String(anchor || "top left").toLowerCase().trim();
  const normalized = anchorAliases[value] || value;
  return validAnchors.has(normalized) ? normalized : "top left";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Gagal membaca file."));
    reader.readAsDataURL(file);
  });
}

function openStorageDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(storageDbName, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(storageDbStore);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Gagal membuka storage browser."));
  });
}

async function saveStoredFolderHandle(handle, displayName) {
  const db = await openStorageDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(storageDbStore, "readwrite");
    tx.objectStore(storageDbStore).put({ handle, displayName }, storageHandleKey);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error("Gagal menyimpan folder handle."));
  });
  db.close();
}

async function loadStoredFolderHandle() {
  if (!("indexedDB" in window)) return null;
  const db = await openStorageDb();
  const saved = await new Promise((resolve, reject) => {
    const tx = db.transaction(storageDbStore, "readonly");
    const request = tx.objectStore(storageDbStore).get(storageHandleKey);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error("Gagal membaca folder handle."));
  });
  db.close();
  return saved;
}

async function ensureFolderPermission(handle, ask = false) {
  if (!handle) return false;
  if (!handle.queryPermission || !handle.requestPermission) return true;
  const options = { mode: "readwrite" };
  if ((await handle.queryPermission(options)) === "granted") return true;
  if (!ask) return false;
  return (await handle.requestPermission(options)) === "granted";
}

async function restoreStorageFolder() {
  try {
    const saved = await loadStoredFolderHandle();
    if (!saved?.handle) return false;
    if (!(await ensureFolderPermission(saved.handle, false))) return false;
    storageDirHandle = saved.handle;
    storageDisplayName = saved.displayName || saved.handle.name || "saves";
    await refreshSaves();
    setStatus(`Folder save aktif: ${storageDisplayName}.`);
    return true;
  } catch {
    return false;
  }
}

function selectedObject() {
  return state.objects.find((object) => object.id === selectedId) || null;
}

function selectedPath() {
  return state.paths.find((path) => path.id === selectedPathId) || null;
}

function clampNumber(value, fallback, min = -Infinity, max = Infinity) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function snapValue(value) {
  return snapGrid ? Math.round(value / gridSize) * gridSize : value;
}

function applyRulerDelta(dx, dy) {
  if (!rulerMode) return { dx, dy };
  return Math.abs(dx) >= Math.abs(dy) ? { dx, dy: 0 } : { dx: 0, dy };
}

function normalizePoints(points) {
  if (!Array.isArray(points)) return pathDefaults().points;
  return points.map((point) => ({
    x: clampNumber(point.x, 0),
    y: clampNumber(point.y, 0)
  }));
}

function objectDefaults(type) {
  const index = state.objects.length + 1;
  return {
    id: uid(),
    label: `${type}_${index}`,
    type,
    x: 80 + index * 18,
    y: 70 + index * 18,
    width: type === "variable_text" ? 260 : 220,
    height: type === "variable_text" ? 70 : 140,
    rotation: 0,
    anchor: "top left",
    zIndex: index,
    opacity: 1,
    locked: false,
    visible: true,
    fill: type === "button" ? "#f2a950" : "#2d8cff",
    stroke: "#f7f0df",
    radius: type === "variable_bar" ? 999 : 16,
    params: defaultParams[type]()
  };
}

function exportData() {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    layout: { ...state.layout },
    objects: state.objects.map((object) => ({
      ...object,
      x: Math.round(object.x),
      y: Math.round(object.y),
      width: Math.round(object.width),
      height: Math.round(object.height),
      rotation: Math.round(object.rotation * 100) / 100
    })),
    paths: state.paths.map((path) => ({
      ...path,
      points: normalizePoints(path.points).map((point) => ({
        x: Math.round(point.x),
        y: Math.round(point.y)
      })),
      lineWidth: Math.round(Number(path.lineWidth || 1))
    }))
  };
}

function exportText() {
  return `${exportPrompt}\n\n${JSON.stringify(exportData(), null, 2)}`;
}

function parseLayoutText(text) {
  const jsonStart = text.indexOf("{");
  if (jsonStart === -1) {
    throw new Error("File tidak berisi JSON layout.");
  }
  return JSON.parse(text.slice(jsonStart));
}

function normalizeImport(data) {
  const layout = data.layout || {};
  state.layout = {
    name: String(layout.name || "Loaded Layout"),
    width: clampNumber(layout.width, 1280, 1),
    height: clampNumber(layout.height, 720, 1),
    background: layout.background || "#172033",
    backgroundImage: String(layout.backgroundImage || ""),
    backgroundImageName: String(layout.backgroundImageName || ""),
    backgroundImageOpacity: clampNumber(layout.backgroundImageOpacity, 1, 0, 1)
  };
  const convertedPaths = [];
  state.objects = Array.isArray(data.objects)
    ? data.objects.filter((object) => {
        if (object.type !== "path_finding") return true;
        convertedPaths.push({
          ...pathDefaults(convertedPaths.length + 1),
          id: object.id?.replace(/^obj_/, "path_") || uid().replace("obj_", "path_"),
          label: object.label || `path_${convertedPaths.length + 1}`,
          points: normalizePoints(object.params?.points).map((point) => ({
            x: clampNumber(object.x, 0) + point.x,
            y: clampNumber(object.y, 0) + point.y
          })),
          strokeColor: object.params?.strokeColor || "#ffd184",
          pointColor: object.params?.pointColor || "#7bc8a4",
          lineWidth: clampNumber(object.params?.lineWidth, 5, 1),
          closed: Boolean(object.params?.closed),
          showPoints: object.params?.showPoints !== false
        });
        return false;
      }).map((object, index) => {
        const type = defaultParams[object.type] ? object.type : "single_img";
        const params = { ...defaultParams[type](), ...(object.params || {}) };
        return {
          ...objectDefaults(type),
          ...object,
          id: object.id || uid(),
          label: object.label || `${type}_${index + 1}`,
          type,
          x: clampNumber(object.x, 0),
          y: clampNumber(object.y, 0),
          width: clampNumber(object.width, 100, 1),
          height: clampNumber(object.height, 100, 1),
          rotation: clampNumber(object.rotation, 0),
          anchor: normalizeAnchor(object.anchor),
          zIndex: clampNumber(object.zIndex, index + 1),
          opacity: clampNumber(object.opacity, 1, 0, 1),
          params
        };
      })
    : [];
  state.paths = [
    ...(Array.isArray(data.paths) ? data.paths : []),
    ...convertedPaths
  ].map((path, index) => ({
    ...pathDefaults(index + 1),
    ...path,
    id: path.id || uid().replace("obj_", "path_"),
    label: path.label || `path_${index + 1}`,
    points: normalizePoints(path.points),
    lineWidth: clampNumber(path.lineWidth, 5, 1),
    closed: Boolean(path.closed),
    showPoints: path.showPoints !== false
  }));
  selectedId = state.objects[0]?.id || null;
  selectedPathId = state.paths[0]?.id || null;
}

function updateStageMetrics() {
  stage.style.width = `${state.layout.width}px`;
  stage.style.height = `${state.layout.height}px`;
  stage.style.background = state.layout.background;
  stage.style.setProperty("--layout-bg-image", state.layout.backgroundImage ? `url("${state.layout.backgroundImage}")` : "none");
  stage.style.setProperty("--layout-bg-opacity", state.layout.backgroundImage ? state.layout.backgroundImageOpacity : 0);
  stage.style.transform = `scale(${scale})`;
  stage.style.setProperty("--grid-size", `${gridSize}px`);
  stage.classList.toggle("snap-grid", snapGrid);
  fields.stageInfo.textContent = `Layout ${state.layout.width} x ${state.layout.height}px | Zoom ${Math.round(scale * 100)}%`;
}

function fitView() {
  const padding = 130;
  const availableW = Math.max(300, viewport.clientWidth - padding);
  const availableH = Math.max(240, viewport.clientHeight - padding);
  scale = Math.min(1, availableW / state.layout.width, availableH / state.layout.height);
  updateStageMetrics();
}

function zoomAtCursor(event) {
  if (event.target.closest(".floating-tools")) return;
  event.preventDefault();
  const rect = stage.getBoundingClientRect();
  const before = {
    x: (event.clientX - rect.left) / scale,
    y: (event.clientY - rect.top) / scale
  };
  const factor = event.deltaY < 0 ? 1.1 : 0.9;
  scale = Math.max(0.1, Math.min(4, scale * factor));
  updateStageMetrics();
  const afterLeft = before.x * scale;
  const afterTop = before.y * scale;
  viewport.scrollLeft += afterLeft - (event.clientX - viewport.getBoundingClientRect().left);
  viewport.scrollTop += afterTop - (event.clientY - viewport.getBoundingClientRect().top);
}

function render() {
  fields.layoutName.value = state.layout.name;
  fields.layoutWidth.value = state.layout.width;
  fields.layoutHeight.value = state.layout.height;
  fields.layoutBg.value = state.layout.background;
  fields.layoutBgOpacity.value = state.layout.backgroundImageOpacity;
  fields.layoutBgName.textContent = state.layout.backgroundImageName
    ? `BG image: ${state.layout.backgroundImageName}`
    : "No background image.";
  updateStageMetrics();
  stage.innerHTML = "";
  stage.appendChild(createPathLayer());
  const sorted = [...state.objects].sort((a, b) => a.zIndex - b.zIndex);
  for (const object of sorted) {
    stage.appendChild(createObjectElement(object));
  }
  renderObjectList();
  renderInspector();
  renderPathPanel();
  fields.rawPreview.value = exportText();
}

function renderObjectList() {
  const objectItems = state.objects
    .slice()
    .sort((a, b) => b.zIndex - a.zIndex)
    .map((object) => `
      <div class="object-list-item ${object.id === selectedId ? "selected" : ""}" data-object-id="${object.id}">
        <strong>${object.label}</strong>
        <span>${object.type} - x:${Math.round(object.x)} y:${Math.round(object.y)} ${Math.round(object.width)}x${Math.round(object.height)}</span>
      </div>
    `);

  const pathItems = state.paths.map((path) => `
    <div class="object-list-item ${path.id === selectedPathId ? "selected" : ""}" data-path-id="${path.id}">
      <strong>${path.label}</strong>
      <span>path finding - ${normalizePoints(path.points).length} dots</span>
    </div>
  `);

  fields.objectList.innerHTML = objectItems.length || pathItems.length
    ? [...objectItems, ...pathItems].join("")
    : `<div class="empty small">Belum ada object tersimpan.</div>`;
}

function createPathLayer() {
  const layer = document.createElement("div");
  layer.className = "path-layer";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("path-stage-svg");
  svg.setAttribute("viewBox", `0 0 ${state.layout.width} ${state.layout.height}`);
  svg.setAttribute("preserveAspectRatio", "none");

  for (const path of state.paths) {
    const points = normalizePoints(path.points);
    const line = document.createElementNS("http://www.w3.org/2000/svg", path.closed ? "polygon" : "polyline");
    line.classList.add("stage-path-line");
    if (path.id === selectedPathId) line.classList.add("selected");
    line.dataset.pathId = path.id;
    line.setAttribute("points", points.map((point) => `${point.x},${point.y}`).join(" "));
    line.setAttribute("fill", path.closed ? "rgba(123, 200, 164, 0.14)" : "none");
    line.setAttribute("stroke", path.strokeColor || "#ffd184");
    line.setAttribute("stroke-width", path.lineWidth || 5);
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("stroke-linejoin", "round");
    line.addEventListener("pointerdown", onPathLinePointerDown);
    svg.appendChild(line);
  }

  layer.appendChild(svg);

  for (const path of state.paths) {
    if (path.showPoints === false) continue;
    normalizePoints(path.points).forEach((point, index) => {
      const dot = document.createElement("div");
      dot.className = "stage-path-dot";
      if (path.id === selectedPathId) dot.classList.add("selected");
      dot.dataset.pathId = path.id;
      dot.dataset.pointIndex = index;
      dot.style.left = `${point.x}px`;
      dot.style.top = `${point.y}px`;
      dot.style.background = path.pointColor || "#7bc8a4";
      dot.title = `${path.label} dot ${index + 1}: ${Math.round(point.x)}, ${Math.round(point.y)}`;
      dot.addEventListener("pointerdown", onPathDotPointerDown);
      layer.appendChild(dot);
    });
  }

  return layer;
}

function createObjectElement(object) {
  const el = document.createElement("div");
  el.className = "object";
  el.dataset.id = object.id;
  el.style.left = `${object.x}px`;
  el.style.top = `${object.y}px`;
  el.style.width = `${object.width}px`;
  el.style.height = `${object.height}px`;
  el.style.transform = `rotate(${object.rotation}deg)`;
  el.style.zIndex = object.zIndex + 10;
  el.style.opacity = object.visible ? object.opacity : 0.25;
  el.style.background = object.fill;
  el.style.borderColor = object.stroke;
  el.style.borderRadius = `${object.radius}px`;
  if (object.id === selectedId) el.classList.add("selected");
  if (object.locked) el.classList.add("locked");
  if (!object.visible) el.classList.add("hidden-object");

  fillObjectVisual(el, object);
  for (const handle of ["nw", "ne", "sw", "se"]) {
    const handleEl = document.createElement("div");
    handleEl.className = "handle";
    handleEl.dataset.handle = handle;
    el.appendChild(handleEl);
  }
  const rotate = document.createElement("div");
  rotate.className = "rotate-handle";
  el.appendChild(rotate);

  el.addEventListener("pointerdown", onObjectPointerDown);
  return el;
}

function fillObjectVisual(el, object) {
  if (object.type === "single_img" && object.params.src) {
    const img = document.createElement("img");
    img.src = object.params.src;
    img.style.objectFit = object.params.fit || "cover";
    el.appendChild(img);
  }

  if (object.type === "spritesheet" && object.params.src) {
    el.classList.add("spritesheet-object");
    const clip = document.createElement("div");
    clip.className = "sprite-clip";
    const img = document.createElement("img");
    const frames = Math.max(1, Number(object.params.frames || 1));
    const frame = Math.max(0, Math.min(frames - 1, Number(object.params.previewFrame || 0)));
    img.src = object.params.src;
    img.style.width = `${frames * 100}%`;
    img.style.height = "100%";
    img.style.maxWidth = "none";
    img.style.objectFit = "fill";
    img.style.transform = `translateX(-${(frame / frames) * 100}%)`;
    clip.appendChild(img);
    el.appendChild(clip);
  }

  if (object.type === "variable_bar") {
    const fill = document.createElement("div");
    fill.className = "bar-fill";
    applyBarPreview(el, fill, object);
    el.appendChild(fill);
  }

  const label = document.createElement("div");
  label.className = "object-label";
  if (object.type === "button") label.textContent = object.label;
  else if (object.type === "variable_text") {
    label.textContent = object.params.text || object.label;
    label.style.fontSize = `${object.params.fontSize || 24}px`;
    label.style.background = "transparent";
    label.style.textShadow = "0 2px 10px rgba(0,0,0,.5)";
  } else label.textContent = object.label;
  el.appendChild(label);

  if (showAnchors) {
    el.appendChild(createAnchorMarker(object));
  }
}

function applyBarPreview(el, fill, object) {
  const params = object.params;
  const min = Number(params.min ?? 0);
  const max = Math.max(min + 1, Number(params.max || 100));
  let percent = ((Number(params.value || 0) - min) / (max - min)) * 100;
  percent = Math.max(0, Math.min(100, params.invert ? 100 - percent : percent));

  const shapeClass = String(params.shape || "pill").replace(/\s+/g, "-");
  el.classList.add("variable-bar-object", `bar-shape-${shapeClass}`);
  el.style.setProperty("--bar-empty-opacity", clampNumber(params.emptyOpacity, 0.22, 0, 1));
  if (params.shape === "free alpha" && params.maskSrc) {
    const mask = `url("${params.maskSrc}")`;
    el.style.maskImage = mask;
    el.style.webkitMaskImage = mask;
    el.style.maskSize = "100% 100%";
    el.style.webkitMaskSize = "100% 100%";
    el.style.maskRepeat = "no-repeat";
    el.style.webkitMaskRepeat = "no-repeat";
    el.style.maskPosition = "center";
    el.style.webkitMaskPosition = "center";
  } else {
    el.style.maskImage = "";
    el.style.webkitMaskImage = "";
  }

  fill.style.left = "";
  fill.style.right = "";
  fill.style.top = "";
  fill.style.bottom = "";
  fill.style.width = "100%";
  fill.style.height = "100%";

  if (params.segmented) {
    const segments = Math.max(1, Number(params.segments || 10));
    fill.style.backgroundImage = `linear-gradient(90deg, transparent calc(100% - 2px), rgba(17,27,23,.5) calc(100% - 2px))`;
    fill.style.backgroundSize = `${100 / segments}% 100%`;
  } else {
    fill.style.backgroundImage = "";
    fill.style.backgroundSize = "";
  }

  if (params.direction === "right-left") {
    fill.style.right = "0";
    fill.style.width = `${percent}%`;
  } else if (params.direction === "top-bottom") {
    fill.style.top = "0";
    fill.style.height = `${percent}%`;
  } else if (params.direction === "bottom-top") {
    fill.style.bottom = "0";
    fill.style.height = `${percent}%`;
  } else {
    fill.style.left = "0";
    fill.style.width = `${percent}%`;
  }
}

function createAnchorMarker(object) {
  const marker = document.createElement("div");
  marker.className = "anchor-marker";
  marker.dataset.anchor = object.anchor;
  marker.title = `Anchor: ${object.anchor}`;
  return marker;
}

function renderInspector() {
  const object = selectedObject();
  const path = selectedPath();
  fields.selectionName.textContent = object ? object.label : path ? `Path: ${path.label}` : "Tidak ada object dipilih";
  fields.emptyInspector.classList.toggle("hidden", Boolean(object));
  fields.inspector.classList.toggle("hidden", !object);

  if (!object) return;
  fields.objLabel.value = object.label;
  fields.objType.value = object.type;
  fields.objX.value = Math.round(object.x);
  fields.objY.value = Math.round(object.y);
  fields.objW.value = Math.round(object.width);
  fields.objH.value = Math.round(object.height);
  fields.objRot.value = Math.round(object.rotation * 100) / 100;
  fields.objZ.value = object.zIndex;
  fields.objAnchor.value = object.anchor;
  renderTypeParams(object);
}

function renderTypeParams(object) {
  const params = object.params;
  const field = (key, label, type = "text", attrs = "") => `
    <label>${label}<input data-param="${key}" type="${type}" value="${params[key] ?? ""}" ${attrs}></label>
  `;
  const select = (key, label, options) => `
    <label>${label}<select data-param="${key}">
      ${options.map((option) => `<option value="${option}" ${params[key] === option ? "selected" : ""}>${option}</option>`).join("")}
    </select></label>
  `;

  let html = "";
  if (object.type === "single_img") {
    html = field("src", "Image Src") + select("fit", "Fit", ["cover", "contain", "fill", "none"]);
  }
  if (object.type === "spritesheet") {
    html =
      field("src", "Spritesheet Src") +
      field("frameWidth", "Frame Width", "number", "min='1'") +
      field("frameHeight", "Frame Height", "number", "min='1'") +
      field("frames", "Frames", "number", "min='1'") +
      field("fps", "FPS", "number", "min='1'") +
      field("previewFrame", "Preview Frame", "number", "min='0'") +
      select("mode", "Mode", ["loop", "pingpong", "once"]);
  }
  if (object.type === "button") {
    html = `<p class="mini-note">Button prototype pakai Label sebagai teks. Tidak ada action logic di editor ini.</p>`;
  }
  if (object.type === "variable_text") {
    html =
      field("varName", "Variable Name") +
      field("text", "Text Template") +
      field("fontSize", "Font Size", "number", "min='1'") +
      select("align", "Align", ["left", "center", "right"]);
  }
  if (object.type === "variable_bar") {
    html =
      field("varName", "Variable Name") +
      field("value", "Preview Value", "number") +
      field("min", "Min", "number") +
      field("max", "Max", "number", "min='1'") +
      select("direction", "Direction", ["left-right", "right-left", "bottom-top", "top-bottom"]) +
      select("shape", "Shape", ["pill", "rectangle", "circle", "diamond", "free alpha"]) +
      field("emptyOpacity", "Empty Opacity", "number", "min='0' max='1' step='0.05'") +
      `<div class="checks">
        <label><input data-param="invert" type="checkbox" ${params.invert ? "checked" : ""}> Invert</label>
        <label><input data-param="segmented" type="checkbox" ${params.segmented ? "checked" : ""}> Segmented</label>
      </div>` +
      field("segments", "Segments", "number", "min='1'") +
      `<div class="button-row">
        <button type="button" data-bar-action="import-mask">Import Alpha</button>
        <button type="button" data-bar-action="clear-mask">Clear Alpha</button>
      </div>
      <p class="mini-note">${params.maskName ? `Alpha mask: ${params.maskName}` : "Free alpha shape uses imported image alpha as mask."}</p>`;
  }
  fields.typeParams.innerHTML = html;
}

function patchSelected(patch) {
  const object = selectedObject();
  if (!object) return;
  Object.assign(object, patch);
  render();
}

function setParam(key, value) {
  const object = selectedObject();
  if (!object) return;
  const numericKeys = new Set(["frameWidth", "frameHeight", "frames", "fps", "previewFrame", "fontSize", "value", "min", "max", "lineWidth", "emptyOpacity", "segments"]);
  if (key === "pointsJson") {
    const parsed = JSON.parse(value);
    object.params.points = normalizePoints(parsed);
    render();
    return;
  }
  const minByKey = { previewFrame: 0, value: -Infinity, min: -Infinity, emptyOpacity: 0, segments: 1 };
  object.params[key] = numericKeys.has(key) ? clampNumber(value, object.params[key], minByKey[key] ?? 1) : value;
  render();
}

async function importBarMask(file) {
  const object = selectedObject();
  if (!object || object.type !== "variable_bar" || !file) return;
  object.params.maskSrc = await readFileAsDataUrl(file);
  object.params.maskName = file.name;
  object.params.shape = "free alpha";
  render();
  setStatus(`Alpha mask "${file.name}" di-import.`, "success");
}

function clearBarMask() {
  const object = selectedObject();
  if (!object || object.type !== "variable_bar") return;
  object.params.maskSrc = "";
  object.params.maskName = "";
  if (object.params.shape === "free alpha") object.params.shape = "pill";
  render();
  setStatus("Alpha mask variable bar dihapus.", "delete");
}

function renderPathPanel() {
  fields.pathSelect.innerHTML = state.paths.length
    ? state.paths.map((path) => `<option value="${path.id}" ${path.id === selectedPathId ? "selected" : ""}>${path.label}</option>`).join("")
    : `<option value="">Belum ada path</option>`;

  const path = selectedPath();
  fields.pathStroke.value = path?.strokeColor || "#ffd184";
  fields.pathPointColor.value = path?.pointColor || "#7bc8a4";
  fields.pathWidth.value = path?.lineWidth || 5;
  fields.pathClosed.checked = Boolean(path?.closed);
}

function createPath() {
  const path = pathDefaults();
  state.paths.push(path);
  selectedPathId = path.id;
  selectedId = null;
  render();
  setStatus(`Path "${path.label}" dibuat.`, "success");
}

function addPathPoint() {
  if (!selectedPath()) createPath();
  const path = selectedPath();
  if (!path) return;
  const points = normalizePoints(path.points);
  const last = points[points.length - 1] || { x: state.layout.width / 2, y: state.layout.height / 2 };
  points.push({
    x: clampNumber(snapValue(last.x + 48), last.x, 0, state.layout.width),
    y: clampNumber(snapValue(last.y + 32), last.y, 0, state.layout.height)
  });
  path.points = points;
  render();
  setStatus("Dot path ditambahkan.", "success");
}

function deletePathPoint() {
  const path = selectedPath();
  if (!path) return;
  const points = normalizePoints(path.points);
  if (points.length <= 1) return;
  points.pop();
  path.points = points;
  render();
  setStatus("Dot path terakhir dihapus.", "delete");
}

function deletePath() {
  const path = selectedPath();
  if (!path) return;
  state.paths = state.paths.filter((item) => item.id !== path.id);
  selectedPathId = state.paths[0]?.id || null;
  render();
  setStatus(`Path "${path.label}" dihapus.`, "delete");
}

function patchSelectedPath(patch) {
  const path = selectedPath();
  if (!path) return;
  Object.assign(path, patch);
  render();
}

function clientToStage(event) {
  const rect = stage.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / scale,
    y: (event.clientY - rect.top) / scale
  };
}

function onPathLinePointerDown(event) {
  const path = state.paths.find((item) => item.id === event.currentTarget.dataset.pathId);
  if (!path) return;
  const changed = selectedPathId !== path.id || selectedId !== null;
  selectedPathId = path.id;
  selectedId = null;
  render();
  if (changed) beep("select");
  event.stopPropagation();
}

function onPathDotPointerDown(event) {
  const path = state.paths.find((item) => item.id === event.currentTarget.dataset.pathId);
  if (!path) return;
  const changed = selectedPathId !== path.id || selectedId !== null;
  selectedPathId = path.id;
  selectedId = null;
  renderPathPanel();
  if (changed) beep("select");
  if (!enableDrag) return;
  const pointIndex = Number(event.currentTarget.dataset.pointIndex);
  const points = normalizePoints(path.points);
  interaction = {
    mode: "stage-path-point",
    id: path.id,
    pointIndex,
    start: clientToStage(event),
    pointStart: points[pointIndex] || { x: 0, y: 0 }
  };
  event.currentTarget.setPointerCapture(event.pointerId);
  event.stopPropagation();
}

function onObjectPointerDown(event) {
  const object = state.objects.find((item) => item.id === event.currentTarget.dataset.id);
  if (!object) return;
  const changed = selectedId !== object.id || selectedPathId !== null;
  selectedId = object.id;
  selectedPathId = null;
  document.querySelectorAll(".object.selected").forEach((item) => item.classList.remove("selected"));
  event.currentTarget.classList.add("selected");
  renderInspector();
  if (changed) beep("select");
  if (object.locked || !enableDrag) return;

  const point = clientToStage(event);
  const handle = event.target.dataset.handle;
  const isRotate = event.target.classList.contains("rotate-handle");
  const rect = { x: object.x, y: object.y, width: object.width, height: object.height, rotation: object.rotation };

  if (isRotate) {
    interaction = { mode: "rotate", id: object.id, start: point, rect };
  } else if (handle) {
    interaction = { mode: "resize", id: object.id, handle, start: point, rect, ratio: rect.width / rect.height };
  } else {
    interaction = { mode: "move", id: object.id, start: point, rect };
  }

  event.currentTarget.setPointerCapture(event.pointerId);
}

function onPointerMove(event) {
  if (!interaction) return;
  if (interaction.mode === "stage-path-point") {
    const path = state.paths.find((item) => item.id === interaction.id);
    if (!path) return;
    const point = clientToStage(event);
    const dx = point.x - interaction.start.x;
    const dy = point.y - interaction.start.y;
    const rulerDelta = applyRulerDelta(dx, dy);
    const points = normalizePoints(path.points);
    points[interaction.pointIndex] = {
      x: clampNumber(snapValue(interaction.pointStart.x + rulerDelta.dx), interaction.pointStart.x, 0, state.layout.width),
      y: clampNumber(snapValue(interaction.pointStart.y + rulerDelta.dy), interaction.pointStart.y, 0, state.layout.height)
    };
    path.points = points;
    render();
    return;
  }

  const object = state.objects.find((item) => item.id === interaction.id);
  if (!object || object.locked) return;
  const point = clientToStage(event);
  const dx = point.x - interaction.start.x;
  const dy = point.y - interaction.start.y;
  const rulerDelta = applyRulerDelta(dx, dy);

  if (interaction.mode === "move") {
    object.x = snapValue(interaction.rect.x + rulerDelta.dx);
    object.y = snapValue(interaction.rect.y + rulerDelta.dy);
  }

  if (interaction.mode === "resize") {
    resizeObject(object, interaction, rulerDelta.dx, rulerDelta.dy, event.shiftKey);
  }

  if (interaction.mode === "rotate") {
    const cx = interaction.rect.x + interaction.rect.width / 2;
    const cy = interaction.rect.y + interaction.rect.height / 2;
    object.rotation = Math.atan2(point.y - cy, point.x - cx) * (180 / Math.PI) + 90;
  }

  render();
}

function resizeObject(object, drag, dx, dy, keepRatio) {
  let { x, y, width, height } = drag.rect;
  const min = 12;
  if (drag.handle.includes("e")) width += dx;
  if (drag.handle.includes("s")) height += dy;
  if (drag.handle.includes("w")) {
    x += dx;
    width -= dx;
  }
  if (drag.handle.includes("n")) {
    y += dy;
    height -= dy;
  }

  width = Math.max(min, width);
  height = Math.max(min, height);

  if (keepRatio) {
    if (Math.abs(dx) > Math.abs(dy)) height = width / drag.ratio;
    else width = height * drag.ratio;
    if (drag.handle.includes("w")) x = drag.rect.x + drag.rect.width - width;
    if (drag.handle.includes("n")) y = drag.rect.y + drag.rect.height - height;
  }

  object.x = x;
  object.y = y;
  object.width = Math.max(min, snapValue(width));
  object.height = Math.max(min, snapValue(height));
  object.x = snapValue(object.x);
  object.y = snapValue(object.y);
}

function onPointerUp() {
  if (interaction) {
    interaction = null;
    fields.rawPreview.value = exportText();
  }
}

function applyLayoutFromInputs() {
  state.layout.name = fields.layoutName.value || "New Layout";
  state.layout.width = clampNumber(fields.layoutWidth.value, state.layout.width, 1);
  state.layout.height = clampNumber(fields.layoutHeight.value, state.layout.height, 1);
  state.layout.background = fields.layoutBg.value;
  state.layout.backgroundImageOpacity = clampNumber(fields.layoutBgOpacity.value, state.layout.backgroundImageOpacity, 0, 1);
  fitView();
  render();
}

async function importLayoutBackground(file) {
  if (!file) return;
  state.layout.backgroundImage = await readFileAsDataUrl(file);
  state.layout.backgroundImageName = file.name;
  state.layout.backgroundImageOpacity = clampNumber(fields.layoutBgOpacity.value, 1, 0, 1);
  render();
  setStatus(`Background image "${file.name}" di-import.`, "success");
}

function clearLayoutBackground() {
  state.layout.backgroundImage = "";
  state.layout.backgroundImageName = "";
  render();
  setStatus("Background image layout dihapus.", "delete");
}

function addObject(type, overrides = {}) {
  const object = { ...objectDefaults(type), ...overrides };
  object.params = { ...defaultParams[object.type](), ...(overrides.params || {}) };
  state.objects.push(object);
  selectedId = object.id;
  selectedPathId = null;
  render();
  setStatus(`Object "${object.label}" dibuat.`, "success");
}

function duplicateSelected() {
  const object = selectedObject();
  if (!object) return;
  const clone = JSON.parse(JSON.stringify(object));
  clone.id = uid();
  clone.label = `${object.label}_copy`;
  clone.x += 24;
  clone.y += 24;
  clone.zIndex = Math.max(0, ...state.objects.map((item) => item.zIndex)) + 1;
  state.objects.push(clone);
  selectedId = clone.id;
  render();
  setStatus(`Duplikat "${clone.label}" dibuat.`, "success");
}

function deleteSelected() {
  const object = selectedObject();
  if (!object) return;
  state.objects = state.objects.filter((item) => item.id !== object.id);
  selectedId = null;
  render();
  setStatus(`Object "${object.label}" dihapus.`, "delete");
}

function loadPresets() {
  fields.presetSelect.innerHTML = `<option value="">Pilih preset...</option>` + layoutPresets
    .map((preset, index) => `<option value="${index}">${preset.name} (${preset.width}x${preset.height})</option>`)
    .join("");
}

async function refreshSaves() {
  if (!storageDirHandle) {
    fields.saveSelect.innerHTML = `<option value="">Pilih folder project/saves dulu...</option>`;
    return;
  }

  const saves = [];
  for await (const entry of storageDirHandle.values()) {
    if (entry.kind === "file" && entry.name.toLowerCase().endsWith(".txt")) {
      saves.push(entry.name);
    }
  }

  fields.saveSelect.innerHTML = saves.length
    ? saves.sort().map((file) => `<option value="${file}">${file}</option>`).join("")
    : `<option value="">Belum ada file .txt</option>`;
}

async function pickStorageFolder() {
  if (!("showDirectoryPicker" in window)) {
    setStatus("Browser ini belum support pilih folder. Pakai Download/Import TXT sebagai fallback.", "delete");
    return;
  }

  const pickedHandle = await window.showDirectoryPicker({
    id: "layout-maker-project",
    mode: "readwrite"
  });
  if (pickedHandle.requestPermission) {
    const permission = await pickedHandle.requestPermission({ mode: "readwrite" });
    if (permission !== "granted") {
      storageDirHandle = null;
      storageDisplayName = "";
      setStatus("Izin folder belum diberikan.", "delete");
      return;
    }
  }

  if (pickedHandle.name.toLowerCase() === "saves") {
    storageDirHandle = pickedHandle;
    storageDisplayName = pickedHandle.name;
  } else {
    storageDirHandle = await pickedHandle.getDirectoryHandle("saves", { create: true });
    storageDisplayName = `${pickedHandle.name}/saves`;
  }

  await saveStoredFolderHandle(storageDirHandle, storageDisplayName);
  await refreshSaves();
  setStatus(`Folder save aktif: ${storageDisplayName}.`, "success");
}

async function saveToFolder() {
  if (!storageDirHandle) {
    await restoreStorageFolder();
  }
  if (storageDirHandle && !(await ensureFolderPermission(storageDirHandle, true))) {
    setStatus("Izin folder saves belum diberikan.", "delete");
    return;
  }
  if (!storageDirHandle) {
    await pickStorageFolder();
    if (!storageDirHandle) return;
  }

  const name = fields.saveName.value || state.layout.name || "layout";
  const fileName = safeSaveName(name);
  const fileHandle = await storageDirHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(exportText());
  await writable.close();
  await refreshSaves();
  fields.saveSelect.value = fileName;
  setStatus(`Tersimpan ke ${storageDisplayName || storageDirHandle.name}/${fileName}.`, "success");
}

async function loadSelectedSave() {
  if (!storageDirHandle) {
    await restoreStorageFolder();
  }
  if (storageDirHandle && !(await ensureFolderPermission(storageDirHandle, true))) {
    setStatus("Izin folder saves belum diberikan.", "delete");
    return;
  }
  if (!storageDirHandle) {
    await pickStorageFolder();
    if (!storageDirHandle) return;
  }

  const file = fields.saveSelect.value;
  if (!file) return;
  const fileHandle = await storageDirHandle.getFileHandle(file);
  const text = await (await fileHandle.getFile()).text();
  normalizeImport(parseLayoutText(text));
  fitView();
  render();
  setStatus(`Loaded ${file}.`, "success");
}

async function importTxtFile(file) {
  if (!file) return;
  const text = await file.text();
  normalizeImport(parseLayoutText(text));
  fields.saveName.value = file.name.replace(/\.txt$/i, "");
  fitView();
  render();
  setStatus(`Imported ${file.name}.`, "success");
}

function downloadTxt() {
  const blob = new Blob([exportText()], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${(fields.saveName.value || state.layout.name || "layout").replace(/[^a-z0-9._ -]/gi, "_")}.txt`;
  link.click();
  URL.revokeObjectURL(url);
  setStatus("Download TXT dibuat.", "success");
}

function bindEvents() {
  document.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => beep());
  });
  $("#applyLayout").addEventListener("click", applyLayoutFromInputs);
  $("#fitView").addEventListener("click", () => {
    fitView();
    setStatus("Canvas di-fit ke viewport.");
  });
  $("#importLayoutBg").addEventListener("click", () => fields.layoutBgFile.click());
  $("#clearLayoutBg").addEventListener("click", clearLayoutBackground);
  fields.layoutBgFile.addEventListener("change", () => {
    importLayoutBackground(fields.layoutBgFile.files[0]).catch((error) => setStatus(error.message, "delete"));
    fields.layoutBgFile.value = "";
  });
  fields.barMaskFile.addEventListener("change", () => {
    importBarMask(fields.barMaskFile.files[0]).catch((error) => setStatus(error.message, "delete"));
    fields.barMaskFile.value = "";
  });
  fields.layoutBgOpacity.addEventListener("change", () => {
    state.layout.backgroundImageOpacity = clampNumber(fields.layoutBgOpacity.value, state.layout.backgroundImageOpacity, 0, 1);
    fields.layoutBgOpacity.value = state.layout.backgroundImageOpacity;
    render();
    setStatus(`BG image opacity ${state.layout.backgroundImageOpacity}.`);
  });
  fields.enableTooltips.addEventListener("change", () => {
    tooltipsEnabled = fields.enableTooltips.checked;
    document.querySelector(".instant-tooltip")?.classList.add("hidden");
    setStatus(tooltipsEnabled ? "Tooltip cepat aktif." : "Tooltip dimatikan.");
  });
  fields.showAnchors.addEventListener("change", () => {
    showAnchors = fields.showAnchors.checked;
    render();
    setStatus(showAnchors ? "Anchor marker ditampilkan." : "Anchor marker disembunyikan.");
  });
  fields.enableDrag.addEventListener("change", () => {
    enableDrag = fields.enableDrag.checked;
    render();
    setStatus(enableDrag ? "Drag editor aktif." : "Drag editor dimatikan.");
  });
  fields.snapGrid.addEventListener("change", () => {
    snapGrid = fields.snapGrid.checked;
    updateStageMetrics();
    setStatus(snapGrid ? "Snap grid aktif." : "Snap grid dimatikan.");
  });
  fields.rulerMode.addEventListener("change", () => {
    rulerMode = fields.rulerMode.checked;
    setStatus(rulerMode ? "Ruler straight aktif: drag terkunci lurus." : "Ruler straight dimatikan.");
  });
  fields.gridSize.addEventListener("change", () => {
    gridSize = clampNumber(fields.gridSize.value, gridSize, 2);
    fields.gridSize.value = gridSize;
    updateStageMetrics();
    setStatus(`Grid size ${gridSize}px.`);
  });
  $("#createPath").addEventListener("click", createPath);
  $("#deletePath").addEventListener("click", deletePath);
  $("#addPathDot").addEventListener("click", addPathPoint);
  $("#deletePathDot").addEventListener("click", deletePathPoint);
  fields.pathSelect.addEventListener("change", () => {
    selectedPathId = fields.pathSelect.value || null;
    selectedId = null;
    render();
  });
  fields.pathStroke.addEventListener("change", () => patchSelectedPath({ strokeColor: fields.pathStroke.value }));
  fields.pathPointColor.addEventListener("change", () => patchSelectedPath({ pointColor: fields.pathPointColor.value }));
  fields.pathWidth.addEventListener("change", () => patchSelectedPath({ lineWidth: clampNumber(fields.pathWidth.value, selectedPath()?.lineWidth || 5, 1) }));
  fields.pathClosed.addEventListener("change", () => patchSelectedPath({ closed: fields.pathClosed.checked }));
  $("#addObject").addEventListener("click", () => addObject(fields.newType.value));
  $("#addSpritesheet").addEventListener("click", () => addObject("spritesheet", {
    label: `spritesheet_${state.objects.length + 1}`,
    width: 128,
    height: 128
  }));
  $("#duplicateObject").addEventListener("click", duplicateSelected);
  $("#deleteObject").addEventListener("click", deleteSelected);
  $("#pickStorage").addEventListener("click", () => pickStorageFolder().catch((error) => setStatus(error.message, "delete")));
  $("#saveFolder").addEventListener("click", () => saveToFolder().catch((error) => setStatus(error.message, "delete")));
  $("#loadSave").addEventListener("click", () => loadSelectedSave().catch((error) => setStatus(error.message, "delete")));
  $("#downloadTxt").addEventListener("click", downloadTxt);
  $("#importTxt").addEventListener("click", () => fields.importFile.click());
  fields.importFile.addEventListener("change", () => {
    importTxtFile(fields.importFile.files[0]).catch((error) => setStatus(error.message, "delete"));
    fields.importFile.value = "";
  });

  fields.presetSelect.addEventListener("change", () => {
    const preset = layoutPresets[Number(fields.presetSelect.value)];
    if (!preset) return;
    state.layout = {
      name: preset.name,
      width: preset.width,
      height: preset.height,
      background: preset.background,
      backgroundImage: "",
      backgroundImageName: "",
      backgroundImageOpacity: 1
    };
    fitView();
    render();
    setStatus(`Preset "${preset.name}" dipakai.`, "success");
  });

  fields.objectList.addEventListener("click", (event) => {
    const objectItem = event.target.closest("[data-object-id]");
    const pathItem = event.target.closest("[data-path-id]");
    if (objectItem) {
      const changed = selectedId !== objectItem.dataset.objectId || selectedPathId !== null;
      selectedId = objectItem.dataset.objectId;
      selectedPathId = null;
      render();
      if (changed) beep("select");
      return;
    }
    if (pathItem) {
      const changed = selectedPathId !== pathItem.dataset.pathId || selectedId !== null;
      selectedPathId = pathItem.dataset.pathId;
      selectedId = null;
      render();
      if (changed) beep("select");
    }
  });

  stage.addEventListener("pointerdown", (event) => {
    if (event.target === stage || event.target.classList.contains("path-layer") || event.target.classList.contains("path-stage-svg")) {
      selectedId = null;
      selectedPathId = null;
      render();
    }
  });
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("resize", fitView);
  viewport.addEventListener("wheel", zoomAtCursor, { passive: false });

  const objectBindings = [
    ["objLabel", "label", "text"],
    ["objX", "x", "number"],
    ["objY", "y", "number"],
    ["objW", "width", "number"],
    ["objH", "height", "number"],
    ["objRot", "rotation", "number"],
    ["objZ", "zIndex", "number"],
    ["objAnchor", "anchor", "text"]
  ];

  for (const [fieldName, key, type] of objectBindings) {
    fields[fieldName].addEventListener("change", () => {
      const value = type === "number" ? clampNumber(fields[fieldName].value, selectedObject()?.[key] || 0, key === "opacity" ? 0 : -Infinity, key === "opacity" ? 1 : Infinity) : fields[fieldName].value;
      patchSelected({ [key]: value });
    });
  }

  fields.objType.addEventListener("change", () => {
    const object = selectedObject();
    if (!object) return;
    const type = fields.objType.value;
    object.type = type;
    object.params = defaultParams[type]();
    render();
  });

  fields.typeParams.addEventListener("change", (event) => {
    const input = event.target.closest("[data-param]");
    if (!input) return;
    const value = input.type === "checkbox" ? input.checked : input.value;
    try {
      setParam(input.dataset.param, value);
    } catch (error) {
      setStatus(error.message || "Param tidak valid.", "delete");
    }
  });
  fields.typeParams.addEventListener("click", (event) => {
    const action = event.target.closest("[data-bar-action]")?.dataset.barAction;
    if (!action) return;
    beep();
    if (action === "import-mask") fields.barMaskFile.click();
    if (action === "clear-mask") clearBarMask();
  });
}

async function init() {
  bindEvents();
  setupInstantTooltips();
  setupTutorial();
  loadPresets();
  await restoreStorageFolder();
  await refreshSaves();
  addObject("button", { label: "Start Button", x: 80, y: 80, width: 220, height: 86 });
  selectedId = null;
  fitView();
  render();
  setStatus("Editor siap. Pilih folder project ini, app akan pakai/bikin subfolder saves.");
}

init().catch((error) => {
  console.error(error);
  setStatus(error.message || "Init gagal", "delete");
});
