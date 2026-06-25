import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// PASTE YOUR FIREBASE CONFIG HERE
// Go to Firebase Console → Project Settings → Your Apps → </> Web → Copy config
const firebaseConfig = {
  apiKey: "AIzaSyAHSaiFEx3gAcsjcIJwUR72PB81UbPgmr8",
  authDomain: "ent-scope.firebaseapp.com",
  projectId: "ent-scope",
  storageBucket: "ent-scope.firebasestorage.app",
  messagingSenderId: "719337292955",
  appId: "1:719337292955:web:ef2d80fc7dcb0c61a0f23e"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
