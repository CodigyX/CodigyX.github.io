document.addEventListener("DOMContentLoaded", () => {
  const btnPDF  = document.getElementById("btnPDF");
  const btnLang = document.getElementById("btnLang");
  const langLabel = document.getElementById("langLabel");
  let currentLang = "es";

  // ── CAMBIO DE IDIOMA ──────────────────────────
  btnLang.addEventListener("click", () => {
    currentLang = currentLang === "es" ? "en" : "es";
    langLabel.textContent = currentLang === "es" ? "EN" : "ES";
    document.documentElement.lang = currentLang;

    document.querySelectorAll("[data-es]").forEach(el => {
      el.textContent = currentLang === "es"
        ? el.getAttribute("data-es")
        : el.getAttribute("data-en");
    });
  });

  // ── GUARDAR PDF CON TEXTO SELECCIONABLE ───────
  btnPDF.addEventListener("click", () => {
    window.print();
  });
});
