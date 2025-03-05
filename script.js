console.log("Загружаем Яндекс.Карты...");
ymaps.ready(init);

let myMap;
let clusterer;
let allCourts = [];
const YANDEX_API_KEY = "988640b3-d0cd-41b7-aaa9-52d0bb6423b6" // 🔹 Вставь свой API-ключ

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

    console.log("⏳ Загружаем корты из JSON...");

    fetch("courts.json")
        .then(response => response.json())
        .then(data => {
            allCourts = data;
            findMissingCoordinates(allCourts).then(updatedCourts => {
                allCourts = updatedCourts;
                addCourts(allCourts);
            });
        })
        .catch(error => console.error("🚨 Ошибка загрузки кортов:", error));

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

// ✅ Функция поиска координат для кортов без координат
async function findMissingCoordinates(courts) {
    let updatedCourts = [];

    for (const court of courts) {
        if (court.lat === null || court.lon === null) {
            try {
                const coords = await getCoordinatesFromAddress(court.address);
                if (coords) {
                    court.lat = coords.lat;
                    court.lon = coords.lon;
                } else {
                    console.warn(`⚠ Не удалось найти координаты: ${court.address}`);
                }
            } catch (error) {
                console.error(`🚨 Ошибка при поиске координат: ${court.address}`, error);
            }
        }
        updatedCourts.push(court);
    }
    return updatedCourts;
}

// ✅ Функция получения координат по адресу через Яндекс API
async function getCoordinatesFromAddress(address) {
    try {
        const response = await fetch(`https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_API_KEY}&format=json&geocode=${encodeURIComponent(address)}`);
        const data = await response.json();
        if (data.response.GeoObjectCollection.featureMember.length > 0) {
            let coords = data.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos.split(" ");
            return { lat: parseFloat(coords[1]), lon: parseFloat(coords[0]) };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Ошибка запроса к Яндекс API", error);
        return null;
    }
}

// ✅ Функция добавления кортов на карту
function addCourts(courts) {
    clusterer.removeAll();

    courts.forEach(court => {
        if (court.lat && court.lon) {
            let placemark = new ymaps.Placemark([court.lat, court.lon], {
                balloonContent: `
                    <b>${court.name}</b><br>
                    📍 ${court.address}<br>
                    ℹ ${court.info}<br>
                    <a href="court.html?name=${encodeURIComponent(court.name)}">Подробнее</a>
                `
            }, {
                preset: "islands#redIcon"
            });

            clusterer.add(placemark);
        } else {
            console.warn(`⚠ Пропускаем ${court.name}, т.к. нет координат`);
        }
    });

    myMap.geoObjects.add(clusterer);
    console.log("✅ Корты добавлены на карту!");
}
