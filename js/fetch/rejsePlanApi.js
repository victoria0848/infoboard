const rejsePlanUrl =
  "https://www.rejseplanen.dk/api/nearbyDepartureBoard?accessId=5b71ed68-7338-4589-8293-f81f0dc92cf2&originCoordLat=57.048731&originCoordLong=9.968186&format=json";

async function getDepartures() {
  const res = await fetch(rejsePlanUrl);
  if (!res.ok)
    throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
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
    console.log("Full API data:", JSON.stringify(data, null, 2));

    // --- Normalize structure ---
    let departures = [];
    if (data.DepartureBoard?.Departure) {
      departures = Array.isArray(data.DepartureBoard.Departure)
        ? data.DepartureBoard.Departure
        : [data.DepartureBoard.Departure];
    } else if (data.Departure) {
      departures = Array.isArray(data.Departure) ? data.Departure : [data.Departure];
    } else if (data.departures) {
      departures = Array.isArray(data.departures)
        ? data.departures
        : [data.departures];
    } else {
      container.innerHTML = `<h2>Bustider</h2><pre>${JSON.stringify(data, null, 2)}</pre>`;
      return;
    }

    if (!departures.length) {
      container.innerHTML = "<h2>Bustider</h2><p>No departures found.</p>";
      return;
    }

    const now = new Date();
    const timezone = "Europe/Copenhagen";

    const futureDepartures = departures
      .map(dep => {
        const dateStr = dep.date || new Date().toISOString().split("T")[0];
        const timeStr = dep.rtTime || dep.time;
        if (!timeStr) return null;

        const [hours, minutes] = timeStr.split(":").map(Number);
        const depDateTime = new Date(
          new Date(dateStr).setHours(hours, minutes,)
        );

        // Fix potential timezone mismatch by shifting to local Copenhagen time
        const offset = new Date().toLocaleString("en-US", { timeZone: timezone });
        const localNow = new Date(offset);

        return { ...dep, depDateTime, localNow };
      })
      .filter(dep => dep && dep.depDateTime > dep.localNow)
      .sort((a, b) => a.depDateTime - b.depDateTime)
      .slice(0, 6);

    // --- Render ---
    if (!futureDepartures.length) {
      container.innerHTML = "<h2>Bustider</h2><p>No upcoming departures.</p>";
      return;
    }

container.innerHTML = `<h2>BUSTIDER</h2>` + futureDepartures
  .map((dep, index) => {  // Add index parameter
    const name = dep.name || dep.line || "Unknown";
    const time = (dep.rtTime || dep.time || "").slice(0, 5);
    const direction = dep.direction || "";
    const type = dep.type || "";
    const delay =
      dep.rtTime && dep.rtTime !== dep.time
        ? `<span style="color:#b1282c;; font-weight: 700;">F</span>`
        : "";

    const minutesLeft = Math.round(
      (dep.depDateTime - dep.localNow) / 60000
    );

    // Add pink background to first departure
    const highlightStyle = index === 0 ? 'background-color: #d38e4584; color: #293646' : '';

    return `
      <div class="card departure-card" style="${highlightStyle}">
        <h3>${name} ${type ? `` : ""}</h3>
        ${direction ? `<div><h3><strong></strong> ${direction}</h3></div>` : ""}
        ${time ? `<div><h3><strong></strong>${delay} ${time} </h3></div>` : ""}
      </div>
    `;
  })
  .join("");

  } catch (err) {
    console.error("Full error:", err);
    container.innerHTML = `<h2>Bustider</h2><p style="color:red;">Error: ${err.message}</p>`;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", displayDepartures);
} else {
  displayDepartures();
}

setInterval(displayDepartures, 1 * 1000); // update every 30 seconds