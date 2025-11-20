const menuUrl = "https://infoskaerm.techcollege.dk/umbraco/api/content/getcanteenmenu/?type=json";

/* --- Fetch Canteen Menu --- */
async function getCanteenMenu() {
  const res = await fetch(menuUrl);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);

  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  if (contentType.includes("application/json")) {
    return JSON.parse(text);
  }

  // XML → JSON fallback
  try {
    return JSON.parse(text);
  } catch (err) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "application/xml");

    function xmlToJson(node) {
      if (node.nodeType === 3) return node.nodeValue.trim();

      const obj = {};
      if (node.attributes && node.attributes.length) {
        obj["@attributes"] = {};
        for (const attr of node.attributes) obj["@attributes"][attr.name] = attr.value;
      }

      for (const child of node.childNodes) {
        if (child.nodeType === 3 && !child.nodeValue.trim()) continue;
        const name = child.nodeName;
        const value = xmlToJson(child);
        if (!value) continue;

        if (obj[name]) {
          if (!Array.isArray(obj[name])) obj[name] = [obj[name]];
          obj[name].push(value);
        } else {
          obj[name] = value;
        }
      }

      if (Object.keys(obj).length === 1 && obj["#text"]) return obj["#text"];
      return obj;
    }

    return xmlToJson(xml);
  }
}

/* --- Display Menu --- */
async function displayMenu() {
  const container = document.getElementById("menu");

  if (!container) {
    console.error("Element with id 'menu' not found!");
    return;
  }

  try {
    const data = await getCanteenMenu();
    console.log("Full API data:", JSON.stringify(data, null, 2));

    let days = [];

    if (Array.isArray(data)) {
      days = data;
    } else if (data.menuDay) {
      days = Array.isArray(data.menuDay) ? data.menuDay : [data.menuDay];
    } else if (data.Days) {
      days = Array.isArray(data.Days) ? data.Days : [data.Days];
    } else {
      container.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
      return;
    }

    if (!days.length) {
      container.innerHTML = "<p>No menu found.</p>";
      return;
    }

    // Detect today's weekday
    const weekdayNames = [
      "Søndag", "MANDAG", "TIRSDAG", "ONSDAG", "TORSDAG", "FREDAG", "Lørdag"
    ];
    const todayName = weekdayNames[new Date().getDay()].toLowerCase();

    // String we want to remove
    const removePhrase = "+ salatbuffet med lun ret";

    container.innerHTML = '<h2>DAGENS RET </h2><h3> PRIS 35.-</h3>' +
      days.map(day => {
        const dayName = day.dayName || day.DayName || day.name || "Unknown Day";
        const dishes = day.dish || day.dishes || day.Dish || day.Dishes || [];
        const dishesArray = Array.isArray(dishes) ? dishes : [dishes];

        // Normalize comparison
        const normalize = s => String(s).toLowerCase().trim();
        const isToday = normalize(dayName) === todayName;

        const cardClass = isToday ? "card today" : "card";

        // --- FILTER OUT THE SENTENCE ---
        const cleanedDishes = dishesArray
          .map(d => d ? d.replace(removePhrase, "").trim() : "")
          .filter(d => d.length > 0);

        return `
          <div class="${cardClass}" id="menu-card">
            <div class="day"><h4 style="text-transform:uppercase;">${dayName}</h4></div>
            <div class="dishes">${cleanedDishes.join("<br>") || "No dishes"}</div>
          </div>
        `;
      }).join("");

  } catch (err) {
    console.error("Full error:", err);
    container.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
}

/* --- Auto Run --- */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', displayMenu);
} else {
  displayMenu();
}

/* --- Auto refresh at midnight --- */
function autoUpdateAtMidnight(callback) {
  function schedule() {
    const now = new Date();
    const next = new Date();

    next.setHours(24, 0, 0, 0);

    const msUntilMidnight = next - now;

    setTimeout(() => {
      callback();
      schedule();
    }, msUntilMidnight);
  }

  schedule();
}

autoUpdateAtMidnight(displayMenu);
