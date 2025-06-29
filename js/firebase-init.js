import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const firebaseConfig = {
/*
 Tokens e dados do Google Firebase
 */
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
