import * as THREE from "/static/vendor/three.module.min.js";

const NODES = [
  { id: "grid", kind: "grid", title: "电网接口", device: "GRID", x: -3.6, z: .1, color: 0xd6a36e },
  { id: "solar", kind: "solar", title: "光伏阵列", device: "GENERATION", x: -2.15, z: -2.55, color: 0xb5d99b },
  { id: "storage", kind: "storage", title: "储能单元", device: "STORAGE", x: 2.15, z: -2.55, color: 0x5abeb2 },
  { id: "load", kind: "load", title: "算力负荷", device: "COMPUTE", x: 3.6, z: .1, color: 0x8badd6 },
  { id: "factory", kind: "factory", title: "生产单元", device: "PRODUCTION", x: 2.2, z: 2.75, color: 0x92afa4 },
  { id: "charge", kind: "charge", title: "柔性负荷", device: "FLEXIBLE", x: -2.2, z: 2.75, color: 0xbda5c9 },
];
const CHANNELS = [
  { id: "solar_load", from: "solar", to: "load", color: 0xb5d99b, bend: -.3 },
  { id: "solar_storage", from: "solar", to: "storage", color: 0x54c0ae, bend: -1.8 },
  { id: "storage_load", from: "storage", to: "load", color: 0x64bec6, bend: .6 },
  { id: "grid_load", from: "grid", to: "load", color: 0xd6a36e, bend: 1.0 },
  { id: "solar_grid", from: "solar", to: "grid", color: 0x9ab78a, bend: -.5 },
];
const ZERO = Object.fromEntries(CHANNELS.map(({ id }) => [id, 0]));
const numeric = (value) => Number(String(value ?? "").replace(/[^\d.-]/g, "")) || 0;

function material(color, glow = false) {
  return new THREE.MeshStandardMaterial({
    color, roughness: .48, metalness: .35,
    emissive: glow ? color : 0x000000, emissiveIntensity: glow ? .32 : 0,
  });
}
function mesh(geometry, color, x = 0, y = 0, z = 0, glow = false) {
  const item = new THREE.Mesh(geometry, material(color, glow));
  item.position.set(x, y, z);
  return item;
}
function cube(w, h, d, color, x = 0, y = 0, z = 0, glow = false) {
  return mesh(new THREE.BoxGeometry(w, h, d), color, x, y, z, glow);
}
function ring(radius, thickness, color, y = 0) {
  const item = mesh(new THREE.TorusGeometry(radius, thickness, 8, 72), color, 0, y, 0, true);
  item.rotation.x = Math.PI / 2;
  return item;
}
function makeNode(definition) {
  const node = new THREE.Group();
  node.position.set(definition.x, 0, definition.z);
  node.userData = { ...definition, metric: ["grid", "solar", "load"].includes(definition.id) ? "— kW" : definition.kind === "storage" ? "SOC —" : "示意资产", note: "未载入数据" };
  node.add(mesh(new THREE.CylinderGeometry(.63, .73, .12, 6), 0x1c4148, 0, .08));
  node.add(ring(.67, .014, definition.color, .16));
  const selection = ring(.78, .022, 0xffd7a8, .12);
  selection.name = "selection"; selection.visible = false; node.add(selection);
  const tint = definition.color;
  if (definition.kind === "solar") {
    for (let i = 0; i < 3; i++) {
      const panel = cube(.28, .055, .65, 0x49726d, (i - 1) * .31, .39, 0);
      panel.rotation.x = -.45;
      node.add(panel);
      for (let j = 0; j < 4; j++) node.add(cube(.23, .017, .012, tint, (i - 1) * .31, .29 + j * .052, .23 - j * .14, true));
      node.add(cube(.04, .25, .04, 0x30555b, (i - 1) * .31, .24));
    }
  } else if (definition.kind === "storage") {
    node.add(mesh(new THREE.CylinderGeometry(.36, .36, .94, 12, 1, true), 0x24494d, 0, .67));
    node.add(ring(.38, .027, tint, 1.16), ring(.38, .027, tint, .2));
    const fill = mesh(new THREE.CylinderGeometry(.31, .31, 1, 12), tint, 0, .23, 0, true);
    fill.name = "socFill"; fill.scale.y = .03; node.add(fill);
    node.add(cube(.17, .06, .17, tint, 0, 1.24, 0, true));
    for (let i = 0; i < 4; i++) node.add(cube(.035, .88, .035, 0x62847b, Math.cos(i * Math.PI / 2) * .37, .68, Math.sin(i * Math.PI / 2) * .37));
  } else if (definition.kind === "grid") {
    node.add(mesh(new THREE.CylinderGeometry(.27, .38, .66, 6), 0x365454, 0, .5));
    const coil = ring(.4, .035, tint, .72); node.add(coil, ring(.34, .028, tint, 1.02));
    node.add(cube(.07, .54, .07, tint, -.28, .95), cube(.07, .54, .07, tint, .28, .95));
    node.add(cube(.62, .055, .055, tint, 0, 1.2, 0, true));
  } else if (definition.kind === "load") {
    for (let i = 0; i < 3; i++) {
      const h = .55 + i * .21;
      node.add(cube(.26, h, .38, 0x335564, (i - 1) * .29, .17 + h / 2));
      for (let j = 0; j < 4; j++) node.add(cube(.18, .021, .016, tint, (i - 1) * .29, .25 + j * .1, .2, true));
    }
  } else if (definition.kind === "charge") {
    node.add(cube(.23, .76, .2, 0x535d69, -.2, .57));
    node.add(cube(.16, .2, .015, tint, -.2, .81, .108, true));
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(.25, .022, 8, 32, Math.PI * 1.7), material(tint));
    hoop.position.set(.06, .61, .03); hoop.rotation.z = -.8; node.add(hoop);
    node.add(cube(.55, .16, .35, 0x385761, .17, .28, .12));
  } else {
    node.add(cube(.82, .39, .5, 0x3b5957, 0, .39));
    const roof = mesh(new THREE.CylinderGeometry(.29, .29, .83, 3), 0x50736a, 0, .65);
    roof.rotation.z = Math.PI / 2; roof.rotation.x = Math.PI / 2; node.add(roof);
    for (let i = 0; i < 3; i++) node.add(cube(.13, .13, .02, tint, (i - 1) * .23, .4, .26, true));
  }
  return node;
}

function fallbackFlows(state) {
  if (state.noData) return { ...ZERO };
  const load = numeric(state.load), solar = numeric(state.generation), imported = numeric(state.gridImport);
  const discharge = Math.max(0, load - solar - imported);
  return { solar_load: Math.min(solar, load), solar_storage: Math.max(0, solar - load), storage_load: discharge, grid_load: imported, solar_grid: 0 };
}

export function createCampus3D(canvas, onLabels) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x102b33, 1);
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xe6f5e9, 2.1));
  const keyLight = new THREE.DirectionalLight(0xe5f4d5, 3);
  keyLight.position.set(-3, 8, 5); scene.add(keyLight);
  const rim = new THREE.DirectionalLight(0x5cb8c4, 1.3);
  rim.position.set(5, 4, -6); scene.add(rim);
  const camera = new THREE.OrthographicCamera(-6, 6, 5, -5, .1, 80);
  const target = new THREE.Vector3(0, 0, .25);
  camera.position.set(0, 8.5, 9.2); camera.lookAt(target);
  let zoom = 1;
  let lastWidth = 0, lastHeight = 0, labelsDirty = true, running = true;
  let selected = "load", editing = false, drag = null;
  let liveFlow = { ...ZERO }, previewFlow = null;
  const nodes = new Map(NODES.map((definition) => [definition.id, makeNode(definition)]));
  nodes.forEach((node) => scene.add(node));

  const ground = mesh(new THREE.CircleGeometry(5.45, 96), 0x15333b, 0, -.07);
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  [1.04, 2.1, 3.25, 4.55].forEach((r, index) => {
    const orbit = ring(r, .008, index === 0 ? 0x577b72 : 0x254750, -.005); scene.add(orbit);
  });
  const grid = new THREE.GridHelper(12, 24, 0x21434a, 0x1c3c44);
  grid.material.transparent = true; grid.material.opacity = .34; grid.position.y = -.01; scene.add(grid);
  const hub = mesh(new THREE.CylinderGeometry(.62, .79, .22, 6), 0x375e59, 0, .13);
  scene.add(hub, ring(.92, .025, 0xa0c78e, .1));
  const glyph = new THREE.Group();
  glyph.add(cube(.1, .03, .58, 0xd5e5b5, -.13, .28), cube(.38, .03, .1, 0xd5e5b5, .03, .28, -.23), cube(.1, .03, .27, 0xd5e5b5, .2, .28, -.1), cube(.32, .03, .1, 0xd5e5b5, .02, .28, .025));
  scene.add(glyph);

  const guide = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x40656a, transparent: true, opacity: .5 }));
  scene.add(guide);
  const paths = CHANNELS.map((channel) => {
    const line = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: channel.color, transparent: true, opacity: .15 }));
    const particles = Array.from({ length: 5 }, () => mesh(new THREE.SphereGeometry(.033, 8, 8), channel.color, 0, 0, 0, true));
    scene.add(line, ...particles);
    return { ...channel, line, particles, curve: null, power: 0 };
  });
  function syncGeometry() {
    const links = [];
    nodes.forEach((node) => { links.push(new THREE.Vector3(0, .12, 0), new THREE.Vector3(node.position.x, .12, node.position.z)); });
    guide.geometry.dispose(); guide.geometry = new THREE.BufferGeometry().setFromPoints(links);
    paths.forEach((path) => {
      const from = nodes.get(path.from).position.clone().setY(.18);
      const to = nodes.get(path.to).position.clone().setY(.18);
      const mid = from.clone().lerp(to, .5).setY(.28);
      mid.z += path.bend;
      path.curve = new THREE.QuadraticBezierCurve3(from, mid, to);
      path.line.geometry.dispose();
      path.line.geometry = new THREE.TubeGeometry(path.curve, 64, .018, 6, false);
    });
    labelsDirty = true;
  }
  function updateSelection() {
    nodes.forEach((node, id) => { node.getObjectByName("selection").visible = editing && id === selected; });
    canvas.dataset.editing = String(editing); labelsDirty = true;
  }
  function resize() {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (width < 2 || height < 2) return;
    if (width !== lastWidth || height !== lastHeight) {
      renderer.setSize(width, height, false);
      lastWidth = width; lastHeight = height; labelsDirty = true;
    }
    const aspect = width / height;
    const vertical = aspect < 1 ? 5.15 / aspect : 4.8;
    camera.left = -vertical * aspect; camera.right = vertical * aspect;
    camera.top = vertical; camera.bottom = -vertical; camera.zoom = zoom; camera.updateProjectionMatrix();
  }
  function updateLabels() {
    const positions = {};
    nodes.forEach((node, id) => {
      const point = node.position.clone().setY(.05).project(camera);
      positions[id] = { ...node.userData, x: (point.x * .5 + .5) * lastWidth, y: (-point.y * .5 + .5) * lastHeight, visible: true, selected: editing && id === selected, placement: "below" };
    });
    onLabels?.(positions); labelsDirty = false;
  }
  function applyFlow() {
    const values = previewFlow || liveFlow;
    const maximum = Math.max(1, ...CHANNELS.map(({ id }) => values[id] || 0));
    paths.forEach((path) => {
      path.power = Math.max(0, values[path.id] || 0);
      path.line.material.opacity = path.power > .05 ? .22 + .65 * path.power / maximum : .06;
      path.line.material.color.set(previewFlow ? 0xf0c58b : path.color);
      path.particles.forEach((particle) => { particle.visible = path.power > .05; });
    });
  }
  function applyEnergyState(state = {}) {
    liveFlow = state.flows || fallbackFlows(state);
    previewFlow = state.previewFlows || null;
    const metrics = {
      grid: [state.gridImport || "— kW", "电网补充"],
      solar: [state.generation || "— kW", "本地发电"],
      storage: [state.storage || "SOC —", state.storageFlow || "待机"],
      load: [state.load || "— kW", "当前需求"],
    };
    for (const [id, [metric, note]] of Object.entries(metrics)) {
      const node = nodes.get(id);
      node.userData.metric = state.noData ? (id === "storage" ? "SOC —" : "— kW") : metric;
      node.userData.note = state.noData ? "未载入数据" : note;
    }
    const fill = nodes.get("storage").getObjectByName("socFill");
    const ratio = state.noData ? 0 : THREE.MathUtils.clamp(Number(state.socPercent ?? numeric(state.storage)) / 100, 0, 1);
    fill.scale.y = Math.max(.025, ratio * .85); fill.position.y = .22 + fill.scale.y / 2;
    applyFlow(); labelsDirty = true;
  }
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  function updateRay(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
  }
  function pointOnFloor(event) {
    updateRay(event);
    return raycaster.ray.intersectPlane(plane, new THREE.Vector3());
  }
  const down = (event) => {
    updateRay(event);
    if (editing) {
      let hit = raycaster.intersectObjects([...nodes.values()], true)[0]?.object;
      while (hit && !hit.userData.id) hit = hit.parent;
      if (!hit) { selected = ""; updateSelection(); return; }
      selected = hit.userData.id;
      const point = pointOnFloor(event);
      if (point) drag = { node: hit, offset: hit.position.clone().sub(point) };
    } else drag = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture?.(event.pointerId); updateSelection();
  };
  const move = (event) => {
    if (!drag) return;
    if (drag.node) {
      const point = pointOnFloor(event);
      if (!point) return;
      const next = point.add(drag.offset);
      drag.node.position.set(THREE.MathUtils.clamp(next.x, -4.8, 4.8), 0, THREE.MathUtils.clamp(next.z, -3.8, 3.8));
      syncGeometry();
    } else {
      const dx = (event.clientX - drag.x) * .012 / zoom, dz = (event.clientY - drag.y) * .018 / zoom;
      target.x -= dx; target.z -= dz; camera.position.x -= dx; camera.position.z -= dz; camera.lookAt(target);
      drag.x = event.clientX; drag.y = event.clientY; labelsDirty = true;
    }
  };
  const up = () => { drag = null; };
  const wheel = (event) => {
    event.preventDefault(); zoom = THREE.MathUtils.clamp(zoom * (event.deltaY > 0 ? .93 : 1.07), .65, 2.4); resize(); labelsDirty = true;
  };
  canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("wheel", wheel, { passive: false });
  let nextId = NODES.length;
  function addModule(type) {
    const kind = type === "datacenter" ? "load" : type === "generation" ? "solar" : type;
    const template = NODES.find((node) => node.kind === kind) || NODES[4];
    const id = "asset-" + ++nextId, angle = nextId * 1.1;
    const node = makeNode({ ...template, id, x: Math.cos(angle) * 4.4, z: Math.sin(angle) * 3.5, title: template.title + " · 新增", device: "未绑定数据" });
    node.userData.metric = "示意资产"; node.userData.note = "仅调整视图";
    nodes.set(id, node); scene.add(node); selected = id; syncGeometry(); updateSelection();
  }
  function releaseNode(node) {
    node.traverse((item) => { item.geometry?.dispose(); if (item.material) item.material.dispose(); });
  }
  function deleteSelected() {
    if (["grid", "solar", "storage", "load"].includes(selected)) return;
    const node = nodes.get(selected);
    if (!node) return;
    scene.remove(node); nodes.delete(selected); releaseNode(node); selected = "load"; syncGeometry(); updateSelection();
  }
  function reset() {
    NODES.forEach((definition) => nodes.get(definition.id)?.position.set(definition.x, 0, definition.z));
    target.set(0, 0, .25); camera.position.set(0, 8.5, 9.2); camera.lookAt(target); zoom = 1; syncGeometry(); resize();
  }
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (document.hidden || canvas.clientWidth < 2 || canvas.clientHeight < 2) return;
    resize();
    if (labelsDirty) updateLabels();
    paths.forEach((path) => {
      if (!path.power || !path.curve) return;
      path.particles.forEach((particle, index) => {
        const progress = (reduceMotion.matches ? 0 : now * .00006 * (1 + Math.min(path.power / 20, 2))) + index / path.particles.length;
        particle.position.copy(path.curve.getPoint(progress % 1));
      });
    });
    renderer.render(scene, camera);
  }
  function destroy() {
    running = false;
    canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move);
    canvas.removeEventListener("pointerup", up); canvas.removeEventListener("pointercancel", up);
    canvas.removeEventListener("wheel", wheel);
    scene.traverse((item) => { item.geometry?.dispose(); item.material?.dispose(); });
    renderer.dispose();
  }
  syncGeometry(); applyEnergyState({ noData: true }); updateSelection(); requestAnimationFrame(frame);
  return {
    resize, reset, destroy, addModule, deleteSelected, applyEnergyState,
    setEditMode(active) { editing = Boolean(active); drag = null; updateSelection(); },
    previewEnergyState(state = {}) { previewFlow = state.flows || fallbackFlows(state); applyFlow(); },
    adoptPreview() { if (previewFlow) { liveFlow = { ...previewFlow }; previewFlow = null; applyFlow(); } },
  };
}
