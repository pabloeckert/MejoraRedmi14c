/**
 * Ultra Aesthetic Mode - Efectos visuales premium
 * Glassmorphism, blur dinámico, sombras, microinteracciones
 */

const AESTHETIC_CSS = `
/* ── Ultra Aesthetic Mode ───────────────────────────── */

/* Dynamic background */
.ua-active body,
.ua-active #root {
  background: linear-gradient(135deg, #0a0a0f 0%, #0d0d1a 25%, #0a0f1a 50%, #0d0a1a 75%, #0a0a0f 100%);
  background-size: 400% 400%;
  animation: ua-gradient-shift 15s ease infinite;
}

@keyframes ua-gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* Enhanced glassmorphism */
.ua-active .glass {
  background: rgba(20, 20, 35, 0.45);
  backdrop-filter: blur(24px) saturate(1.8);
  -webkit-backdrop-filter: blur(24px) saturate(1.8);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.ua-active .glass:hover {
  background: rgba(25, 25, 45, 0.55);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transform: translateY(-1px);
}

.ua-active .glass-strong {
  background: rgba(25, 25, 45, 0.65);
  backdrop-filter: blur(32px) saturate(2);
  -webkit-backdrop-filter: blur(32px) saturate(2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

/* Glow effects */
.ua-active .gradient-text {
  text-shadow: 0 0 30px rgba(139, 92, 246, 0.3);
}

.ua-active .status-dot.connected {
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.6);
}

/* Button enhancements */
.ua-active button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.ua-active button:active {
  transform: scale(0.97);
}

.ua-active button:hover {
  filter: brightness(1.1);
}

/* Smooth tab transitions */
.ua-active .tab-content {
  animation: ua-fade-in 0.3s ease-out;
}

@keyframes ua-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Card shimmer effect */
.ua-active .glass::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.02),
    transparent
  );
  animation: ua-shimmer 8s infinite;
  pointer-events: none;
  border-radius: inherit;
}

@keyframes ua-shimmer {
  0% { left: -100%; }
  50% { left: 100%; }
  100% { left: 100%; }
}

/* Metric cards glow */
.ua-active [data-metric-card] {
  position: relative;
  overflow: hidden;
}

.ua-active [data-metric-card]::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(139, 92, 246, 0.06) 0%,
    transparent 60%
  );
  pointer-events: none;
}

/* Health bar glow */
.ua-active .health-bar-fill {
  box-shadow: 0 0 16px currentColor;
}

/* Loading spinner 3D */
.ua-active .ua-spinner {
  animation: ua-spin-3d 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes ua-spin-3d {
  0% { transform: rotateY(0deg) rotateX(0deg); }
  50% { transform: rotateY(180deg) rotateX(15deg); }
  100% { transform: rotateY(360deg) rotateX(0deg); }
}

/* Notification slide-in */
.ua-active .notification-enter {
  animation: ua-slide-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes ua-slide-in {
  from { opacity: 0; transform: translateX(100px) scale(0.8); }
  to { opacity: 1; transform: translateX(0) scale(1); }
}

/* Pulse ring on optimize button */
.ua-active .optimize-btn {
  position: relative;
}

.ua-active .optimize-btn::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  opacity: 0;
  animation: ua-pulse-ring 2s ease-in-out infinite;
  z-index: -1;
}

@keyframes ua-pulse-ring {
  0%, 100% { opacity: 0; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(1.02); }
}

/* Scrollbar premium */
.ua-active ::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #3b82f6, #8b5cf6);
  border-radius: 10px;
}

.ua-active ::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #60a5fa, #a78bfa);
}
`;

let styleElement = null;
let active = false;

/**
 * Activa el modo Ultra Aesthetic
 */
function enable() {
  if (active) return;
  active = true;

  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'ultra-aesthetic';
    styleElement.textContent = AESTHETIC_CSS;
  }

  document.documentElement.classList.add('ua-active');
  document.head.appendChild(styleElement);

  // Track mouse for radial glow effect
  document.addEventListener('mousemove', _handleMouseMove);

  return true;
}

/**
 * Desactiva el modo Ultra Aesthetic
 */
function disable() {
  active = false;
  document.documentElement.classList.remove('ua-active');
  if (styleElement?.parentNode) {
    styleElement.parentNode.removeChild(styleElement);
  }
  document.removeEventListener('mousemove', _handleMouseMove);
}

/**
 * Toggle
 */
function toggle() {
  return active ? disable() : enable();
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

module.exports = { enable, disable, toggle, isActive };
