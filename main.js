const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

let lenis;

function splitText() {
    qsa('[data-split]').forEach((el) => {
        if (el.dataset.splitted === 'true') return;

        const fragment = document.createDocumentFragment();

        el.childNodes.forEach((node) => {
            if (node.nodeName === 'BR') {
                fragment.appendChild(document.createElement('br'));
                return;
            }

            if (node.nodeType !== Node.TEXT_NODE) {
                fragment.appendChild(node.cloneNode(true));
                return;
            }

            [...node.textContent].forEach((char) => {
                const span = document.createElement('span');
                span.className = 'char';
                span.textContent = char === ' ' ? '\u00a0' : char;
                fragment.appendChild(span);
            });
        });

        el.replaceChildren(fragment);
        el.dataset.splitted = 'true';
    });
}

function initSmoothScroll() {
    if (prefersReducedMotion || isTouch || !window.Lenis) return;

    lenis = new Lenis({
        duration: 1.28,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 0.72,
        touchMultiplier: 1.12,
        overscroll: false
    });

    lenis.on('scroll', () => {
        if (window.ScrollTrigger) ScrollTrigger.update();
    });

    if (window.gsap) {
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
        return;
    }

    const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
}

function initAnchors() {
    qsa('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            const target = qs(link.getAttribute('href'));
            if (!target) return;

            event.preventDefault();
            if (lenis) {
                const headerOffset = -(qs('.topbar')?.offsetHeight || 0);
                lenis.scrollTo(target, { duration: 1.05, offset: headerOffset });
            } else {
                target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
            }
        });
    });
}

function initMotion() {
    if (!window.gsap || !window.ScrollTrigger) return;

    gsap.registerPlugin(ScrollTrigger);
    gsap.config({ nullTargetWarn: false });

    gsap.to('.progress', {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
            trigger: document.documentElement,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.2
        }
    });

    initAdventure();

    if (prefersReducedMotion) {
        gsap.set('.char, .terminal-lines p, .hero-actions, .pixel-cluster i, .right-menu', {
            clearProps: 'all',
            opacity: 1
        });
        return;
    }

    const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    heroTl
        .from('.terminal-lines p', {
            x: -18,
            opacity: 0,
            duration: 0.58,
            stagger: 0.12
        })
        .from('.tiny-flag', {
            opacity: 0,
            duration: 0.72
        }, 0.08)
        .from('.pixel-title .char', {
            yPercent: 110,
            opacity: 0,
            duration: 0.86,
            stagger: { each: 0.014, from: 'random' }
        }, 0.16)
        .from('.hero-actions', {
            y: 22,
            opacity: 0,
            duration: 0.62
        }, 0.55)
        .from('.right-menu a', {
            x: 16,
            opacity: 0,
            duration: 0.48,
            stagger: 0.06
        }, 0.62)
        .from('.pixel-cluster i', {
            scale: 0,
            opacity: 0,
            transformOrigin: '50% 50%',
            duration: 0.34,
            stagger: { each: 0.035, from: 'random' }
        }, 0.3);

    gsap.to('.pixel-title', {
        '--depth-y': '-78px',
        scale: 0.92,
        ease: 'none',
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 0.8
        }
    });

    gsap.to('.cluster-a', {
        '--float-y': '-92px',
        '--float-x': '-24px',
        ease: 'none',
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1
        }
    });

    gsap.to('.cluster-b', {
        '--float-y': '104px',
        '--float-x': '18px',
        ease: 'none',
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1
        }
    });

    gsap.to('.vertical-label', {
        yPercent: -18,
        ease: 'none',
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1.2
        }
    });

    qsa('.statement [data-split], .game-head [data-split], .adventure-head [data-split], .links [data-split]').forEach((el) => {
        gsap.from(el.querySelectorAll('.char'), {
            yPercent: 80,
            opacity: 0.08,
            duration: 0.7,
            stagger: 0.006,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: el,
                start: 'top 78%',
                end: 'top 36%',
                scrub: 0.55
            }
        });
    });

    gsap.from('.lab-frame, .challenge-board', {
        y: 70,
        opacity: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: 'power3.out',
        immediateRender: false,
        scrollTrigger: {
            trigger: '.lab',
            start: 'top 72%',
            once: true
        }
    });

    gsap.from('.game-shell', {
        y: 70,
        opacity: 0,
        duration: 0.82,
        ease: 'power3.out',
        immediateRender: false,
        scrollTrigger: {
            trigger: '.game-zone',
            start: 'top 70%',
            once: true
        }
    });
}

function initAdventure() {
    const section = qs('.adventure');
    const sticky = qs('.adventure-sticky');
    const track = qs('.adventure-track');
    const stages = qsa('.stage');
    const mapDots = qsa('.map-dot');
    if (!section || !sticky || !track || !stages.length || !window.gsap || !window.ScrollTrigger) return;

    const setScene = (index) => {
        const clamped = Math.max(0, Math.min(stages.length - 1, index));
        section.dataset.scene = stages[clamped].dataset.scene || 'bin';
        mapDots.forEach((dot, dotIndex) => {
            dot.classList.toggle('is-active', dotIndex === clamped);
        });
    };

    setScene(0);

    if (window.innerWidth <= 900) {
        stages.forEach((stage, index) => {
            ScrollTrigger.create({
                trigger: stage,
                start: 'top 48%',
                end: 'bottom 48%',
                onEnter: () => setScene(index),
                onEnterBack: () => setScene(index)
            });
        });
        return;
    }

    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

    gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => `+=${distance()}`,
            scrub: 0.75,
            pin: sticky,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
                setScene(Math.round(self.progress * (stages.length - 1)));
            }
        }
    });
}

function initPointerDepth() {
    const hero = qs('.hero');
    if (!hero || prefersReducedMotion || !window.gsap || isTouch) return;

    const setFrameX = gsap.quickTo(hero, '--cursor-frame-x', { duration: 0.7, ease: 'power3.out' });
    const setFrameY = gsap.quickTo(hero, '--cursor-frame-y', { duration: 0.7, ease: 'power3.out' });
    const setTitleX = gsap.quickTo(hero, '--cursor-title-x', { duration: 0.7, ease: 'power3.out' });
    const setTitleY = gsap.quickTo(hero, '--cursor-title-y', { duration: 0.7, ease: 'power3.out' });
    const setBgX = gsap.quickTo(hero, '--cursor-bg-x', { duration: 0.7, ease: 'power3.out' });
    const setBgY = gsap.quickTo(hero, '--cursor-bg-y', { duration: 0.7, ease: 'power3.out' });

    hero.addEventListener('pointermove', (event) => {
        const rect = hero.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 28;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 22;
        setFrameX(`${x.toFixed(2)}px`);
        setFrameY(`${y.toFixed(2)}px`);
        setTitleX(`${(-x * 0.5).toFixed(2)}px`);
        setTitleY(`${(-y * 0.5).toFixed(2)}px`);
        setBgX(`${(-x * 0.45).toFixed(2)}px`);
        setBgY(`${(-y * 0.45).toFixed(2)}px`);
    });
}

function initDraggableBits() {
    const targets = qsa('.pixel-cluster');
    if (!targets.length || isTouch) return;

    targets.forEach((target) => {
        let startX = 0;
        let startY = 0;
        let baseX = Number(target.dataset.dragX || 0);
        let baseY = Number(target.dataset.dragY || 0);

        target.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            target.setPointerCapture(event.pointerId);
            target.classList.add('is-dragging');
            startX = event.clientX;
            startY = event.clientY;
            baseX = Number(target.dataset.dragX || 0);
            baseY = Number(target.dataset.dragY || 0);
        });

        target.addEventListener('pointermove', (event) => {
            if (!target.classList.contains('is-dragging')) return;

            const nextX = baseX + event.clientX - startX;
            const nextY = baseY + event.clientY - startY;
            target.dataset.dragX = String(nextX);
            target.dataset.dragY = String(nextY);
            target.style.setProperty('--drag-x', `${nextX}px`);
            target.style.setProperty('--drag-y', `${nextY}px`);
        });

        const stopDrag = () => target.classList.remove('is-dragging');
        target.addEventListener('pointerup', stopDrag);
        target.addEventListener('pointercancel', stopDrag);
    });
}

function setCardPosition(target, x, y) {
    target.dataset.cardX = String(x);
    target.dataset.cardY = String(y);
    target.style.setProperty('--card-x', `${x}px`);
    target.style.setProperty('--card-y', `${y}px`);
}

function initStageInteractions() {
    initPasswordToggle();
    initDraggableCards();
    initRunawayCards();
}

function initPasswordToggle() {
    const leak = qs('[data-password-toggle]');
    const value = qs('[data-password-value]');
    if (!leak || !value) return;

    const raw = 'password=123456';
    const masked = 'password=******';

    leak.addEventListener('click', () => {
        if (leak.dataset.suppressClick === 'true') return;

        const isMasked = leak.classList.toggle('is-masked');
        leak.setAttribute('aria-pressed', String(isMasked));
        value.textContent = isMasked ? masked : raw;
    });
}

function initDraggableCards() {
    const targets = qsa('[data-drag-card]');
    if (!targets.length) return;

    targets.forEach((target) => {
        let startX = 0;
        let startY = 0;
        let baseX = Number(target.dataset.cardX || 0);
        let baseY = Number(target.dataset.cardY || 0);
        let moved = false;

        target.addEventListener('pointerdown', (event) => {
            if (event.button !== undefined && event.button !== 0) return;
            target.setPointerCapture(event.pointerId);
            target.classList.add('is-dragging');
            startX = event.clientX;
            startY = event.clientY;
            baseX = Number(target.dataset.cardX || 0);
            baseY = Number(target.dataset.cardY || 0);
            moved = false;
        });

        target.addEventListener('pointermove', (event) => {
            if (!target.classList.contains('is-dragging')) return;

            const deltaX = event.clientX - startX;
            const deltaY = event.clientY - startY;
            moved = moved || Math.abs(deltaX) + Math.abs(deltaY) > 4;
            setCardPosition(target, baseX + deltaX, baseY + deltaY);
        });

        const stopDrag = (event) => {
            if (!target.classList.contains('is-dragging')) return;
            target.classList.remove('is-dragging');
            if (target.hasPointerCapture?.(event.pointerId)) {
                target.releasePointerCapture(event.pointerId);
            }

            if (moved) {
                target.dataset.suppressClick = 'true';
                window.setTimeout(() => {
                    delete target.dataset.suppressClick;
                }, 80);
            }
        };

        target.addEventListener('pointerup', stopDrag);
        target.addEventListener('pointercancel', stopDrag);
    });
}

function initRunawayCards() {
    const targets = qsa('[data-runaway]');
    if (!targets.length || prefersReducedMotion || isTouch) return;

    const nudge = (target, force = 1) => {
        if (target.classList.contains('is-dragging')) return;

        const currentX = Number(target.dataset.cardX || 0);
        const currentY = Number(target.dataset.cardY || 0);
        const nextX = currentX + (Math.random() - 0.5) * 42 * force;
        const nextY = currentY + (Math.random() - 0.5) * 28 * force;
        setCardPosition(target, Math.round(nextX), Math.round(nextY));
    };

    targets.forEach((target) => {
        target.addEventListener('pointerenter', () => nudge(target, 1.45));
        target.addEventListener('focus', () => nudge(target, 1));
    });

    window.setInterval(() => {
        if (document.hidden) return;
        const target = targets[Math.floor(Math.random() * targets.length)];
        nudge(target, 0.65);
    }, 3200);
}

function initGameZone() {
    const zone = qs('.game-zone');
    const scene = qs('#game-scene');
    const input = qs('#game-answer');
    const submit = qs('#game-submit');
    const retry = qs('#game-retry');
    const title = qs('#game-title');
    const brief = qs('#game-brief');
    const hint = qs('#game-hint');
    const difficulty = qs('#game-difficulty');
    const type = qs('#game-type');
    const round = qs('#game-round');
    const feedback = qs('#game-feedback');
    const score = qs('#game-score');
    const clear = qs('#game-clear');
    const clearLine = qs('#clear-line');
    const audioCard = qs('#audio-card');
    const miscAudio = qs('#misc-audio');
    const dots = qsa('[data-step-dot]');
    const candyCanvas = qs('#candy-game');
    const candyStatus = qs('#candy-status');
    const gateStatus = qs('#gate-status');
    const patchCandyValue = qs('#patch-candy-value');
    const patchRequired = qs('#patch-required');
    const patchNeedSmall = qs('#patch-need-small');
    const patchScore = qs('#patch-score');
    const patchJmp = qs('#patch-jmp');
    const patchFeedback = qs('#patch-feedback');
    if (!zone || !scene || !input || !submit || !title || !brief || !hint || !difficulty || !type || !round || !feedback || !score || !clear) return;

    const normalizeAnswer = (value) => value.trim().replace(/\s+/g, '').toLowerCase();
    const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
    const clearLines = [
        'sound: on / brain: suspiciously warm',
        'rainbow packet delivered, please stop staring at wireshark',
        'Nyan mode loaded. 题目说它今天也想下班。',
        'all solved. 现在可以假装自己只是随便看看。'
    ];

    function base62Xor163(value) {
        const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const bytes = [...value].map((char) => char.charCodeAt(0) ^ 0xa3);
        let big = 0n;

        bytes.forEach((byte) => {
            big = (big << 8n) + BigInt(byte);
        });

        if (big === 0n) return '0';

        let encoded = '';
        while (big > 0n) {
            encoded = alphabet[Number(big % 62n)] + encoded;
            big /= 62n;
        }
        return encoded;
    }

    function makeChallengePool() {
        const miscFlags = [
            'flag{xor163_is_not_a_love_language}',
            'flag{netease_comment_area_has_no_flag}',
            'flag{bassline_says_stop_using_online_decoder}',
            'flag{misc_players_need_sleep_too}',
            'flag{liuer_heard_it_but_refused_to_tell_you}'
        ];
        const miscFlag = miscFlags[Math.floor(Math.random() * miscFlags.length)];
        const miscCipher = base62Xor163(miscFlag);

        return [
            {
                id: 'block-pwn',
                type: 'PWN',
                title: '32-bit Block PWN',
                brief: '积木程序只会拖块、运行、cat。它很诚实，诚实得像没开 PIE。',
                hint: '黄昏把操场切成 32 位，积木一块块落下，像那些没对齐的栈帧。\n\n我以为拼错的是青春，后来才发现只是忘了 cat。',
                difficulty: '难度：中等-',
                answers: ['flag{y0u_4re_really_pwn3r!}'],
                scene: `
                    <div class="scene-layout scene-pwn">
                        <div class="block-program" data-game-drag>
                            <span class="block-token token-green">when run</span>
                            <span class="block-token">open("./flag")</span>
                            <button class="block-token token-pink" type="button" data-game-output="flag{y0u_4re_really_pwn3r!}">cat flag.txt</button>
                            <span class="block-token">print(stdout)</span>
                        </div>
                        <div class="game-monitor">
                            <span>$ ./block32 --please</span>
                            <code data-output-line>stdout: 你倒是点 cat 啊</code>
                        </div>
                        <div class="mini-stack" data-game-drag data-game-runaway>
                            <b>CANARY</b>
                            <i>00</i><i>a7</i><i>ff</i><i>??</i>
                        </div>
                    </div>`
            },
            {
                id: 'voice-misc',
                type: 'MISC',
                title: 'Phone Recording',
                brief: '一段手机录音。听完以后，请不要把网易云评论区搬进 writeup。',
                hint: '人民商场里的那架旧琴依旧还在，漆皮斑驳，音准早失。大多数的旋律早就在回忆里模糊，唯有那段他演奏时的，那几个重音、后半段加花格外清晰。\n\n指尖悬在琴键上，不敢触碰。当年未懂的顿挫，是否藏着未尽之言？\n\n于是我顺着回忆开始弹奏……',
                difficulty: '难度：中等-',
                audio: true,
                answers: ['flag{I_LOVE_YOU}', 'flag{ILOVEYOU}', 'flag{I-LOVE-YOU}'],
                scene: `
                    <div class="scene-layout scene-audio">
                        <div class="pixel-piano" data-game-drag>
                            <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
                        </div>
                        <div class="cassette">
                            <b>PHONE_REC.WAV</b>
                            <span></span>
                            <span></span>
                        </div>
                        <div class="wave-grid" aria-hidden="true">
                            <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
                            <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
                        </div>
                    </div>`
            },
            {
                id: 'web-login',
                type: 'WEB',
                title: 'Weak Password Romance',
                brief: '登录框把真心写在脸上：password=123456。点它，它还会害羞。',
                hint: '那年夏天，表单里的 placeholder 比告白还直白。\n\n他说密码会永远记得我，直到我发现每个人都是 123456。',
                difficulty: '难度：入门，但侮辱性较强',
                answers: ['flag{password_123456_is_not_a_strategy}'],
                scene: `
                    <div class="scene-layout scene-web">
                        <button class="leak-password" type="button" data-password-toggle aria-pressed="false">
                            <span>POST /login</span>
                            <strong data-password-value>password=123456</strong>
                        </button>
                        <div class="request-stack" data-game-drag>
                            <span>if password == "123456":</span>
                            <code>return "flag{password_123456_is_not_a_strategy}"</code>
                        </div>
                        <div class="cookie-chip" data-game-drag>Cookie: role=admin?</div>
                        <div class="web-pixels" aria-hidden="true"></div>
                    </div>`
            },
            {
                id: 're-gobot',
                type: 'RE',
                title: 'GoBot Strings',
                brief: 'Go 写出来的东西，最先反抗的是符号名，然后是你的耐心。',
                hint: '他像自动贩卖机前沉默的少年，递出一罐冰冷的 strings。\n\n拉环打开，汽水没有气，flag 倒是溢出来了。',
                difficulty: '难度：中等，主要难在别想太多',
                answers: ['flag{gobot_said_strings_first}'],
                scene: `
                    <div class="scene-layout scene-re">
                        <button class="gobot-card game-gobot" type="button" data-game-output="flag{gobot_said_strings_first}" data-game-runaway>
                            <div class="gobot-face">
                                <i></i><i></i><i></i><i></i>
                            </div>
                            <strong>GoBot</strong>
                            <span>main.main knows something</span>
                        </button>
                        <pre class="asm-sheet" data-game-drag>cmp eax, 0x2a
jnz short cry
call runtime.morestack
lea rdi, flag_string</pre>
                        <div class="game-monitor">
                            <span>$ strings gobot | grep flag</span>
                            <code data-output-line>stdout: 点一下 GoBot，它会装作没听见</code>
                        </div>
                    </div>`
            },
            {
                id: 'misc-cipher',
                type: 'MISC',
                title: 'Base62 After XOR163',
                brief: '贝斯手柳儿爱听网易云音乐。下面这串是 base62(xor163(flag))，别怪歌单。',
                hint: '雨后的地铁口，有人把耳机分给了左耳。\n\n我听见低频在心里绕了 163 圈，最后变成一串看起来很想被丢进脚本的字母。',
                difficulty: '难度：中等，手算属于自虐',
                answers: [miscFlag],
                scene: `
                    <div class="scene-layout scene-cipher">
                        <div class="lyric-board" data-game-drag>贝斯手柳儿爱听网易云音乐</div>
                        <div class="cipher-box">
                            <span>base62(xor163(flag))</span>
                            <code>len=${miscFlag.length}
${miscCipher}</code>
                        </div>
                        <div class="qr-noise mini-qr" data-game-drag>
                            <i></i><i></i><i></i><i></i><i></i><i></i>
                            <i></i><i></i><i></i><i></i><i></i><i></i>
                            <i></i><i></i><i></i><i></i><i></i><i></i>
                            <i></i><i></i><i></i><i></i><i></i><i></i>
                        </div>
                    </div>`
            }
        ];
    }

    let queue = [];
    let currentIndex = 0;
    let locked = false;
    let gateUnlocked = false;

    const candyGame = {
        count: 0,
        need: 100000,
        tile: 20,
        player: { x: 2, y: 12, dir: 1 },
        candy: { x: 18, y: 5 }
    };
    const candyCtx = candyCanvas?.getContext('2d');
    const candyCols = candyCanvas ? Math.floor(candyCanvas.width / candyGame.tile) : 0;
    const candyRows = candyCanvas ? Math.floor(candyCanvas.height / candyGame.tile) : 0;

    function updateChallengeLock() {
        if (locked) return;

        input.disabled = !gateUnlocked;
        submit.disabled = !gateUnlocked;
        if (!gateUnlocked) {
            feedback.style.color = '#ff2d2d';
            feedback.textContent = 'blocked: 糖豆门还锁着。要么吃 100000 个，要么把代码改了。';
            return;
        }

        feedback.style.color = '';
        if (!input.value) {
            feedback.textContent = 'status: gate unlocked，随机题可以开刀了。';
        }
    }

    function updateCandyHud() {
        if (candyStatus) candyStatus.textContent = `CANDY ${candyGame.count}/${candyGame.need}`;
        if (gateStatus) gateStatus.textContent = gateUnlocked ? 'GATE: PATCHED' : 'GATE: LOCKED';
        if (patchCandyValue) patchCandyValue.textContent = String(candyGame.count);
        if (patchRequired && document.activeElement !== patchRequired) {
            patchRequired.value = String(candyGame.need);
        }
    }

    function placeCandy() {
        if (!candyCols || !candyRows) return;

        do {
            candyGame.candy.x = 1 + Math.floor(Math.random() * (candyCols - 2));
            candyGame.candy.y = 1 + Math.floor(Math.random() * (candyRows - 2));
        } while (candyGame.candy.x === candyGame.player.x && candyGame.candy.y === candyGame.player.y);
    }

    function drawCandyGame() {
        if (!candyCtx || !candyCanvas) return;

        candyCtx.fillStyle = '#111';
        candyCtx.fillRect(0, 0, candyCanvas.width, candyCanvas.height);

        for (let y = 0; y < candyRows; y += 1) {
            for (let x = 0; x < candyCols; x += 1) {
                if ((x + y) % 2 === 0) {
                    candyCtx.fillStyle = '#151515';
                    candyCtx.fillRect(x * candyGame.tile, y * candyGame.tile, candyGame.tile, candyGame.tile);
                }
                candyCtx.strokeStyle = 'rgba(244, 244, 239, 0.055)';
                candyCtx.strokeRect(x * candyGame.tile + 0.5, y * candyGame.tile + 0.5, candyGame.tile, candyGame.tile);
            }
        }

        const candyX = candyGame.candy.x * candyGame.tile;
        const candyY = candyGame.candy.y * candyGame.tile;
        candyCtx.fillStyle = '#b7ff2a';
        candyCtx.fillRect(candyX + 5, candyY + 5, 10, 10);
        candyCtx.fillStyle = '#f4f4ef';
        candyCtx.fillRect(candyX + 8, candyY + 2, 4, 16);

        const playerX = candyGame.player.x * candyGame.tile;
        const playerY = candyGame.player.y * candyGame.tile;
        candyCtx.fillStyle = '#ff6aa2';
        candyCtx.fillRect(playerX + 5, playerY + 2, 10, 6);
        candyCtx.fillRect(playerX + 3, playerY + 8, 14, 6);
        candyCtx.fillStyle = '#ffd8e7';
        candyCtx.fillRect(playerX + 6, playerY + 7, 8, 5);
        candyCtx.fillStyle = '#111';
        candyCtx.fillRect(playerX + 7, playerY + 9, 2, 1);
        candyCtx.fillRect(playerX + 13, playerY + 9, 1, 1);
        candyCtx.fillStyle = '#f4f4ef';
        candyCtx.fillRect(playerX + 5, playerY + 16, 3, 3);
        candyCtx.fillRect(playerX + 13, playerY + 16, 3, 3);

        updateCandyHud();
    }

    function unlockGate(reason) {
        if (gateUnlocked) return;

        gateUnlocked = true;
        zone.classList.add('is-gate-open');
        updateCandyHud();
        if (patchFeedback) patchFeedback.textContent = `patched: ${reason}`;
        feedback.style.color = '';
        feedback.textContent = 'status: 糖豆门被你改穿了。现在做题。';
        input.disabled = false;
        submit.disabled = false;
        input.focus({ preventScroll: true });
    }

    function setCandyNeed(value, reason) {
        const nextNeed = Math.max(1, Number.parseInt(value, 10) || 1);
        candyGame.need = nextNeed;
        updateCandyHud();
        if (patchFeedback) patchFeedback.textContent = `patched: need = ${nextNeed}. ${reason}`;
        if (candyGame.count >= candyGame.need) unlockGate('condition already true, unlock_challenge() 被顺手叫醒。');
    }

    function moveCandyPlayer(dx, dy) {
        if (!candyCanvas) return;

        const nextX = Math.max(0, Math.min(candyCols - 1, candyGame.player.x + dx));
        const nextY = Math.max(0, Math.min(candyRows - 1, candyGame.player.y + dy));
        candyGame.player.x = nextX;
        candyGame.player.y = nextY;
        if (dx) candyGame.player.dir = dx;

        if (nextX === candyGame.candy.x && nextY === candyGame.candy.y) {
            candyGame.count += 1;
            placeCandy();
            if (patchFeedback && !gateUnlocked) {
                patchFeedback.textContent = `status: candy++，还差 ${Math.max(0, candyGame.need - candyGame.count)} 个。挺励志，也挺坐牢。`;
            }
            if (candyGame.count >= candyGame.need) unlockGate('candy >= need，正常人类路线居然成立。');
        }

        drawCandyGame();
    }

    function resetCandyGate() {
        gateUnlocked = false;
        zone.classList.remove('is-gate-open');
        candyGame.count = 0;
        candyGame.need = 100000;
        candyGame.player = { x: 2, y: 12, dir: 1 };
        if (patchRequired) patchRequired.value = '100000';
        placeCandy();
        drawCandyGame();
        if (patchFeedback) patchFeedback.textContent = 'status: 这门要 100000 颗糖豆，正常玩完大概能悟道。';
    }

    function initCandyGate() {
        if (!candyCanvas) return;

        candyCanvas.tabIndex = 0;
        candyCanvas.addEventListener('pointerdown', () => candyCanvas.focus({ preventScroll: true }));

        const keyMap = {
            ArrowUp: [0, -1],
            ArrowDown: [0, 1],
            ArrowLeft: [-1, 0],
            ArrowRight: [1, 0],
            w: [0, -1],
            s: [0, 1],
            a: [-1, 0],
            d: [1, 0],
            W: [0, -1],
            S: [0, 1],
            A: [-1, 0],
            D: [1, 0]
        };

        window.addEventListener('keydown', (event) => {
            if ([input, patchRequired].includes(document.activeElement)) return;

            const rect = zone.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > window.innerHeight) return;

            const vector = keyMap[event.key];
            if (!vector) return;
            event.preventDefault();
            moveCandyPlayer(vector[0], vector[1]);
        });

        patchRequired?.addEventListener('change', () => setCandyNeed(patchRequired.value, '手改常量，青春少走九万九千九百九十七步。'));
        patchRequired?.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            setCandyNeed(patchRequired.value, 'Enter 一按，常量就当场改命。');
        });
        patchNeedSmall?.addEventListener('click', () => setCandyNeed(3, '糖豆门：我是不是被羞辱了？'));
        patchScore?.addEventListener('click', () => {
            candyGame.count = Math.max(0, candyGame.need - 1);
            updateCandyHud();
            drawCandyGame();
            if (patchFeedback) patchFeedback.textContent = 'patched: candy = need - 1. 再吃一颗，门就装不下去了。';
        });
        patchJmp?.addEventListener('click', () => {
            candyGame.count = candyGame.need;
            drawCandyGame();
            unlockGate('jmp unlock_challenge，控制流说它想叛逆一次。');
        });
    }

    function bindSceneInteractions(challenge) {
        qsa('[data-game-drag]', scene).forEach((target) => {
            let startX = 0;
            let startY = 0;
            let baseX = Number(target.dataset.cardX || 0);
            let baseY = Number(target.dataset.cardY || 0);

            target.addEventListener('pointerdown', (event) => {
                if (event.button !== undefined && event.button !== 0) return;
                target.setPointerCapture(event.pointerId);
                target.classList.add('is-dragging');
                startX = event.clientX;
                startY = event.clientY;
                baseX = Number(target.dataset.cardX || 0);
                baseY = Number(target.dataset.cardY || 0);
            });

            target.addEventListener('pointermove', (event) => {
                if (!target.classList.contains('is-dragging')) return;
                setCardPosition(target, baseX + event.clientX - startX, baseY + event.clientY - startY);
            });

            const stopDrag = (event) => {
                if (!target.classList.contains('is-dragging')) return;
                target.classList.remove('is-dragging');
                if (target.hasPointerCapture?.(event.pointerId)) {
                    target.releasePointerCapture(event.pointerId);
                }
            };

            target.addEventListener('pointerup', stopDrag);
            target.addEventListener('pointercancel', stopDrag);
        });

        qsa('[data-game-runaway]', scene).forEach((target) => {
            if (prefersReducedMotion || isTouch) return;

            target.addEventListener('pointerenter', () => {
                const nextX = Number(target.dataset.cardX || 0) + Math.round((Math.random() - 0.5) * 52);
                const nextY = Number(target.dataset.cardY || 0) + Math.round((Math.random() - 0.5) * 34);
                setCardPosition(target, nextX, nextY);
            });
        });

        qsa('[data-password-toggle]', scene).forEach((button) => {
            const value = qs('[data-password-value]', button);
            if (!value) return;

            button.addEventListener('click', () => {
                const masked = button.classList.toggle('is-masked');
                button.setAttribute('aria-pressed', String(masked));
                value.textContent = masked ? 'password=********' : 'password=123456';
                feedback.textContent = masked
                    ? 'status: 掩耳盗铃成功，数据库已经笑出声。'
                    : 'status: 明文回来了，安全感走了。';
            });
        });

        qsa('[data-game-output]', scene).forEach((button) => {
            button.addEventListener('click', () => {
                const line = qs('[data-output-line]', scene);
                if (line) line.textContent = `stdout: ${button.dataset.gameOutput}`;
                feedback.textContent = challenge.id === 'block-pwn'
                    ? 'status: cat 很配合，人类不一定。'
                    : 'status: 它把 flag 吐出来了，表情还很无辜。';
            });
        });
    }

    function renderChallenge() {
        const challenge = queue[currentIndex];
        if (!challenge) return;

        locked = false;
        zone.dataset.challenge = challenge.type.toLowerCase();
        type.textContent = challenge.type;
        round.textContent = `ROUND ${currentIndex + 1}`;
        title.textContent = challenge.title;
        brief.textContent = challenge.brief;
        hint.textContent = challenge.hint;
        difficulty.textContent = challenge.difficulty;
        score.textContent = `${currentIndex}/3`;
        feedback.style.color = '';
        feedback.textContent = gateUnlocked
            ? 'status: 题目已加载，别急着开摆。'
            : 'blocked: 糖豆门还锁着。要么吃 100000 个，要么把代码改了。';
        input.value = '';
        input.disabled = !gateUnlocked;
        submit.disabled = !gateUnlocked;
        scene.innerHTML = challenge.scene;
        if (audioCard) audioCard.hidden = !challenge.audio;
        if (miscAudio && !challenge.audio) miscAudio.pause();

        dots.forEach((dot, index) => {
            dot.classList.toggle('is-active', index === currentIndex);
            dot.classList.toggle('is-solved', index < currentIndex);
        });

        bindSceneInteractions(challenge);

        if (window.gsap && !prefersReducedMotion) {
            gsap.fromTo(scene.children, { y: 22, opacity: 0 }, {
                y: 0,
                opacity: 1,
                duration: 0.46,
                stagger: 0.04,
                ease: 'power3.out'
            });
        }

        window.setTimeout(() => {
            if (gateUnlocked) input.focus({ preventScroll: true });
        }, 40);
    }

    function showClear() {
        locked = true;
        zone.dataset.gameState = 'clear';
        score.textContent = '3/3';
        dots.forEach((dot) => {
            dot.classList.remove('is-active');
            dot.classList.add('is-solved');
        });
        feedback.style.color = '#1e7a13';
        feedback.textContent = 'accepted: 三题全过，彩虹通道开了。';
        input.disabled = true;
        submit.disabled = true;
        if (miscAudio) miscAudio.pause();
        clear.hidden = false;
        if (clearLine) clearLine.textContent = clearLines[Math.floor(Math.random() * clearLines.length)];
        playClearSound();

        if (window.gsap && !prefersReducedMotion) {
            gsap.fromTo(clear, { y: 36, opacity: 0 }, {
                y: 0,
                opacity: 1,
                duration: 0.6,
                ease: 'power3.out'
            });
        }
    }

    function submitAnswer() {
        if (locked) return;

        if (!gateUnlocked) {
            feedback.style.color = '#ff2d2d';
            feedback.textContent = 'blocked: 糖豆门没开。逆向人不排队，逆向人 patch。';
            return;
        }

        const challenge = queue[currentIndex];
        const answer = normalizeAnswer(input.value);
        const accepted = challenge.answers.some((item) => normalizeAnswer(item) === answer);

        if (!accepted) {
            feedback.style.color = '#ff2d2d';
            feedback.textContent = 'wrong: flag 没对上，但你的嘴硬很稳定。';
            if (window.gsap && !prefersReducedMotion) {
                gsap.fromTo('.answer-console', { x: -4 }, { x: 4, repeat: 3, yoyo: true, duration: 0.045, clearProps: 'transform' });
            }
            return;
        }

        locked = true;
        feedback.style.color = '#1e7a13';
        feedback.textContent = 'accepted: 这题被你打穿了，下一题正在换衣服。';
        currentIndex += 1;
        score.textContent = `${currentIndex}/3`;

        if (currentIndex >= 3) {
            window.setTimeout(showClear, 520);
            return;
        }

        window.setTimeout(renderChallenge, 620);
    }

    function startRun() {
        queue = shuffle(makeChallengePool()).slice(0, 3);
        currentIndex = 0;
        locked = false;
        zone.dataset.gameState = 'playing';
        clear.hidden = true;
        resetCandyGate();
        renderChallenge();
        updateChallengeLock();
    }

    function playClearSound() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const master = ctx.createGain();
        master.gain.setValueAtTime(0.0001, ctx.currentTime);
        master.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.03);
        master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.15);
        master.connect(ctx.destination);

        [523.25, 659.25, 783.99, 1046.5, 783.99, 987.77].forEach((freq, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = ctx.currentTime + index * 0.12;
            osc.type = index % 2 ? 'square' : 'triangle';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
            osc.connect(gain);
            gain.connect(master);
            osc.start(start);
            osc.stop(start + 0.2);
        });

        window.setTimeout(() => ctx.close(), 1400);
    }

    submit.addEventListener('click', submitAnswer);
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') submitAnswer();
    });
    retry?.addEventListener('click', startRun);

    initCandyGate();
    startRun();
}

function initPixelGame() {
    const canvas = qs('#pixel-game');
    const status = qs('#fragment-status');
    const prompt = qs('#challenge-text');
    const input = qs('#flag-answer');
    const submit = qs('#submit-flag');
    const result = qs('#flag-result');
    if (!canvas || !status || !prompt || !input || !submit || !result) return;

    const ctx = canvas.getContext('2d');
    const tile = 16;
    const cols = canvas.width / tile;
    const rows = canvas.height / tile;
    const player = { x: 2, y: 16, dir: 1 };
    const exit = { x: 27, y: 2 };
    const walls = new Set();
    const fragments = [
        { x: 6, y: 4, got: false },
        { x: 15, y: 14, got: false },
        { x: 24, y: 8, got: false }
    ];
    const challenges = [
        {
            title: 'base64 rehearsal',
            body: 'decode this stage pass:\n\nZmxhZ3twaW5rX3BhbmljX3B3bn0=',
            answer: 'flag{pink_panic_pwn}'
        },
        {
            title: 'hex sticker',
            body: 'from hex, with feeling:\n\n666c61677b68617070795f6861636b696e677d',
            answer: 'flag{happy_hacking}'
        },
        {
            title: 'rot13 distortion',
            body: 'rot13 is a very serious crypto, probably:\n\nsynt{obppuv_ebpxf_cja}',
            answer: 'flag{bocchi_rocks_pwn}'
        },
        {
            title: 'reverse encore',
            body: 'read it backwards before Bocchi evaporates:\n\n}edoc_ni_tsol{galf',
            answer: 'flag{lost_in_code}'
        }
    ];
    const challenge = challenges[Math.floor(Math.random() * challenges.length)];

    function addWall(x, y) {
        walls.add(`${x},${y}`);
    }

    for (let x = 0; x < cols; x += 1) {
        addWall(x, 0);
        addWall(x, rows - 1);
    }

    for (let y = 0; y < rows; y += 1) {
        addWall(0, y);
        addWall(cols - 1, y);
    }

    for (let x = 4; x < 25; x += 1) {
        if (![8, 17].includes(x)) addWall(x, 6);
    }

    for (let x = 7; x < 29; x += 1) {
        if (![12, 23].includes(x)) addWall(x, 12);
    }

    for (let y = 3; y < 17; y += 1) {
        if (![5, 10, 15].includes(y)) addWall(20, y);
    }

    for (let y = 8; y < 18; y += 1) {
        if (![9, 16].includes(y)) addWall(10, y);
    }

    function fillTile(x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * tile, y * tile, tile, tile);
    }

    function drawDitherTile(x, y) {
        ctx.fillStyle = '#f0f0e9';
        ctx.fillRect(x * tile, y * tile, tile, tile);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        for (let py = 2; py < tile; py += 4) {
            for (let px = (py / 2) % 4; px < tile; px += 4) {
                ctx.fillRect(x * tile + px, y * tile + py, 1, 1);
            }
        }
    }

    function drawGrid() {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let y = 0; y < rows; y += 1) {
            for (let x = 0; x < cols; x += 1) {
                if ((x + y) % 2 === 0) {
                    ctx.fillStyle = '#151515';
                    ctx.fillRect(x * tile, y * tile, tile, tile);
                }

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
                ctx.strokeRect(x * tile + 0.5, y * tile + 0.5, tile, tile);

                if (walls.has(`${x},${y}`)) {
                    if ((x + y) % 3 === 0) {
                        drawDitherTile(x, y);
                    } else {
                        fillTile(x, y, '#f4f4ef');
                    }
                }
            }
        }
    }

    function drawGate() {
        fillTile(exit.x, exit.y, '#b7ff2a');
        ctx.fillStyle = '#111';
        ctx.fillRect(exit.x * tile + 4, exit.y * tile + 5, 8, 7);
        ctx.fillStyle = '#f4f4ef';
        ctx.fillRect(exit.x * tile + 7, exit.y * tile + 8, 2, 2);
    }

    function drawFragments() {
        fragments.forEach((fragment, index) => {
            if (fragment.got) return;

            const x = fragment.x * tile;
            const y = fragment.y * tile;
            ctx.fillStyle = index === 1 ? '#ff6aa2' : '#b7ff2a';
            ctx.fillRect(x + 5, y + 3, 6, 10);
            ctx.fillStyle = '#f4f4ef';
            ctx.fillRect(x + 7, y + 1, 2, 14);
            ctx.fillStyle = '#111';
            ctx.fillRect(x + 4, y + 12, 8, 2);
        });
    }

    function drawPlayer() {
        const x = player.x * tile;
        const y = player.y * tile;

        ctx.fillStyle = '#ff6aa2';
        ctx.fillRect(x + 4, y + 1, 8, 5);
        ctx.fillRect(x + 3, y + 5, 10, 3);
        ctx.fillStyle = '#ffd8e7';
        ctx.fillRect(x + 5, y + 6, 6, 4);
        ctx.fillStyle = '#111';
        ctx.fillRect(x + 5, y + 7, 2, 1);
        ctx.fillRect(x + 10, y + 7, 1, 1);
        ctx.fillStyle = '#f35f99';
        ctx.fillRect(x + 4, y + 10, 8, 4);
        ctx.fillStyle = '#52351f';
        ctx.fillRect(x + (player.dir >= 0 ? 11 : 1), y + 9, 5, 2);
        ctx.fillStyle = '#f4f4ef';
        ctx.fillRect(x + 5, y + 14, 2, 2);
        ctx.fillRect(x + 10, y + 14, 2, 2);
    }

    function draw() {
        drawGrid();
        drawGate();
        drawFragments();
        drawPlayer();

        const count = fragments.filter((fragment) => fragment.got).length;
        status.textContent = `FRAGMENTS ${count}/3`;

        if (count === 3) {
            prompt.textContent = `${challenge.title}\n\n${challenge.body}`;
            result.textContent = 'status: challenge unlocked. 现在轮到脑子上台。';
        }
    }

    function canMove(x, y) {
        return x >= 0 && y >= 0 && x < cols && y < rows && !walls.has(`${x},${y}`);
    }

    function move(dx, dy) {
        const nextX = player.x + dx;
        const nextY = player.y + dy;
        if (!canMove(nextX, nextY)) return;

        player.x = nextX;
        player.y = nextY;
        if (dx) player.dir = dx;

        fragments.forEach((fragment) => {
            if (!fragment.got && fragment.x === player.x && fragment.y === player.y) {
                fragment.got = true;
                result.style.color = '';
                result.textContent = 'fragment++  波奇酱：我只是路过，真的。';
            }
        });

        draw();
    }

    const keyMap = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        w: [0, -1],
        s: [0, 1],
        a: [-1, 0],
        d: [1, 0],
        W: [0, -1],
        S: [0, 1],
        A: [-1, 0],
        D: [1, 0]
    };

    window.addEventListener('keydown', (event) => {
        if (document.activeElement === input) return;
        const vector = keyMap[event.key];
        if (!vector) return;

        event.preventDefault();
        move(vector[0], vector[1]);
    });

    submit.addEventListener('click', () => {
        const count = fragments.filter((fragment) => fragment.got).length;
        if (count < 3) {
            result.style.color = '#ff2d2d';
            result.textContent = 'blocked: 先把三个碎片捡齐，别跳关。';
            return;
        }

        if (input.value.trim() === challenge.answer) {
            result.style.color = '#1e7a13';
            result.textContent = 'accepted. flag 拿下，今晚少怀疑人生五分钟。';
        } else {
            result.style.color = '#ff2d2d';
            result.textContent = 'wrong answer. 编码看一眼，别和它硬刚。';
        }
    });

    draw();
}

function initMiscCipher() {
    const dataEl = qs('#misc-cipher-data');
    const previewEl = qs('#misc-flag-preview');
    if (!dataEl || !previewEl) return;

    const flags = [
        'flag{password_123456_is_not_a_strategy}',
        'flag{canary_saw_you_smashing_stack}',
        'flag{gobot_said_strings_first}',
        'flag{netease_cloud_wont_decode_it_for_you}',
        'flag{stop_refreshing_and_solve_it}'
    ];
    const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const flag = flags[Math.floor(Math.random() * flags.length)];
    const bytes = [...flag].map((char) => char.charCodeAt(0) ^ 0xa3);

    let value = 0n;
    bytes.forEach((byte) => {
        value = (value << 8n) + BigInt(byte);
    });

    let encoded = '';
    while (value > 0n) {
        encoded = alphabet[Number(value % 62n)] + encoded;
        value /= 62n;
    }

    dataEl.textContent = `len=${bytes.length}\n${encoded || '0'}`;
    previewEl.textContent = flag;
}

window.addEventListener('DOMContentLoaded', () => {
    splitText();
    initSmoothScroll();
    initAnchors();
    initMotion();
    initPointerDepth();
    initDraggableBits();
    initStageInteractions();
    initGameZone();
    initMiscCipher();
});
