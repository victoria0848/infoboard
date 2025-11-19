const vejrurl = "https://api.openweathermap.org/data/2.5/weather?q=Aalborg&appid=4d58d6f0a435bf7c5a52e2030f17682d&units=metric";

async function getWeather() {
  const res = await fetch(vejrurl);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
  
  const data = await res.json();
  return data;
}

async function displayWeather() {
  const container = document.getElementById("weather");
  
  if (!container) {
    console.error("Element with id 'weather' not found!");
    return;
  }

  try {
    const data = await getWeather();
    console.log("Full API data:", JSON.stringify(data, null, 2));

    const city = data.name || "Unknown";
    const temp = data.main?.temp || "N/A";
    const icon = data.weather?.[0]?.icon || "";
    const windDeg = data.wind?.deg || "N/A";

    container.innerHTML = `
      <div class="card weather-card">
        <div class="main-temp">${temp}°C</div>
      </div>
    `;
  } catch (err) {
    console.error("Full error:", err);
    container.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', displayWeather);
} else {
  displayWeather();
}
