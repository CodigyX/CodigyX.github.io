const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.nav-menu');

const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 24);

const closeMenu = () => {
  menu?.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
};

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

menuButton?.addEventListener('click', () => {
  const isOpen = menu?.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(Boolean(isOpen)));
});

menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
window.addEventListener('resize', () => {
  if (window.innerWidth > 720) closeMenu();
});

const mapCompanies = document.querySelectorAll('.map-company');
const mapCompanyPanel = document.querySelector('.map-companies');
const careerMapShell = document.querySelector('.career-map');
const mapStage = document.querySelector('.map-stage');
const mapBack = document.querySelector('.map-back');
const mapBackLabel = mapBack?.lastChild;
const nationalCompanyStack = document.querySelector('.national-company-stack');
const mapTitle = document.querySelector('#map-title');
const mapHeadingEyebrow = document.querySelector('.map-stage-heading p');
const mapHeadingSubtitle = document.querySelector('.map-stage-heading span');

const workplaces = [
  {
    id: 'gigante', company: 'Gigante', municipality: 'Veracruz', cvegeo: '30193',
    lat: 19.1738, lon: -96.1342, base: true, labelX: 845, labelY: 438,
  },
  {
    id: 'jamova', company: 'JAMOVA', municipality: 'Cuitláhuac', cvegeo: '30053',
    lat: 18.8143, lon: -96.7228, labelX: 820, labelY: 500,
  },
  {
    id: 'dislyshop', company: 'Dislyshop', municipality: 'Córdoba', cvegeo: '30044',
    lat: 18.8842, lon: -96.9256, labelX: 720, labelY: 548,
  },
  {
    id: 'asti', company: 'ASTI', municipality: 'Orizaba', cvegeo: '30118',
    lat: 18.8505, lon: -97.1036, labelX: 605, labelY: 525,
  },
  {
    id: 'kenworth', company: 'Kenworth del Este', municipality: 'Venta Parada · Amatlán', cvegeo: '30014',
    lat: 18.85246, lon: -96.85036, labelX: 585, labelY: 462,
  },
];

const activateMapCompany = (selectedId) => {
  let selectedCompany = null;
  mapCompanies.forEach((company) => {
    const isSelected = company.dataset.mapId === selectedId;
    company.classList.toggle('active', isSelected);
    company.setAttribute('aria-pressed', String(isSelected));
    if (isSelected) selectedCompany = company;
  });

  if (selectedCompany && mapCompanyPanel) {
    mapCompanyPanel.scrollTo({
      top: Math.max(0, selectedCompany.offsetTop - mapCompanyPanel.offsetTop - 16),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }
};

const buildMunicipalMap = () => {
  const container = document.querySelector('#municipal-map-canvas');
  const data = window.VERACRUZ_MUNICIPIOS;
  if (!container || !data) return null;

  const namespace = 'http://www.w3.org/2000/svg';
  const createSvgElement = (tag, attributes = {}) => {
    const element = document.createElementNS(namespace, tag);
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
    return element;
  };

  const fullView = { x: 0, y: 0, w: data.width, h: data.height };
  let currentView = { ...fullView };
  let animationFrame = null;
  const routeIds = new Set(workplaces.map((workplace) => workplace.cvegeo));
  const municipalityById = new Map(data.municipalities.map((municipality) => [municipality.id, municipality]));

  const svg = createSvgElement('svg', {
    viewBox: `0 0 ${data.width} ${data.height}`,
    role: 'img',
    'aria-label': 'Mapa de Veracruz dividido en sus 212 municipios',
    preserveAspectRatio: 'xMidYMid meet',
  });

  const defs = createSvgElement('defs');
  const gradient = createSvgElement('linearGradient', { id: 'municipal-active', x1: '0', y1: '0', x2: '1', y2: '1' });
  gradient.append(createSvgElement('stop', { offset: '0', 'stop-color': '#9d8cff' }));
  gradient.append(createSvgElement('stop', { offset: '1', 'stop-color': '#6043c3' }));
  const baseGradient = createSvgElement('linearGradient', { id: 'municipal-base', x1: '0', y1: '0', x2: '1', y2: '1' });
  baseGradient.append(createSvgElement('stop', { offset: '0', 'stop-color': '#6f60df' }));
  baseGradient.append(createSvgElement('stop', { offset: '.58', 'stop-color': '#6941cc' }));
  baseGradient.append(createSvgElement('stop', { offset: '1', 'stop-color': '#7d258f' }));
  const filter = createSvgElement('filter', { id: 'municipal-glow', x: '-80%', y: '-80%', width: '260%', height: '260%' });
  filter.append(createSvgElement('feGaussianBlur', { stdDeviation: '7', result: 'blur' }));
  const merge = createSvgElement('feMerge');
  merge.append(createSvgElement('feMergeNode', { in: 'blur' }));
  merge.append(createSvgElement('feMergeNode', { in: 'SourceGraphic' }));
  filter.append(merge);
  defs.append(baseGradient, gradient, filter);
  svg.append(defs);

  const paths = new Map();
  const municipalityLayer = createSvgElement('g', { class: 'municipality-layer' });
  data.municipalities.forEach((municipality) => {
    const path = createSvgElement('path', {
      class: `municipality${routeIds.has(municipality.id) ? ' route-municipality' : ''}`,
      d: municipality.d,
      'data-municipality': municipality.id,
    });
    const title = createSvgElement('title');
    title.textContent = municipality.name;
    path.append(title);
    municipalityLayer.append(path);
    paths.set(municipality.id, path);
  });
  svg.append(municipalityLayer);

  const markers = new Map();
  const markerLayer = createSvgElement('g', { class: 'municipality-markers' });
  workplaces.forEach((workplace) => {
    const municipality = municipalityById.get(workplace.cvegeo);
    if (!municipality) return;
    const [x, y] = municipality.center;
    const group = createSvgElement('g', { class: 'municipality-marker', 'data-workplace': workplace.id });
    group.append(createSvgElement('circle', { cx: x, cy: y, r: 3 }));
    const company = createSvgElement('text', { x, y: y - 17 });
    company.textContent = workplace.company;
    const place = createSvgElement('text', { class: 'municipality-small', x, y: y + 22 });
    place.textContent = workplace.municipality;
    group.append(company, place);
    markerLayer.append(group);
    markers.set(workplace.id, group);
  });
  svg.append(markerLayer);
  container.append(svg);

  const selection = document.createElement('div');
  selection.className = 'municipal-selection';
  selection.innerHTML = '<span>Municipio seleccionado</span><strong></strong>';
  mapStage?.append(selection);

  const setViewBox = (view) => svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.w} ${view.h}`);
  const animateTo = (target) => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      currentView = target;
      setViewBox(target);
      return;
    }
    const start = { ...currentView };
    const startTime = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - startTime) / 680);
      const eased = 1 - Math.pow(1 - progress, 3);
      currentView = {
        x: start.x + (target.x - start.x) * eased,
        y: start.y + (target.y - start.y) * eased,
        w: start.w + (target.w - start.w) * eased,
        h: start.h + (target.h - start.h) * eased,
      };
      setViewBox(currentView);
      if (progress < 1) animationFrame = requestAnimationFrame(tick);
    };
    animationFrame = requestAnimationFrame(tick);
  };

  const select = (workplaceId) => {
    const workplace = workplaces.find((item) => item.id === workplaceId);
    const municipality = workplace && municipalityById.get(workplace.cvegeo);
    if (!workplace || !municipality) return;

    mapStage?.classList.add('municipal-mode');
    mapStage?.classList.remove('municipal-overview');
    careerMapShell?.classList.add('veracruz-active');
    careerMapShell?.classList.remove('map-national');
    if (mapBackLabel) mapBackLabel.textContent = ' Ver Veracruz completo';
    container.setAttribute('aria-hidden', 'false');
    selection.querySelector('strong').textContent = `${workplace.municipality} · ${workplace.company}`;
    paths.forEach((path, id) => path.classList.toggle('selected', id === workplace.cvegeo));
    markers.forEach((marker, id) => marker.classList.toggle('selected', id === workplaceId));

    const [x, y, width, height] = municipality.bbox;
    const aspect = Math.max(.9, container.clientWidth / Math.max(container.clientHeight, 1));
    const targetWidth = Math.max(82, width * 3.1, height * 3.1 * aspect);
    const targetHeight = targetWidth / aspect;
    animateTo({
      x: x + width / 2 - targetWidth / 2,
      y: y + height / 2 - targetHeight / 2,
      w: targetWidth,
      h: targetHeight,
    });
  };

  const reset = () => {
    mapStage?.classList.add('municipal-mode', 'municipal-overview');
    careerMapShell?.classList.add('veracruz-active');
    careerMapShell?.classList.remove('map-national');
    container.setAttribute('aria-hidden', 'false');
    animateTo(fullView);
    paths.forEach((path) => path.classList.remove('selected'));
    markers.forEach((marker) => marker.classList.remove('selected'));
    activateMapCompany(null);
    if (mapTitle) mapTitle.textContent = 'Veracruz';
    if (mapHeadingEyebrow) mapHeadingEyebrow.textContent = 'Golfo · Veracruz';
    if (mapHeadingSubtitle) mapHeadingSubtitle.textContent = 'Selecciona una empresa o uno de los municipios destacados.';
    if (mapBackLabel) mapBackLabel.textContent = ' Ver México';
  };

  const exit = () => {
    mapStage?.classList.remove('municipal-mode', 'municipal-overview');
    careerMapShell?.classList.remove('veracruz-active');
    careerMapShell?.classList.add('map-national');
    container.setAttribute('aria-hidden', 'true');
    currentView = { ...fullView };
    setViewBox(fullView);
    paths.forEach((path) => path.classList.remove('selected'));
    markers.forEach((marker) => marker.classList.remove('selected'));
    activateMapCompany(null);
    if (mapTitle) mapTitle.textContent = 'México';
    if (mapHeadingEyebrow) mapHeadingEyebrow.textContent = 'México · Trayectoria profesional';
    if (mapHeadingSubtitle) mapHeadingSubtitle.textContent = 'Selecciona Veracruz para explorar mis experiencias.';
  };

  workplaces.forEach((workplace) => {
    const path = paths.get(workplace.cvegeo);
    if (!path) return;
    path.classList.add('interactive');
    path.addEventListener('click', () => {
      activateMapCompany(workplace.id);
      select(workplace.id);
    });
  });

  exit();
  return { select, reset, exit };
};

const municipalMap = buildMunicipalMap();
let careerMap = null;

if (window.MapaWeb && window.MAPA_MEXICO && document.querySelector('#career-map-canvas')) {
  careerMap = window.MapaWeb.crear('#career-map-canvas', {
    datos: window.MAPA_MEXICO,
    zoom: 1.08,
    margen: 32,
    anchoMinimoEtiquetas: 680,
    puntos: [{
      id: 'veracruz', nombre: 'Veracruz', detalle: '5 experiencias', estado: 'MX-VER',
      lat: 19.1738, lon: -96.1342, base: true, etiquetaX: 895, etiquetaY: 455,
    }],
    alSeleccionar: (point) => {
      if (point?.id === 'veracruz') municipalMap?.reset();
    },
  });
}

nationalCompanyStack?.addEventListener('click', () => municipalMap?.reset());

mapCompanies.forEach((company) => {
  company.addEventListener('click', () => {
    const id = company.dataset.mapId;
    activateMapCompany(id);
    municipalMap?.select(id);
  });
});

mapBack?.addEventListener('click', () => {
  if (mapStage?.classList.contains('municipal-overview')) {
    municipalMap?.exit();
    careerMap?.reiniciar();
  } else {
    municipalMap?.reset();
  }
});

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('visible'));
}

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
