document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnPDF");

  btn.addEventListener("click", () => {
    const element = document.getElementById("cv");

    const opt = {
      margin: 0.2,
      filename: "Erick_Barrena_Backend_Developer.pdf",
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  });
});