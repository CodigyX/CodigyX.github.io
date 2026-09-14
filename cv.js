document.addEventListener("DOMContentLoaded", () => {
  const btnPDF  = document.getElementById("btnPDF");
  const btnLang = document.getElementById("btnLang");
  const langLabel = document.getElementById("langLabel");
  const supportedLanguages = ["es", "en"];

  const getInitialLanguage = () => {
    const urlLanguage = new URLSearchParams(window.location.search).get("lang");
    if (supportedLanguages.includes(urlLanguage)) return urlLanguage;

    const savedLanguage = localStorage.getItem("cv-language");
    if (supportedLanguages.includes(savedLanguage)) return savedLanguage;

    return navigator.language.toLowerCase().startsWith("en") ? "en" : "es";
  };

  let currentLang = getInitialLanguage();

  const setLanguage = (language, { updateUrl = true, save = true } = {}) => {
    currentLang = supportedLanguages.includes(language) ? language : "es";
    document.documentElement.lang = currentLang;
    langLabel.textContent = currentLang === "es" ? "EN" : "ES";
    btnLang.setAttribute(
      "aria-label",
      currentLang === "es" ? "Ver CV en inglés" : "View CV in Spanish"
    );

    document.querySelectorAll("[data-es]").forEach(el => {
      el.textContent = el.getAttribute(`data-${currentLang}`);
    });

    if (save) localStorage.setItem("cv-language", currentLang);

    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set("lang", currentLang);
      window.history.replaceState({ lang: currentLang }, "", url);
    }
  };

  // ── CAMBIO DE IDIOMA ──────────────────────────
  btnLang.addEventListener("click", () => {
    setLanguage(currentLang === "es" ? "en" : "es");
  });

  setLanguage(currentLang);

  // ── GUARDAR PDF CON TEXTO SELECCIONABLE ───────
  btnPDF.addEventListener("click", () => {
    window.print();
  });
});
