/* ============================================
   BABBAGE TECH GLOBAL — 3D Globe (Three.js)
   ============================================ */

(function initGlobe() {
  const canvas = document.getElementById('globe-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // ── Scene Setup ──────────────────────────────
  const scene = new THREE.Scene();
  const W = canvas.parentElement.clientWidth || 520;
  const H = canvas.parentElement.clientHeight || 520;

  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
  camera.position.z = 2.6;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  // ── Earth Sphere ──────────────────────────────
  const geometry = new THREE.SphereGeometry(1, 64, 64);

  // Build earth texture procedurally using a canvas
  const texSize = 1024;
  const texCanvas = document.createElement('canvas');
  texCanvas.width = texSize;
  texCanvas.height = texSize / 2;
  const tCtx = texCanvas.getContext('2d');

  // Ocean base
  tCtx.fillStyle = '#050a1a';
  tCtx.fillRect(0, 0, texSize, texSize / 2);

  // Grid lines
  tCtx.strokeStyle = 'rgba(124,58,237,0.15)';
  tCtx.lineWidth = 0.5;
  for (let i = 0; i <= 12; i++) {
    const x = (i / 12) * texSize;
    tCtx.beginPath(); tCtx.moveTo(x, 0); tCtx.lineTo(x, texSize / 2); tCtx.stroke();
  }
  for (let i = 0; i <= 6; i++) {
    const y = (i / 6) * (texSize / 2);
    tCtx.beginPath(); tCtx.moveTo(0, y); tCtx.lineTo(texSize, y); tCtx.stroke();
  }

  // Continent-like shapes
  const continentColor = 'rgba(45,212,191,0.25)';
  const borderColor = 'rgba(45,212,191,0.5)';
  tCtx.fillStyle = continentColor;
  tCtx.strokeStyle = borderColor;
  tCtx.lineWidth = 1.2;

  function drawContinent(points) {
    tCtx.beginPath();
    tCtx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) tCtx.lineTo(points[i][0], points[i][1]);
    tCtx.closePath();
    tCtx.fill();
    tCtx.stroke();
  }

  // North America
  drawContinent([[140,60],[200,50],[230,80],[220,140],[190,170],[160,160],[130,130],[125,90]]);
  // South America
  drawContinent([[195,175],[230,170],[245,200],[240,260],[210,290],[185,265],[180,210]]);
  // Europe
  drawContinent([[430,55],[490,50],[510,80],[500,110],[460,120],[430,100],[420,75]]);
  // Africa
  drawContinent([[440,120],[510,115],[540,160],[535,230],[510,270],[470,275],[440,240],[425,180],[435,140]]);
  // Asia
  drawContinent([[510,55],[660,50],[720,80],[740,120],[700,160],[650,170],[580,160],[530,130],[505,90]]);
  // Australia
  drawContinent([[660,195],[720,185],[750,210],[745,245],[710,255],[675,240],[655,215]]);

  // City dots
  const cities = [
    [435, 200], [330, 95], [545, 90], [680, 95],
    [175, 130], [510, 80], [745, 215], [480, 170],
  ];
  cities.forEach(([x, y]) => {
    tCtx.beginPath();
    tCtx.arc(x, y, 3, 0, Math.PI * 2);
    tCtx.fillStyle = 'rgba(124,58,237,0.9)';
    tCtx.fill();
    // Pulse ring
    tCtx.beginPath();
    tCtx.arc(x, y, 7, 0, Math.PI * 2);
    tCtx.strokeStyle = 'rgba(124,58,237,0.4)';
    tCtx.lineWidth = 1;
    tCtx.stroke();
  });

  const texture = new THREE.CanvasTexture(texCanvas);

  const material = new THREE.MeshPhongMaterial({
    map: texture,
    transparent: true,
    opacity: 0.95,
    shininess: 30,
  });

  const globe = new THREE.Mesh(geometry, material);
  scene.add(globe);

  // ── Atmosphere / Glow ─────────────────────────
  const atmGeo = new THREE.SphereGeometry(1.08, 64, 64);
  const atmMat = new THREE.MeshPhongMaterial({
    color: 0x7C3AED,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.12,
  });
  scene.add(new THREE.Mesh(atmGeo, atmMat));

  // Teal outer glow
  const geoGlow = new THREE.SphereGeometry(1.18, 32, 32);
  const matGlow = new THREE.MeshPhongMaterial({
    color: 0x2DD4BF,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.04,
  });
  scene.add(new THREE.Mesh(geoGlow, matGlow));

  // ── Dot Field (Stars) ─────────────────────────
  const dotsCount = 400;
  const dotsGeo = new THREE.BufferGeometry();
  const dotsPositions = new Float32Array(dotsCount * 3);
  for (let i = 0; i < dotsCount; i++) {
    const r = 1.02;
    const lat = (Math.random() - 0.5) * Math.PI;
    const lon = Math.random() * 2 * Math.PI;
    dotsPositions[i * 3] = r * Math.cos(lat) * Math.cos(lon);
    dotsPositions[i * 3 + 1] = r * Math.sin(lat);
    dotsPositions[i * 3 + 2] = r * Math.cos(lat) * Math.sin(lon);
  }
  dotsGeo.setAttribute('position', new THREE.BufferAttribute(dotsPositions, 3));
  const dotsMat = new THREE.PointsMaterial({ color: 0x7C3AED, size: 0.006, transparent: true, opacity: 0.6 });
  scene.add(new THREE.Points(dotsGeo, dotsMat));

  // ── Orbiting Ring ─────────────────────────────
  const ringGeo = new THREE.TorusGeometry(1.4, 0.005, 8, 200);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x7C3AED, transparent: true, opacity: 0.4 });
  const orbitRing = new THREE.Mesh(ringGeo, ringMat);
  orbitRing.rotation.x = Math.PI * 0.3;
  scene.add(orbitRing);

  const ring2Geo = new THREE.TorusGeometry(1.6, 0.003, 8, 200);
  const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x2DD4BF, transparent: true, opacity: 0.2 });
  const orbit2 = new THREE.Mesh(ring2Geo, ring2Mat);
  orbit2.rotation.x = Math.PI * 0.15;
  orbit2.rotation.z = Math.PI * 0.2;
  scene.add(orbit2);

  // ── Orbiting Satellite Dot ─────────────────────
  const satGeo = new THREE.SphereGeometry(0.025, 8, 8);
  const satMat = new THREE.MeshBasicMaterial({ color: 0x7C3AED });
  const satellite = new THREE.Mesh(satGeo, satMat);
  scene.add(satellite);

  // ── Lighting ──────────────────────────────────
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
  sunLight.position.set(5, 3, 5);
  scene.add(sunLight);

  const purpleLight = new THREE.PointLight(0x7C3AED, 1.5, 6);
  purpleLight.position.set(-3, 0, 2);
  scene.add(purpleLight);

  const tealLight = new THREE.PointLight(0x2DD4BF, 0.8, 6);
  tealLight.position.set(3, -2, -1);
  scene.add(tealLight);

  // ── Mouse Interaction ─────────────────────────
  let targetRotX = 0;
  let targetRotY = 0;
  let currentRotX = 0;
  let currentRotY = 0;
  let mouseOver = false;

  const globeContainer = document.getElementById('globe-container');
  if (globeContainer) {
    globeContainer.addEventListener('mousemove', (e) => {
      const rect = globeContainer.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotX = y * 0.5;
      targetRotY = x * 1.0;
      mouseOver = true;
    });
    globeContainer.addEventListener('mouseleave', () => {
      mouseOver = false;
    });
  }

  // ── Animation Loop ────────────────────────────
  let time = 0;
  let autoRotateY = 0;

  function animate() {
    requestAnimationFrame(animate);
    time += 0.01;
    autoRotateY += 0.0018;

    if (mouseOver) {
      currentRotX += (targetRotX - currentRotX) * 0.05;
      currentRotY += (targetRotY - currentRotY) * 0.05;
      globe.rotation.x = currentRotX;
      globe.rotation.y = autoRotateY + currentRotY;
    } else {
      currentRotX *= 0.95;
      currentRotY *= 0.95;
      globe.rotation.x = currentRotX;
      globe.rotation.y = autoRotateY;
    }

    // Orbit rings
    orbitRing.rotation.z = time * 0.2;
    orbit2.rotation.z = -time * 0.12;

    // Satellite orbit
    const satAngle = time * 0.8;
    satellite.position.set(
      1.4 * Math.cos(satAngle),
      0.6 * Math.sin(satAngle),
      1.4 * Math.sin(satAngle * 0.7)
    );

    // Pulsing lights
    purpleLight.intensity = 1.2 + 0.5 * Math.sin(time * 1.5);
    tealLight.intensity = 0.6 + 0.4 * Math.sin(time * 2.0);

    renderer.render(scene, camera);
  }
  animate();

  // ── Resize ────────────────────────────────────
  window.addEventListener('resize', () => {
    const c = canvas.parentElement;
    if (!c) return;
    const nW = c.clientWidth;
    const nH = c.clientHeight;
    camera.aspect = nW / nH;
    camera.updateProjectionMatrix();
    renderer.setSize(nW, nH);
  });
})();
