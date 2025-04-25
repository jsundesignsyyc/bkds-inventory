import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCjAKeBOaZ-B8gbo5z2sJkgaBKe690G-ls",
  authDomain: "inventory-71124.firebaseapp.com",
  projectId: "inventory-71124",
  storageBucket: "inventory-71124.appspot.com", // FIXED .app → .app**spot**.com
  messagingSenderId: "460557151499",
  appId: "1:460557151499:web:83709834b08534d50d060e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };