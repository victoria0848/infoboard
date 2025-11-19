const weatherURL = "https://api.openweathermap.org/data/2.5/weather?q=Aalborg&units=metric&appid=4d58d6f0a435bf7c5a52e2030f17682d";

// Hent data uden cache (for at undgå gamle værdier som fx 0.97)
async function getWeather() {
    const res = await fetch(weatherURL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Weather error: ${res.status}`);
    return await res.json();
}

function roundTemp(t) {
    return typeof t === "number" ? Math.round(t) : "N/A";
}

async function displayWeather() {
    const el = document.getElementById("weather");
    if (!el) return console.error("Element #weather ikke fundet");

    try {
        const data = await getWeather();

        console.log("RAW WEATHER DATA:", data); // Debug

        const temp = roundTemp(data.main?.temp);
        const description = data.weather?.[0]?.description ?? "";
        const icon = data.weather?.[0]?.icon ?? "";
        const iconURL = icon ? `https://openweathermap.org/img/wn/${icon}.png` : "";

        // MATCHER DIT CSS: lille panel med ikon + temp
        el.innerHTML = `
            <h2 class="weather-temp">${temp}°C</h2>
        `;
        
    } catch (err) {
        console.error(err);
        el.innerHTML = `<span style="color:red;">Fejl i vejrdata</span>`;
    }
}

document.addEventListener("DOMContentLoaded", displayWeather);
