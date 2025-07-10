// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD81lKzzk0i7OkjQLTd8PCO5LmhoOvX6F0",
  authDomain: window.location.hostname === "localhost" ? "localhost" : "time-report-e71fd.web.app",
  projectId: "time-report-e71fd",
  storageBucket: "time-report-e71fd.firebasestore.app",
  messagingSenderId: "391324886347",
  appId: "1:391324886347:web:f6c6bb9d010bb02dc074ce"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Connect to emulators if running locally
if (window.location.hostname === "localhost") {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
}
