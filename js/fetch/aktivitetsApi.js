const API_URL = 'https://iws.itcn.dk/techcollege/schedules?departmentCode=smed';

/* --- Format time --- */
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
}

/* --- Format date --- */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('da-DK', { weekday: 'short', day: 'numeric', month: 'numeric' });
}

/* --- Fetch Schedule --- */
async function fetchSchedule() {
    const content = document.getElementById('content');
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP fejl! status: ${response.status}`);

        const data = await response.json();
        displayNextLectures(data);

    } catch (error) {
        content.innerHTML = `
            <div class="error">
                <h2>⚠️ Kunne ikke hente skema</h2>
                <p>${error.message}</p>
                <p style="margin-top: 10px; font-size: 0.9em;">OBS! Kræver VPN adgang udenfor skolens netværk.</p>
            </div>
        `;
        console.error('Fejl ved hentning af skema:', error);
    }
}

/* --- Show Next Lectures --- */
function displayNextLectures(data) {
    const content = document.getElementById('content');

    let scheduleData = data.value || data.data || data.schedules || data.activities || data;
    if (!Array.isArray(scheduleData)) scheduleData = Object.values(data)[0];

    if (!Array.isArray(scheduleData) || scheduleData.length === 0) {
        content.innerHTML = '<div class="error">Ingen aktiviteter fundet</div>';
        return;
    }

    const now = new Date();

    // Sort by start date
    scheduleData.sort((a, b) => new Date(a.StartDate) - new Date(b.StartDate));

    // Only FUTURE lectures
    let futureLectures = scheduleData.filter(item => new Date(item.StartDate) > now);

    /* --- NEW FILTER: Only show these 3 categories --- */
    const allowed = ["edu-praktik", "edu-grafisk", "edu-web"];
    futureLectures = futureLectures.filter(item => {
        const cls = getEducationClass(item);
        return allowed.includes(cls);
    });

    if (futureLectures.length === 0) {
        content.innerHTML = '<h1 class="section-title">🎓 Ingen kommende lektioner</h1>';
        return;
    }

    // Take next 8 lectures
    const next8 = futureLectures.slice(0, 8);

    let html = `<h1 class="section-title">LOKALER</h1>`;
    html += next8.map(item => makeCard(item, now)).join('');

    content.innerHTML = html;
}

/* --- Determine education color class --- */
function getEducationClass(item) {
    const text = `${item.Subject || ""} ${item.Team || ""}`.toLowerCase();

    if (text.includes("praktik")) return "edu-praktik";
    if (text.includes("grafisk")) return "edu-grafisk";
    if (text.includes("web") || text.includes("webudvikler")) return "edu-web";
    if (text.includes("tryk")) return "edu-tryk";

    // Extra categories (not included in filter)
    if (text.includes("dataservice")) return "edu-dataservice";
    if (text.includes("studie")) return "edu-studietid";
    if (text.includes("bonusfag")) return "edu-bonusfag";

    return "";
}

/* --- Build Lesson Card --- */
function makeCard(item) {
    const subject = item.Subject || "Ukendt fag";
    const room = item.Room ? `Lokale: ${item.Room}` : "";
    const team = item.Team ? `Hold: ${item.Team}` : "";

    const statusText = `kl. ${formatTime(item.StartDate)}`;
    const eduClass = getEducationClass(item);

    return `
        <div class="schedule-card ${eduClass}">
            <div class="schedule-row">
                <div class="schedule-title">${subject}</div>
                <div class="schedule-room">${room}</div>
                <div class="schedule-team">${team}</div>
                <div class="schedule-status">${statusText}</div>
            </div>
        </div>
    `;
}

/* --- Auto Refresh every minute --- */
document.addEventListener('DOMContentLoaded', () => {
    fetchSchedule();
    setInterval(fetchSchedule, 60 * 1000);
});
