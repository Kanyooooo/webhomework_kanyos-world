# 深度技术实现文档 (Technical Implementation Bible)

> *"Talk is cheap. Show me the code."* — Linus Torvalds

本文档详细阐述了 **Kanyo's World** 背后的核心算法与实现细节。本项目拒绝使用 Three.js、GSAP 或 React 等任何第三方库，旨在探索原生 Web 技术的极限。

---

## 1. 虚空滚动系统 (The Void Scroll System)

传统的浏览器滚动条过于生硬。我们实现了一个基于 **线性插值 (Lerp)** 的虚拟滚动系统，以获得物理般的阻尼感。

### 1.1 核心公式 (The Formula)

核心思想是分离 "当前位置" (`current`) 和 "目标位置" (`target`)。

```javascript
// Linear Interpolation
// a: current value, b: target value, n: friction coefficient (0.0 ~ 1.0)
function lerp(a, b, n) {
    return (1 - n) * a + n * b;
}
```

在每一帧 (`requestAnimationFrame`) 中：
1. 监听 `wheel` 事件，更新 `target`。
2. 计算 `current = lerp(current, target, 0.075)`。
3. 使用 CSS3 `transform: translate3d(0, -current, 0)` 移动容器。
4. **性能优化**：使用 `will-change: transform` 提示浏览器开启 GPU 加速层。

### 1.2 视差效应 (Parallax Effect)

为了创造深度感，不同层级的元素拥有不同的运动速度。
$$
Offset = ScrollPosition \times SpeedFactor
$$
- `SpeedFactor > 1`: 前景（移动更快）
- `SpeedFactor < 1`: 背景（移动更慢）

---

## 2. 原生吉他合成器 (Web Audio Guitar Synth)

这是一个基于 **物理建模 (Physical Modeling)** 思想的音频合成引擎。

### 2.1 信号链 (Signal Chain)

```text
[ VCO (振荡器) ] ---> [ VCA (包络控制) ] ---> [ WaveShaper (失真) ] ---> [ Master Gain ] ---> [ Destination ]
```

### 2.2 核心代码实现

#### 振荡器 (Oscillator)
模拟琴弦的物理振动。我们使用 `sawtooth` (锯齿波) 作为基波，因为它富含偶次谐波，音色明亮有力。

```javascript
const osc = ctx.createOscillator();
osc.type = 'sawtooth';
osc.frequency.value = 440; // A4 Note
```

#### 失真效果 (Distortion)
通过 **WaveShaperNode** 对波形进行非线性削波 (Clipping)，模拟电子管放大器的过载音色。

```javascript
function makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < n_samples; ++i) {
        const x = i * 2 / n_samples - 1;
        // Sigmoid 传递函数，模拟模拟电路的软削波特性
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
}
```

#### ADSR 包络 (Envelope)
模拟拨弦时的音量变化：
- **Attack**: 瞬间达到最大音量。
- **Decay**: 快速衰减到延音电平。
- **Release**: 松手后声音自然消散。

```javascript
const now = ctx.currentTime;
gainNode.gain.cancelScheduledValues(now);
gainNode.gain.setValueAtTime(0, now);
gainNode.gain.linearRampToValueAtTime(1, now + 0.01); // Attack
gainNode.gain.exponentialRampToValueAtTime(0.001, now + 2); // Release
```

---

## 3. 粒子与光标交互 (Particle & Cursor Interaction)

### 3.1 斥力场 (Repulsion Field)

为了模拟社恐属性，粒子会主动躲避鼠标。我们使用平方反比定律的变体来计算斥力。

$$
Force = \frac{G \cdot Mass}{Distance^2}
$$

在代码中：

```javascript
const dx = mouse.x - this.x;
const dy = mouse.y - this.y;
const distance = Math.sqrt(dx * dx + dy * dy);

if (distance < this.radius) {
    const angle = Math.atan2(dy, dx);
    const force = (this.radius - distance) / this.radius;
    
    // 斥力方向与鼠标方向相反
    const forceX = -Math.cos(angle) * force * this.density;
    const forceY = -Math.sin(angle) * force * this.density;
    
    this.x += forceX;
    this.y += forceY;
}
```

---

## 4. 资源加载与 Hex 命名法 (Asset Loading)

为了方便程序化加载素材，我们采用了十六进制命名规范。

- 文件名格式：`bocchi0x00XX.gif`
- 优势：可以直接通过循环生成文件名，无需维护资源列表数组。

```javascript
const hex = index.toString(16).toUpperCase().padStart(2, '0');
const path = `assets/bocchi/bocchi0x00${hex}.gif`;
```

---

## 5. 性能优化清单 (Optimization Checklist)

1.  **RAF Loop**: 所有动画逻辑统一在 `requestAnimationFrame` 中执行，避免 `setInterval` 带来的掉帧。
2.  **Layer Promotion**: 对滚动容器使用 `will-change: transform`，强制浏览器创建独立图层。
3.  **Canvas Prerendering**: 静态背景元素预渲染到离屏 Canvas，减少主循环重绘开销。
4.  **Audio Context Management**: 音频上下文仅在用户首次交互后创建 (Auto-play policy compliant)。

---

> *"Code is poetry written in mathematics."*
