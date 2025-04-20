// src/firebase-login.js
import { initializeApp } from 'firebase/app'
import { getAuth, EmailAuthProvider } from 'firebase/auth'
import * as firebaseui from 'firebaseui'

// Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyBp_XEBrLGAtOkSL9re9K5P0WgPumueuOA",
  authDomain: "star-platform-bf3e7.firebaseapp.com",
  projectId: "star-platform-bf3e7",
  storageBucket: "star-platform-bf3e7.appspot.com",
  messagingSenderId: "965516728684",
  appId: "1:965516728684:web:8f8648cb424a4434a37b49",
  measurementId: "G-X54H7KXE5Y"
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

const ui = new firebaseui.auth.AuthUI(auth)
ui.start('#firebaseui-auth-container', {
  signInOptions: [EmailAuthProvider.PROVIDER_ID],
  signInSuccessUrl: '/profile.html',
})
