/* ===========================
   PBL PORTFOLIO — MAIN SCRIPT
   =========================== */

// ===== STAR BACKGROUND =====
(function generateStars() {
  const container = document.getElementById('starsContainer');
  if (!container) return;
  const count = 120;
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      width: ${Math.random() * 3 + 1}px;
      height: ${Math.random() * 3 + 1}px;
      animation-delay: ${Math.random() * 3}s;
      animation-duration: ${Math.random() * 3 + 2}s;
      opacity: ${Math.random() * 0.5 + 0.1};
    `;
    container.appendChild(star);
  }
})();

// ===== NAVBAR SCROLL EFFECT =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}, { passive: true });

// ===== HAMBURGER MENU =====
function toggleMenu() {
  const navLinks = document.getElementById('navLinks');
  navLinks.classList.toggle('open');
}

// Close menu on nav link click
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('navLinks').classList.remove('open');
  });
});

// ===== SCROLL SPY (Active Nav Link) =====
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.nav-links a');

const scrollSpy = () => {
  const scrollY = window.scrollY + 120;
  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');
    if (scrollY >= top && scrollY < top + height) {
      navItems.forEach(a => {
        a.style.color = '';
        if (a.getAttribute('href') === '#' + id) {
          a.style.color = 'var(--blue-end)';
        }
      });
    }
  });
};

window.addEventListener('scroll', scrollSpy, { passive: true });

// ===== FADE IN ON SCROLL =====
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

// ===== RESULTS CHART (Chart.js) =====
window.addEventListener('load', () => {
  const ctx = document.getElementById('resultsChart');
  if (!ctx) return;

  const data = {
    labels: ['Transcription\nAccuracy', 'Summary\nQuality', 'Quiz\nRelevance', 'Response\nSpeed', 'User\nSatisfaction'],
    datasets: [
      {
        label: 'Existing System',
        data: [58, 52, 48, 40, 55],
        backgroundColor: 'rgba(148, 163, 184, 0.15)',
        borderColor: 'rgba(148, 163, 184, 0.5)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: 'Our Solution',
        data: [88, 82, 80, 90, 92],
        backgroundColor: 'rgba(59, 130, 246, 0.25)',
        borderColor: 'rgba(96, 165, 250, 0.8)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  };

  new Chart(ctx, {
    type: 'bar',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: {
            color: '#94A3B8',
            font: { family: 'Inter', size: 12 },
            usePointStyle: true,
            pointStyle: 'circle',
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          borderColor: 'rgba(59,130,246,0.3)',
          borderWidth: 1,
          titleColor: '#F1F5F9',
          bodyColor: '#94A3B8',
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}%`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#64748B',
            font: { family: 'Inter', size: 11 }
          }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#64748B',
            font: { family: 'Inter', size: 11 },
            callback: v => v + '%'
          },
          max: 100,
          min: 0
        }
      }
    }
  });
});

// ===== ACCURACY RING ANIMATION =====
const animateRing = () => {
  const ring = document.getElementById('ringFill');
  const valueEl = document.getElementById('accuracyValue');
  if (!ring || !valueEl) return;

  const target = 80; // 80%
  const circumference = 2 * Math.PI * 54; // r=54
  const dashOffset = circumference - (circumference * target / 100);

  // Animate ring
  ring.style.strokeDashoffset = dashOffset;

  // Animate counter
  let current = 0;
  const interval = setInterval(() => {
    current += 2;
    if (current >= target) {
      current = target;
      clearInterval(interval);
    }
    valueEl.textContent = current + '%';
  }, 30);
};

// Trigger when results section comes into view
const ringObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateRing();
      ringObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const resultsSection = document.getElementById('results');
if (resultsSection) ringObserver.observe(resultsSection);

// ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
