// ヒーローの水平線の下を、自画像と名前が映る水面にする。
// 自画像に触れる(または水面に触れる)と、自画像が跳ね、映り込みも一緒に跳ねる。
// 名前は各文字の位置を測って 2D canvas に描き、three.js のシェーダーで揺らす。
// 自画像の映り込みは、画像そのものを別のテクスチャにして、跳ね具合を uniform で渡す。
import {
  CanvasTexture,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Texture,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
} from 'three';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D uName;
  uniform sampler2D uPortrait;
  uniform vec2 uRes;
  uniform float uTime;
  uniform float uImpact;   // 着地の揺れ(1 から減っていく)
  uniform vec4 uPort;      // 自画像の x, 幅, 高さ, 未使用(px)
  uniform vec3 uJump;      // 持ち上がり(px), 縦の伸び縮み, 横の伸び縮み
  varying vec2 vUv;

  void main() {
    vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uRes; // 左上原点の px 座標。y=0 が水平線
    float depth = p.y / uRes.y;

    // 水面の揺れ: 水平線から離れるほど横に大きく揺れる。着地の直後は強くなる。
    float amp = 1.0 + uImpact * 2.6;
    vec2 off = vec2(0.0);
    off.x += sin(p.y * 0.09 + uTime * 1.6) * (0.6 + depth * 2.2) * amp;
    off.x += sin(p.y * 0.031 - uTime * 0.9 + p.x * 0.004) * (0.8 + depth * 3.0) * amp;
    vec2 q = p + off;

    // 名前の映り込み
    vec2 nuv = vec2(q.x / uRes.x, 1.0 - q.y / uRes.y);
    vec4 name = texture2D(uName, nuv);

    // 自画像の映り込み: 実物が持ち上がるほど、影は水面の下へ離れる
    float cx = uPort.x + uPort.y * 0.5;
    float qx = cx + (q.x - cx) / uJump.z;
    float qy = (q.y - uJump.x) / uJump.y;
    vec2 puv = vec2((qx - uPort.x) / uPort.y, qy / uPort.z);
    float inside = step(0.0, puv.x) * step(puv.x, 1.0) * step(0.0, puv.y) * step(puv.y, 1.0);
    vec4 portrait = texture2D(uPortrait, clamp(puv, 0.0, 1.0));

    float fade = 1.0 - smoothstep(0.0, 0.85, depth);
    float an = name.a * 0.22 * fade;
    float ap = portrait.a * inside * 0.22 * fade;
    float alpha = an + ap * (1.0 - an);
    vec3 col = (name.rgb * an + portrait.rgb * ap * (1.0 - an)) / max(alpha, 0.0001);
    gl_FragColor = vec4(col, alpha);
  }
`;

// 跳ねの動き: ためる → 跳ぶ → 着地で潰れて、ゆれながら戻る
const T_CROUCH = 0.1;
const T_AIR = 0.5;
const T_LAND = 0.45;
const T_TOTAL = T_CROUCH + T_AIR + T_LAND;

function pose(t: number, height: number) {
  if (t < T_CROUCH) {
    const k = Math.sin((t / T_CROUCH) * (Math.PI / 2));
    const sy = 1 - 0.1 * k;
    return { lift: 0, sy, sx: 1 / Math.sqrt(sy), landed: -1 };
  }
  if (t < T_CROUCH + T_AIR) {
    const u = (t - T_CROUCH) / T_AIR;
    const sy = 1 + 0.06 * Math.sin(u * Math.PI);
    return { lift: height * 4 * u * (1 - u), sy, sx: 1 / Math.sqrt(sy), landed: -1 };
  }
  const tau = t - T_CROUCH - T_AIR;
  const sy = 1 - 0.12 * Math.exp(-7 * tau) * Math.cos(tau * 24);
  return { lift: 0, sy, sx: 1 / Math.sqrt(sy), landed: tau };
}

export function initLake(root: HTMLElement) {
  const canvas = root.querySelector('canvas');
  const name = document.querySelector<HTMLElement>('#top h1');
  const portrait = document.querySelector<HTMLImageElement>('#top [data-portrait]');
  const hero = document.getElementById('top');
  if (!canvas || !name || !portrait || !hero) return;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false });
  } catch {
    return; // WebGL が使えないときは、CSS の静止した影のまま。自画像も動かさない
  }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const portraitTexture = new Texture(portrait);
  const uniforms = {
    uName: { value: null as CanvasTexture | null },
    uPortrait: { value: portraitTexture },
    uRes: { value: new Vector2(1, 1) },
    uTime: { value: 0 },
    uImpact: { value: 0 },
    uPort: { value: new Vector4(0, 1, 1, 0) },
    uJump: { value: new Vector3(0, 1, 1) },
  };
  const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthTest: false });
  scene.add(new Mesh(new PlaneGeometry(2, 2), material));

  const t0 = performance.now();
  const now = () => (performance.now() - t0) / 1000;

  // 名前の各文字を、水平線(root の上端)を軸に反転して描く
  const buildNameTexture = (w: number, h: number) => {
    const dpr = renderer.getPixelRatio();
    const c = document.createElement('canvas');
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.scale(dpr, dpr);
    const rootRect = root.getBoundingClientRect();
    const style = getComputedStyle(name);
    const fontSize = parseFloat(style.fontSize);
    ctx.font = `${style.fontWeight} ${fontSize}px "Shippori Mincho B1", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#17222d';

    const walker = document.createTreeWalker(name, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? '';
      for (let i = 0; i < text.length; i++) {
        if (!text[i].trim()) continue;
        const range = document.createRange();
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const box = range.getBoundingClientRect();
        const cx = box.left + box.width / 2 - rootRect.left;
        const cy = box.top + fontSize / 2; // 字間の詰めを除いた、字面の中心
        ctx.save();
        ctx.translate(cx, rootRect.top - cy);
        ctx.scale(1, -1);
        ctx.fillText(text[i], 0, 0);
        ctx.restore();
      }
    }
    return new CanvasTexture(c);
  };

  let jumpStart = -1; // 跳ねていないときは -1
  let jumpHeight = 40;
  let landedAt = -1;

  const resize = () => {
    const w = root.clientWidth;
    const h = root.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w, h);
    const next = buildNameTexture(w, h);
    if (next) {
      uniforms.uName.value?.dispose();
      uniforms.uName.value = next;
    }
    // 自画像の位置と大きさ(跳ねている最中は変形しているので、そのときは測り直さない)
    if (jumpStart < 0) {
      const box = portrait.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      uniforms.uPort.value.set(box.left - rootRect.left, box.width, box.height, 0);
      jumpHeight = Math.min(box.height * 0.14, 72);
    }
  };

  const jump = () => {
    if (jumpStart >= 0 && now() - jumpStart < T_CROUCH + T_AIR) return; // 空中では受け付けない
    jumpStart = now();
    landedAt = -1;
  };

  let live = false;
  let visible = true;
  let frame = 0;
  const tick = () => {
    frame = 0;
    if (!visible || document.hidden) return;
    const t = now();
    uniforms.uTime.value = t;

    let lift = 0;
    let sy = 1;
    let sx = 1;
    if (jumpStart >= 0) {
      const elapsed = t - jumpStart;
      if (elapsed >= T_TOTAL) {
        jumpStart = -1;
        portrait.style.transform = '';
      } else {
        const p = pose(elapsed, jumpHeight);
        lift = p.lift;
        sy = p.sy;
        sx = p.sx;
        if (p.landed >= 0 && landedAt < 0) landedAt = t;
        portrait.style.transform = `translateY(${-lift}px) scale(${sx}, ${sy})`;
      }
    }
    uniforms.uJump.value.set(lift, sy, sx);
    uniforms.uImpact.value = landedAt >= 0 ? Math.exp(-2.6 * (t - landedAt)) : 0;

    renderer.render(scene, camera);
    if (!live) {
      live = true;
      root.dataset.live = 'true';
      hero.dataset.lakeLive = 'true';
    }
    frame = requestAnimationFrame(tick);
  };
  const kick = () => {
    if (!frame) frame = requestAnimationFrame(tick);
  };

  let resizeTimer = 0;
  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 150);
  }).observe(root);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) kick();
  }).observe(root);
  document.addEventListener('visibilitychange', kick);

  // 触れる場所: 水面と自画像。キーボードでも跳ねさせられるようにする。
  canvas.addEventListener('pointerdown', jump);
  portrait.addEventListener('pointerdown', jump);
  portrait.setAttribute('role', 'button');
  portrait.setAttribute('tabindex', '0');
  portrait.setAttribute('aria-label', '山根のイラストを跳ねさせる');
  portrait.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      jump();
    }
  });

  const start = () => {
    resize();
    portraitTexture.needsUpdate = true;
    kick();
    // 名前が現れ終わるころ、ひとりでに1回跳ねて、触れることを知らせる
    window.setTimeout(jump, 600);
  };

  // フォントと画像がそろってから、テクスチャを作る
  const ready = [
    document.fonts?.load('800 64px "Shippori Mincho B1"', 'Yuta Yamane'),
    portrait.decode(),
  ].map((p) => Promise.resolve(p).catch(() => undefined));
  Promise.all(ready).then(start);
}
