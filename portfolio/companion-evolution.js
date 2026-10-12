(() => {
  const stage = document.getElementById('companion-stage');
  if (!stage) return;
  let model = window.createNexScene?.(stage);
  const image = document.getElementById('companion-image');
  const name = document.getElementById('companion-name');
  const label = document.getElementById('companion-form-label');
  const status = document.getElementById('evolution-status');
  const evolveButton = document.getElementById('companion-evolve');
  const spinButton = document.getElementById('companion-spin');
  const motionButton = document.getElementById('companion-motion');
  const motionToggle = document.getElementById('arena-motion');
  const choices = [...document.querySelectorAll('[data-evolution]')];
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const forms = [
    { name: 'NEX', label: 'Forma inicial · Explorador digital', src: 'imagenes/nex-galactic.webp', alt: 'Nex, criatura digital de pelaje naranja, orejas grandes y armadura plateada' },
    { name: 'NEX GUARDIÁN', label: 'Segunda forma · Protector digital', src: 'imagenes/nex-guardian.webp', alt: 'Nex Guardián, evolución del mismo zorro naranja con armadura reforzada y aletas de energía' },
    { name: 'NEX ASTRAL', label: 'Tercera forma · Guardián celestial', src: 'imagenes/nex-astral.webp', alt: 'Nex Astral, evolución celestial del zorro naranja, con armadura blanca y alas de energía' },
  ];
  let current = 0;
  let busy = false;
  // Prepare all images before a transformation; do not swap to an unloaded asset.
  const ready = forms.map(form => {
    const asset = new Image();
    asset.src = form.src;
    return asset.decode().then(() => asset).catch(() => null);
  });
  function motionAllowed() {
    return document.body.dataset.motion === 'true' || (document.body.dataset.motion !== 'false' && !motionQuery.matches);
  }
  function render(index) {
    current = index;
    model?.setForm(index);
    const form = forms[index];
    image.src = form.src;
    image.alt = form.alt;
    stage.dataset.form = String(index);
    stage.setAttribute('aria-label', `${form.name}, compañero original del portafolio`);
    name.textContent = form.name;
    label.textContent = form.label;
    choices.forEach((button, choice) => button.setAttribute('aria-pressed', String(choice === index)));
    evolveButton.innerHTML = index === forms.length - 1 ? 'Volver al inicio <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>' : 'Evolucionar <i class="bi bi-stars" aria-hidden="true"></i>';
  }
  function setBusy(value) {
    busy = value;
    stage.setAttribute('aria-busy', String(value));
    stage.classList.toggle('is-spinning', value);
    [...choices, evolveButton, spinButton].forEach(button => { button.disabled = value; });
    spinButton.disabled = value || !model;
  }
  async function rotate(duration) {
    if (!model || !motionAllowed() || document.hidden || document.body.dataset.screen !== 'inicio') return false;
    return model.spin(duration);
  }
  async function selectForm(index) {
    if (busy || index === current) return;
    setBusy(true);
    const asset = await ready[index];
    if (!asset && !model) {
      status.textContent = 'No se pudo cargar esta forma. Recarga la página para volver a intentarlo.';
      setBusy(false);
      return;
    }
    status.textContent = `Transformando a ${forms[index].name}…`;
    stage.classList.add('is-evolving');
    try {
      if(model && motionAllowed() && !document.hidden && document.body.dataset.screen === 'inicio') {
        await model.evolve(index,()=>render(index));
      }
      render(index);
      status.textContent = `${forms[index].name} · Transformación completa.`;
    } finally {
      stage.classList.remove('is-evolving');
      setBusy(false);
    }
  }
  choices.forEach((button, index) => {
    button.addEventListener('click', () => selectForm(index));
    button.addEventListener('keydown', event => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? forms.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + forms.length) % forms.length;
      choices[next].focus();
      selectForm(next);
    });
  });
  evolveButton.addEventListener('click', () => selectForm((current + 1) % forms.length));
  spinButton.addEventListener('click', async () => {
    if (busy) return;
    if (!motionAllowed()) {
      status.textContent = 'Movimiento desactivado. Pulsa «Activar animación» para ver el giro.';
      return;
    }
    setBusy(true);
    status.textContent = `${forms[current].name} · Giro visual de 360°.`;
    let completed = false;
    try { completed = await rotate(1800); }
    finally { setBusy(false); }
    status.textContent = `${forms[current].name} · ${completed ? 'Giro completo.' : 'Giro detenido.'}`;
  });
  // Honor the portfolio's motion switch even in the middle of an evolution.
  function syncMotionButton() {
    const enabled = motionAllowed();
    motionButton.setAttribute('aria-pressed', String(enabled));
    motionButton.textContent = enabled ? 'Pausar animación' : 'Activar animación';
  }
  motionButton.addEventListener('click', () => {
    motionToggle.checked = !motionAllowed();
    motionToggle.dispatchEvent(new Event('change', { bubbles: true }));
  });
  new MutationObserver(() => {
    if (!motionAllowed()) model?.cancel();
    syncMotionButton();
  }).observe(document.body, { attributes: true, attributeFilter: ['data-motion'] });
  document.addEventListener('visibilitychange', () => { if (document.hidden) model?.cancel(); });
  window.addEventListener('hashchange', () => { if (document.body.dataset.screen !== 'inicio') model?.cancel(); });
  stage.addEventListener('nex-renderer-lost', () => {
    model?.dispose(); model = null; spinButton.disabled = true;
    status.textContent = 'Vista estática: el navegador no pudo mantener el renderizado 3D. Recarga para reintentarlo.';
  });
  render(0);
  setBusy(false);
  status.textContent = model ? 'Modelo 3D · Arrastra para girar o selecciona una evolución.' : 'Vista estática: tu navegador no tiene WebGL disponible.';
  syncMotionButton();
})();
