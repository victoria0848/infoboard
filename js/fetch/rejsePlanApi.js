const rejsePlanUrl =
  "https://www.rejseplanen.dk/api/nearbyDepartureBoard?accessId=5b71ed68-7338-4589-8293-f81f0dc92cf2&originCoordLat=57.048731&originCoordLong=9.968186&format=json";

async function getDepartures() {
  const res = await fetch(rejsePlanUrl);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
  return res.json();
}

async function displayDepartures() {
  const container = document.getElementById("departures");
  if (!container) {
    console.error("Element with id 'departures' not found!");
    return;
  }

  try {
    const data = await getDepartures();

    // Normalize structure
    let departures = [];
    if (data.DepartureBoard?.Departure) {
      departures = Array.isArray(data.DepartureBoard.Departure)
        ? data.DepartureBoard.Departure
        : [data.DepartureBoard.Departure];
    } else if (data.Departure) {
      departures = Array.isArray(data.Departure) ? data.Departure : [data.Departure];
    } else if (data.departures) {
      departures = Array.isArray(data.departures) ? data.departures : [data.departures];
    } else {
      container.innerHTML = `<h2>Bustider</h2><pre>${JSON.stringify(data, null, 2)}</pre>`;
      return;
    }

    if (!departures.length) {
      container.innerHTML = "<h2>Bustider</h2><p>No departures found.</p>";
      return;
    }

    const now = new Date(); // local time (Copenhagen for DK users)

    const futureDepartures = departures
      .map((dep) => {
        const dateStr = dep.date || new Date().toISOString().split("T")[0];
        const timeStr = dep.rtTime || dep.time;
        if (!timeStr) return null;

        // Build clean timestamp: YYYY-MM-DDTHH:mm:00
        const ts = `${dateStr}T${timeStr}:00`;
        const depDateTime = new Date(ts);

        return { ...dep, depDateTime };
      })
      .filter((dep) => dep && dep.depDateTime > now)
      .sort((a, b) => a.depDateTime - b.depDateTime)
      .slice(0, 8);

    if (!futureDepartures.length) {
      container.innerHTML = "<h2>Bustider</h2><p>No upcoming departures.</p>";
      return;
    }

    container.innerHTML =
      `<h2>BUSTIDER</h2>` +
      futureDepartures
        .map((dep, index) => {
          const name = dep.name || dep.line || "Unknown";
          const time = (dep.rtTime || dep.time || "").slice(0, 5);
          const direction = dep.direction || "";

          const delay =
            dep.rtTime && dep.rtTime !== dep.time
              ? `<span style="color:#b1282c; font-weight:700;">F</span>`
              : "";

          const highlightStyle =
            index === 0 ? 'background-color: #d38e4584; color: #293646;' : "";

          return `
          <div class="card departure-card" style="${highlightStyle}">
            <h3>${name}</h3>
            ${direction ? `<div><h3>${direction}</h3></div>` : ""}
            ${time ? `<div><h3>${delay} ${time}</h3></div>` : ""}
          </div>
        `;
        })
        .join("");

  } catch (err) {
    console.error("Full error:", err);
    container.innerHTML = `<h2>Bustider</h2><p style="color:red;">Vi kan desværre ikke få fat i bustiderne lige pt<br>
    Vi arbejder på det! :)</p>`;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", displayDepartures);
} else {
  displayDepartures();
}

setInterval(displayDepartures, 10000); // update every 5 seconds
