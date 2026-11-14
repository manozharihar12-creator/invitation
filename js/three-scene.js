// Three.js cinematic 3D - golden dust + god-rays + bride & groom cutouts only
import * as THREE from "three";

const canvas = document.getElementById("three-overlay");
if (!canvas) {
  console.warn("[three] #three-overlay not found");
} else {
  THREE.Cache.enabled = true;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x211f1a, 3.2, 9.5);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
  camera.position.set(0, 0.2, 4.8);

  function resize() {
    const r = canvas.parentElement?.getBoundingClientRect() || { width: innerWidth, height: innerHeight };
    const w = r.width || innerWidth;
    const h = r.height || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  // ---- layer 1: golden dust ----
  const C1 = 180;
  const g1 = new THREE.BufferGeometry();
  const p1 = new Float32Array(C1 * 3);
  const s1 = new Float32Array(C1);
  for (let i = 0; i < C1; i++) {
    p1[i * 3] = (Math.random() - 0.5) * 10;
    p1[i * 3 + 1] = (Math.random() - 0.5) * 7;
    p1[i * 3 + 2] = (Math.random() - 0.5) * 5 - 1;
    s1[i] = Math.random();
  }
  g1.setAttribute("position", new THREE.BufferAttribute(p1, 3));
  const m1 = new THREE.PointsMaterial({
    color: 0xd0b07a, size: 0.045, sizeAttenuation: true,
    transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const pts1 = new THREE.Points(g1, m1);
  scene.add(pts1);

  // ---- layer 2: bokeh ----
  const C2 = 40;
  const g2 = new THREE.BufferGeometry();
  const p2 = new Float32Array(C2 * 3);
  for (let i = 0; i < C2; i++) {
    p2[i * 3] = (Math.random() - 0.5) * 6;
    p2[i * 3 + 1] = (Math.random() - 0.5) * 4;
    p2[i * 3 + 2] = (Math.random() - 0.5) * 2;
  }
  g2.setAttribute("position", new THREE.BufferAttribute(p2, 3));
  const m2 = new THREE.PointsMaterial({
    color: 0xffdca8, size: 0.18, sizeAttenuation: true,
    transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const pts2 = new THREE.Points(g2, m2);
  scene.add(pts2);

  // ---- god-rays ----
  const coneG = new THREE.ConeGeometry(2.2, 9, 6, 1, true);
  coneG.translate(0, -3.5, 0);
  const mkCone = (x, rot) => {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffe0a3, transparent: true, opacity: 0.06,
      side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending
    });
    const o = new THREE.Mesh(coneG, mat);
    o.position.set(x, 3.5, -1.2);
    o.rotation.x = Math.PI;
    o.rotation.z = rot;
    return o;
  };
  const cones = [mkCone(-0.8, 0.15), mkCone(0.9, -0.12), mkCone(0, 0)];
  cones.forEach(c => scene.add(c));

  // ---- Bride & Groom cutouts — PNG only, no frame/glow ----
  const loader = new THREE.TextureLoader();

  function makeCharacter({ url, x, y, z, w, h, name }) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.visible = false;
    group.name = name;
    group.frustumCulled = false;

    const planeGeo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      alphaTest: 0.01
    });
    const mesh = new THREE.Mesh(planeGeo, mat);
    mesh.frustumCulled = false;
    group.add(mesh);

    group.userData = {
      mesh, mat,
      baseX: x, baseY: y, baseZ: z,
      w, h, loaded: false
    };

    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;

        const img = tex.image;
        if (img && img.width && img.height) {
          const aspect = img.width / img.height;
          const nh = h;
          const nw = nh * aspect;
          mesh.geometry.dispose();
          mesh.geometry = new THREE.PlaneGeometry(nw, nh);
          group.userData.w = nw;
        }

        mat.map = tex;
        mat.needsUpdate = true;
        group.userData.loaded = true;
        console.log(`[3D cutout] ${name} loaded ${img?.width}x${img?.height}`);
      },
      undefined,
      (err) => console.warn(`[3D cutout] ${name} failed`, url, err)
    );

    scene.add(group);
    return group;
  }

  function dims() {
    const mobile = innerWidth < 700;
    const h = mobile ? 1.7 : 2.1;
    const w = h * 0.72;
    return { mobile, h, w };
  }

  let { mobile: isMobile, h: charH, w: charW } = dims();

  const brideGroup = makeCharacter({
    url: "/assets/bride.png",
    x: isMobile ? -0.52 : -1.15,
    y: isMobile ? -0.2 : -0.02,
    z: 0.25,
    w: charW, h: charH,
    name: "bride"
  });

  const groomGroup = makeCharacter({
    url: "/assets/groom.png?v=2",
    x: isMobile ? 0.52 : 1.15,
    y: isMobile ? -0.3 : -0.02,
    z: 0.25,
    w: charW, h: charH,
    name: "groom"
  });

  brideGroup.rotation.y = 0.22;
  groomGroup.rotation.y = -0.22;

  window.addEventListener("resize", () => {
    const d = dims();
    isMobile = d.mobile;
    brideGroup.userData.baseX = isMobile ? -0.52 : -1.15;
    groomGroup.userData.baseX = isMobile ? 0.52 : 1.15;
  });

  let scrollT = 0;
  let activeIdx = 0;
  function readProgress() {
    const f = document.getElementById("progress-fill");
    const mt = f?.style.transform.match(/scaleX\(([^)]+)\)/);
    if (mt) scrollT = parseFloat(mt[1]) || 0;
    const numEl = document.getElementById("chapter-number");
    if (numEl) {
      const n = parseInt(numEl.textContent, 10);
      if (!isNaN(n)) activeIdx = n - 1;
    }
  }

  // --- tight window: only during own chapter, for a few seconds ---
  let _lastActive = 0;
  let _enterT = 0;
  function charOpacity(group, targetActive) {
    // only show during its exact chapter
    if (activeIdx !== targetActive) return 0;

    // Track when we entered this chapter to create a short few-sec window
    // Use performance.now() monotonic but we have scrollT; approximate with enter time
    const t = scrollT;
    // Bride (idx 1) spans roughly scrollT 0.14-0.31, Groom (idx 2) 0.31-0.53
    // Show from ~15% into the chapter to ~85% into it, with quick fade
    if (group.name === "bride") {
      // fade in over 2% scroll, fade out in last 20% of its window
      if (t < 0.16) return Math.max(0, (t - 0.13) / 0.03);
      if (t > 0.28) return Math.max(0, 1 - (t - 0.28) / 0.05);
      return 1;
    } else {
      // groom
      if (t < 0.33) return Math.max(0, (t - 0.30) / 0.03);
      if (t > 0.49) return Math.max(0, 1 - (t - 0.49) / 0.06);
      return 1;
    }
  }

  function animate(now) {
    requestAnimationFrame(animate);
    readProgress();
    const t = now * 0.0008;

    const a1 = g1.attributes.position;
    for (let i = 0; i < C1; i++) {
      const ix = i * 3;
      a1.array[ix + 1] += 0.0015 + s1[i] * 0.004 + scrollT * 0.004;
      a1.array[ix] += Math.sin(t + i * 0.7) * 0.0009;
      a1.array[ix + 2] += Math.cos(t * 0.5 + i) * 0.0004;
      if (a1.array[ix + 1] > 4) {
        a1.array[ix] = (Math.random() - 0.5) * 10;
        a1.array[ix + 1] = -3.8;
        a1.array[ix + 2] = (Math.random() - 0.5) * 5 - 1;
      }
    }
    a1.needsUpdate = true;

    const a2 = g2.attributes.position;
    for (let i = 0; i < C2; i++) {
      const ix = i * 3;
      a2.array[ix + 1] += 0.0008;
      if (a2.array[ix + 1] > 3) a2.array[ix + 1] = -3;
    }
    a2.needsUpdate = true;

    camera.position.x = Math.sin(scrollT * 1.8) * 0.48 + Math.sin(t * 0.3) * 0.07;
    camera.position.y = 0.2 + Math.cos(scrollT * 1.2) * 0.22 + Math.sin(t * 0.2) * 0.04;
    camera.position.z = 4.8 - scrollT * 0.85;
    camera.lookAt(Math.sin(scrollT * 1.5) * 0.18, scrollT * 0.1, -2);

    pts1.rotation.y = scrollT * 0.9;
    pts1.rotation.x = scrollT * 0.2;
    pts2.rotation.y = -scrollT * 0.4;
    m1.opacity = 0.20 + (0.5 - Math.abs(scrollT - 0.25)) * 0.62;
    m2.opacity = 0.10 + scrollT * 0.12;

    cones.forEach((c, i) => {
      c.rotation.y = scrollT * 1.8 + i * 0.6;
      c.material.opacity = 0.028 + scrollT * 0.062 + Math.sin(t + i) * 0.018;
    });

    for (const { g, idx } of [{ g: brideGroup, idx: 1 }, { g: groomGroup, idx: 2 }]) {
      if (!g.userData.loaded) continue;
      const op = charOpacity(g, idx);
      const ud = g.userData;

      if (op < 0.012) {
        if (g.visible) g.visible = false;
        continue;
      }
      if (!g.visible) g.visible = true;

      const bob = Math.sin(t * 0.85 + idx * 1.15) * 0.065;
      const sway = Math.sin(t * 0.55 + idx * 0.9) * 0.035;
      g.position.y = ud.baseY + bob;
      g.position.x = ud.baseX + sway;

      const activeBoost = activeIdx === idx ? 1.32 : 1.0;
      const targetScale = 0.80 + op * 0.42 * activeBoost;
      g.scale.x += (targetScale - g.scale.x) * 0.075;
      g.scale.y += (targetScale - g.scale.y) * 0.075;
      g.scale.z = g.scale.x;

      const targetRotY = (g.name === "bride" ? 0.22 : -0.22) + Math.sin(t * 0.32 + idx) * 0.07 + scrollT * 0.10;
      g.rotation.y += (targetRotY - g.rotation.y) * 0.055;
      g.rotation.x = 0.02 + Math.sin(t * 0.38 + idx * 0.7) * 0.025;

      const targetZ = ud.baseZ + (activeIdx === idx ? 0.50 : 0) + op * 0.12;
      g.position.z += (targetZ - g.position.z) * 0.07;

      ud.mat.opacity += (op - ud.mat.opacity) * 0.11;
    }

    renderer.render(scene, camera);
  }
  animate(0);

  const vc = document.getElementById("journey-video");
  if (vc) {
    new MutationObserver(() => {
      const fr = parseInt(vc.dataset.frame || "0", 10);
      if (fr > 2) {
        canvas.style.opacity = "1";
        canvas.style.transition = "opacity 1.2s ease";
      }
    }).observe(vc, { attributes: true, attributeFilter: ["data-frame"] });
  }

  window._chars = { bride: brideGroup, groom: groomGroup };
  console.log("[three] cutouts only — no frame");
}