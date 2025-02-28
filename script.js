// ✅ Инициализация карты Яндекс.Карт
ymaps.ready(init);

function init() {
    var myMap = new ymaps.Map("map", {
        center: [55.751244, 37.618423], // Центр Москвы
        zoom: 11,
        controls: ["zoomControl", "geolocationControl"]
    });

    // ✅ Загружаем корты из JSON-файла
    fetch("courts.json")
        .then(response => response.json())
        .then(courts => {
            let clusterer = new ymaps.Clusterer({
                preset: 'islands#invertedBlueClusterIcons',
                groupByCoordinates: false
            });

            courts.forEach(court => {
                let placemark = new ymaps.Placemark([court.lat, court.lon], {
                    balloonContent: `<b>${court.name}</b><br>${court.info}<br><a href="court.html?name=${court.name}">Подробнее</a>`
                }, {
                    preset: "islands#redIcon"
                });
                clusterer.add(placemark);
            });

            myMap.geoObjects.add(clusterer);
        })
        .catch(error => console.error("Ошибка загрузки кортов:", error));

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
}
