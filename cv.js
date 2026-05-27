document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnPDF");
  const btnLang = document.getElementById("btnLang");
  const langLabel = document.getElementById("langLabel");

  let currentLang = "es";

  // ── CAMBIO DE IDIOMA ─────────────────────────────────────────
  btnLang.addEventListener("click", () => {
    currentLang = currentLang === "es" ? "en" : "es";
    langLabel.textContent = currentLang === "es" ? "EN" : "ES";

    // Actualizar todos los elementos con data-es / data-en
    document.querySelectorAll("[data-es]").forEach(el => {
      el.textContent = currentLang === "es"
        ? el.getAttribute("data-es")
        : el.getAttribute("data-en");
    });

    // Actualizar atributo lang del html
    document.documentElement.lang = currentLang;
  });

  // ── DESCARGAR PDF ─────────────────────────────────────────────
  btn.addEventListener("click", () => {
    const body = document.getElementById("body");
    const element = document.getElementById("cv");

    // Ocultar controles durante la generación
    document.querySelector(".top-controls").style.display = "none";

    const lang = currentLang === "es" ? "ES" : "EN";
    const filename = `Erick_Barrena_Backend_Developer_${lang}.pdf`;

    const opt = {
      margin: 0.3,
      filename: filename,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      document.querySelector(".top-controls").style.display = "flex";
    });
  });
});