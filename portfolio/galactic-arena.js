(() => {
  const body = document.body;
  const home = document.querySelector('[data-arena-screen="inicio"]');
  const sections = [home, ...['sobre-mi', 'experiencia', 'proyectos', 'tecnologias', 'contacto'].map(id => document.getElementById(id))].filter(Boolean);
  sections.forEach(section => { section.dataset.arenaScreen ||= section.id; });
  body.classList.add('arena-enabled');

  function showScreen() {
    const id = location.hash.slice(1) || 'inicio';
    const screenId = id === 'portfolio-content' ? (body.dataset.screen || 'inicio') : id;
    const chosen = sections.find(section => section.dataset.arenaScreen === screenId) || home;
    sections.forEach(section => { section.hidden = section !== chosen; });
    document.querySelectorAll('.nav-menu a').forEach(link => {
      if (link.getAttribute('href') === `#${chosen.dataset.arenaScreen}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    body.dataset.screen = chosen.dataset.arenaScreen;
    window.scrollTo({ top: 0, behavior: 'instant' });
    window.dispatchEvent(new Event('resize'));
  }
  window.addEventListener('hashchange', showScreen);
  showScreen();

  const menuItems = [...document.querySelectorAll('.arena-menu-item')];
  const description = document.getElementById('arena-menu-description');
  function selectMenu(item) {
    menuItems.forEach(link => link.classList.toggle('is-selected', link === item));
    description.textContent = item.dataset.description;
  }
  menuItems.forEach(item => {
    item.addEventListener('pointerenter', () => selectMenu(item));
    item.addEventListener('focus', () => selectMenu(item));
    item.addEventListener('keydown', event => {
      if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      menuItems[(menuItems.indexOf(item) + direction + menuItems.length) % menuItems.length].focus();
    });
  });
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.target.matches('input,textarea,select')) return;
    if (body.dataset.screen === 'inicio' && ['ArrowDown', 'ArrowUp'].includes(event.key)
      && !event.target.closest('.nav-menu,.social-links')) {
      event.preventDefault();
      const selected = menuItems.findIndex(item => item.classList.contains('is-selected'));
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      menuItems[(selected + direction + menuItems.length) % menuItems.length].focus();
      return;
    }
    if (event.key !== 'Escape' || event.target.matches('input,textarea,select')) return;
    if (body.dataset.screen !== 'inicio') location.hash = 'inicio';
  });

  const slots = [...document.querySelectorAll('[data-project-select]')];
  const panels = [...document.querySelectorAll('[data-project-panel]')];
  function selectProject(id) {
    slots.forEach(slot => {
      const selected = slot.dataset.projectSelect === id;
      slot.classList.toggle('is-selected', selected);
      slot.setAttribute('aria-pressed', String(selected));
    });
    panels.forEach(panel => { panel.hidden = panel.dataset.projectPanel !== id; });
  }
  slots.forEach(slot => slot.addEventListener('click', () => selectProject(slot.dataset.projectSelect)));
  selectProject('spendify');

  const profileSlots = [...document.querySelectorAll('[data-profile-select]')];
  const profilePanels = [...document.querySelectorAll('[data-profile-panel]')];
  function selectProfile(id) {
    profileSlots.forEach(slot => {
      const selected = slot.dataset.profileSelect === id;
      slot.classList.toggle('is-selected', selected);
      slot.setAttribute('aria-pressed', String(selected));
    });
    profilePanels.forEach(panel => { panel.hidden = panel.dataset.profilePanel !== id; });
  }
  profileSlots.forEach((slot, index) => {
    slot.addEventListener('click', () => selectProfile(slot.dataset.profileSelect));
    slot.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? profileSlots.length - 1 : (index + direction + profileSlots.length) % profileSlots.length;
      const next = profileSlots[nextIndex];
      next.focus();
      selectProfile(next.dataset.profileSelect);
    });
  });
  selectProfile('backend');

  const toggle = document.getElementById('arena-motion');
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let moving = !motionQuery.matches;
  let explicitlyChosenMotion = false;
  let animationFrame = 0;
  let width = 0, height = 0;
  const canvas = document.getElementById('galaxy-canvas');
  const ctx = canvas.getContext('2d');
  const stars = Array.from({ length: 135 }, (_, i) => ({
    x: ((i * 719 + 173) % 997) / 997,
    y: ((i * 337 + 73) % 991) / 991,
    size: i % 9 === 0 ? 1.8 : .6 + (i % 4) * .22,
    opacity: .22 + (i % 8) * .08,
  }));
  function resizeGalaxy() {
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    if (!moving) drawGalaxy(0);
  }
  function drawGalaxy(time) {
    ctx.clearRect(0, 0, width, height);
    const phase = moving ? time * .000025 : 0;
    for (const star of stars) {
      const x = (star.x * width + phase * 30 * star.size) % width;
      const y = star.y * height;
      ctx.fillStyle = `rgba(195,224,255,${star.opacity})`;
      ctx.beginPath(); ctx.arc(x, y, star.size, 0, Math.PI * 2); ctx.fill();
    }
    const cx = width * .69, cy = height * .47;
    const rotation = -.15 + Math.sin(phase * .2) * .07;
    const maxRadius = Math.hypot(width, height) * .72;
    const rings = [];
    for (let ring = 0; ring < 12; ring++) {
      const depth = ((ring / 12 + phase * .04) % 1);
      const radius = 22 + Math.pow(depth, 2.3) * maxRadius;
      const points = Array.from({ length: 6 }, (_, i) => {
        const angle = rotation + i * Math.PI / 3;
        return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius * .84];
      });
      rings.push({ points, radius });
    }
    rings.sort((a, b) => a.radius - b.radius);
    ctx.lineWidth = 1;
    rings.forEach(({ points, radius }, index) => {
      ctx.strokeStyle = `rgba(58,150,195,${.03 + Math.min(radius / maxRadius, 1) * .1})`;
      ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.stroke();
      if (index > 0) {
        points.forEach(([x, y], i) => {
          ctx.beginPath(); ctx.moveTo(...rings[index - 1].points[i]); ctx.lineTo(x, y); ctx.stroke();
        });
      }
    });
    // Small honeycomb cells form a receding digital floor, not a flat wallpaper.
    ctx.strokeStyle = 'rgba(68,175,221,.065)';
    for (let row = 0; row < 5; row++) {
      const size = 11 + row * 7;
      const y = cy + 75 + row * row * 22;
      for (let column = -10; column <= 10; column++) {
        const x = cx + column * size * 1.74 + (row % 2 ? size * .87 : 0);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = Math.PI / 3 * i + Math.PI / 6;
          const point = [x + Math.cos(angle) * size, y + Math.sin(angle) * size * .58];
          i ? ctx.lineTo(...point) : ctx.moveTo(...point);
        }
        ctx.closePath(); ctx.stroke();
      }
    }
    if (moving && !document.hidden) animationFrame = requestAnimationFrame(drawGalaxy);
  }
  function updateMotion() {
    cancelAnimationFrame(animationFrame);
    toggle.checked = moving;
    body.dataset.motion = String(moving);
    document.documentElement.style.scrollBehavior = moving ? '' : 'auto';
    drawGalaxy(performance.now());
  }
  toggle.addEventListener('change', () => {
    explicitlyChosenMotion = true;
    moving = toggle.checked;
    updateMotion();
  });
  motionQuery.addEventListener('change', event => {
    if (!explicitlyChosenMotion) { moving = !event.matches; updateMotion(); }
  });
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(animationFrame);
    if (!document.hidden) drawGalaxy(performance.now());
  });
  window.addEventListener('resize', resizeGalaxy, { passive: true });
  resizeGalaxy();
  updateMotion();
})();
