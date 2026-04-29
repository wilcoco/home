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
        if (window.innerWidth <= 768 && !a.parentElement.classList.contains('has-submenu')) {
          menuToggle.classList.remove('active');
          navLinks.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    });
  }

  // Header scroll effect
  const header = document.getElementById('header');
  if (header) {
    const onScroll = () => {
      if (window.pageYOffset > 30) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Reveal on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

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

  // Mark active nav based on current path
  // Path examples: "/", "/products", "/products.html"
  let path = window.location.pathname.replace(/\/$/, '').replace(/\.html$/, '');
  const slug = path === '' ? 'home' : path.replace(/^\//, '');
  document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
    if (a.dataset.page === slug) {
      a.classList.add('active');
    }
    // ESG sub-pages should also activate the ESG menu
    if (slug === 'environment' || slug === 'social' || slug === 'governance') {
      if (a.dataset.page === 'esg') a.classList.add('active');
    }
  });
});
