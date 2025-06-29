import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAY-Rg98XBj02xCdCbBgdNaLB5k2KQyO_U",
  authDomain: "cardapio-digital-sl.firebaseapp.com",
  projectId: "cardapio-digital-sl",
  storageBucket: "cardapio-digital-sl.firebasestorage.app",
  messagingSenderId: "1068100672412",
  appId: "1:1068100672412:web:72c067736280fc4a034659",
  measurementId: "G-9E65WYJKVG",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
