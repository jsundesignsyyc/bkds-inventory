import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore, doc, collection, getDocs, updateDoc, deleteDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCjAKeBOaZ-B8gbo5z2sJkgaBKe690G-ls",
  authDomain: "inventory-71124.firebaseapp.com",
  projectId: "inventory-71124",
  storageBucket: "inventory-71124.appspot.com", // FIXED from .app
  messagingSenderId: "460557151499",
  appId: "1:460557151499:web:83709834b08534d50d060e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const urlParams = new URLSearchParams(window.location.search);
const location = urlParams.get("location");
let week = urlParams.get("week");
const category = "Signature Dumplings";

const weekRangeDisplay = document.getElementById("week-range");
const tableBody = document.getElementById("inventory-body");
const weekSelector = document.getElementById("week-selector");

if (!location || !week) {
  alert("Missing location or week in URL parameters.");
  window.location.href = "index.html";
}

function encodeWeek(weekStr) {
  return weekStr.replace(/ → /g, "--");
}
function decodeWeek(encodedStr) {
  return encodedStr.replace(/--/g, " → ");
}

function sanitizeDocId(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
}

weekRangeDisplay.textContent = decodeWeek(week);

async function populateWeekSelector() {
  const weeksRef = collection(db, `locations/${location}/weeks`);
  const snapshot = await getDocs(weeksRef);
  weekSelector.innerHTML = "";

  snapshot.forEach(doc => {
    const data = doc.data();
    const option = document.createElement("option");
    option.value = encodeWeek(data.name || `${data.start} → ${data.end}`);
    option.textContent = data.name || `${data.start} → ${data.end}`;
    if (option.value === week) option.selected = true;
    weekSelector.appendChild(option);
  });

  weekSelector.addEventListener("change", (e) => {
    const selected = e.target.value;
    window.location.href = `week.html?location=${location}&week=${selected}`;
  });
}

async function loadItems() {
  const categoryPath = `locations/${location}/weeks/${decodeWeek(week)}/categories/${category}/items`;
  const itemsRef = collection(db, categoryPath);
  const snapshot = await getDocs(itemsRef);
  tableBody.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const row = createRow(docSnap.id, data, categoryPath);
    tableBody.appendChild(row);
  });

  const newRow = createRow(null, {}, categoryPath, true);
  tableBody.appendChild(newRow);
}

function createRow(id, data, path, isNew = false) {
  const row = document.createElement("tr");
if (id) row.dataset.id = id;
  const fields = ["sku", "brand", "name", "packSize", "unit", "unitPrice"];

  const columns = [
    "LastSunday",
    "MonShipment", "Mon",
    "TueShipment", "Tue",
    "WedShipment", "Wed",
    "ThuShipment", "Thu",
    "FriShipment", "Fri",
    "SatShipment", "Sat",
    "SunShipment", "Sun"
  ];

  // Static fields
  fields.forEach(field => {
    const td = document.createElement("td");
    td.innerHTML = `<input type="text" value="${data[field] || ""}" data-field="${field}" />`;
    row.appendChild(td);
  });

  // Daily + shipment inputs
  columns.forEach(label => {
    const td = document.createElement("td");
    td.innerHTML = `<input type="number" step="0.01" value="${data[label] || 0}" data-day="${label}" />`;
    row.appendChild(td);
  });

  // amountSold
  const amtSold = document.createElement("td");
  amtSold.innerHTML = `<input type="number" step="0.01" value="${data.amountSold || 0}" data-field="amountSold" />`;
  row.appendChild(amtSold);

  // itemCost
  const cost = document.createElement("td");
  cost.innerHTML = `<input type="number" step="0.01" value="${data.itemCost || 0}" data-field="itemCost" />`;
  row.appendChild(cost);

  // Controls
  const actions = document.createElement("td");
  actions.classList.add("controls");

  const saveBtn = document.createElement("button");
  saveBtn.textContent = isNew ? "Add" : "Save";
  saveBtn.onclick = async () => {
    const inputs = row.querySelectorAll("input");
    const newData = {};
    inputs.forEach(input => {
      const key = input.dataset.field || input.dataset.day;
      newData[key] = input.value;
    });

    if (isNew) {
      const itemName = newData.name || `item-${Date.now()}`;
      const safeId = sanitizeDocId(itemName);
      const newRef = doc(db, `${path}/${safeId}`);
      await setDoc(newRef, newData);
      loadItems();
    } else {
      await updateDoc(doc(db, `${path}/${id}`), newData);
    }
  };
  actions.appendChild(saveBtn);

  if (!isNew) {
    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = async () => {
      await deleteDoc(doc(db, `${path}/${id}`));
      row.remove();
    };
    actions.appendChild(delBtn);
  }

  row.appendChild(actions);
  return row;
}

await populateWeekSelector();
await loadItems();


await populateWeekSelector();
await loadItems();

document.getElementById("upload-all-button")?.addEventListener("click", async () => {
  const categoryPath = `locations/${location}/weeks/${decodeWeek(week)}/categories/${category}/items`;
  const rows = document.querySelectorAll("#inventory-body tr");

  for (const row of rows) {
    const inputs = row.querySelectorAll("input");
    const newData = {};
    let isEmpty = true;

    inputs.forEach(input => {
      const key = input.dataset.field || input.dataset.day;
      const val = input.value;
      if (val !== "" && val !== "0") isEmpty = false;
      newData[key] = isNaN(val) ? val : parseFloat(val);
    });

    if (isEmpty) continue; // ❌ skip empty row

    const id = row.dataset.id;
    const name = newData.name || `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const safeId = sanitizeDocId(name);
    const docId = id || safeId;
    const ref = doc(db, `${categoryPath}/${docId}`);
    await setDoc(ref, newData, { merge: true });
    row.dataset.id = docId; // ✅ assign dataset.id after insert
  }

  alert("All changes uploaded successfully.");
  await loadItems(); // refresh with new IDs
});