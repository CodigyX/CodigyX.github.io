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

  // ── DESCARGAR PDF ─────────────────────────────
  btnPDF.addEventListener("click", () => {
    const controls = document.getElementById("controls");
    const element  = document.getElementById("cv");
    controls.style.display = "none";

    const lang = currentLang === "es" ? "ES" : "EN";

    html2pdf().set({
      margin: 0.4,
      filename: `Erick_Barrena_Backend_Developer_${lang}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
    }).from(element).save().then(() => {
      controls.style.display = "flex";
    });
  });
});