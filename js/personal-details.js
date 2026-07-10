import { auth, onAuthStateChanged } from "./firebase-init.js";

/**
 * CyberShield Awareness - Personal Details Setup Logic
 * Manages operator configuration, clearance preview, and matrix-particle background.
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // --- COMPONENT SELECTORS ---
  const matrixCanvas = document.getElementById('matrix-canvas');
  const particlesCanvas = document.getElementById('background-canvas');
  
  const form = document.getElementById('operator-details-form');
  const nameInput = document.getElementById('operator-name-input');
  const codenameInput = document.getElementById('operator-codename-input');
  const deptSelect = document.getElementById('operator-dept-select');
  const clearanceSelect = document.getElementById('operator-clearance-select');
  const nodeSelect = document.getElementById('operator-node-select');
  
  // Badge elements
  const badgeNameVal = document.getElementById('badge-name-val');
  const badgeCallsignVal = document.getElementById('badge-callsign-val');
  const badgeDeptVal = document.getElementById('badge-dept-val');
  const badgeClearanceVal = document.getElementById('badge-clearance-val');
  
  const toastContainer = document.getElementById('toast-container');

  // --- TOAST NOTIFICATIONS ---
  function showToast(title, desc, isError = false) {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast-notification ${isError ? 'error' : 'success'}`;
    toast.style.position = 'relative';
    toast.style.marginBottom = '0.75rem';
    toast.style.display = 'flex';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)';

    toast.innerHTML = `
      <svg class="toast-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <div class="toast-message-col">
        <span class="toast-title" style="font-weight: 700; color: #ffffff;">${title}</span>
        <span class="toast-desc" style="color: var(--text-muted); font-size: 0.75rem;">${desc}</span>
      </div>
    `;

    toastContainer.appendChild(toast);

    // Force reflow
    toast.offsetHeight;

    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    // Remove after 3.5s
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      setTimeout(() => {
        toast.remove();
      }, 350);
    }, 3500);
  }

  // --- LIVE PREVIEW ENGINE ---
  function updateBadge() {
    const name = nameInput.value.trim() || 'operator_unknown';
    const codename = codenameInput.value.trim().toUpperCase() || 'AGENT_GUEST';
    const dept = deptSelect.value;
    const clearance = clearanceSelect.value;
    
    badgeNameVal.textContent = name;
    badgeCallsignVal.textContent = codename;
    badgeDeptVal.textContent = dept;

    // Apply color accents depending on clearance level
    if (clearance === 'LEVEL_4_ADMIN') {
      badgeClearanceVal.textContent = 'LEVEL 4 - TOP SECRET';
      badgeClearanceVal.style.color = '#ff4081'; // Hot Pink / Red
    } else if (clearance === 'LEVEL_3_ANALYST') {
      badgeClearanceVal.textContent = 'LEVEL 3 - SECRET';
      badgeClearanceVal.style.color = '#ffb300'; // Orange / Yellow
    } else if (clearance === 'LEVEL_2_SPECIALIST') {
      badgeClearanceVal.textContent = 'LEVEL 2 - RESTRICTED';
      badgeClearanceVal.style.color = 'var(--neon-green)'; // Green
    } else {
      badgeClearanceVal.textContent = 'LEVEL 1 - PUBLIC';
      badgeClearanceVal.style.color = 'var(--neon-blue)'; // Blue
    }
  }

  // Bind live updates
  [nameInput, codenameInput].forEach(input => {
    input.addEventListener('input', updateBadge);
  });
  
  [deptSelect, clearanceSelect, nodeSelect].forEach(select => {
    select.addEventListener('change', updateBadge);
  });

  // --- LOAD PROFILE OR PREFILL FROM ME ROUTE ---
  async function loadProfileData(user) {
    try {
      // 1. Try to load from LocalStorage first
      const stored = localStorage.getItem('operatorProfile');
      if (stored) {
        const profile = JSON.parse(stored);
        nameInput.value = profile.name || '';
        codenameInput.value = profile.codename || '';
        deptSelect.value = profile.department || 'SOC Operations Center';
        clearanceSelect.value = profile.clearance || 'LEVEL_2_SPECIALIST';
        nodeSelect.value = profile.node || 'LND-SOC-09 (London)';
        updateBadge();
        return;
      }

      // 2. Otherwise load from user session
      if (user) {
        const username = user.displayName || user.email.split('@')[0];
        nameInput.value = username.replace(/_/g, ' ') || '';
        codenameInput.value = `AGENT_${username.toUpperCase()}`;
        updateBadge();
        return;
      }

      // Fallback: Display demo profile if not authenticated and no stored profile
      nameInput.value = 'Agent Alice';
      codenameInput.value = 'AGENT_ALICE';
      deptSelect.value = 'SOC Operations Center';
      clearanceSelect.value = 'LEVEL_2_SPECIALIST';
      nodeSelect.value = 'LND-SOC-09 (London)';
      updateBadge();
    } catch (e) {
      console.error('Failed to load prefill data:', e);
      // Fallback: Display demo profile on error
      nameInput.value = 'Agent Alice';
      codenameInput.value = 'AGENT_ALICE';
      deptSelect.value = 'SOC Operations Center';
      clearanceSelect.value = 'LEVEL_2_SPECIALIST';
      nodeSelect.value = 'LND-SOC-09 (London)';
      updateBadge();
    }
  }

  // Enforce session check on launch
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      console.log("No active Firebase session. Redirecting to login page.");
      window.location.href = '/';
      return;
    }
    loadProfileData(user);
  });

  // --- SUBMIT / COMMIT PROFILE ---
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const profile = {
        name: nameInput.value.trim(),
        codename: codenameInput.value.trim().toUpperCase(),
        department: deptSelect.value,
        clearance: clearanceSelect.value,
        node: nodeSelect.value
      };

      // Store in LocalStorage
      localStorage.setItem('operatorProfile', JSON.stringify(profile));

      showToast('CREDENTIALS COMMITTED', 'Operator clearance files synced with node cluster. Loading terminal...');

      // Redirect to the actual dashboard
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1500);
    });
  }

  // --- BACKGROUND ANIMATIONS (MATRIX & PARTICLES) ---

  // 1. Matrix Rain Animation
  let matrixContext = null;
  if (matrixCanvas) {
    matrixContext = matrixCanvas.getContext('2d');
  }

  const alphabet = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&+*¥';
  const fontSize = 14;
  let columns = 0;
  let rainDrops = [];

  function initMatrix() {
    if (!matrixCanvas || !matrixContext) return;
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;

    columns = Math.floor(matrixCanvas.width / fontSize);
    rainDrops = [];
    for (let x = 0; x < columns; x++) {
      rainDrops[x] = Math.random() * -100; // Staggered entry height
    }
  }

  function drawMatrix() {
    if (!matrixCanvas || !matrixContext) return;
    
    // Clear slightly on each frame to create trails
    matrixContext.fillStyle = 'rgba(5, 7, 15, 0.12)';
    matrixContext.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

    matrixContext.font = fontSize + 'px monospace';

    for (let i = 0; i < rainDrops.length; i++) {
      const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
      
      const x = i * fontSize;
      const y = rainDrops[i] * fontSize;

      if (Math.random() > 0.98) {
        matrixContext.fillStyle = '#00f5a0'; // Splash of neon green occasionally
      } else {
        matrixContext.fillStyle = 'rgba(0, 242, 254, 0.4)';
      }

      matrixContext.fillText(text, x, y);

      if (y > matrixCanvas.height && Math.random() > 0.975) {
        rainDrops[i] = 0;
      }
      rainDrops[i]++;
    }
  }

  // 2. Slow Drifting Glow Particles
  let particlesContext = null;
  if (particlesCanvas) {
    particlesContext = particlesCanvas.getContext('2d');
  }

  const particlesArray = [];
  const maxParticles = 40;

  class Particle {
    constructor() {
      this.init();
    }

    init() {
      if (!particlesCanvas) return;
      this.x = Math.random() * particlesCanvas.width;
      this.y = Math.random() * particlesCanvas.height;
      this.size = Math.random() * 2 + 1; // 1px to 3px
      this.speedX = (Math.random() * 0.2) - 0.1; // slow drift
      this.speedY = (Math.random() * -0.2) - 0.05; // upwards bias
      this.opacity = Math.random() * 0.4 + 0.1;
      this.opacityDirection = Math.random() > 0.5 ? 0.005 : -0.005;
      
      const colors = ['#00f2fe', '#4facfe', '#00f5a0'];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      if (particlesCanvas) {
        if (this.y < 0) this.y = particlesCanvas.height;
        if (this.y > particlesCanvas.height) this.y = 0;
        if (this.x < 0) this.x = particlesCanvas.width;
        if (this.x > particlesCanvas.width) this.x = 0;
      }

      this.opacity += this.opacityDirection;
      if (this.opacity >= 0.6 || this.opacity <= 0.1) {
        this.opacityDirection = -this.opacityDirection;
      }
    }

    draw() {
      if (!particlesContext) return;
      particlesContext.save();
      particlesContext.beginPath();
      particlesContext.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      
      particlesContext.shadowBlur = this.size * 3;
      particlesContext.shadowColor = this.color;
      particlesContext.fillStyle = this.color;
      particlesContext.globalAlpha = this.opacity;
      
      particlesContext.fill();
      particlesContext.restore();
    }
  }

  function initParticles() {
    if (!particlesCanvas) return;
    particlesCanvas.width = window.innerWidth;
    particlesCanvas.height = window.innerHeight;

    particlesArray.length = 0;
    for (let i = 0; i < maxParticles; i++) {
      particlesArray.push(new Particle());
    }
  }

  function drawParticles() {
    if (!particlesCanvas || !particlesContext) return;
    particlesContext.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
    
    for (let i = 0; i < particlesArray.length; i++) {
      particlesArray[i].update();
      particlesArray[i].draw();
    }
  }

  // Handle Resize
  window.addEventListener('resize', () => {
    initMatrix();
    initParticles();
  });

  // Initialization calls
  initMatrix();
  initParticles();

  // Unified Animation Loop
  function animate() {
    drawMatrix();
    drawParticles();
    requestAnimationFrame(animate);
  }
  animate();

});
