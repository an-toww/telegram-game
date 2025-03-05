console.log("Загружаем Яндекс.Карты...");
ymaps.ready(init);

let myMap;
let clusterer;
let allCourts = [];

function init() {
    myMap = new ymaps.Map("map", {
        center: [55.751244, 37.618423], // Москва
        zoom: 11,
        controls: ["zoomControl", "geolocationControl"]
    });

    clusterer = new ymaps.Clusterer({
        preset: 'islands#invertedBlueClusterIcons',
        groupByCoordinates: false
    });

    myMap.geoObjects.add(clusterer);

    console.log("⏳ Загружаем корты...");

    fetch("https://overpass-api.de/api/interpreter?data=[out:json];node['leisure'='pitch']['sport'='tennis']['fee'!='yes'](55.5,37.3,56.0,38.0);out;")
        .then(response => response.json())
        .then(data => {
            allCourts = data.elements.map(el => ({
                name: el.tags.name || "Теннисный корт",
                lat: el.lat,
                lon: el.lon,
                info: el.tags.description || "Нет информации"
            }));

            if (allCourts.length === 0) {
                console.warn("⚠ Нет данных в OpenStreetMap API, загружаем из JSON...");
                loadCourtsFromJSON();
            } else {
                console.log("✅ Загружены корты из OpenStreetMap:", allCourts);
                addCourts(allCourts);
            }
        })
        .catch(error => {
            console.error("🚨 Ошибка загрузки OpenStreetMap API:", error);
            loadCourtsFromJSON();
        });

    document.getElementById("location-btn").addEventListener("click", function() {
        ymaps.geolocation.get({
            provider: 'browser',
            mapStateAutoApply: true
        }).then(function(result) {
            myMap.geoObjects.add(result.geoObjects);
            myMap.setCenter(result.geoObjects.get(0).geometry.getCoordinates(), 14);
        });
    });
}

// ✅ Загружаем JSON, если OpenStreetMap API пустой
function loadCourtsFromJSON() {
    fetch("courts.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Ошибка загрузки файла courts.json");
            }
            return response.json();
        })
        .then(data => {
            console.log("✅ Загружены корты из JSON:", data);
            allCourts = data;
            addCourts(allCourts);
        })
        .catch(error => console.error("🚨 Ошибка загрузки кортов из JSON:", error));
}

// ✅ Функция добавления кортов на карту
function addCourts(courts) {
    clusterer.removeAll();

    courts.forEach(court => {
        let placemark = new ymaps.Placemark([court.lat, court.lon], {
            balloonContent: `
                <b>${court.name}</b><br>
                <a href="court.html?name=${encodeURIComponent(court.name)}">Подробнее</a>
            `
        }, {
            preset: "islands#redIcon"
        });

        clusterer.add(placemark);
    });

    myMap.geoObjects.add(clusterer);
    console.log("✅ Корты добавлены на карту!");
}
