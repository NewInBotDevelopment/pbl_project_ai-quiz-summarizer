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

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Existing System', 'Our Solution'],
      datasets: [{
        data: [58, 88],
        backgroundColor: [
          'rgba(100, 116, 139, 0.35)',
          'rgba(59, 130, 246, 0.7)'
        ],
        borderColor: [
          'rgba(100, 116, 139, 0)',
          'rgba(59, 130, 246, 0)'
        ],
        borderWidth: 0,
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 60,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(8, 12, 24, 0.95)',
          borderColor: 'rgba(59,130,246,0.25)',
          borderWidth: 1,
          titleColor: '#F1F5F9',
          bodyColor: '#64748B',
          padding: 12,
          callbacks: {
            label: c => ` ${c.parsed.y}%`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: '#475569',
            font: { family: 'Inter', size: 11 }
          }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
          border: { display: false },
          ticks: {
            color: '#475569',
            font: { family: 'Inter', size: 10 },
            callback: v => v,
            stepSize: 10
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
