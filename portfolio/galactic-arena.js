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
  slots.forEach((slot, index) => {
    slot.addEventListener('click', () => selectProject(slot.dataset.projectSelect));
    slot.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? slots.length - 1 : (index + direction + slots.length) % slots.length;
      slots[nextIndex].focus();
      selectProject(slots[nextIndex].dataset.projectSelect);
    });
  });
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

  // Mirror the existing map's state; geographic navigation remains in portafolio.js.
  const map = document.querySelector('.career-map');
  const mapLocation = document.querySelector('.map-interface-location');
  function updateMapLocation() {
    if (!map || !mapLocation) return;
    const selected = map.querySelector('.map-company.active .map-company-copy small');
    mapLocation.textContent = map.classList.contains('map-national') ? 'México'
      : selected ? `Veracruz / ${selected.textContent.split(' · ')[0]}` : 'México / Veracruz';
  }
  if (map) {
    new MutationObserver(updateMapLocation).observe(map, { attributes: true, subtree: true, attributeFilter: ['class'] });
    updateMapLocation();
  }

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
      ctx.fillStyle = `rgba(224,210,249,${star.opacity})`;
      ctx.beginPath(); ctx.arc(x, y, star.size, 0, Math.PI * 2); ctx.fill();
    }
    const cx = width * .69, cy = height * .47;
    // Concentric data gates connect the console frame and the companion's portal.
    const unit = Math.min(width, height) * .3;
    for (let ring = 0; ring < 7; ring++) {
      const radius = unit * (.8 + ring * .44);
      ctx.lineWidth = ring % 2 ? 1 : 2;
      ctx.strokeStyle = ring % 3 === 0 ? 'rgba(234,199,126,.10)' : 'rgba(194,163,232,.10)';
      ctx.setLineDash(ring % 2 ? [2, 18] : [radius * .55, 18]);
      ctx.lineDashOffset = phase * (ring % 2 ? -25 : 18);
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
      if (ring === 2) {
        ctx.setLineDash([]);
        for (let mark = 0; mark < 24; mark++) {
          const angle = mark * Math.PI / 12 + phase * .025;
          ctx.save(); ctx.translate(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
          ctx.rotate(angle); ctx.fillStyle = 'rgba(217,204,238,.16)';
          ctx.fillRect(-3, -2, 8, 4); ctx.restore();
        }
      }
    }
    ctx.setLineDash([]);
    // Small honeycomb cells form a receding digital floor, not a flat wallpaper.
    ctx.strokeStyle = 'rgba(182,150,224,.065)';
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
