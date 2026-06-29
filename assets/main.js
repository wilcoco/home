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

  // Ethics form: anonymous toggle + AJAX submit
  const ethicsForm = document.getElementById('ethicsForm');
  if (ethicsForm) {
    const anonymous = document.getElementById('anonymous');
    const identityFields = document.getElementById('identityFields');
    const emailField = document.getElementById('emailField');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const success = document.getElementById('formSuccess');
    const errorBox = document.getElementById('formError');
    const submitBtn = ethicsForm.querySelector('.form-submit');

    // 익명 체크 시 신원 입력 영역 숨김 + required 해제
    const applyAnonymous = () => {
      const on = anonymous && anonymous.checked;
      if (identityFields) identityFields.style.display = on ? 'none' : '';
      if (emailField) emailField.style.display = on ? 'none' : '';
      if (nameInput) nameInput.required = !on;
      if (emailInput) emailInput.required = !on;
    };
    if (anonymous) {
      anonymous.addEventListener('change', applyAnonymous);
      applyAnonymous();
    }

    ethicsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (success) success.classList.remove('visible');
      if (errorBox) errorBox.classList.remove('visible');

      const payload = {
        type: ethicsForm.type ? ethicsForm.type.value : '',
        anonymous: anonymous ? anonymous.checked : false,
        name: nameInput ? nameInput.value : '',
        contact: ethicsForm.contact ? ethicsForm.contact.value : '',
        email: emailInput ? emailInput.value : '',
        message: ethicsForm.message ? ethicsForm.message.value : '',
        website: ethicsForm.website ? ethicsForm.website.value : '',
      };

      const showError = (msg) => {
        if (errorBox) {
          errorBox.textContent = msg;
          errorBox.classList.add('visible');
        } else {
          alert(msg);
        }
      };

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '전송 중…'; }
      try {
        const res = await fetch('/api/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          if (success) {
            success.classList.add('visible');
            setTimeout(() => success.classList.remove('visible'), 6000);
          }
          ethicsForm.reset();
          applyAnonymous();
        } else {
          showError((data && data.error) || '제보 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        }
      } catch (err) {
        showError('네트워크 오류로 제보를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '제보 접수'; }
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
