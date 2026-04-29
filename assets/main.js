/* ============================================
   ㈜캠스 (CAMS Korea) - Shared Script
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // Mobile menu toggle
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
      document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        // Close menu only when navigating in mobile
        if (window.innerWidth <= 768 && !a.parentElement.classList.contains('has-submenu')) {
          menuToggle.classList.remove('active');
          navLinks.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    });
  }

  // Header scroll effect
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 50) {
        header.style.background = 'rgba(10, 14, 20, 0.95)';
        header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
      } else {
        header.style.background = 'rgba(10, 14, 20, 0.85)';
        header.style.boxShadow = 'none';
      }
    });
  }

  // Reveal on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -80px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Ethics form submit
  const ethicsForm = document.getElementById('ethicsForm');
  if (ethicsForm) {
    ethicsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const success = document.getElementById('formSuccess');
      if (success) {
        success.classList.add('visible');
        ethicsForm.reset();
        setTimeout(() => success.classList.remove('visible'), 5000);
      }
    });
  }

  // Mark active nav
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
    if (a.dataset.page === path.replace('.html', '') ||
        (path === 'index.html' && a.dataset.page === 'home') ||
        (path === '' && a.dataset.page === 'home')) {
      a.classList.add('active');
    }
  });
});
