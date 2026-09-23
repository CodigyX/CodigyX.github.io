/**
 * mapa-web — mapa SVG interactivo desde datos geográficos reales.
 * Sin dependencias, sin API key, sin peticiones al cargar.
 *
 *   MapaWeb.crear('#mapa', {
 *     datos: MAPA_MEXICO,
 *     puntos: [
 *       { nombre: 'Veracruz', estado: 'MX-VER', lat: 19.1738, lon: -96.1342, base: true },
 *       { nombre: 'Cancún',   estado: 'MX-ROO', lat: 21.1619, lon: -86.8515 },
 *     ],
 *   });
 */
window.MapaWeb = (() => {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const crearNodo = (etiqueta, atributos = {}) => {
    const nodo = document.createElementNS(NS, etiqueta);
    for (const [clave, valor] of Object.entries(atributos)) {
      if (valor !== null && valor !== undefined) nodo.setAttribute(clave, String(valor));
    }
    return nodo;
  };

  const OPCIONES_POR_DEFECTO = {
    // Margen alrededor del país, en unidades del lienzo
    margen: 40,
    // Cuánto se acerca la cámara al elegir un punto (1 = sin acercar)
    zoom: 2.2,
    // Duración del viaje de la cámara, en milisegundos
    duracion: 700,
    // Dibujar arcos desde el punto marcado como `base` hacia los demás
    arcos: true,
    // Etiquetas de texto junto a cada punto. Se ocultan bajo este ancho.
    etiquetas: true,
    anchoMinimoEtiquetas: 640,
    // Se llama al seleccionar o deseleccionar un punto
    alSeleccionar: null,
  };

  /** Convierte lat/lon a coordenadas del lienzo usando la proyección del archivo de datos. */
  function proyectar(proyeccion, lat, lon) {
    const mercY = (Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 180 / 2)) * 180) / Math.PI;
    return {
      x: (lon - proyeccion.minLon) * proyeccion.escala,
      y: (proyeccion.maxY - mercY) * proyeccion.escala,
    };
  }

  function crear(contenedor, opciones) {
    const raiz = typeof contenedor === 'string' ? document.querySelector(contenedor) : contenedor;
    if (!raiz) throw new Error('mapa-web: no encontré el contenedor');

    const cfg = { ...OPCIONES_POR_DEFECTO, ...opciones };
    const datos = cfg.datos;
    if (!datos || !datos.estados) throw new Error('mapa-web: falta la opción `datos`');

    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Cada punto se resuelve a coordenadas del lienzo una sola vez
    const puntos = (cfg.puntos || []).map((punto, indice) => {
      const posicion =
        punto.x !== undefined && punto.y !== undefined
          ? { x: punto.x, y: punto.y }
          : proyectar(datos.proyeccion, punto.lat, punto.lon);
      return { ...punto, ...posicion, id: punto.id || `punto-${indice}` };
    });

    const porEstado = new Map(puntos.filter((p) => p.estado).map((p) => [p.estado, p]));
    const base = puntos.find((p) => p.base) || puntos[0];

    // --- Lienzo -----------------------------------------------------------
    const VISTA = {
      x: -cfg.margen,
      y: -cfg.margen * 0.75,
      w: datos.ancho + cfg.margen * 2,
      h: datos.alto + cfg.margen * 1.5,
    };

    const svg = crearNodo('svg', {
      class: 'mw',
      viewBox: `${VISTA.x} ${VISTA.y} ${VISTA.w} ${VISTA.h}`,
      role: 'img',
      'aria-label': cfg.textoAlternativo || `Mapa de ${datos.pais}`,
    });

    // Resplandor detrás del país. Solo emite el desenfoque: la silueta que lo
    // genera nunca se pinta, por eso el filtro no incluye SourceGraphic.
    const defs = crearNodo('defs');
    defs.innerHTML = `
      <linearGradient id="mwRelleno" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--mw-estado-desde, #251152)"/>
        <stop offset="100%" stop-color="var(--mw-estado-hasta, #150931)"/>
      </linearGradient>
      <linearGradient id="mwActivo" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="var(--mw-activo-desde, #4f46e5)"/>
        <stop offset="100%" stop-color="var(--mw-activo-hasta, #9333ea)"/>
      </linearGradient>
      <radialGradient id="mwHalo">
        <stop offset="0%" stop-color="var(--mw-halo, #c7d2fe)" stop-opacity=".9"/>
        <stop offset="100%" stop-color="var(--mw-halo, #6366f1)" stop-opacity="0"/>
      </radialGradient>
      <filter id="mwResplandor" x="-25%" y="-25%" width="150%" height="150%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="9" result="difuso"/>
        <feFlood flood-color="var(--mw-resplandor, #7c6bff)" flood-opacity=".55" result="tinte"/>
        <feComposite in="tinte" in2="difuso" operator="in"/>
      </filter>`;
    svg.appendChild(defs);

    // Dos grupos y no uno: el de dentro lleva la animación de entrada, que
    // termina con `forwards` y fija la opacidad. El de fuera queda libre para
    // que el zoom pueda desvanecerlo sin pelearse con ella.
    const capaResplandor = crearNodo('g', { class: 'mw-capa-resplandor' });
    const resplandor = crearNodo('g', { class: 'mw-resplandor' });
    resplandor.appendChild(crearNodo('path', { d: datos.silueta, fill: '#000', filter: 'url(#mwResplandor)' }));
    capaResplandor.appendChild(resplandor);
    svg.appendChild(capaResplandor);

    // --- Entidades --------------------------------------------------------
    const capaEstados = crearNodo('g', { class: 'mw-estados', fill: 'url(#mwRelleno)', 'stroke-linejoin': 'round' });
    const nodosEstado = new Map();

    datos.estados.forEach((estado, i) => {
      const activo = porEstado.has(estado.codigo);
      const trazo = crearNodo('path', {
        class: 'mw-estado' + (activo ? ' mw-estado-activo' : ''),
        d: estado.d,
        'data-codigo': estado.codigo,
        style: `--i:${i}`,
      });
      const titulo = crearNodo('title');
      titulo.textContent = estado.nombre;
      trazo.appendChild(titulo);
      capaEstados.appendChild(trazo);
      nodosEstado.set(estado.codigo, trazo);
    });
    svg.appendChild(capaEstados);

    // Copia del estado elegido, encima de la capa atenuada. El halo es un
    // trazo grueso y no un drop-shadow: un filtro aquí se tendría que
    // rasterizar de nuevo en cada cuadro del zoom, y ahí es donde parpadea.
    const capaDestacada = crearNodo('g', { class: 'mw-destacada', fill: 'url(#mwActivo)', 'stroke-linejoin': 'round' });
    svg.appendChild(capaDestacada);

    // --- Arcos ------------------------------------------------------------
    const capaArcos = crearNodo('g', { class: 'mw-arcos' });
    if (cfg.arcos && base) {
      puntos
        .filter((p) => p !== base)
        .forEach((punto, i) => {
          const distancia = Math.hypot(punto.x - base.x, punto.y - base.y);
          const cx = (base.x + punto.x) / 2;
          const cy = (base.y + punto.y) / 2 - distancia * 0.3;
          const d = `M${base.x} ${base.y}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${punto.x} ${punto.y}`;
          const grupo = crearNodo('g', { style: `--d:${(i * 0.22).toFixed(2)}s` });
          grupo.appendChild(crearNodo('path', { class: 'mw-arco', d, pathLength: 100 }));
          grupo.appendChild(crearNodo('path', { class: 'mw-arco-luz', d, pathLength: 100 }));
          capaArcos.appendChild(grupo);
        });
    }
    svg.appendChild(capaArcos);

    // --- Marcadores -------------------------------------------------------
    const nodosPunto = new Map();

    puntos.forEach((punto, i) => {
      const grupo = crearNodo('g', {
        class: 'mw-punto' + (punto.base ? ' mw-punto-base' : ''),
        'data-punto': punto.id,
        style: `--d:${(i * 0.16).toFixed(2)}s`,
        tabindex: 0,
        role: 'button',
        'aria-label': punto.nombre,
      });

      // El círculo se escala aparte: su caja son puros círculos concéntricos,
      // así el centro no se corre y --contra lo mantiene del mismo tamaño en
      // pantalla aunque la cámara se acerque.
      const circulo = crearNodo('g', { class: 'mw-circulo' });
      circulo.appendChild(crearNodo('circle', { class: 'mw-golpe', cx: punto.x, cy: punto.y, r: 20, fill: 'transparent' }));
      circulo.appendChild(crearNodo('circle', { class: 'mw-pulso', cx: punto.x, cy: punto.y, r: 9 }));
      circulo.appendChild(crearNodo('circle', { class: 'mw-halo', cx: punto.x, cy: punto.y, r: 11, fill: 'url(#mwHalo)' }));
      circulo.appendChild(crearNodo('circle', { class: 'mw-foco', cx: punto.x, cy: punto.y, r: 14 }));
      circulo.appendChild(crearNodo('circle', { class: 'mw-nucleo', cx: punto.x, cy: punto.y, r: punto.base ? 4.4 : 3.4 }));
      grupo.appendChild(circulo);

      if (cfg.etiquetas && punto.nombre) {
        const ancla = punto.anclaEtiqueta || (punto.x > datos.ancho * 0.55 ? 'end' : 'start');
        const ex = punto.etiquetaX ?? punto.x + (ancla === 'start' ? 18 : -18);
        const ey = punto.etiquetaY ?? punto.y - 16;

        // Mismo motivo que el resplandor: el interior lleva la entrada, el
        // exterior queda libre para desvanecerse cuando la cámara se acerca.
        const rotulo = crearNodo('g', { class: 'mw-rotulo' });
        const interior = crearNodo('g', { class: 'mw-rotulo-interior' });
        const guiaX = ex + (ancla === 'start' ? -9 : 9);
        const guiaY = ey - 4;
        const dx = guiaX - punto.x;
        const dy = guiaY - punto.y;
        const largo = Math.hypot(dx, dy) || 1;
        interior.appendChild(
          crearNodo('path', {
            class: 'mw-guia',
            d: `M${(punto.x + (dx / largo) * 11).toFixed(1)} ${(punto.y + (dy / largo) * 11).toFixed(1)}L${ex} ${ey}`,
          })
        );
        const titulo = crearNodo('text', { class: 'mw-etiqueta', x: ex, y: ey, 'text-anchor': ancla });
        titulo.textContent = punto.nombre;
        interior.appendChild(titulo);
        if (punto.detalle) {
          const detalle = crearNodo('text', { class: 'mw-detalle', x: ex, y: ey + 17, 'text-anchor': ancla });
          detalle.textContent = punto.detalle;
          interior.appendChild(detalle);
        }
        rotulo.appendChild(interior);
        grupo.appendChild(rotulo);
      }

      capaEstados.after(grupo);
      svg.appendChild(grupo);
      nodosPunto.set(punto.id, grupo);
    });

    raiz.classList.add('mw-contenedor');
    raiz.appendChild(svg);

    // --- Cámara -----------------------------------------------------------
    // Se anima el viewBox y no un transform de CSS: escalar por CSS un grupo
    // de este tamaño obliga al navegador a rasterizar una capa de miles de
    // píxeles, y hay equipos donde esa capa se corta o se queda en gris.
    let encuadre = { ...VISTA };
    let cuadro = 0;
    let seleccionado = null;

    const pintarEncuadre = () =>
      svg.setAttribute(
        'viewBox',
        `${encuadre.x.toFixed(1)} ${encuadre.y.toFixed(1)} ${encuadre.w.toFixed(1)} ${encuadre.h.toFixed(1)}`
      );

    function viajarA(destino) {
      cancelAnimationFrame(cuadro);
      svg.style.setProperty('--contra', String(destino.w / VISTA.w));

      if (quieto.matches) {
        encuadre = { ...destino };
        pintarEncuadre();
        return;
      }

      const desde = { ...encuadre };
      const arranque = performance.now();
      svg.classList.add('mw-moviendo');

      const paso = (ahora) => {
        const t = Math.min(1, (ahora - arranque) / cfg.duracion);
        const e = 1 - Math.pow(1 - t, 3);
        encuadre = {
          x: desde.x + (destino.x - desde.x) * e,
          y: desde.y + (destino.y - desde.y) * e,
          w: desde.w + (destino.w - desde.w) * e,
          h: desde.h + (destino.h - desde.h) * e,
        };
        pintarEncuadre();
        if (t < 1) cuadro = requestAnimationFrame(paso);
        else svg.classList.remove('mw-moviendo');
      };
      cuadro = requestAnimationFrame(paso);
    }

    function seleccionar(id) {
      const punto = id ? puntos.find((p) => p.id === id) : null;
      seleccionado = punto ? punto.id : null;

      if (punto) {
        const escala = punto.zoom || cfg.zoom;
        const w = VISTA.w / escala;
        const h = VISTA.h / escala;
        viajarA({ x: punto.x - w / 2, y: punto.y - h / 2, w, h });
      } else {
        viajarA({ ...VISTA });
      }
      svg.classList.toggle('mw-enfocado', Boolean(punto));

      capaDestacada.replaceChildren();
      const original = punto && punto.estado ? nodosEstado.get(punto.estado) : null;
      if (original) {
        for (const clase of ['mw-halo-estado', 'mw-estado-destacado']) {
          const copia = original.cloneNode(false);
          copia.setAttribute('class', clase);
          copia.setAttribute('vector-effect', 'non-scaling-stroke');
          copia.removeAttribute('style');
          capaDestacada.appendChild(copia);
        }
      }

      nodosPunto.forEach((nodo, clave) => nodo.classList.toggle('mw-seleccionado', clave === seleccionado));
      if (typeof cfg.alSeleccionar === 'function') cfg.alSeleccionar(punto || null);
    }

    const alternar = (id) => seleccionar(seleccionado === id ? null : id);

    nodosPunto.forEach((nodo, id) => {
      nodo.addEventListener('click', () => alternar(id));
      nodo.addEventListener('keydown', (evento) => {
        if (evento.key === 'Enter' || evento.key === ' ') {
          evento.preventDefault();
          alternar(id);
        }
      });
      nodo.addEventListener('mouseenter', () => nodo.classList.add('mw-encima'));
      nodo.addEventListener('mouseleave', () => nodo.classList.remove('mw-encima'));
    });

    document.addEventListener('keydown', (evento) => {
      if (evento.key === 'Escape' && seleccionado) seleccionar(null);
    });

    // Las etiquetas se apagan en pantallas angostas: no caben legibles
    const anchas = window.matchMedia(`(min-width: ${cfg.anchoMinimoEtiquetas}px)`);
    const ajustarEtiquetas = () => svg.classList.toggle('mw-sin-etiquetas', !anchas.matches);
    ajustarEtiquetas();
    anchas.addEventListener('change', ajustarEtiquetas);

    // Las animaciones de entrada arrancan cuando el mapa se ve
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        raiz.classList.add('mw-en-vista');
        observador.disconnect();
      },
      { threshold: 0.15 }
    );
    observador.observe(raiz);

    return {
      svg,
      puntos,
      seleccionar,
      reiniciar: () => seleccionar(null),
      seleccionado: () => (seleccionado ? puntos.find((p) => p.id === seleccionado) : null),
    };
  }

  return { crear, proyectar };
})();
