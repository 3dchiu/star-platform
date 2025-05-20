// public/js/firebase-init.js
import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
// 初始化 App
const app = initializeApp(firebaseConfig);

// 导出 Modular API
export const auth = getAuth(app);
export const db   = getFirestore(app);
export const ts   = serverTimestamp;
