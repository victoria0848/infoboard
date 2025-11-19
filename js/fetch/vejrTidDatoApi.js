document.addEventListener("DOMContentLoaded", () => {
  const timeContainer = document.getElementById("getCopenhagenTime");
  const dateContainer = document.getElementById("getCopenhagenDate");

  function updateCopenhagenTimeAndDate() {
    const now = new Date();

    // Time
    const timeOptions = {
      timeZone: "Europe/Copenhagen",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    };
    timeContainer.textContent = now.toLocaleTimeString("da-DK", timeOptions);

    // Date
    const dateOptions = {
      timeZone: "Europe/Copenhagen",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    };
    dateContainer.textContent = now.toLocaleDateString("da-DK", dateOptions);
  }

  // Initial update
  updateCopenhagenTimeAndDate();

  // Update every second
  setInterval(updateCopenhagenTimeAndDate, 1000);
});
