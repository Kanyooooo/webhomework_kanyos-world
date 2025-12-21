/**
 * Preloader Logic
 */
class Loader {
    constructor() {
        this.loader = document.getElementById('loader');
        this.counter = document.querySelector('.counter');
        this.progress = 0;
        
        if (this.loader && this.counter) {
            this.init();
        } else {
            if(this.loader) this.loader.style.display = 'none';
        }
    }

    init() {
        document.body.style.overflow = 'hidden';
        
        // Failsafe: Force complete after 5 seconds regardless of progress
        setTimeout(() => {
            if (this.progress < 100) {
                console.warn('Loader timed out, forcing completion');
                this.progress = 100;
                this.complete();
            }
        }, 5000);

        const interval = setInterval(() => {
            this.progress += Math.floor(Math.random() * 10) + 1;
            
            if (this.progress > 100) {
                this.progress = 100;
                clearInterval(interval);
                this.complete();
            }
            
            this.counter.textContent = `${this.progress}%`;
        }, 50);
    }

    complete() {
        setTimeout(() => {
            this.loader.style.transform = 'translateY(-100%)';
            document.body.style.overflow = '';
            document.body.style.overflowX = 'hidden';
        }, 500);
    }
}

/**
 * Custom Cursor Logic - "Bocchi" style (softer)
 */
class Cursor {
    constructor() {
        this.cursor = document.getElementById('cursor');
        this.follower = document.getElementById('cursor-follower');
        this.pos = { x: 0, y: 0 };
        this.mouse = { x: 0, y: 0 };
        
        if (this.cursor && this.follower) {
            this.init();
        }
    }

    init() {
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            
            // Immediate update for the dot
            this.cursor.style.transform = `translate3d(${this.mouse.x}px, ${this.mouse.y}px, 0) translate(-50%, -50%)`;
        });

        // Add hover effects
        const triggers = document.querySelectorAll('.hover-trigger');
        triggers.forEach(trigger => {
            trigger.addEventListener('mouseenter', () => {
                this.follower.classList.add('active');
            });
            trigger.addEventListener('mouseleave', () => {
                this.follower.classList.remove('active');
            });
        });

        this.render();
    }

    render() {
        this.pos.x += (this.mouse.x - this.pos.x) * 0.1;
        this.pos.y += (this.mouse.y - this.pos.y) * 0.1;

        this.follower.style.transform = `translate3d(${this.pos.x}px, ${this.pos.y}px, 0) translate(-50%, -50%)`;

        requestAnimationFrame(() => this.render());
    }
}

/**
 * Canvas Background Effect - Floating Shapes (Cubes & Triangles)
 */
class CanvasBackground {
    constructor() {
        this.canvas = document.getElementById('bg-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.shapes = [];
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.mouse = { x: -1000, y: -1000 }; // Initialize off-screen
        
        this.colors = ['#e57283', '#fcd53f', '#0077b6', '#d93838']; // Theme colors
        
        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        // Create shapes
        const shapeCount = this.width < 768 ? 20 : 50;
        for (let i = 0; i < shapeCount; i++) {
            this.shapes.push(new Shape(this.width, this.height, this.colors));
        }

        this.animate();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.shapes.forEach(shape => {
            shape.update(this.width, this.height, this.mouse);
            shape.draw(this.ctx);
        });

        requestAnimationFrame(() => this.animate());
    }
}

class Shape {
    constructor(w, h, colors) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        
        // Base velocity
        this.baseVx = (Math.random() - 0.5) * 0.8;
        this.baseVy = (Math.random() - 0.5) * 0.8;
        this.vx = this.baseVx;
        this.vy = this.baseVy;
        
        this.size = Math.random() * 20 + 10;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        
        // Shape Logic: Yellow (#fcd53f) must be triangle (Nijika's Doritos)
        // Others can be squares (Bocchi's boxes) or random
        if (this.color === '#fcd53f') {
            this.type = 'triangle';
        } else {
            this.type = 'square';
        }
    }

    update(w, h, mouse) {
        // Mouse Interaction (Repulsion/Anxiety)
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const interactionRadius = 200;

        if (dist < interactionRadius) {
            const force = (interactionRadius - dist) / interactionRadius;
            const angle = Math.atan2(dy, dx);
            
            // Push away faster when close
            this.vx += Math.cos(angle) * force * 1.5;
            this.vy += Math.sin(angle) * force * 1.5;
            
            // Spin faster when scared
            this.rotation += 0.1;
        }

        // Friction to return to base speed
        this.vx += (this.baseVx - this.vx) * 0.05;
        this.vy += (this.baseVy - this.vy) * 0.05;

        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;

        // Boundary wrap
        if (this.x < -50) this.x = w + 50;
        if (this.x > w + 50) this.x = -50;
        if (this.y < -50) this.y = h + 50;
        if (this.y > h + 50) this.y = -50;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.6; 

        if (this.type === 'square') {
            // Draw Box
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else if (this.type === 'triangle') {
            // Draw Dorito
            ctx.beginPath();
            // Equilateral triangle calculation
            const h = this.size * (Math.sqrt(3)/2);
            ctx.moveTo(0, -h / 2);
            ctx.lineTo(this.size / 2, h / 2);
            ctx.lineTo(-this.size / 2, h / 2);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
}

/**
 * Smooth Scroll Implementation
 */
class SmoothScroll {
    constructor() {
        this.content = document.getElementById('smooth-content');
        if (!this.content) return;

        this.current = 0;
        this.target = 0;
        this.ease = 0.05; // Smoothness factor
        this.isAnimating = false; // Lock for transitions

        this.dom = {
            el: this.content,
            height: this.content.getBoundingClientRect().height
        };
        
        // Define Sections
        // We use window.innerHeight as unit "h"
        // 1. Home: 0
        // 2. About: 1h
        // 3. Links: 2h (Height 4h) -> End at 6h
        // 4. Guitar: 6h
        // 5. Gallery: 7h (Height 6h) -> End at 13h
        // 6. Let's Rock: 13h
        // 7. Footer: 14h
        
        this.init();
    }

    init() {
        document.body.style.height = `${this.dom.height}px`;
        
        // Calculate Section Offsets dynamically
        this.calcOffsets();

        // Hijack Wheel
        window.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

        window.addEventListener('resize', () => {
            this.dom.height = this.content.getBoundingClientRect().height;
            document.body.style.height = `${this.dom.height}px`;
            this.calcOffsets();
        });

        this.render();
    }

    calcOffsets() {
        // Get exact positions from DOM
        const getTop = (id) => {
            const el = document.getElementById(id);
            return el ? el.offsetTop : 0;
        };
        
        // Assuming standard order in HTML
        this.sections = {
            home: { start: 0, end: getTop('about') },
            about: { start: getTop('about'), end: getTop('links') },
            links: { start: getTop('links'), end: getTop('guitar') },
            guitar: { start: getTop('guitar'), end: getTop('gallery') },
            gallery: { start: getTop('gallery'), end: getTop('lets-rock') },
            letsRock: { start: getTop('lets-rock'), end: document.body.scrollHeight }
        };
    }

    onWheel(e) {
        e.preventDefault();
        
        // If locked in animation, ignore input
        if (this.isAnimating) return;

        const delta = e.deltaY;
        const currentPos = this.target;
        const s = this.sections;
        const h = window.innerHeight; // Viewport height for offsets
        
        // --- Logic Board ---
        
        // 1. Home
        if (currentPos < s.home.end - 10) {
            if (delta > 0) this.scrollTo(s.about.start); 
            return;
        }

        // 2. About
        if (currentPos >= s.about.start - 10 && currentPos < s.about.end - 10) {
            if (delta > 0) this.scrollTo(s.links.start); 
            else if (delta < 0) this.scrollTo(s.home.start); 
            return;
        }

        // 3. Links (Tall)
        if (currentPos >= s.links.start - 10 && currentPos < s.links.end - 10) {
            if (delta > 0) {
                // Manual scroll is allowed up to a point
                this.target += delta;
            } else {
                if (currentPos <= s.links.start + 10) this.scrollTo(s.about.start); 
                else this.target += delta;
            }
            this.clampTarget();
            return;
        }

        // 4. Guitar
        if (currentPos >= s.guitar.start - 10 && currentPos < s.guitar.end - 10) {
            if (delta > 0) this.scrollTo(s.gallery.start); 
            else if (delta < 0) this.scrollTo(s.links.end - h); // Back to bottom of Links
            return;
        }

        // 5. Gallery (Tall)
        if (currentPos >= s.gallery.start - 10 && currentPos < s.gallery.end - 10) {
            if (delta > 0) {
                 const sectionH = s.gallery.end - s.gallery.start;
                 const progress = (currentPos - s.gallery.start) / sectionH;
                 
                 // "Starts to crush" -> Cube Rotation > 0.85
                 if (progress > 0.85) {
                     this.scrollTo(s.letsRock.start, true); // Spring to Let's Rock
                 } else {
                     this.target += delta;
                 }
            } else {
                if (currentPos <= s.gallery.start + 10) this.scrollTo(s.guitar.start); 
                else this.target += delta;
            }
            this.clampTarget();
            return;
        }

        // 6. Let's Rock / Footer
        if (currentPos >= s.letsRock.start - 10) {
             this.target += delta;
             this.clampTarget();
        }
    }
    
    clampTarget() {
        if (this.target < 0) this.target = 0;
        if (this.target > this.dom.height - window.innerHeight) this.target = this.dom.height - window.innerHeight;
    }

    scrollTo(y, useSpring = false, customDuration = 0) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        // Custom animation loop for "Spring" or standard ease
        const start = this.current;
        const dist = y - start;
        
        let duration;
        if (customDuration > 0) {
            duration = customDuration;
        } else {
            duration = useSpring ? 2500 : 1800;
        }

        const startTime = performance.now();
        
        const animate = (time) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing functions
            let ease;
            if (useSpring) {
                // Soft Elastic Out (Very dampened, elegant wobble)
                const p = progress;
                if (p === 0 || p === 1) ease = p;
                else {
                    const c4 = (2 * Math.PI) / 6; // Lower frequency = slower wobble
                    ease = Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * c4) + 1;
                }
            } else {
                // Quintic Out (More extreme smoothness than Power4)
                ease = 1 - Math.pow(1 - progress, 5);
            }
            
            this.current = start + (dist * ease);
            this.target = this.current; // Sync target
            
            // Update Visuals
            const currentY = -this.current.toFixed(2);
            this.content.style.transform = `translate3d(0, ${currentY}px, 0)`;
            this.parallax();
            window.dispatchEvent(new CustomEvent('smoothscroll', { detail: { y: this.current } }));
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
                this.target = y; // Ensure final exact value
            }
        };
        
        requestAnimationFrame(animate);
    }

    render() {
        if (!this.isAnimating) {
            // Normal smooth float logic when not locked
            this.current += (this.target - this.current) * this.ease;
            const y = -this.current.toFixed(2);
            this.content.style.transform = `translate3d(0, ${y}px, 0)`;
            this.parallax();
            window.dispatchEvent(new CustomEvent('smoothscroll', { detail: { y: this.current } }));

            // --- TRIGGER CHECK: Auto-Scroll Logic in Render Loop ---
            // This ensures we catch the exact moment visually, regardless of input momentum
            const s = this.sections;
            if (s && s.links) {
                // Check if we are in Links Section
                if (this.current >= s.links.start && this.current < s.links.end) {
                    const sectionH = s.links.end - s.links.start;
                    const progress = (this.current - s.links.start) / sectionH;
                    
                    // Trigger exactly when Orbit Ends (0.5) + slight buffer (0.02)
                    // If user scrolls past 0.52 visually, we take over.
                    if (progress > 0.52) {
                        // console.log("Auto-Trigger: Orbit Ended, starting cinematic zoom");
                        this.scrollTo(s.guitar.start, false, 3000);
                    }
                }
            }
        }
        
        requestAnimationFrame(() => this.render());
    }

    parallax() {
        const parallaxElements = document.querySelectorAll('.parallax');
        parallaxElements.forEach(el => {
            const speed = el.getAttribute('data-speed') || 0;
            const y = (this.current * speed).toFixed(2);
            el.style.transform = `translate3d(0, ${y}px, 0)`;
        });
    }
}

/**
 * Speed Lines Effect for Tunnel Transition
 */
class SpeedLines {
    constructor() {
        this.canvas = document.getElementById('tunnel-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.lines = [];
        this.numLines = 50;
        this.centerX = window.innerWidth / 2;
        this.centerY = window.innerHeight / 2;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.initLines();
    }
    
    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }
    
    initLines() {
        const colors = ['#e57283', '#fcd53f', '#0077b6', '#888888'];
        const dataItems = [
            "LINK 01: BLOG",
            "LINK 02: FRIENDS",
            "LINK 03: GITHUB",
            "LINK 04: BILIBILI",
            "GUITAR SESSION",
            "SYSTEM/SECURITY",
            "PWN/BINARY",
            "BOCCHI THE ROCK"
        ];

        for (let i = 0; i < this.numLines; i++) {
            // 30% chance to be an informational line
            const isInfo = Math.random() < 0.3;
            
            this.lines.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                z: Math.random() * 2 + 0.5, // Depth factor
                color: colors[Math.floor(Math.random() * colors.length)],
                data: isInfo ? dataItems[Math.floor(Math.random() * dataItems.length)] : null,
                width: isInfo ? 2 : 1 // Thicker lines for info
            });
        }
    }
    
    draw(progress) {
        if (!this.canvas) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Map progress (0.4 to 0.9) to opacity and speed
        // Active range: 0.4 -> 0.9
        let activeProgress = (progress - 0.4) / 0.5;
        if (activeProgress < 0) activeProgress = 0;
        if (activeProgress > 1) activeProgress = 1;
        
        // Acceleration Curve: Power function for dramatic zoom
        const acceleration = Math.pow(activeProgress, 3) * 50; 
        
        this.canvas.style.opacity = activeProgress;
        
        if (activeProgress <= 0) return;
        
        // Font settings for info lines
        this.ctx.font = '12px "JetBrains Mono", monospace';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        
        this.lines.forEach(line => {
            this.ctx.strokeStyle = line.color;
            this.ctx.lineWidth = line.width || 2;
            
            // Calculate direction from center
            const dx = line.x - this.centerX;
            const dy = line.y - this.centerY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            // Speed increases with progress drastically
            const speed = (10 + acceleration) * line.z;
            
            // Move line outwards
            const moveX = (dx / dist) * speed;
            const moveY = (dy / dist) * speed;
            
            line.x += moveX;
            line.y += moveY;
            
            // Reset if out of bounds
            // Reset logic: spawn near center to create tunnel effect
            if (line.x < 0 || line.x > this.canvas.width || line.y < 0 || line.y > this.canvas.height) {
                // Spawn in a small radius around center
                const spawnRadius = 100 * (1 - activeProgress); // Tighter spawn as we go faster
                const angle = Math.random() * Math.PI * 2;
                const r = Math.random() * spawnRadius;
                
                line.x = this.centerX + Math.cos(angle) * r;
                line.y = this.centerY + Math.sin(angle) * r;
            }
            
            // Draw line trail
            const trailLen = speed * 3 * activeProgress;
            
            this.ctx.beginPath();
            this.ctx.moveTo(line.x, line.y);
            this.ctx.lineTo(line.x - moveX * (trailLen/speed), line.y - moveY * (trailLen/speed));
            this.ctx.stroke();

            // Draw Text for Info Lines
            if (line.data && activeProgress > 0.2) {
                this.ctx.fillStyle = line.color;
                this.ctx.globalAlpha = 0.8;
                // Position text at the head of the line
                this.ctx.fillText(line.data, line.x + 10, line.y);
                this.ctx.globalAlpha = 1.0;
                
                // Draw a small dot at the tip
                this.ctx.beginPath();
                this.ctx.arc(line.x, line.y, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
}

/**
 * Mathematically Generated Guitar Body
 * Uses Bezier Curves and Constructive Geometry to render a guitar shape
 */
class GuitarCanvas {
    constructor() {
        this.canvas = document.getElementById('guitar-body-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Initial draw
        this.draw();
    }

    resize() {
        // Full screen canvas to act as a mask
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Update canvas resolution
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Update CSS to match
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        
        this.draw();
    }

    draw() {
        if (!this.ctx) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const cx = this.width / 2;
        const cy = this.height / 2;
        // Scale guitar to fit nicely in the center
        const scale = Math.min(this.width, this.height) * 0.13;

        this.ctx.save();
        // Shift drawing down so soundhole centers
        // We want the soundhole to be at (0,0) relative to context, which is at (cx, cy)
        this.ctx.translate(cx, cy);
        this.ctx.rotate(Math.PI / 2); // Rotate 90 degrees to make it horizontal
        
        // --- Draw Neck (Behind Body) ---
        const neckWidth = 1.0 * scale; // Thinner neck
        const neckHeight = 8 * scale; 
        
        // Neck extends upwards from body (which is now Left in screen coordinates due to rotation)
        
        this.ctx.fillStyle = '#dcb484'; // Maple wood
        this.ctx.fillRect(-neckWidth / 2, -7 * scale, neckWidth, 5 * scale);
        
        // Fretboard
        this.ctx.fillStyle = '#5d4037'; // Rosewood
        this.ctx.fillRect(-neckWidth / 2 + 2, -7 * scale, neckWidth - 4, 5 * scale);

        // --- Draw Headstock ---
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        const hx = 0;
        const hy = -7 * scale;
        this.ctx.moveTo(hx - neckWidth, hy);
        this.ctx.lineTo(hx + neckWidth, hy);
        this.ctx.lineTo(hx + neckWidth * 1.2, hy - 2 * scale);
        this.ctx.lineTo(hx, hy - 2.5 * scale);
        this.ctx.lineTo(hx - neckWidth * 1.2, hy - 2 * scale);
        this.ctx.closePath();
        this.ctx.fill();

        // --- Draw Body using Bezier Curves (Horizontal Orientation) ---
        this.ctx.beginPath();
        
        // Guitar dimensions (Even slimmer for horizontal view)
        const bodyWidth = 3.0 * scale; // Even thinner
        const bodyHeight = 5 * scale;
        const waistY = -0.8 * scale; 
        const waistWidth = 2.0 * scale; 
        const shoulderY = -2.8 * scale; 
        const bottomY = 3.5 * scale; 
        
        // Draw left side
        this.ctx.moveTo(0, shoulderY); // Top center
        this.ctx.bezierCurveTo(
            -bodyWidth * 0.9, shoulderY, // Control point 1 
            -bodyWidth, waistY - 1 * scale, // Control point 2 
            -waistWidth, waistY // Waist
        );
        this.ctx.bezierCurveTo(
            -bodyWidth * 1.1, waistY + 1.5 * scale, // Control point 1 
            -bodyWidth * 1.1, bottomY, // Control point 2 
            0, bottomY // Bottom center
        );
        
        // Draw right side
        this.ctx.bezierCurveTo(
            bodyWidth * 1.1, bottomY, // Control point 1
            bodyWidth * 1.1, waistY + 1.5 * scale, // Control point 2
            waistWidth, waistY // Waist
        );
        this.ctx.bezierCurveTo(
            bodyWidth, waistY - 1 * scale, // Control point 1
            bodyWidth * 0.9, shoulderY, // Control point 2
            0, shoulderY // Top center
        );
        
        this.ctx.closePath();
        
        // Gradient Fill
        const gradient = this.ctx.createLinearGradient(-3 * scale, -4 * scale, 3 * scale, 4 * scale);
        gradient.addColorStop(0, '#e57283'); // Bocchi Pink
        gradient.addColorStop(1, '#d93838');
        
        this.ctx.fillStyle = gradient;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
        this.ctx.fill();
        
        // --- Draw Pickguard (Refined) ---
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; 
        this.ctx.beginPath();
        this.ctx.moveTo(0.6 * scale, -0.5 * scale);
        this.ctx.bezierCurveTo(2.0 * scale, -0.5 * scale, 2.0 * scale, 2.0 * scale, 1 * scale, 2.0 * scale);
        this.ctx.lineTo(0.6 * scale, 0.5 * scale);
        this.ctx.fill();

        // --- Draw Soundhole (Cutout) ---
        // This cuts through EVERYTHING (Body + Background + Neck) to reveal the fixed section behind
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.beginPath();
        const holeRadius = 1.0 * scale;
        // Draw hole at (0,0) to align with center of screen
        this.ctx.arc(0, 0, holeRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Restore for Rosette and other details
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, holeRadius + 5, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // --- Draw Bridge ---
        this.ctx.fillStyle = '#5d4037'; // Rosewood
        this.ctx.fillRect(-1.5 * scale, 1.5 * scale, 3 * scale, 0.6 * scale);
        
        // --- Draw Strings (Over the hole, but thin) ---
        this.ctx.strokeStyle = '#c0c0c0'; // Silver
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        const stringSpacing = 0.2 * scale;
        for(let i = -2.5; i <= 2.5; i++) {
            const x = i * stringSpacing;
            this.ctx.moveTo(x, -7 * scale); // From nut
            this.ctx.lineTo(x, 1.8 * scale); // To bridge
        }
        this.ctx.stroke();

        this.ctx.restore();
    }
}

/**
 * Scroll Transitions Manager
 * Handles unique entrance animations and Scroll Jacking for Links Section
 */
class ScrollTransitions {
    constructor() {
        this.sections = document.querySelectorAll('section, footer');
        this.linksSection = document.getElementById('links');
        this.speedLines = new SpeedLines();
        
        // Links Section Elements
        if (this.linksSection) {
            this.wrapper = this.linksSection.querySelector('.sticky-wrapper');
            this.linksContent = this.linksSection.querySelector('.zoom-wrapper');
            this.linksText = this.linksSection.querySelector('.links-text-container');
            this.ring = this.linksSection.querySelector('.ring-container');
            this.items = this.linksSection.querySelectorAll('.note-link');
            this.guitarSection = document.getElementById('guitar');
        }
        
        this.init();
    }

    init() {
        this.checkPositions();
        window.addEventListener('scroll', () => this.checkPositions());
        // Listen to custom smoothscroll event for precise animation AND visibility checks
        window.addEventListener('smoothscroll', (e) => {
            this.onSmoothScroll(e.detail.y);
            this.checkPositions(); // Ensure we check visibility on virtual scroll
        });
    }

    checkPositions() {
        const triggerBottom = window.innerHeight * 0.8;
        const currentScroll = this.smoothScroll ? this.smoothScroll.current : window.scrollY; // Handle Virtual or Native

        this.sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            
            // Special Logic for #about (01 Profile)
            if (section.id === 'about') {
                // Logic: Reveal immediately upon entering viewport (even slightly)
                // This matches user request: "只要界面滑动，你就直接开始打开遮罩"
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    section.classList.add('in-view');
                }
            } 
            // Standard Logic for others
            else if (rect.top < triggerBottom && rect.bottom > 0) {
                section.classList.add('in-view');
            }
        });
    }
    
    onSmoothScroll(scrollY) {
        // --- Gallery Sticky Horizontal Scroll ---
        const gallery = document.getElementById('gallery');
        if (gallery) {
            const rect = gallery.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const gallerySticky = gallery.querySelector('.gallery-sticky');
            
            const sectionTop = rect.top;
            const sectionHeight = rect.height;
            
            // --- Sticky Logic ---
            // We want to pin the .gallery-sticky container while we scroll through the section
            if (sectionTop <= 0 && rect.bottom >= viewportHeight) {
                // Pin it
                if (gallerySticky) gallerySticky.style.transform = `translate3d(0, ${-sectionTop}px, 0)`;
            } else if (sectionTop > 0) {
                // Before
                if (gallerySticky) gallerySticky.style.transform = 'translate3d(0, 0, 0)';
            } else {
                // After (bottom align)
                if (gallerySticky) gallerySticky.style.transform = `translate3d(0, ${sectionHeight - viewportHeight}px, 0)`;
            }
            
            // --- Animation Logic ---
            // Calculate progress (0 to 1)
            const maxScroll = sectionHeight - viewportHeight;
            let progress = -sectionTop / maxScroll;
            if (progress < 0) progress = 0;
            if (progress > 1) progress = 1;

            // Only animate if roughly in view
            if (rect.top < viewportHeight && rect.bottom > 0) {
                const layerBack = gallery.querySelector('.layer-back-text');
                const layerImages = gallery.querySelector('.layer-images');
                
                
                // Direction Logic:
                // User wants "Images move RIGHT".
                // If we use positive translateX, content moves RIGHT.
                // We start from LEFT (negative X) and move towards RIGHT (positive X).
                
                const baseMove = 3000; // Slower speed (was 5000)
                
                if (layerBack) {
                    // Back Text: Deep Background (Parallax Factor 0.3)
                    // Start at -1500, Move to +1500
                    const startX = -1500;
                    const moveX = progress * baseMove * 0.3;
                    layerBack.style.transform = `translate3d(${startX + moveX}px, 0, -100px) scale(1.1)`;
                }
                
                if (layerImages) {
                    // Images: Middle (Parallax Factor 0.6)
                    const startX = -3000;
                    const moveX = progress * baseMove * 0.6;
                    layerImages.style.transform = `translate3d(${startX + moveX}px, 0, 0)`;
                }
                

                
                // --- Cube Transition Logic (Gallery -> Let's Rock) ---
                // Transition trigger zone: progress > 0.85
                const transitionStart = 0.85;
                if (progress > transitionStart) {
                    const transProgress = (progress - transitionStart) / (1.0 - transitionStart); // 0 to 1
                    
                    const gallerySticky = gallery.querySelector('.gallery-sticky');
                    if (gallerySticky) {
                        gallerySticky.style.transformOrigin = 'center bottom';
                        // Keep the Sticky Y offset but add rotation
                        // We need to calculate the correct Y offset for sticky behavior during transition
                        // It is still pinned until end of section
                        gallerySticky.style.transform = `translate3d(0, ${-sectionTop}px, 0) rotateX(${transProgress * 90}deg)`;
                        gallerySticky.style.opacity = 1 - transProgress * 0.5; 
                    }
                }
            }
        }
        
        // --- Independent Let's Rock Entrance Animation ---
        const letsRockSection = document.getElementById('lets-rock');
        if (letsRockSection) {
            const rockRect = letsRockSection.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            
            // If Let's Rock is entering from bottom
            if (rockRect.top < viewportHeight && rockRect.bottom > -viewportHeight) {
                let enterProgress = 1 - (rockRect.top / viewportHeight);
                if (enterProgress < 0) enterProgress = 0;
                if (enterProgress > 1) enterProgress = 1;
                
                letsRockSection.style.transformOrigin = 'center top';
                letsRockSection.style.perspective = '1000px';
                const rot = -90 * (1 - enterProgress);
                letsRockSection.style.transform = `rotateX(${rot}deg)`;
                letsRockSection.style.filter = `brightness(${enterProgress})`;
            }
        }

        // --- Let's Rock Logic ---
        const letsRock = document.getElementById('lets-rock');
        if (letsRock && !letsRock.hasAttribute('data-initialized')) {
            letsRock.setAttribute('data-initialized', 'true');
            const rockTrigger = letsRock.querySelector('.rock-circle');
            
            if (rockTrigger) {
                rockTrigger.addEventListener('click', () => {
                    // Create Flash Overlay
                    const flash = document.createElement('div');
                    flash.className = 'flash-overlay';
                    document.body.appendChild(flash);
                    
                    // Trigger Flash
                    requestAnimationFrame(() => {
                        flash.classList.add('active');
                    });
                    
                    // Play Audio (if ctx exists)
                    if (this.ctx && this.ctx.state === 'suspended') {
                        this.ctx.resume();
                    }
                    if (this.ctx) {
                        // Simple distortion chord
                        const now = this.ctx.currentTime;
                        const freqs = [130.81, 196.00, 261.63, 392.00]; // C Power Chord
                        freqs.forEach(f => {
                            const osc = this.ctx.createOscillator();
                            osc.type = 'sawtooth';
                            osc.frequency.value = f;
                            const gain = this.ctx.createGain();
                            gain.gain.setValueAtTime(0.1, now);
                            gain.gain.exponentialRampToValueAtTime(0.01, now + 1);
                            osc.connect(gain);
                            gain.connect(this.masterGain);
                            osc.start(now);
                            osc.stop(now + 1);
                        });
                    }

                    // Scroll to Footer after flash starts
                    setTimeout(() => {
                        const footer = document.getElementById('footer');
                        if (footer) {
                            footer.scrollIntoView({ behavior: 'auto' }); // Instant jump behind flash
                        }
                        
                        // Fade out flash
                        setTimeout(() => {
                            flash.classList.remove('active');
                            setTimeout(() => flash.remove(), 500);
                        }, 100);
                    }, 300);
                });
            }
        }

        if (!this.linksSection) return;
        
        const rect = this.linksSection.getBoundingClientRect();
        const sectionTop = rect.top;
        const sectionHeight = rect.height;
        const viewportHeight = window.innerHeight;
        
        // --- 1. Sticky Wrapper Logic ---
        if (sectionTop <= 0 && rect.bottom >= viewportHeight) {
            // Pin the wrapper
            this.wrapper.style.transform = `translate3d(0, ${-sectionTop}px, 0)`;
        } else if (sectionTop > 0) {
            // Before section
            this.wrapper.style.transform = 'translate3d(0, 0, 0)';
        } else {
            // After section (bottom aligned)
            this.wrapper.style.transform = `translate3d(0, ${sectionHeight - viewportHeight}px, 0)`;
        }
        
        // --- 2. Animation Logic ---
        const maxScroll = sectionHeight - viewportHeight;
        let progress = -sectionTop / maxScroll;
        
        // Clamp progress
        if (progress < 0) progress = 0;
        if (progress > 1) progress = 1;
        
        // Phase 1: Notes Orbit (0.0 - 0.5)
        const orbitStart = 0.0;
        const orbitEnd = 0.5;
        let orbitProgress = (progress - orbitStart) / (orbitEnd - orbitStart);
        if (orbitProgress < 0) orbitProgress = 0;
        if (orbitProgress > 1) orbitProgress = 1;
        
        if (this.items && this.ring) {
            const rect = this.ring.getBoundingClientRect();
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const baseRadius = Math.min(rect.width, rect.height) / 2 * 0.6; 
            const radius = baseRadius * (0.3 + 0.7 * orbitProgress);
            const rotation = orbitProgress * Math.PI * 2;
            
            this.items.forEach((item, index) => {
                const angle = rotation + (index * Math.PI / 2);
                const x = cx + radius * Math.cos(angle);
                const y = cy + radius * Math.sin(angle);
                
                item.style.left = `${x}px`;
                item.style.top = `${y}px`;
                item.style.transform = 'translate(-50%, -50%)';
                // Fade out notes as we zoom in next phase
                item.style.opacity = progress > 0.5 ? 1 - (progress - 0.5) * 5 : 1;
            });
        }
        
        // Phase 2: Tunnel Effect (0.3 - 1.0)
        this.speedLines.draw(progress);
        
        // Phase 3: Zoom into Soundhole (0.5 - 1.0)
        if (this.linksContent && this.guitarSection) {
            const zoomStart = 0.5;
            const zoomEnd = 1.0;
            let zoomProgress = (progress - zoomStart) / (zoomEnd - zoomStart);
            if (zoomProgress < 0) zoomProgress = 0;
            if (zoomProgress > 1) zoomProgress = 1;

            // Scale the whole content to zoom into the center (soundhole)
            // Power function for accelerating zoom
            // We need enough scale to move the hole edges off screen
            const scale = 1 + Math.pow(zoomProgress, 4) * 150; 
            
            this.linksContent.style.transformOrigin = 'center center';
            this.linksContent.style.transform = `scale(${scale})`;
            
            // --- Synchronized Zoom for Note Links ---
            // Instead of fading out, make them scale up and explode outwards
            if (this.items && zoomProgress > 0) {
                this.items.forEach((item) => {
                    // Get current transform (from orbit phase) or reset
                    // We want to add extra scale on top
                    // Since we are inside linksContent which is already scaling HUGE,
                    // we actually need to counter-scale or just let them fly.
                    // If we scale them up too, they will become massive.
                    // The user asked "Links zoom... simultaneously".
                    // Since the parent (linksContent) is zooming 150x, the children ARE zooming.
                    // But maybe they want them to stay visible longer?
                    // Let's keep opacity 1 until very end
                    item.style.opacity = zoomProgress > 0.8 ? 1 - (zoomProgress - 0.8) * 5 : 1;
                });
            }

            // As we zoom, we need to make sure the Section 3 (guitarSection) is visible BEHIND the hole.
            // We enable this logic as soon as we enter the section (rect.top < viewportHeight)
            // And keep it until the section is fully scrolled away (rect.bottom > 0) so the handover is seamless
            
            if (rect.top <= 0 && rect.bottom > 0) {
                // Instead of position: fixed (which breaks inside transformed container),
                // use translation to visually pin it to the viewport top.
                // rect.bottom is the distance from top of viewport to bottom of linksSection.
                // guitarSection is naturally at rect.bottom.
                // We want it at 0. So translate by -rect.bottom.
                
                this.guitarSection.style.position = 'relative'; // Keep in flow to maintain footer position
                this.guitarSection.style.zIndex = '5'; 
                this.guitarSection.style.opacity = 1;
                
                // Centered scale logic
                this.guitarSection.style.transformOrigin = '50% 50%';
                
                // Exponential ease for "flying into" effect
                // Start at calculated ratio to match string spacing
                // Section 2 Spacing = min(w, h) * 0.13 * 0.2
                // Section 3 Spacing approx 50px
                // innerScale = (min(w, h) * 0.026) / 50
                const viewportMian = Math.min(window.innerWidth, window.innerHeight);
                const targetStartScale = (viewportMian * 0.026) / 50;
                
                // Use the calculated start scale, but clamp it reasonable (e.g. 0.4 to 0.8) to prevent extreme sizes
                const startScale = Math.max(0.4, Math.min(0.8, targetStartScale));
                
                const ease = Math.pow(zoomProgress, 2.5); 
                const innerScale = startScale + (1.0 - startScale) * ease; 
                
                // Opacity adjustment: fade in as we get closer to prevent "ghosting" too early
                // but keep visible enough to see target
                this.guitarSection.style.opacity = 0.8 + 0.2 * zoomProgress;
                
                // Apply BOTH translation (for position) and scale (for zoom)
                this.guitarSection.style.transform = `translate3d(0, ${-rect.bottom}px, 0) scale(${innerScale})`;
                
                // --- CLIP PATH MASK ---
                // We clip the guitarSection so it is ONLY visible inside the soundhole.
                // The soundhole radius on the canvas is approximately: min(w, h) * 0.13 * 1.0 (from GuitarCanvas)
                // However, the visual hole scales UP as zoomProgress increases.
                // Visual Hole Radius = Base Radius * Outer Scale
                // Outer Scale (scale) = 1 + Math.pow(zoomProgress, 4) * 150
                
                // Wait, if we use clip-path on guitarSection, we need to consider that guitarSection ITSELF is scaling (innerScale).
                // So the clip-path circle radius needs to be relative to the SCALED guitarSection size? 
                // No, clip-path is applied to the element's box.
                // If the element is scaled by innerScale, the clip-path coordinate system is also scaled? Yes.
                
                // Let's simplify:
                // Visual Hole Size on Screen = BaseHoleSize * OuterScale
                // Guitar Section Size on Screen = ViewportSize * InnerScale
                // We want the Visible Part of Guitar Section = Visual Hole Size
                
                // So, Clip Radius (in GuitarSection local coords) = (Visual Hole Size on Screen) / InnerScale
                
                const viewportMin = Math.min(window.innerWidth, window.innerHeight);
                const baseHoleRadius = viewportMin * 0.13; // Matches GuitarCanvas logic
                const visualHoleRadius = baseHoleRadius * scale; // scale is the outer zoom
                
                // Clip radius in local unscaled pixels (since clip-path applies before transform? No, standard CSS: clip-path applies to the box, transform scales the result)
                // Actually, clip-path applies to the border-box. 
                // If we transform: scale(), the visual clip path scales too.
                // So: VisualClipRadius = DefinedClipRadius * InnerScale
                // We want: VisualClipRadius = visualHoleRadius
                // So: DefinedClipRadius = visualHoleRadius / innerScale
                
                const clipRadius = visualHoleRadius / innerScale;
                
                // Apply circular clip
                this.guitarSection.style.clipPath = `circle(${clipRadius}px at 50% 50%)`;

                this.guitarSection.style.willChange = 'transform, opacity, clip-path';

                // --- ALIGN FRETBOARD STRINGS WITH CANVAS STRINGS ---
                // Problem: Section 3 content (Fretboard) might not be perfectly centered relative to the screen center.
                // We need to shift Section 3 vertically so its Fretboard Center matches the Window Center.
                
                const fretboard = document.getElementById('fretboard');
                if (fretboard) {
                    // We only need to calculate this offset once or when resize, but doing it here is safe enough for now.
                    // However, getBoundingClientRect() depends on current transform.
                    // We need the "natural" offset.
                    // Let's assume the layout is stable.
                    // Center of guitarSection is at 50% of viewport (since we translate it to top:0).
                    // Center of Fretboard relative to guitarSection?
                    // We can estimate this by looking at the structure.
                    // But simpler: let's just manually tweak the offset based on user feedback "Too High".
                    // If it's too high, we need to push it down (positive Y).
                    // User said "Section 3 is biased upwards".
                    // Let's try adding a fixed offset, or better, calculate it.
                    
                    // We can't easily get the unscaled rect during animation.
                    // Let's add a manual adjustment factor.
                    const yOffset = 55; // Push down more (was 40) to align strings better.
                    
                    // Update transform to include this offset
                    this.guitarSection.style.transform = `translate3d(0, ${-rect.bottom + yOffset}px, 0) scale(${innerScale})`;
                }
                
            } else {
                // Reset when Links section is out of view (either above or below)
                // If rect.bottom <= 0, we are below Links, so GuitarSection is now at top of viewport naturally.
                this.guitarSection.style.position = '';
                this.guitarSection.style.top = '';
                this.guitarSection.style.left = '';
                this.guitarSection.style.width = '';
                this.guitarSection.style.height = '';
                this.guitarSection.style.zIndex = '';
                this.guitarSection.style.transform = ''; // Reset
                this.guitarSection.style.clipPath = '';
            }
            
            // Pass through clicks when zoomed in
            // Don't fade out visually, let the hole expansion do the work
            // Just disable interaction with the ring/links
            if (zoomProgress > 0.8) {
                this.linksSection.style.pointerEvents = 'none';
            } else {
                this.linksSection.style.pointerEvents = 'auto';
            }
            
            // Ensure opacity stays 1 so we fly THROUGH the hole, not ghost through it
            this.linksSection.style.opacity = 1;
            
            // Fade out title text
            if (this.linksText) {
                this.linksText.style.opacity = 1 - zoomProgress * 3;
                if (this.linksText.style.opacity < 0) this.linksText.style.opacity = 0;
            }
        }
    }
}

/**
 * Web Audio API Guitar Synthesizer - Enhanced Version
 * Supports 6 strings, 12 frets, and chords
 */
class GuitarSynth {
    constructor() {
        this.fretboard = document.getElementById('fretboard');
        this.volControl = document.getElementById('volume');
        this.distControl = document.getElementById('distortion');
        
        if (!this.fretboard) return;

        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.distortion = this.ctx.createWaveShaper();
        
        // Connect chain: Source -> Distortion -> MasterGain -> Destination
        this.distortion.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
        
        this.masterGain.gain.value = 0.5;
        this.setDistortion(50);
        
        // Standard Tuning (E2, A2, D3, G3, B3, E4)
        this.baseFreqs = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63].reverse(); // Reverse for Top-Down visual (High E top)
        
        // Map keyboard keys to C Major Scale (approximate range for Twinkle Twinkle)
        // C4, D4, E4, F4, G4, A4, B4, C5
        this.keyboardMap = {
            'A': 261.63, // C4
            'S': 293.66, // D4
            'D': 329.63, // E4
            'F': 349.23, // F4
            'G': 392.00, // G4
            'H': 440.00, // A4
            'J': 493.88, // B4
            'K': 523.25, // C5
            'L': 587.33  // D5
        };

        this.initUI();
        this.initEvents();
        this.initRockSolo();
    }
    
    initRockSolo() {
        const rockWord = document.querySelector('.word-rock');
        if (rockWord) {
            rockWord.addEventListener('mouseenter', () => {
                this.playRandomSolo();
            });
        }
    }

    playRandomSolo() {
        // Resume AudioContext if suspended (browser policy)
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(e => console.log("AudioContext resume failed:", e));
        }
        
        if (!this.ctx) return;
        
        // Simple pentatonic licks or random shred
        const scale = [261.63, 311.13, 349.23, 392.00, 466.16, 523.25]; // C Minor Pentatonic
        
        const now = this.ctx.currentTime;
        const notes = 5;
        
        for (let i = 0; i < notes; i++) {
            const freq = scale[Math.floor(Math.random() * scale.length)];
            const time = now + (i * 0.1);
            
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.5, time + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
            
            osc.connect(gain);
            gain.connect(this.distortion); // Use existing distortion
            
            osc.start(time);
            osc.stop(time + 0.15);
            
            // Visual feedback on strings
            setTimeout(() => {
                this.animateString(Math.floor(Math.random() * 6));
            }, i * 100);
        }
    }
    
    makeDistortionCurve(amount) {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        
        for (let i = 0; i < n_samples; ++i) {
            const x = i * 2 / n_samples - 1;
            curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }

    setDistortion(val) {
        this.distortion.curve = this.makeDistortionCurve(val);
        this.distortion.oversample = '4x';
    }

    playNote(freq) {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        
        osc.type = 'sawtooth'; // Guitar-like
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        // Envelope
        noteGain.gain.setValueAtTime(0, this.ctx.currentTime);
        noteGain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 0.01); // Attack
        noteGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5); // Decay
        
        osc.connect(noteGain);
        noteGain.connect(this.distortion);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 1.5);
    }

    playString(stringIndex, fretIndex) {
        // Calculate frequency: f = base * 2^(fret/12)
        const baseFreq = this.baseFreqs[stringIndex];
        const freq = baseFreq * Math.pow(2, fretIndex / 12);
        
        this.playNote(freq);
        this.animateString(stringIndex);
        this.createVisualNote(stringIndex, fretIndex);
    }

    createVisualNote(stringIndex, fretIndex) {
        const note = document.createElement('div');
        note.classList.add('visual-note');
        
        // Position based on grid
        // String height is ~50px (300px / 6)
        // Fret width decreases log-ish or just linear for simple CSS
        const stringHeight = 300 / 6;
        const fretWidth = 100 / 13; // 12 frets + open
        
        const top = (stringIndex * stringHeight) + (stringHeight / 2);
        const left = (fretIndex * fretWidth) + (fretWidth / 2);
        
        note.style.top = `${top}px`;
        note.style.left = `${left}%`;
        
        this.fretboard.appendChild(note);
        setTimeout(() => note.remove(), 1000);
    }
    
    animateString(stringIndex) {
        // Find the string element
        const strings = this.fretboard.querySelectorAll('.string');
        if (strings[stringIndex]) {
            strings[stringIndex].classList.add('vibrating');
            setTimeout(() => strings[stringIndex].classList.remove('vibrating'), 200);
        }
    }

    initUI() {
        this.fretboard.innerHTML = ''; // Clear existing
        
        // Add strings
        this.baseFreqs.forEach((_, i) => {
            const string = document.createElement('div');
            string.classList.add('string');
            // Calculate position to distribute 6 strings evenly within the fretboard height
            // We use absolute positioning percentages
            string.style.top = `${(i * 100) / 6 + (100/12)}%`; 
            this.fretboard.appendChild(string);
        });

        // Add frets (vertical lines)
        for (let i = 1; i <= 12; i++) {
            const fret = document.createElement('div');
            fret.classList.add('fret-line');
            fret.style.left = `${(i * 100) / 13}%`;
            fret.setAttribute('data-fret', i);
            this.fretboard.appendChild(fret);
            
            // Fret markers (dots)
            if ([3, 5, 7, 9, 12].includes(i)) {
                const marker = document.createElement('div');
                marker.classList.add('fret-dot');
                marker.style.left = `${(i * 100) / 13 - (50/13)}%`; // Center between frets
                if (i === 12) {
                    // Double dot for 12th fret
                    marker.classList.add('double');
                }
                this.fretboard.appendChild(marker);
            }
        }
        
        // Add fret numbers
        const numbers = document.createElement('div');
        numbers.classList.add('fret-numbers');
        for (let i = 0; i <= 12; i++) {
             const num = document.createElement('span');
             num.textContent = i;
             num.style.left = `${(i * 100) / 13}%`;
             numbers.appendChild(num);
        }
        this.fretboard.appendChild(numbers);
    }

    playTwinkleTwinkle() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const melody = [
            // Line 1: C C G G A A G
            { key: 'A', dur: 0.5 }, { key: 'A', dur: 0.5 },
            { key: 'G', dur: 0.5 }, { key: 'G', dur: 0.5 },
            { key: 'H', dur: 0.5 }, { key: 'H', dur: 0.5 },
            { key: 'G', dur: 1.0 },
            
            // Line 2: F F E E D D C
            { key: 'F', dur: 0.5 }, { key: 'F', dur: 0.5 },
            { key: 'D', dur: 0.5 }, { key: 'D', dur: 0.5 },
            { key: 'S', dur: 0.5 }, { key: 'S', dur: 0.5 },
            { key: 'A', dur: 1.0 },

             // Line 3: G G F F E E D
            { key: 'G', dur: 0.5 }, { key: 'G', dur: 0.5 },
            { key: 'F', dur: 0.5 }, { key: 'F', dur: 0.5 },
            { key: 'D', dur: 0.5 }, { key: 'D', dur: 0.5 },
            { key: 'S', dur: 1.0 },

            // Line 4: G G F F E E D
            { key: 'G', dur: 0.5 }, { key: 'G', dur: 0.5 },
            { key: 'F', dur: 0.5 }, { key: 'F', dur: 0.5 },
            { key: 'D', dur: 0.5 }, { key: 'D', dur: 0.5 },
            { key: 'S', dur: 1.0 },

            // Line 5: C C G G A A G
            { key: 'A', dur: 0.5 }, { key: 'A', dur: 0.5 },
            { key: 'G', dur: 0.5 }, { key: 'G', dur: 0.5 },
            { key: 'H', dur: 0.5 }, { key: 'H', dur: 0.5 },
            { key: 'G', dur: 1.0 },

            // Line 6: F F E E D D C
            { key: 'F', dur: 0.5 }, { key: 'F', dur: 0.5 },
            { key: 'D', dur: 0.5 }, { key: 'D', dur: 0.5 },
            { key: 'S', dur: 0.5 }, { key: 'S', dur: 0.5 },
            { key: 'A', dur: 1.0 }
        ];

        let currentTime = this.ctx.currentTime;
        let delay = 0;

        melody.forEach(note => {
            const freq = this.keyboardMap[note.key];
            if (freq) {
                const start = currentTime + delay;
                
                // Play note
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.value = freq;
                
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.5, start + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, start + note.dur - 0.05);
                
                osc.connect(gain);
                gain.connect(this.distortion);
                
                osc.start(start);
                osc.stop(start + note.dur);

                // Visual
                setTimeout(() => {
                    this.animateString(Math.floor(Math.random() * 6));
                    const keyEl = document.querySelector(`.key[data-key="${note.key}"]`);
                    if(keyEl) {
                         keyEl.classList.add('active');
                         setTimeout(() => keyEl.classList.remove('active'), note.dur * 1000 - 50);
                    }
                }, delay * 1000);

                delay += note.dur;
            }
        });
    }

    initEvents() {
        // Play Button
        const playBtn = document.getElementById('play-twinkle');
        if (playBtn) {
            playBtn.addEventListener('click', () => this.playTwinkleTwinkle());
        }

        // Keyboard (Simplified C Major Scale)
        window.addEventListener('keydown', (e) => {
            const key = e.key.toUpperCase();
            if (this.keyboardMap[key]) {
                this.playNote(this.keyboardMap[key]);
                
                // Visual feedback for keyboard is generic
                this.animateString(Math.floor(Math.random() * 6)); 
                
                const keyEl = document.querySelector(`.key[data-key="${key}"]`);
                if(keyEl) {
                    keyEl.classList.add('active');
                    setTimeout(() => keyEl.classList.remove('active'), 100);
                }
            }
        });

        // Click on Fretboard (Advanced)
        this.fretboard.addEventListener('click', (e) => {
            const rect = this.fretboard.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const width = rect.width;
            const height = rect.height;
            
            // Determine String (0-5)
            const stringHeight = height / 6;
            const stringIndex = Math.floor(y / stringHeight);
            
            // Determine Fret (0-12)
            const fretWidth = width / 13;
            const fretIndex = Math.floor(x / fretWidth);
            
            if (stringIndex >= 0 && stringIndex < 6 && fretIndex >= 0 && fretIndex <= 12) {
                this.playString(stringIndex, fretIndex);
            }
        });

        // Controls
        if(this.volControl) {
            this.volControl.addEventListener('input', (e) => {
                this.masterGain.gain.value = e.target.value;
            });
        }
        
        if(this.distControl) {
            this.distControl.addEventListener('input', (e) => {
                this.setDistortion(parseInt(e.target.value));
            });
        }
    }
}

class BocchiSticker {
    constructor() {
        this.sticker = document.getElementById('bocchi-sticker');
        if (!this.sticker) return;
        
        this.basePath = 'assets/bocchi/bocchi0x00';
        this.count = 19;
        this.current = 0;
        
        this.init();
    }
    
    init() {
        // Randomly change sticker on click
        this.sticker.addEventListener('click', () => {
            this.changeSticker();
            this.animateJump();
        });
        
        // Auto change every 10s
        setInterval(() => this.changeSticker(), 10000);
    }
    
    changeSticker() {
        // Random index 0-18
        const idx = Math.floor(Math.random() * this.count);
        // Convert to Hex (2 digits, uppercase)
        const hex = idx.toString(16).toUpperCase().padStart(2, '0');
        this.sticker.src = `${this.basePath}${hex}.gif`;
    }
    
    animateJump() {
        this.sticker.style.transform = 'translateY(-20px) rotate(10deg)';
        setTimeout(() => {
            this.sticker.style.transform = 'translateY(0) rotate(0deg)';
        }, 200);
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    new Loader();
    new Cursor();
    new CanvasBackground();
    new SmoothScroll();
    new GuitarCanvas(); // Add Guitar Canvas
    new ScrollTransitions();
    new GuitarSynth();
    new BocchiSticker();
});
