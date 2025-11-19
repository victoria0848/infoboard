const menuUrl = "https://infoskaerm.techcollege.dk/umbraco/api/content/getcanteenmenu/?type=json";
 
async function getCanteenMenu() {
  const res = await fetch(menuUrl);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
 
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();
 
  if (contentType.includes("application/json")) {
    return JSON.parse(text);
  }
 
  try {
    return JSON.parse(text);
  } catch (err) {
    // XML → JSON fallback
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
 
    // Detect today's local weekday name
    const weekdayNames = [
      "Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"
    ];
    const todayName = weekdayNames[new Date().getDay()].toLowerCase();
 
    container.innerHTML = '<h2>DAGENS RET </h2><h3> PRIS 35.-<h3>' +
      days.map(day => {
        const dayName = day.dayName || day.DayName || day.name || "Unknown Day";
        const dishes = day.dish || day.dishes || day.Dish || day.Dishes || [];
        const dishesArray = Array.isArray(dishes) ? dishes : [dishes];
 
        // --- FIXED: normalize for comparison ---
        const normalize = s => String(s).toLowerCase().trim();
        const isToday = normalize(dayName) === todayName;
 
        const cardClass = isToday ? "card today" : "card";
 
        return `
          <div class="${cardClass}" id="menu-card">
            <div class="day"><h4>${dayName}</h4></div>
            <div class="dishes">${dishesArray.filter(d => d).join("<br>") || "No dishes"}</div>
          </div>
        `;
      }).join("");
 
  } catch (err) {
    console.error("Full error:", err);
    container.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
}
 
// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', displayMenu);
} else {
  displayMenu();
}
function autoUpdateAtMidnight(callback) {
  function schedule() {
    const now = new Date();
    const next = new Date();

    // Set next to exactly midnight
    next.setHours(24, 0, 0, 0);

    const msUntilMidnight = next - now;

    setTimeout(() => {
      callback();   // run your update function
      schedule();   // schedule next midnight update
    }, msUntilMidnight);
  }

  schedule();
}
autoUpdateAtMidnight(displayMenu);