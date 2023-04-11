var nombre="CodigyX"
var email="codigyx89@gmail.com"
var edad = 22

function getNombre() {
	console.log(nombre);
	var myNameElement = document.getElementById("nombre");
	myNameElement.innerHTML = nombre;

}

function getEmail() {
        console.log(email);
        var myEmailElement = document.getElementById("email");
        myEmailElement.innerHTML = '<b>' + email + '</b>';
}

function getEdad() {
        console.log(edad);
        var myEdadElement = document.getElementById("edad");
        myEdadElement.innerHTML = '<h1>' + edad + '</h1>';
	myEdadElement.style.color = "#0000FF";

}

