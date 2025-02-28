// ✅ Инициализация карты с центром на Москве
var map = L.map('map').setView([55.751244, 37.618423], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// ✅ Массив с данными о кортах и их характеристиками
var courts = [
  { name: "Парк Горького", lat: 55.7308, lon: 37.6034, surface: "hard", lights: true, locker: false },
  { name: "Лужники", lat: 55.7158, lon: 37.5537, surface: "clay", lights: true, locker: true },
  { name: "Сокольники", lat: 55.7942, lon: 37.6742, surface: "grass", lights: false, locker: false },
  { name: "Филевский парк", lat: 55.7451, lon: 37.4673, surface: "hard", lights: true, locker: true }
];

var userMarker;
var courtMarkers = [];

// ✅ Функция для добавления маркеров кортов на карту
function addCourts(filteredCourts = courts) {
  courtMarkers.forEach(function(marker) {
    map.removeLayer(marker);
  });
  courtMarkers = [];

  filteredCourts.forEach(function(court) {
    let marker = L.marker([court.lat, court.lon])
      .addTo(map)
      .bindPopup(`<b>${court.name}</b><br><a href="court.html?name=${court.name}">Подробнее</a>`);
    courtMarkers.push(marker);
  });
}

addCourts();

// ✅ Получаем геолокацию пользователя и центрируем карту
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

// ✅ Применяем фильтры по характеристикам
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

// ✅ Подключение Firebase (замени своими данными)
const firebaseConfig = {
    apiKey: "AIzaSyCG2R1rwajqL2jo97RJjKJex3UIG_S2eYA",
    authDomain: "courtmapchats.firebaseapp.com",
    databaseURL: "https://courtmapchats-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "courtmapchats",
    storageBucket: "courtmapchats.firebasestorage.app",
    messagingSenderId: "425867947036",
    appId: "1:425867947036:web:3133054a859c9e5d1543d9"
};

// ✅ Инициализация Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const database = firebase.database();

// ✅ Получаем ID корта из URL (фикс)
const urlParams = new URLSearchParams(window.location.search);
const courtId = urlParams.get("name") || "default";

// ✅ Функция отправки сообщений
function sendMessage() {
    const messageInput = document.getElementById("message-input");
    const message = messageInput.value.trim();

    if (message !== "") {
        database.ref("chats/" + courtId).push({
            message: message,
            timestamp: Date.now()
        });

        messageInput.value = ""; // Очистка поля ввода после отправки
    }
}

// ✅ Функция загрузки сообщений в реальном времени (фикс)
function loadMessages() {
    database.ref("chats/" + courtId).on("child_added", function(snapshot) {
        const msg = snapshot.val();
        const messageContainer = document.createElement("div");
        messageContainer.classList.add("message");

        // ✅ Добавляем время отправки
        const time = new Date(msg.timestamp).toLocaleTimeString();
        messageContainer.innerHTML = `<b>${time}</b>: ${msg.message}`;

        document.getElementById("chat-box").appendChild(messageContainer);
        document.getElementById("chat-box").scrollTop = document.getElementById("chat-box").scrollHeight;
    });
}

// ✅ Загружаем чат при загрузке страницы корта
if (document.getElementById("chat-box")) {
    loadMessages();
}
// ✅ Авто-прокрутка при открытии клавиатуры
document.getElementById("message-input").addEventListener("focus", function() {
    setTimeout(() => {
        window.scrollTo(0, document.body.scrollHeight);
    }, 300);
});

// ✅ Авто-прокрутка чата при новом сообщении
function scrollChatToBottom() {
    const chatBox = document.getElementById("chat-box");
    chatBox.scrollTop = chatBox.scrollHeight;
}

// ✅ Загружаем сообщения и прокручиваем вниз
function loadMessages() {
    database.ref("chats/" + courtId).on("child_added", function(snapshot) {
        const msg = snapshot.val();
        const messageContainer = document.createElement("div");
        messageContainer.classList.add("message");

        // ✅ Добавляем время отправки
        const time = new Date(msg.timestamp).toLocaleTimeString();
        messageContainer.innerHTML = `<b>${time}</b>: ${msg.message}`;

        document.getElementById("chat-box").appendChild(messageContainer);
        scrollChatToBottom(); // ✅ Прокручиваем вниз
    });
}
