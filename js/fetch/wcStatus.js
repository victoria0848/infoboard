const wc = document.getElementById("wc");
let occupied = false;

setInterval(() => {
  occupied = !occupied;
  wc.innerHTML = occupied ? "🚻 WC" : "🚻 WC";
  wc.style.color = occupied ? "#b32626" : "#293646";
}, 4000);