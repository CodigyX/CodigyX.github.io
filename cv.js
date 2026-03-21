document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnPDF");

  btn.addEventListener("click", () => {

    const body = document.getElementById("body");
    const element = document.getElementById("cv");

    // ACTIVAR MODO ATS
    body.classList.add("ats-mode");

    const opt = {
      margin: 0.3,
      filename: "Erick_Barrena_Backend_Developer_ATS.pdf",
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      // DESACTIVAR MODO ATS
      body.classList.remove("ats-mode");
    });

  });
});