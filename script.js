// ✅ Загружаем Яндекс.Карты
console.log("Загружаем Яндекс.Карты...");
ymaps.ready(init);

let myMap;
let clusterer;
let allCourts = []; // Список всех кортов

function init() {
    myMap = new ymaps.Map("map", {
        center: [55.751244, 37.618423], // Центр Москвы
        zoom: 11,
        controls: ["zoomControl", "geolocationControl"]
    });

    clusterer = new ymaps.Clusterer({
        preset: 'islands#invertedBlueClusterIcons',
        groupByCoordinates: false
    });

    myMap.geoObjects.add(clusterer);

    // ✅ Пробуем загрузить корты из OpenStreetMap API
    fetch("https://overpass-api.de/api/interpreter?data=[out:json];node['leisure'='pitch']['sport'='tennis'];out;")
        .then(response => response.json())
        .then(data => {
            allCourts = data.elements.map(el => ({
                name: el.tags.name || "Теннисный корт",
                lat: el.lat,
                lon: el.lon,
                surface: el.tags.surface || "Неизвестно", // Покрытие
                lights: el.tags.lit === "yes",
                locker: el.tags.changing_rooms === "yes",
                info: el.tags.description || "Нет информации"
            }));

            if (allCourts.length === 0) {
                throw new Error("Нет кортов в OpenStreetMap API!");
            }

            addCourts(allCourts); // Добавляем корты на карту
        })
        .catch(error => {
            console.error("Ошибка загрузки кортов из API:", error);
            loadCourtsFromJSON(); // Если API не работает, загружаем `courts.json`
        });

    // ✅ Кнопка "📍 Найти меня"
    document.getElementById("location-btn").addEventListener("click", function() {
        ymaps.geolocation.get({
            provider: 'browser',
            mapStateAutoApply: true
        }).then(function(result) {
            myMap.geoObjects.add(result.geoObjects);
            myMap.setCenter(result.geoObjects.get(0).geometry.getCoordinates(), 14);
        });
    });

    // ✅ Обработчики фильтров
    document.getElementById("surface-filter").addEventListener("change", applyFilters);
    document.getElementById("lights-filter").addEventListener("change", applyFilters);
    document.getElementById("locker-filter").addEventListener("change", applyFilters);
}

// ✅ Функция загрузки кортов из `courts.json` (если API не работает)
function loadCourtsFromJSON() {
    fetch("courts.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Ошибка загрузки файла courts.json");
            }
            return response.json();
        })
        .then(data => {
            console.log("Загружены корты из файла:", data);
            allCourts = data;
            addCourts(allCourts);
        })
        .catch(error => console.error("Ошибка загрузки кортов из файла:", error));
}

// ✅ Функция добавления кортов на карту
function addCourts(courts) {
    clusterer.removeAll(); // Очищаем старые метки

    courts.forEach(court => {
        let placemark = new ymaps.Placemark([court.lat, court.lon], {
            balloonContent: `
                <b>${court.name}</b><br>
                Покрытие: ${court.surface}<br>
                Освещение: ${court.lights ? "✅ Есть" : "❌ Нет"}<br>
                Раздевалки: ${court.locker ? "✅ Есть" : "❌ Нет"}<br>
                <a href="court.html?name=${encodeURIComponent(court.name)}">Подробнее</a>
            `
        }, {
            preset: "islands#redIcon"
        });

        clusterer.add(placemark);
    });

    myMap.geoObjects.add(clusterer);
}

// ✅ Функция фильтрации кортов
function applyFilters() {
    let selectedSurface = document.getElementById("surface-filter").value;
    let filterLights = document.getElementById("lights-filter").checked;
    let filterLocker = document.getElementById("locker-filter").checked;

    let filteredCourts = allCourts.filter(court => {
        let matchesSurface = (selectedSurface === "all" || court.surface === selectedSurface);
        let matchesLights = (!filterLights || court.lights);
        let matchesLocker = (!filterLocker || court.locker);
        return matchesSurface && matchesLights && matchesLocker;
    });

    addCourts(filteredCourts); // Обновляем карту с отфильтрованными кортами
}
