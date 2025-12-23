# 🎸 Kanyo's World | 孤独摇滚与二进制的共鸣

<div align="center">

![Bocchi Status](https://img.shields.io/badge/Social%20Anxiety-100%25-ff69b4?style=for-the-badge&logo=github)
![Tech Stack](https://img.shields.io/badge/Tech-Vanilla%20JS-f7df1e?style=for-the-badge&logo=javascript)
![Vibe](https://img.shields.io/badge/Vibe-Cyberpunk%20x%20Moe-00ffff?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)


[ 在线演示 (Demo) ](https://kanyooooo.github.io/webhomework_kanyos-world/) · [ 报告 Bug ](https://github.com/Kanyooooo/webhomework_kanyos-world/issues)

</div>

---

## ⚡ 简介 (Introduction)

欢迎来到 **Kanyo's World**。这是一个由于过度沉迷 **CS:APP** 和 **《孤独摇滚！》** 而产生的数字幻觉。

这里没有臃肿的框架，没有复杂的构建工具，只有 **纯粹的数学**、**原生的 JavaScript** 和 **失真的吉他噪音**。这是一个试图用 Web 技术还原“波奇酱”内心世界的实验性项目。

> *"如果计算机底层原理是我的骨架，那么摇滚乐就是我的灵魂。"*

---

## ✨ 核心特性 (Super Cool Features)

### 🎸 1. 原生吉他合成器 (Web Audio Guitar Synth)
扔掉采样库！这里使用 **Web Audio API** 从零构建了一把电吉他。
- **物理建模**：使用 `OscillatorNode` 模拟琴弦振动。
- **电子管失真**：通过自定义 `WaveShaperNode` 曲线实现硬核失真效果。
- **包络控制**：ADSR (Attack, Decay, Sustain, Release) 完整实现。
- **代码即乐器**：每一个音符都是实时计算的波形。

### 🌀 2. 虚空滚动 (Infinite Void Scroll)
为了追求极致的平滑，我劫持了浏览器的原生滚动。
- **Lerp 插值**：实现了惯性滚动和平滑阻尼，手感如丝般顺滑。
- **视差特效**：元素根据深度不同以不同速度移动，创造伪 3D 空间感。
- **性能优化**：基于 `requestAnimationFrame` 的高帧率渲染。

### 🌸 3. 波奇粒子系统 (Bocchi Particle System)
- **动态加载**：随机生成的波奇酱贴图 (Hex 命名法 `0x00` - `0x12`)。
- **光标追踪**：鼠标移动会引发粒子的物理排斥效果（毕竟社恐）。

### 💻 4. 硬核底层致敬 (Systems Programming Tribute)
隐藏在可爱外表下的是一颗硬核的心。
- 致敬 **Linux Kernel**、**GDB**、**Binary Exploitation**。
- 页面设计融入了终端 (Terminal) 和 16 进制编辑器风格。

---

## 🛠️ 技术栈 (Tech Stack)

我们不生产代码，我们只是底层原理的搬运工。

| 模块 | 技术实现 | 备注 |
| :--- | :--- | :--- |
| **Core** | `Vanilla JavaScript (ES6+)` | 0 依赖，拒绝 `node_modules` 黑洞 |
| **Renderer** | `HTML5 Canvas 2D` | 手写粒子引擎和背景渲染 |
| **Audio** | `Web Audio API` | 纯代码生成音频信号流 |
| **Physics** | `Custom Physics Engine` | 手搓向量计算和碰撞检测 |
| **Style** | `CSS3 (Variables + Flex/Grid)` | 霓虹光效与响应式布局 |

---

## 🚀 快速开始 (Get Started)

不需要 `npm install`，不需要 `webpack`，甚至不需要服务器。

1.  **克隆仓库**
    ```bash
    git clone https://github.com/Kanyooooo/webhomework_kanyos-world.git
    ```

2.  **进入目录**
    ```bash
    cd webhomework_kanyos-world
    ```

3.  **启动！**
    - 直接用浏览器打开 `index.html`。
    - 或者使用 VS Code 的 `Live Server` 插件（推荐，为了避免本地文件跨域策略限制音频加载）。

---

## 📂 目录结构 (File Structure)

```text
.
├── index.html          # 主入口 (The Entry Point)
├── main.js             # 核心逻辑 (The Brain)
├── style.css           # 视觉样式 (The Skin)
├── assets/             # 资源库 (The Soul)
│   ├── bocchi/         # 19+ 张波奇酱神态包
│   └── music/          # 演示音频
├── TECHNICAL_IMPLEMENTATION.md # 技术圣经 (Deep Dive)
└── README.md           # 你正在读的这个文件
```

---

## 👨‍💻 作者 (Author)

**Kanyo**
- CS Student / System Enthusiast
- 喜欢 C 语言、Linux 内核和各种底层调试。
- 梦想是用汇编语言写一个 Web 框架（开玩笑的）。

---

<div align="center">

*"Rock 'n' Roll will never die, nor will the segmentation fault."*

Made with ❤️ and 🎸 by Kanyo

</div>
