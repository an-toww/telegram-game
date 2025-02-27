let score = 0;
document.getElementById("play").addEventListener("click", function() {
    score++;
    document.getElementById("score").innerText = "Очки: " + score;
});

// Интеграция с Telegram
if (window.TelegramGameProxy) {
    TelegramGameProxy.ready();
}