/**
 * Ultra Aesthetic Mode - Efectos visuales premium (Light Theme)
 * Glassmorphism, blur dinámico, sombras, microinteracciones
 */

const AESTHETIC_CSS = `
/* ── Ultra Aesthetic Mode ───────────────────────────── */

/* Dynamic background */
.ua-active body,
.ua-active #root {
  background: linear-gradient(135deg, #f0f7ff 0%, #e8f0fe 25%, #f0f4ff 50%, #e8f4fd 75%, #f0f7ff 100%);
  background-size: 400% 400%;
  animation: ua-gradient-shift 15s ease infinite;
}

@keyframes ua-gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* Enhanced glassmorphism */
.ua-active .glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(24px) saturate(1.8);
  -webkit-backdrop-filter: blur(24px) saturate(1.8);
  border: 1px solid rgba(37, 99, 235, 0.1);
  box-shadow:
    0 8px 32px rgba(37, 99, 235, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.ua-active .glass:hover {
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(37, 99, 235, 0.2);
  box-shadow:
    0 12px 40px rgba(37, 99, 235, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
  transform: translateY(-1px);
}

.ua-active .glass-strong {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(32px) saturate(2);
  -webkit-backdrop-filter: blur(32px) saturate(2);
  border: 1px solid rgba(37, 99, 235, 0.12);
  box-shadow:
    0 16px 48px rgba(37, 99, 235, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

/* Card hover glow */
.ua-active [data-metric-card] {
  position: relative;
  overflow: hidden;
}
.ua-active [data-metric-card]::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(37, 99, 235, 0.06),
    transparent 40%
  );
  pointer-events: none;
  z-index: 1;
}

/* Enhanced buttons */
.ua-active button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.ua-active button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
}
.ua-active button:active {
  transform: translateY(0) scale(0.98);
}

/* Floating particles (subtle for light theme) */
.ua-active .particle {
  position: fixed;
  width: 4px;
  height: 4px;
  background: rgba(37, 99, 235, 0.15);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  animation: ua-float 8s ease-in-out infinite;
}

@keyframes ua-float {
  0%, 100% { transform: translateY(0) translateX(0); opacity: 0.15; }
  25% { transform: translateY(-30px) translateX(15px); opacity: 0.25; }
  50% { transform: translateY(-15px) translateX(-10px); opacity: 0.15; }
  75% { transform: translateY(-40px) translateX(5px); opacity: 0.2; }
}

/* Gradient text enhancement */
.ua-active .gradient-text {
  background: linear-gradient(135deg, #2563eb, #3b82f6, #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Status dot enhancement */
.ua-active .status-dot.connected {
  box-shadow: 0 0 8px rgba(5, 150, 105, 0.4);
}

/* Smooth scrolling */
.ua-active {
  scroll-behavior: smooth;
}

/* Button shimmer */
.ua-active .optimize-btn {
  position: relative;
  overflow: hidden;
}
.ua-active .optimize-btn::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255, 255, 255, 0.15) 50%,
    transparent 70%
  );
  animation: ua-shimmer 3s ease-in-out infinite;
}

@keyframes ua-shimmer {
  0% { transform: translateX(-100%) rotate(45deg); }
  100% { transform: translateX(100%) rotate(45deg); }
}

/* Chart enhancement */
.ua-active svg text {
  transition: fill 0.3s ease;
}

/* Input focus glow */
.ua-active input:focus,
.ua-active select:focus {
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

/* Section transitions */
.ua-active .glass,
.ua-active .glass-strong {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.ua-active .glass:hover,
.ua-active .glass-strong:hover {
  box-shadow: 0 12px 40px rgba(37, 99, 235, 0.1);
}

/* Tab animation */
.ua-active button[role="tab"],
.ua-active .tab-content button {
  transition: all 0.2s ease;
}

/* Loading animation enhancement */
.ua-active .animate-spin {
  animation-duration: 1.5s;
}
.ua-active .animate-pulse {
  animation-duration: 2s;
}
`;

let active = false;
let styleEl = null;
let particles = [];

function enable() {
  if (active) return;
  active = true;

  // Inject CSS
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'ultra-aesthetic-style';
    styleEl.textContent = AESTHETIC_CSS;
    document.head.appendChild(styleEl);
  }

  document.body.classList.add('ua-active');

  // Add subtle particles
  _addParticles();

  // Mouse tracking for card glow
  document.addEventListener('mousemove', _handleMouseMove);

  console.log('[AESTHETIC] ✨ Ultra Aesthetic Mode activado');
}

function disable() {
  if (!active) return;
  active = false;

  document.body.classList.remove('ua-active');

  // Remove particles
  _removeParticles();

  // Remove mouse tracking
  document.removeEventListener('mousemove', _handleMouseMove);

  console.log('[AESTHETIC] Ultra Aesthetic Mode desactivado');
}

function toggle() {
  if (active) disable(); else enable();
}

function _addParticles() {
  _removeParticles();
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + 'vw';
    particle.style.top = Math.random() * 100 + 'vh';
    particle.style.animationDelay = (Math.random() * 5) + 's';
    particle.style.animationDuration = (6 + Math.random() * 6) + 's';
    document.body.appendChild(particle);
    particles.push(particle);
  }
}

function _removeParticles() {
  particles.forEach(p => p.remove());
  particles = [];
}

/**
 * Estado actual
 */
function isActive() {
  return active;
}

function _handleMouseMove(e) {
  const cards = document.querySelectorAll('[data-metric-card]');
  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(0);
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(0);
    card.style.setProperty('--mouse-x', x + '%');
    card.style.setProperty('--mouse-y', y + '%');
  });
}

export { enable, disable, toggle, isActive };
