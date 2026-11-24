/* Portafolio · Erick Barrena — interacciones */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) {
      return null;
    }
    return null;
  }

  /* ---------- Aviso breve ---------- */
  var toast = document.getElementById("toast");
  var toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-visible"); }, 2200);
  }

  /* ---------- Idioma ---------- */
  var langs = ["es", "en"];
  var btnLang = document.getElementById("btnLang");
  var lang = (function () {
    var fromUrl = new URLSearchParams(location.search).get("lang");
    if (langs.indexOf(fromUrl) >= 0) return fromUrl;
    var saved = store("pf-lang");
    if (langs.indexOf(saved) >= 0) return saved;
    return (navigator.language || "es").toLowerCase().indexOf("en") === 0 ? "en" : "es";
  })();

  var labels = {
    es: { lang: "Change language to English", theme: "Cambiar tema", menuOpen: "Abrir menú", menuClose: "Cerrar menú", copied: "Correo copiado", copyFail: "No se pudo copiar" },
    en: { lang: "Cambiar idioma a español", theme: "Toggle theme", menuOpen: "Open menu", menuClose: "Close menu", copied: "Email copied", copyFail: "Couldn't copy" }
  };

  function setLang(next, opts) {
    lang = langs.indexOf(next) >= 0 ? next : "es";
    root.lang = lang;
    document.querySelectorAll("[data-es]").forEach(function (el) {
      var text = el.getAttribute("data-" + lang);
      if (text !== null) el.textContent = text;
    });
    btnLang.textContent = lang === "es" ? "EN" : "ES";
    btnLang.setAttribute("aria-label", labels[lang].lang);
    document.getElementById("btnTheme").setAttribute("aria-label", labels[lang].theme);
    updateMenuLabel();
    if (!opts || opts.save !== false) store("pf-lang", lang);
    var url = new URL(location.href);
    url.searchParams.set("lang", lang);
    history.replaceState(null, "", url);
  }

  btnLang.addEventListener("click", function () { setLang(lang === "es" ? "en" : "es"); });

  /* ---------- Tema ---------- */
  var btnTheme = document.getElementById("btnTheme");
  var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function currentTheme() {
    var forced = root.getAttribute("data-theme");
    if (forced) return forced;
    return darkQuery.matches ? "dark" : "light";
  }

  btnTheme.addEventListener("click", function () {
    var next = currentTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    store("pf-theme", next);
  });

  /* ---------- Menú móvil ---------- */
  var btnMenu = document.getElementById("btnMenu");
  var navLinks = document.getElementById("navLinks");

  function updateMenuLabel() {
    var open = btnMenu.getAttribute("aria-expanded") === "true";
    btnMenu.setAttribute("aria-label", open ? labels[lang].menuClose : labels[lang].menuOpen);
  }

  function setMenu(open) {
    btnMenu.setAttribute("aria-expanded", String(open));
    navLinks.classList.toggle("is-open", open);
    updateMenuLabel();
  }

  btnMenu.addEventListener("click", function () {
    setMenu(btnMenu.getAttribute("aria-expanded") !== "true");
  });
  navLinks.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });
  window.matchMedia("(min-width: 900px)").addEventListener("change", function (e) {
    if (e.matches) setMenu(false);
  });

  /* ---------- Barra al hacer scroll ---------- */
  var nav = document.getElementById("nav");
  function onScroll() { nav.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Sección activa ---------- */
  var navMap = {};
  navLinks.querySelectorAll('a[href^="#"]').forEach(function (a) {
    navMap[a.getAttribute("href").slice(1)] = a;
  });

  if ("IntersectionObserver" in window) {
    var activeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        Object.keys(navMap).forEach(function (id) {
          navMap[id].classList.toggle("is-active", id === entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main section[id]").forEach(function (s) { activeObserver.observe(s); });
  }

  /* ---------- Aparición y contadores ---------- */
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var prefix = el.getAttribute("data-prefix") || "";
    if (reduceMotion || isNaN(target)) { el.textContent = prefix + target; return; }
    var start = null;
    var duration = 1100;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        entry.target.querySelectorAll("[data-count]").forEach(countUp);
        obs.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Copiar correo ---------- */
  var btnCopy = document.getElementById("btnCopy");
  if (btnCopy) {
    btnCopy.addEventListener("click", function () {
      var email = "ecodigyx@gmail.com";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(
          function () { showToast(labels[lang].copied); },
          function () { showToast(labels[lang].copyFail); }
        );
      } else {
        showToast(labels[lang].copyFail);
      }
    });
  }

  /* ---------- Temática metro: líneas por tecnología ---------- */
  var techLine = {
    be: ["java", "spring", "jpa", "hibernate", "ejb", "rest", "maven"],
    db: ["sql", "mariadb", "postgresql", "mysql", "minio"],
    fe: ["jsp", "angular", "typescript", "javascript", "html", "flutter", "swing", "wordpress", "php"],
    qa: ["junit", "playwright", "pytest", "postman"],
    inf: ["docker", "github actions", "git", "payara", "tomcat", "jira", "rabbitmq", "kubernetes"]
  };
  document.querySelectorAll(".tags li").forEach(function (li) {
    var name = li.textContent.trim().toLowerCase();
    var order = ["qa", "inf", "db", "fe", "be"]; // las más específicas primero
    for (var i = 0; i < order.length; i++) {
      var keys = techLine[order[i]];
      for (var k = 0; k < keys.length; k++) {
        if (name.indexOf(keys[k]) === 0 || name === keys[k]) {
          li.setAttribute("data-line", order[i]);
          return;
        }
      }
    }
  });

  /* ---------- Temática metro: el tren avanza con el scroll ---------- */
  var metroLine = document.querySelector(".metro-line");
  var train = metroLine && metroLine.querySelector(".train");
  var trainTicking = false;

  function moveTrain() {
    trainTicking = false;
    if (!train) return;
    var rect = metroLine.getBoundingClientRect();
    var travel = Math.max(rect.height - train.offsetHeight - 20, 0);
    var progress = (window.innerHeight * 0.55 - rect.top) / rect.height;
    progress = Math.min(Math.max(progress, 0), 1);
    train.style.setProperty("--train-y", Math.round(10 + travel * progress) + "px");
  }
  function requestTrain() {
    if (!trainTicking) { trainTicking = true; requestAnimationFrame(moveTrain); }
  }
  if (train && !reduceMotion) {
    window.addEventListener("scroll", requestTrain, { passive: true });
    window.addEventListener("resize", requestTrain);
    moveTrain();
  }


  setLang(lang, { save: false });
})();
