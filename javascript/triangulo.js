var base;
var altura;
var area;

function calcularArea() {
	var baseElement = document.getElementById("base");
	var alturaElement = document.getElementById("altura");
	base = baseElement.value;
	altura = alturaElement.value;
	console.log(base);
	console.log(altura);

	area = (base * altura) / 2;
	console.log(area);

	var areaElement = document.getElementById("resultado")
	areaElement.innerHTML = 'Area = ' + area;
}
