let result = document.getElementById("result");
let searchBtn = document.getElementById("search-btn");
let cityRef = document.getElementById("city");

//Function to fetch weather details from api and display them
let getWeather = () => {
  let cityValue = cityRef.value;
  //If input field is empty
  if (cityValue.length == 0) {
    result.innerHTML = `<h3 class="msg">Ingresa una ciudad</h3>`;
  }
  //If input field is NOT empty
  else {
    let url = `https://api.openweathermap.org/data/2.5/weather?q=${cityValue}&appid=${key}&units=metric&lang=es`;
    //Clear the input field
    cityRef.value = "";
    fetch(url)
      .then((resp) => resp.json())
      //If city name is valid
      .then((data) => {
        console.log(data);
        console.log(data.weather[0].icon);
        console.log(data.weather[0].main);
        console.log(data.weather[0].description);
        console.log(data.name);
        console.log(data.main.temp_min);
        console.log(data.main.temp_max);
        console.log(data.main.humidity)
        result.innerHTML = `
        <h2>${data.name}</h2>
        <h4 class="desc">${data.weather[0].description}</h4>
        <img src="https://openweathermap.org/img/w/${data.weather[0].icon}.png">
        <h1>${ Math.round(data.main.temp)} &#176;C</h1>
        <h4 class="desc">Humedad: ${data.main.humidity}%</h4>
        <div class="temp-container">
            <div>
                <h4 class="title">Min</h4>
                <h4 class="temp">${ Math.round(data.main.temp_min)} &#176;C</h4>
            </div>
            <div>
                <h4 class="title">Max</h4>
                <h4 class="temp">${ Math.round(data.main.temp_max)} &#176;C</h4>
            </div>
        </div>
        `;
      })
      //If city name is NOT valid
      .catch(() => {
        result.innerHTML = `<h3 class="msg">Ciudad no encontrada</h3>`;
      });
  }
};
searchBtn.addEventListener("click", getWeather);
window.addEventListener("load", getWeather);