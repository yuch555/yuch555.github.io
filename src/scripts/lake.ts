// ヒーローの水平線の下を、触ると波が立つ水面にする。
// 名前(h1)の各文字の位置を測り、水平線を軸に反転して 2D canvas に描き、
// それをテクスチャにして three.js のシェーダーで歪ませる。
import {
  CanvasTexture,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector4,
  WebGLRenderer,
} from 'three';

const MAX_RIPPLES = 8;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D uTex;
  uniform vec2 uRes;
  uniform float uTime;
  uniform vec4 uRip[${MAX_RIPPLES}]; // x, y, 開始時刻, 強さ
  varying vec2 vUv;

  void main() {
    vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uRes; // 左上原点の px 座標
    float depth = p.y / uRes.y;
    vec2 off = vec2(0.0);
    float ring = 0.0;

    // ふだんの揺れ: 水平線から離れるほど横に大きく揺れる
    off.x += sin(p.y * 0.09 + uTime * 1.6) * (0.6 + depth * 2.2);
    off.x += sin(p.y * 0.031 - uTime * 0.9 + p.x * 0.004) * (0.8 + depth * 3.0);

    for (int i = 0; i < ${MAX_RIPPLES}; i++) {
      vec4 r = uRip[i];
      if (r.w <= 0.0) continue;
      float age = uTime - r.z;
      if (age < 0.0) continue;
      vec2 dv = p - r.xy;
      float d = length(dv);
      float front = age * 190.0;
      float env = exp(-pow((d - front) / 38.0, 2.0)) * exp(-age * 0.85) * r.w;
      float h = sin((d - front) * 0.22) * env;
      off += normalize(dv + vec2(0.0001)) * h * 9.0;
      ring += abs(h);
    }

    vec2 uv = (p + off) / uRes;
    uv.y = 1.0 - uv.y;
    vec4 texel = texture2D(uTex, uv);
    float fade = 1.0 - smoothstep(0.0, 0.85, depth);
    float ta = texel.a * 0.22 * fade;
    float ra = clamp(ring * 0.3, 0.0, 0.5) * (1.0 - smoothstep(0.55, 1.0, depth));
    float alpha = ta + ra * (1.0 - ta);
    vec3 mizu = vec3(0.031, 0.439, 0.478);
    vec3 col = (texel.rgb * ta + mizu * ra * (1.0 - ta)) / max(alpha, 0.0001);
    gl_FragColor = vec4(col, alpha);
  }
`;

export function initLake(root: HTMLElement) {
  const canvas = root.querySelector('canvas');
  const name = document.querySelector<HTMLElement>('#top h1');
  const portrait = document.querySelector<HTMLImageElement>('#top [data-portrait]');
  if (!canvas || !name) return;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false });
  } catch {
    return; // WebGL が使えないときは、CSS の静止した影のまま
  }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const ripples = Array.from({ length: MAX_RIPPLES }, () => new Vector4(0, 0, 0, 0));
  const uniforms = {
    uTex: { value: null as CanvasTexture | null },
    uRes: { value: new Vector2(1, 1) },
    uTime: { value: 0 },
    uRip: { value: ripples },
  };
  const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthTest: false });
  scene.add(new Mesh(new PlaneGeometry(2, 2), material));

  const t0 = performance.now();
  const now = () => (performance.now() - t0) / 1000;
  let rippleIndex = 0;
  const addRipple = (x: number, y: number, strength: number) => {
    ripples[rippleIndex].set(x, y, now(), strength);
    rippleIndex = (rippleIndex + 1) % MAX_RIPPLES;
  };

  // 名前の各文字を、水平線(root の上端)を軸に反転して描く
  const buildTexture = (w: number, h: number) => {
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
    // 自画像も水平線を軸に反転して映す(足元が水平線に接している)
    if (portrait?.complete && portrait.naturalWidth) {
      const box = portrait.getBoundingClientRect();
      ctx.save();
      ctx.translate(box.left - rootRect.left, rootRect.top - box.bottom + box.height);
      ctx.scale(1, -1);
      ctx.drawImage(portrait, 0, 0, box.width, box.height);
      ctx.restore();
    }
    return new CanvasTexture(c);
  };

  const resize = () => {
    const w = root.clientWidth;
    const h = root.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w, h);
    const next = buildTexture(w, h);
    if (next) {
      uniforms.uTex.value?.dispose();
      uniforms.uTex.value = next;
    }
  };

  let live = false;
  let visible = true;
  let frame = 0;
  const tick = () => {
    frame = 0;
    if (!visible || document.hidden) return;
    uniforms.uTime.value = now();
    renderer.render(scene, camera);
    if (!live) {
      live = true;
      root.dataset.live = 'true';
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

  // 触ると波が立つ。なぞると小さな波、クリック・タップで大きな波。
  let lastMove = 0;
  let lastX = -999;
  let lastY = -999;
  const local = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };
  canvas.addEventListener('pointermove', (e) => {
    const [x, y] = local(e);
    const t = performance.now();
    if (t - lastMove < 110 || Math.hypot(x - lastX, y - lastY) < 24) return;
    lastMove = t;
    lastX = x;
    lastY = y;
    addRipple(x, y, 0.35);
  });
  canvas.addEventListener('pointerdown', (e) => {
    const [x, y] = local(e);
    addRipple(x, y, 1);
  });

  const start = () => {
    resize();
    // 名前が現れ終わったところに、ひと粒の雫を落とす
    const nameRect = name.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    window.setTimeout(() => addRipple(nameRect.left + nameRect.width / 2 - rootRect.left, 6, 1.2), 400);
    kick();
  };

  // フォントと画像がそろってから、テクスチャを作る
  const ready = [
    document.fonts?.load('800 64px "Shippori Mincho B1"', 'Yuta Yamane'),
    portrait?.decode(),
  ].map((p) => Promise.resolve(p).catch(() => undefined));
  Promise.all(ready).then(start);
}
