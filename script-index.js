import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCjAKeBOaZ-B8gbo5z2sJkgaBKe690G-ls",
  authDomain: "inventory-71124.firebaseapp.com",
  projectId: "inventory-71124",
  storageBucket: "inventory-71124.firebasestorage.app",
  messagingSenderId: "460557151499",
  appId: "1:460557151499:web:83709834b08534d50d060e"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM
const currentWeekContainer = document.getElementById("current-week-container");
const pastWeeksContainer = document.getElementById("past-weeks-container");
const newWeekButton = document.getElementById("new-week-button");
const locationSelector = document.getElementById("location-selector");

let selectedLocation = null;
let unsubscribeWeeks = null;

// Hide weeks until store is selected
currentWeekContainer.innerHTML = `<p style="color:gray;">Please select a location</p>`;
pastWeeksContainer.innerHTML = "";
newWeekButton.style.display = "none";

function encodeWeek(weekName) {
  return weekName.replace(/ → /g, "--");
}

// Handle location selection
locationSelector.addEventListener("change", (e) => {
  selectedLocation = e.target.value;
  if (!selectedLocation) return;

  newWeekButton.style.display = "inline-block";

  const weeksRef = collection(db, `locations/${selectedLocation}/weeks`);
  const q = query(weeksRef, orderBy("createdAt", "desc"));

  if (unsubscribeWeeks) unsubscribeWeeks();

  unsubscribeWeeks = onSnapshot(q, (snapshot) => {
    currentWeekContainer.innerHTML = "";
    pastWeeksContainer.innerHTML = "";

    if (snapshot.empty) {
      currentWeekContainer.innerHTML = `<p style="color:gray;">No weeks yet</p>`;
      return;
    }

    let isFirst = true;
    snapshot.forEach((doc) => {
      const week = doc.data();
      const encodedWeek = encodeWeek(week.name);
      const a = document.createElement("a");
      a.textContent = week.name;
      a.href = `week.html?location=${selectedLocation}&week=${encodedWeek}`;
      a.className = isFirst ? "past-weeks-button" : "past-weeks-button";

      if (isFirst) {
        a.id = "current-week-button";
        currentWeekContainer.appendChild(a);
        isFirst = false;
      } else {
        pastWeeksContainer.appendChild(a);
      }
    });
  });
});

// Handle New Week creation
newWeekButton.addEventListener("click", async () => {
  if (!selectedLocation) return;

  const now = new Date();

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const start = startOfWeek.toISOString().slice(0, 10);
  const end = endOfWeek.toISOString().slice(0, 10);

  const week = {
    createdAt: now.toISOString(),
    name: `${start} → ${end}`,
  };

  try {
    const weeksRef = collection(db, `locations/${selectedLocation}/weeks`);
    await addDoc(weeksRef, week);
    console.log("✅ Week added:", week.name);
  } catch (err) {
    console.error("❌ Error adding week:", err);
  }
});
