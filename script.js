console.log("Загружаем Яндекс.Карты...");
ymaps.ready(init);

let myMap;
let clusterer;
let allCourts = [];
const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS6SpY-42Fp2lTrjUPLEXtkJogH1n7c_j-KaXMW9B19wnW9geukapdUSy6U0CJGhmDX6x_TnrjSNNIB/pub?output=csv"; // 🔹 Вставь ссылку на свою таблицу
const YANDEX_API_KEY = "988640b3-d0cd-41b7-aaa9-52d0bb6423b6"; // 🔹 Вставь API-ключ Яндекс.Карт

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

    console.log("⏳ Загружаем корты из Google Таблицы...");
    loadCourtsFromGoogleSheets();
}

// ✅ Загружаем данные из Google Таблицы
function loadCourtsFromGoogleSheets() {
    fetch(GOOGLE_SHEET_URL)
        .then(response => response.text())
        .then(csvText => {
            allCourts = parseCSV(csvText);
            findMissingCoordinates(allCourts).then(updatedCourts => {
                allCourts = updatedCourts;
                addCourts(allCourts);
            });
        })
        .catch(error => console.error("🚨 Ошибка загрузки данных из Google Sheets:", error));
}

// ✅ Конвертируем CSV в массив объектов
function parseCSV(csvText) {
    let rows = csvText.split("\n").map(row => row.split(","));
    let courts = [];

    for (let i = 1; i < rows.length; i++) { // Пропускаем заголовки
        let [name, address, lat, lon, info] = rows[i];
        courts.push({
            name: name.trim(),
            address: address.trim(),
            lat: lat ? parseFloat(lat) : null,
            lon: lon ? parseFloat(lon) : null,
            info: info.trim()
        });
    }
    return courts;
}

// ✅ Автоматически находим координаты, если их нет
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

// ✅ Получаем координаты по адресу через Яндекс API
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

// ✅ Добавляем корты на карту
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
