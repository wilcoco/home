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
  //
  // .reveal 은 opacity:0 으로 시작하므로, 여기서 .visible 을 못 붙이면 본문이 통째로
  // 빈 화면이 된다. 대외 공개 페이지라 아래 두 가지를 반드시 지킬 것:
  //   1. threshold 는 0. 비율 기준(예: 0.1)을 쓰면 뷰포트보다 훨씬 긴 섹션은 교차 비율이
  //      그 값에 영원히 도달하지 못한다. (환경 페이지의 '환경경영방침 이행' 섹션은
  //      표·차트가 늘어 8,700px 가 되면서 최대 비율이 0.08 까지 떨어졌다.)
  //   2. IntersectionObserver 를 못 쓰면 애니메이션을 포기하고 전부 드러낸다.
  const revealTargets = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    revealTargets.forEach(el => el.classList.add('visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -60px 0px' });

    revealTargets.forEach(el => observer.observe(el));
  }

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
      // 서버가 응답하지 않아도 UI가 멈추지 않도록 25초 안전 타임아웃
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 25000);
      const t0 = Date.now();
      console.log('[제보] 전송 시작', { type: payload.type, anonymous: payload.anonymous });
      try {
        const res = await fetch('/api/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: ctrl.signal,
        });
        console.log(`[제보] 응답 수신: HTTP ${res.status} (${Date.now() - t0}ms)`);
        const data = await res.json().catch(() => ({}));
        console.log('[제보] 응답 내용:', data);
        if (res.ok && data.ok) {
          console.log('[제보] ✅ 성공');
          if (success) {
            success.classList.add('visible');
            setTimeout(() => success.classList.remove('visible'), 6000);
          }
          ethicsForm.reset();
          applyAnonymous();
        } else {
          console.warn('[제보] ⚠️ 서버가 실패 응답:', data);
          showError((data && data.error) || '제보 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        }
      } catch (err) {
        console.error(`[제보] ❌ 요청 오류 (${Date.now() - t0}ms):`, err);
        if (err && err.name === 'AbortError') {
          showError('서버 응답이 지연되고 있습니다. 잠시 후 다시 시도하거나 관리자에게 문의해 주세요.');
        } else {
          showError('네트워크 오류로 제보를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        }
      } finally {
        clearTimeout(timer);
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
