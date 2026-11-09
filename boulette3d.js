/* =========================================================
   COCOON · La boulette en 3D (three.js)
   Boule procédurale : base au miel + flocons d'avoine,
   éclats de cacahuète et petites graines.
   Si WebGL n'est pas dispo, la photo reste affichée.
   ========================================================= */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const wrap = document.getElementById('ball');
const canvas = document.getElementById('ball-canvas');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmall = matchMedia('(max-width: 700px)').matches;

/* ---------- Aléatoire reproductible + bruit ---------- */
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(2811);
const R = (a, b) => a + (b - a) * rand();

function hash3(x, y, z) {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return h - Math.floor(h);
}
function noise3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const L = (a, b, k) => a + (b - a) * k;
  const c = (dx, dy, dz) => hash3(ix + dx, iy + dy, iz + dz);
  return L(
    L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v),
    L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w);
}
function fbm(x, y, z) {
  let s = 0, a = .5, f = 1;
  for (let i = 0; i < 4; i++) { s += a * noise3(x * f, y * f, z * f); f *= 2.1; a *= .5; }
  return s; // ~0..1
}

/* Rayon de la boule selon la direction : légèrement bosselée, pas parfaite */
const SQUASH = .94;
function radiusAt(n) {
  return 1 + .07 * (fbm(n.x * 1.4 + 3, n.y * 1.4, n.z * 1.4) - .5) + .03 * (noise3(n.x * 5, n.y * 5, n.z * 5) - .5);
}
function surfacePoint(n, out) {
  out.copy(n).multiplyScalar(radiusAt(n));
  out.y *= SQUASH;
  return out;
}

/* Points répartis uniformément sur la sphère (spirale de Fibonacci + bruit) */
function spherePoints(count, jitter) {
  const pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i + .5) / count * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    const p = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r);
    p.x += R(-jitter, jitter); p.y += R(-jitter, jitter); p.z += R(-jitter, jitter);
    pts.push(p.normalize());
  }
  return pts;
}

/* ---------- Scène ---------- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) {
  console.warn('WebGL indisponible, on garde la photo.', e);
  wrap.classList.add('no-3d');
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;

const camera = new THREE.PerspectiveCamera(30, 1, .1, 50);
camera.position.set(0, 0, 6.1);

scene.add(new THREE.HemisphereLight(0xfff1d6, 0x2a1608, .35));
const key = new THREE.DirectionalLight(0xffe3bd, 2.1);
key.position.set(3, 4, 5);
scene.add(key);
const rim = new THREE.DirectionalLight(0xfab62d, 3.2);
rim.position.set(-4, 2, -4);
scene.add(rim);
const rim2 = new THREE.DirectionalLight(0xcc5803, 2.0);
rim2.position.set(4, -2, -3);
scene.add(rim2);

const ball = new THREE.Group();
const spinner = new THREE.Group(); // rotation utilisateur
spinner.add(ball);
scene.add(spinner);

const tmp = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);

/* ---- 1. Le cœur : pâte miel / beurre de cacahuète ---- */
{
  const geo = new THREE.SphereGeometry(1, isSmall ? 110 : 160, isSmall ? 80 : 120);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cLight = new THREE.Color('#a86f38'), cMid = new THREE.Color('#7a4a22'), cDark = new THREE.Color('#40240f');
  const c = new THREE.Color(), n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    n.fromBufferAttribute(pos, i).normalize();
    const r = radiusAt(n);
    surfacePoint(n, tmp);
    pos.setXYZ(i, tmp.x, tmp.y, tmp.z);
    const k = noise3(n.x * 7, n.y * 7, n.z * 7);
    c.copy(cMid).lerp(cLight, k * .8);
    c.lerp(cDark, Math.max(0, (1.0 - r) * 8)); // creux plus sombres
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: .5, metalness: 0,
    clearcoat: .35, clearcoatRoughness: .45, envMapIntensity: .6,
  });
  ball.add(new THREE.Mesh(geo, mat));
}

/* Place des morceaux à la surface, orientés selon la normale */
function scatter(mesh, points, opts) {
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion();
  const s = new THREE.Vector3(), axis = new THREE.Vector3(), p = new THREE.Vector3();
  const col = new THREE.Color();
  points.forEach((n, i) => {
    surfacePoint(n, p);
    p.addScaledVector(n, R(opts.lift[0], opts.lift[1]));
    q.setFromUnitVectors(up, n);                                   // à plat sur la surface
    q2.setFromAxisAngle(n, R(0, Math.PI * 2)); q.premultiply(q2);  // tourné autour de la normale
    axis.set(R(-1, 1), R(-1, 1), R(-1, 1)).cross(n).normalize();
    q2.setFromAxisAngle(axis, R(-opts.tilt, opts.tilt)); q.premultiply(q2); // un peu de travers
    const k = R(opts.size[0], opts.size[1]);
    s.set(k * R(.85, 1.15), k, k * R(.85, 1.15));
    m.compose(p, q, s);
    mesh.setMatrixAt(i, m);
    col.set(opts.colors[Math.floor(rand() * opts.colors.length)]).offsetHSL(0, 0, R(-.04, .04));
    mesh.setColorAt(i, col);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  ball.add(mesh);
}

/* ---- 2. Flocons d'avoine : disques plats, un peu bombés, bords irréguliers ---- */
{
  const geo = new THREE.SphereGeometry(1, 18, 8);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const a = Math.atan2(z, x);
    const edge = 1 + .06 * Math.sin(a * 3 + 1.3) + .03 * Math.sin(a * 7);
    x *= edge * 1.0; z *= edge * .72;
    y = y * .16 + .14 * (x * x * .6 + z * z * .3) - .05; // bombé
    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ roughness: .85, metalness: 0, envMapIntensity: .35 });
  const pts = spherePoints(isSmall ? 1300 : 1700, .03);
  const mesh = new THREE.InstancedMesh(geo, mat, pts.length);
  scatter(mesh, pts, {
    size: [.06, .125], lift: [-.025, .012], tilt: .38,
    colors: ['#cfb07a', '#c19c62', '#dcc08e', '#b08648', '#a98a5c', '#d4b886', '#9c7440'],
  });
}

/* ---- 3. Éclats de cacahuète ---- */
{
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    tmp.fromBufferAttribute(pos, i);
    const k = .75 + hash3(tmp.x * 3.1, tmp.y * 3.1, tmp.z * 3.1) * .5;
    pos.setXYZ(i, tmp.x * k, tmp.y * k * .7, tmp.z * k);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ roughness: .75, metalness: 0, envMapIntensity: .3 });
  const pts = spherePoints(isSmall ? 70 : 90, .25);
  const mesh = new THREE.InstancedMesh(geo, mat, pts.length);
  scatter(mesh, pts, {
    size: [.055, .09], lift: [-.01, .02], tilt: 1.2,
    colors: ['#e3b97f', '#d6a25f', '#ebc995', '#c48a4b'],
  });
}

/* ---- 4. Petites graines sombres ---- */
{
  const geo = new THREE.SphereGeometry(1, 8, 6);
  geo.scale(1, .5, .62);
  const mat = new THREE.MeshStandardMaterial({ roughness: .4, metalness: 0, envMapIntensity: .8 });
  const pts = spherePoints(isSmall ? 220 : 300, .3);
  const mesh = new THREE.InstancedMesh(geo, mat, pts.length);
  scatter(mesh, pts, {
    size: [.016, .026], lift: [.02, .06], tilt: .8,
    colors: ['#2b1c12', '#3d2a1b', '#5b3e25', '#6e5236'],
  });
}

ball.rotation.set(.35, 0, -.15);

/* ---------- Taille ---------- */
function resize() {
  const { width, height } = canvas.getBoundingClientRect();
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas);
resize();

/* ---------- Interaction : glisser pour faire tourner (avec inertie) ---------- */
const AUTO = reduceMotion ? 0 : .35; // rad/s
let velY = AUTO, velX = 0, tiltX = 0;
let dragging = false, lastX = 0, lastY = 0, lastT = 0;

canvas.addEventListener('pointerdown', e => {
  dragging = true; lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
  canvas.setPointerCapture(e.pointerId);
  wrap.classList.add('was-touched');
});
canvas.addEventListener('pointermove', e => {
  if (!dragging) return;
  const now = performance.now(), dt = Math.max(1, now - lastT) / 1000;
  const dx = e.clientX - lastX, dy = e.clientY - lastY;
  spinner.rotation.y += dx * .012;
  tiltX = THREE.MathUtils.clamp(tiltX + dy * .008, -.8, .8);
  velY = dx * .012 / dt; velX = dy * .008 / dt;
  lastX = e.clientX; lastY = e.clientY; lastT = now;
});
const endDrag = () => { dragging = false; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

/* ---------- Boucle (seulement quand la boule est visible) ---------- */
let visible = true, running = false, last = performance.now();
const t0 = last;

function frame(now) {
  if (!visible || document.hidden) { running = false; return; }
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  const t = (now - t0) / 1000;

  if (!dragging) {
    velY += (AUTO - velY) * Math.min(1, dt * 1.6);   // retour doux vers la rotation auto
    velX *= Math.pow(.02, dt);
    spinner.rotation.y += velY * dt;
    tiltX = THREE.MathUtils.clamp(tiltX + velX * dt, -.8, .8);
    tiltX += (0 - tiltX) * Math.min(1, dt * .8);
  }
  spinner.rotation.x = tiltX;

  // Entrée : la boule « pop » au chargement, puis flotte
  const intro = Math.min(1, t / 1.1);
  const back = 1 + 2.2 * Math.pow(intro - 1, 3) + 1.2 * Math.pow(intro - 1, 2);
  const sc = reduceMotion ? 1 : .55 + .45 * back;
  spinner.scale.setScalar(sc);
  spinner.position.y = reduceMotion ? 0 : Math.sin(t * 1.4) * .05;

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
function start() {
  if (running) return;
  running = true; last = performance.now();
  requestAnimationFrame(frame);
}
new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }).observe(wrap);
document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });

renderer.render(scene, camera);
wrap.classList.add('is-3d');
start();
