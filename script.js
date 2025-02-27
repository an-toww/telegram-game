var map = L.map('map').setView([55.751244, 37.618423], 11); // Москва

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var courts = [
    { name: "Парк Горького", lat: 55.7308, lon: 37.6034, surface: "hard", lights: true, locker: false },
    { name: "Лужники", lat: 55.7158, lon: 37.5537, surface: "clay", lights: true, locker: true },
    { name: "Сокольники", lat: 55.7942, lon: 37.6742, surface: "grass", lights: false, locker: false },
    { name: "Филевский парк", lat: 55.7451, lon: 37.4673, surface: "hard", lights: true, locker: true }
];

var userMarker;
var courtMarkers = [];

function addCourts(filteredCourts = courts) {
    courtMarkers.forEach(marker => map.removeLayer(marker));
    courtMarkers = [];

    filteredCourts.forEach(court => {
        let marker = L.marker([court.lat, court.lon])
            .addTo(map)
            .bindPopup(`<b>${court.name}</b>`);
        courtMarkers.push(marker);
    });
}

addCourts();

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;

            if (userMarker) map.removeLayer(userMarker);

            map.setView([userLat, userLon], 14);
            userMarker = L.marker([userLat, userLon]).addTo(map).bindPopup("Вы здесь! 📍").openPopup();
        });
    }
}

function applyFilters() {
    let selectedSurface = document.getElementById("surface-filter").value;
    let filteredCourts = courts.filter(court => selectedSurface === "all" || court.surface === selectedSurface);
    addCourts(filteredCourts);
}
