// ============================================
// rAyMant - PREMIUM RANDOM NAME PICKER
// ============================================

class RayMant {
    constructor() {
        this.names = [];
        this.currentDevice = null;
        this.isSpinning = false;
        this.wheelRotation = 0; // Base rotation for drawing segments
        this.wheelCanvas = null;
        this.wheelCtx = null;
        this.starfieldCanvas = null;
        this.starfieldCtx = null;
        this.stars = [];
        this.particles = []; // For 3D interactive particles
        this.wheelSize = 400;
        this.pointerAngle = -Math.PI / 2; // Top center (fixed)
        this.spinCount = 0; // Track spin count for ad gate logic
        this.mouseX = 0;
        this.mouseY = 0;
        this.touchX = 0;
        this.touchY = 0;
        
        this.init();
    }

    init() {
        this.setupDeviceSelector();
        this.setupInteractiveStarfield();
        this.setupEventListeners();
    }

    // ============================================
    // DEVICE SELECTOR
    // ============================================

    setupDeviceSelector() {
        const deviceButtons = document.querySelectorAll('.device-btn');
        const deviceSelector = document.getElementById('deviceSelector');

        deviceButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const device = btn.dataset.device;
                this.selectDevice(device);
                deviceSelector.classList.add('hidden');
            });
        });
    }

    selectDevice(device) {
        this.currentDevice = device;
        const desktopLayout = document.getElementById('desktopLayout');
        const mobileLayout = document.getElementById('mobileLayout');

        if (device === 'desktop') {
            desktopLayout.classList.remove('hidden');
            mobileLayout.classList.add('hidden');
            this.wheelCanvas = document.getElementById('wheelCanvas');
        } else {
            desktopLayout.classList.add('hidden');
            mobileLayout.classList.remove('hidden');
            this.wheelCanvas = document.getElementById('mobileWheelCanvas');
        }

        this.wheelCtx = this.wheelCanvas.getContext('2d');
        this.setupWheelCanvas();
        // Reset wheel rotation
        this.wheelRotation = 0;
        this.wheelCanvas.style.transform = 'rotate(0deg)';
        this.drawWheel();
    }

    // ============================================
    // INTERACTIVE 3D STARFIELD ANIMATION
    // ============================================

    setupInteractiveStarfield() {
        this.starfieldCanvas = document.getElementById('starfield');
        this.starfieldCtx = this.starfieldCanvas.getContext('2d');
        
        this.resizeStarfield();
        window.addEventListener('resize', () => this.resizeStarfield());
        
        // Create 3D particles that react to mouse/touch
        const particleCount = 300;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.starfieldCanvas.width,
                y: Math.random() * this.starfieldCanvas.height,
                z: Math.random() * 1000, // Depth
                radius: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.5 + 0.1,
                opacity: Math.random() * 0.8 + 0.2,
                color: Math.random() > 0.5 ? 'rgba(0, 242, 255, ' : 'rgba(255, 0, 189, '
            });
        }
        
        // Mouse movement tracking (Desktop)
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
        
        // Touch movement tracking (Mobile)
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.touchX = e.touches[0].clientX;
                this.touchY = e.touches[0].clientY;
            }
        }, { passive: true });
        
        this.animateInteractiveStarfield();
    }

    resizeStarfield() {
        this.starfieldCanvas.width = window.innerWidth;
        this.starfieldCanvas.height = window.innerHeight;
    }

    animateInteractiveStarfield() {
        this.starfieldCtx.clearRect(0, 0, this.starfieldCanvas.width, this.starfieldCanvas.height);
        
        const centerX = this.starfieldCanvas.width / 2;
        const centerY = this.starfieldCanvas.height / 2;
        
        // Get interaction point (mouse or touch)
        const interactionX = this.touchX || this.mouseX || centerX;
        const interactionY = this.touchY || this.mouseY || centerY;
        
        this.particles.forEach(particle => {
            // Move particles
            particle.z -= particle.speed * 2;
            if (particle.z <= 0) {
                particle.z = 1000;
                particle.x = Math.random() * this.starfieldCanvas.width;
                particle.y = Math.random() * this.starfieldCanvas.height;
            }
            
            // Calculate 3D position
            const k = 128 / particle.z;
            const px = (particle.x - centerX) * k + centerX;
            const py = (particle.y - centerY) * k + centerY;
            const pr = particle.radius * k;
            
            // React to mouse/touch interaction
            const dx = interactionX - px;
            const dy = interactionY - py;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = 200;
            
            if (distance < maxDistance) {
                const force = (1 - distance / maxDistance) * 50;
                particle.x += (dx / distance) * force * 0.01;
                particle.y += (dy / distance) * force * 0.01;
                
                // Increase opacity when near interaction
                const enhancedOpacity = Math.min(1, particle.opacity + (1 - distance / maxDistance) * 0.5);
                this.drawParticle(px, py, pr, particle.color, enhancedOpacity);
            } else {
                this.drawParticle(px, py, pr, particle.color, particle.opacity);
            }
        });
        
        requestAnimationFrame(() => this.animateInteractiveStarfield());
    }

    drawParticle(x, y, radius, colorBase, opacity) {
        this.starfieldCtx.beginPath();
        this.starfieldCtx.arc(x, y, radius, 0, Math.PI * 2);
        this.starfieldCtx.fillStyle = colorBase + opacity + ')';
        this.starfieldCtx.fill();
        
        // Add glow effect
        this.starfieldCtx.shadowBlur = radius * 5;
        this.starfieldCtx.shadowColor = colorBase + '0.8)';
    }

    // ============================================
    // WHEEL SETUP & DRAWING
    // ============================================

    setupWheelCanvas() {
        const size = this.currentDevice === 'mobile' ? 300 : 400;
        this.wheelSize = size;
        this.wheelCanvas.width = size;
        this.wheelCanvas.height = size;
        // Ensure canvas uses transform-origin center for rotation
        this.wheelCanvas.style.transformOrigin = 'center center';
    }

    drawWheel() {
        if (!this.wheelCtx || this.names.length === 0) {
            this.drawEmptyWheel();
            return;
        }

        const centerX = this.wheelSize / 2;
        const centerY = this.wheelSize / 2;
        const radius = this.wheelSize / 2 - 10;
        const anglePerSegment = (Math.PI * 2) / this.names.length;

        // Clear canvas
        this.wheelCtx.clearRect(0, 0, this.wheelSize, this.wheelSize);

        // Draw segments (base rotation, actual rotation handled by CSS transform)
        // We draw at base position starting from top (-Math.PI/2), then CSS transforms the entire canvas
        // In canvas, 0 radians = right, so we offset by -Math.PI/2 to start from top
        const offsetAngle = -Math.PI / 2;
        this.names.forEach((name, index) => {
            const startAngle = index * anglePerSegment + offsetAngle;
            const endAngle = (index + 1) * anglePerSegment + offsetAngle;

            // Create gradient for each segment
            const gradient = this.wheelCtx.createLinearGradient(
                centerX + Math.cos(startAngle) * radius,
                centerY + Math.sin(startAngle) * radius,
                centerX + Math.cos(endAngle) * radius,
                centerY + Math.sin(endAngle) * radius
            );

            // Alternate between neon blue and neon pink
            if (index % 2 === 0) {
                gradient.addColorStop(0, 'rgba(0, 242, 255, 0.8)');
                gradient.addColorStop(1, 'rgba(0, 242, 255, 0.4)');
            } else {
                gradient.addColorStop(0, 'rgba(255, 0, 189, 0.8)');
                gradient.addColorStop(1, 'rgba(255, 0, 189, 0.4)');
            }

            // Draw segment
            this.wheelCtx.beginPath();
            this.wheelCtx.moveTo(centerX, centerY);
            this.wheelCtx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.wheelCtx.closePath();
            this.wheelCtx.fillStyle = gradient;
            this.wheelCtx.fill();

            // Draw border
            this.wheelCtx.strokeStyle = index % 2 === 0 ? '#00f2ff' : '#ff00bd';
            this.wheelCtx.lineWidth = 2;
            this.wheelCtx.stroke();

            // Draw text
            const textAngle = startAngle + anglePerSegment / 2;
            const textRadius = radius * 0.7;
            const textX = centerX + Math.cos(textAngle) * textRadius;
            const textY = centerY + Math.sin(textAngle) * textRadius;

            this.wheelCtx.save();
            this.wheelCtx.translate(textX, textY);
            this.wheelCtx.rotate(textAngle + Math.PI / 2);
            this.wheelCtx.fillStyle = '#ffffff';
            this.wheelCtx.font = 'bold 14px Poppins';
            this.wheelCtx.textAlign = 'center';
            this.wheelCtx.textBaseline = 'middle';
            this.wheelCtx.shadowBlur = 5;
            this.wheelCtx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            
            // Truncate long names
            const maxWidth = radius * 0.8;
            let displayName = name;
            const metrics = this.wheelCtx.measureText(name);
            if (metrics.width > maxWidth) {
                displayName = name.substring(0, Math.floor(name.length * maxWidth / metrics.width) - 3) + '...';
            }
            
            this.wheelCtx.fillText(displayName, 0, 0);
            this.wheelCtx.restore();
        });

        // Draw center circle
        this.wheelCtx.beginPath();
        this.wheelCtx.arc(centerX, centerY, 30, 0, Math.PI * 2);
        this.wheelCtx.fillStyle = '#0f172a';
        this.wheelCtx.fill();
        this.wheelCtx.strokeStyle = '#00f2ff';
        this.wheelCtx.lineWidth = 3;
        this.wheelCtx.stroke();
    }

    drawEmptyWheel() {
        const centerX = this.wheelSize / 2;
        const centerY = this.wheelSize / 2;
        const radius = this.wheelSize / 2 - 10;

        this.wheelCtx.clearRect(0, 0, this.wheelSize, this.wheelSize);

        // Draw empty circle
        this.wheelCtx.beginPath();
        this.wheelCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.wheelCtx.strokeStyle = 'rgba(0, 242, 255, 0.3)';
        this.wheelCtx.lineWidth = 3;
        this.wheelCtx.stroke();

        // Draw message
        this.wheelCtx.fillStyle = 'rgba(0, 242, 255, 0.6)';
        this.wheelCtx.font = '16px Poppins';
        this.wheelCtx.textAlign = 'center';
        this.wheelCtx.textBaseline = 'middle';
        this.wheelCtx.fillText('Add names to start', centerX, centerY);
    }

    // ============================================
    // SPIN WHEEL LOGIC WITH AD GATE SYSTEM
    // ============================================

    shouldShowAd() {
        // Gate Logic:
        // 1st Spin: MUST show ad
        // 2nd Spin: No ad
        // 3rd Spin onwards: Show ad every 3 spins
        if (this.spinCount === 0) {
            return true; // First spin always shows ad
        } else if (this.spinCount === 1) {
            return false; // Second spin, no ad
        } else {
            // From 3rd spin, show ad every 3 spins (spins 3, 6, 9, 12...)
            return (this.spinCount - 1) % 3 === 0;
        }
    }

    showAdGate() {
        // Open ad in new tab/window
        // Using the ad script's redirect mechanism
        window.open('https://pl28448808.effectivegatecpm.com/03/3b/52/033b529bcff4fbc367c67045cb023c5b', '_blank');
        
        // Return a promise that resolves after a delay (allows ad to load)
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 1500); // Brief delay to allow ad interaction
        });
    }

    async spinWheel() {
        if (this.isSpinning || this.names.length === 0) return;

        // Check if we should show ad gate
        if (this.shouldShowAd()) {
            await this.showAdGate();
        }

        this.isSpinning = true;
        this.spinCount++;
        const spinBtn = this.currentDevice === 'desktop' 
            ? document.getElementById('spinBtn')
            : document.getElementById('mobileSpinBtn');
        spinBtn.disabled = true;

        // Random spin: 5-10 full rotations + random angle
        const fullRotations = 5 + Math.random() * 5;
        const randomAngle = Math.random() * Math.PI * 2;
        const totalRotationRad = fullRotations * Math.PI * 2 + randomAngle;
        const totalRotationDeg = (totalRotationRad * 180) / Math.PI;
        
        // Calculate final rotation (in degrees)
        const startRotation = this.wheelRotation;
        const finalRotationDeg = startRotation + totalRotationDeg;
        
        // Smooth animation using requestAnimationFrame for ultra-smooth spinning
        const duration = 6000; // 6 seconds
        const startTime = performance.now();
        
        // Smooth easing function (ease-out cubic for natural deceleration)
        const easeOutCubic = (t) => {
            return 1 - Math.pow(1 - t, 3);
        };
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Apply smooth easing
            const easedProgress = easeOutCubic(progress);
            
            // Calculate current rotation
            const currentRotation = startRotation + (totalRotationDeg * easedProgress);
            
            // Apply transform (pointer stays fixed, wheel rotates)
            this.wheelCanvas.style.transform = `rotate(${currentRotation}deg)`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Animation complete
                this.wheelRotation = finalRotationDeg;
                this.onSpinComplete(totalRotationRad);
            }
        };
        
        // Start animation
        requestAnimationFrame(animate);
    }

    onSpinComplete(totalRotationRad) {
        this.isSpinning = false;
        const spinBtn = this.currentDevice === 'desktop' 
            ? document.getElementById('spinBtn')
            : document.getElementById('mobileSpinBtn');
        spinBtn.disabled = false;

        // Calculate winner based on fixed pointer at top
        // Segments are drawn starting from top (-Math.PI/2), pointer is at top
        // When wheel rotates, we need to find which segment is now at the top position
        const normalizedRotation = ((totalRotationRad % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const anglePerSegment = (Math.PI * 2) / this.names.length;
        
        // Since segments start from top and rotate clockwise, we calculate:
        // Which segment index corresponds to the top position after rotation
        // The rotation is clockwise, so we need to reverse it to find the original segment
        let winnerIndex = Math.floor((normalizedRotation) / anglePerSegment);
        
        // Reverse the index because wheel rotates clockwise but segments are numbered from top
        winnerIndex = this.names.length - (winnerIndex % this.names.length);
        if (winnerIndex >= this.names.length) winnerIndex -= this.names.length;
        if (winnerIndex < 0) winnerIndex += this.names.length;

        const winner = this.names[winnerIndex];
        this.showWinner(winner);
    }

    // ============================================
    // WINNER POPUP & CONFETTI
    // ============================================

    showWinner(name) {
        const popup = document.getElementById('winnerPopup');
        const winnerName = document.getElementById('winnerName');
        
        winnerName.textContent = name;
        popup.classList.remove('hidden');

        // Confetti explosion
        this.fireConfetti();
    }

    fireConfetti() {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            // Neon blue confetti
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ['#00f2ff', '#00d4ff', '#00b8ff']
            });

            // Neon pink confetti
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ['#ff00bd', '#ff00e6', '#ff00ff']
            });
        }, 250);
    }

    // ============================================
    // NAME MANAGEMENT
    // ============================================

    addName(name) {
        const trimmedName = name.trim();
        if (trimmedName && !this.names.includes(trimmedName)) {
            this.names.push(trimmedName);
            this.updateNamesList();
            this.drawWheel();
            return true;
        }
        return false;
    }

    deleteName(index) {
        this.names.splice(index, 1);
        this.updateNamesList();
        this.drawWheel();
    }

    updateNamesList() {
        const desktopList = document.getElementById('namesList');
        const mobileList = document.getElementById('mobileNamesList');

        [desktopList, mobileList].forEach(list => {
            if (!list) return;
            
            list.innerHTML = '';
            this.names.forEach((name, index) => {
                const item = document.createElement('div');
                item.className = 'name-item';
                item.innerHTML = `
                    <span>${name}</span>
                    <button class="delete-btn" data-index="${index}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                `;
                list.appendChild(item);
            });

            // Add delete event listeners
            list.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.dataset.index);
                    this.deleteName(index);
                });
            });
        });
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    setupEventListeners() {
        // Desktop name input
        const desktopInput = document.getElementById('nameInput');
        const desktopAddBtn = document.getElementById('addNameBtn');
        
        if (desktopInput && desktopAddBtn) {
            desktopAddBtn.addEventListener('click', () => {
                if (this.addName(desktopInput.value)) {
                    desktopInput.value = '';
                }
            });

            desktopInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    if (this.addName(desktopInput.value)) {
                        desktopInput.value = '';
                    }
                }
            });
        }

        // Mobile name input
        const mobileInput = document.getElementById('mobileNameInput');
        const mobileAddBtn = document.getElementById('mobileAddNameBtn');
        
        if (mobileInput && mobileAddBtn) {
            mobileAddBtn.addEventListener('click', () => {
                if (this.addName(mobileInput.value)) {
                    mobileInput.value = '';
                }
            });

            mobileInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    if (this.addName(mobileInput.value)) {
                        mobileInput.value = '';
                    }
                }
            });
        }

        // Spin buttons
        const desktopSpinBtn = document.getElementById('spinBtn');
        const mobileSpinBtn = document.getElementById('mobileSpinBtn');

        if (desktopSpinBtn) {
            desktopSpinBtn.addEventListener('click', () => this.spinWheel());
        }

        if (mobileSpinBtn) {
            mobileSpinBtn.addEventListener('click', () => this.spinWheel());
        }

        // Winner popup close
        const closeWinnerBtn = document.getElementById('closeWinnerBtn');
        if (closeWinnerBtn) {
            closeWinnerBtn.addEventListener('click', () => {
                document.getElementById('winnerPopup').classList.add('hidden');
            });
        }

        // Mobile navigation
        const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn');
        mobileNavBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchMobileView(view);
                
                // Update active state
                mobileNavBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    switchMobileView(view) {
        const namesView = document.getElementById('mobileNamesView');
        const wheelView = document.getElementById('mobileWheelView');

        if (view === 'names') {
            namesView.classList.add('active');
            wheelView.classList.remove('active');
        } else {
            namesView.classList.remove('active');
            wheelView.classList.add('active');
            // Redraw wheel when switching to wheel view
            setTimeout(() => this.drawWheel(), 100);
        }
    }
}

// ============================================
// INITIALIZE rAyMant APP
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    window.rayMantApp = new RayMant();
});