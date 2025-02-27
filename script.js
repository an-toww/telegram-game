// Инициализация карты с центром на Москве
var map = L.map('map').setView([55.751244, 37.618423], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Массив с данными о кортах и их характеристиками
var courts = [
  { name: "Парк Горького", lat: 55.7308, lon: 37.6034, surface: "hard", lights: true, locker: false },
  { name: "Лужники", lat: 55.7158, lon: 37.5537, surface: "clay", lights: true, locker: true },
  { name: "Сокольники", lat: 55.7942, lon: 37.6742, surface: "grass", lights: false, locker: false },
  { name: "Филевский парк", lat: 55.7451, lon: 37.4673, surface: "hard", lights: true, locker: true }
];

var userMarker;
var courtMarkers = [];

// Функция для добавления маркеров кортов на карту
function addCourts(filteredCourts = courts) {
  courtMarkers.forEach(function(marker) {
    map.removeLayer(marker);
  });
  courtMarkers = [];

  filteredCourts.forEach(function(court) {
    let marker = L.marker([court.lat, court.lon])
      .addTo(map)
      .bindPopup(`<b>${court.name}</b>`);
    courtMarkers.push(marker);
  });
}

addCourts();

// Получаем геолокацию пользователя и центрируем карту
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      const userLat = position.coords.latitude;
      const userLon = position.coords.longitude;
      if (userMarker) {
        map.removeLayer(userMarker);
      }
      map.setView([userLat, userLon], 14);
      userMarker = L.marker([userLat, userLon]).addTo(map).bindPopup("Вы здесь! 📍").openPopup();
    });
  }
}

// Применяем фильтры по характеристикам
function applyFilters() {
  let selectedSurface = document.getElementById("surface-filter").value;
  let filterLights = document.getElementById("lights-filter").checked;
  let filterLocker = document.getElementById("locker-filter").checked;

  let filteredCourts = courts.filter(function(court) {
    let matchesSurface = (selectedSurface === "all" || court.surface === selectedSurface);
    let matchesLights = (!filterLights || court.lights);
    let matchesLocker = (!filterLocker || court.locker);
    return matchesSurface && matchesLights && matchesLocker;
  });

  addCourts(filteredCourts);
}
