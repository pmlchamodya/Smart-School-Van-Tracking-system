// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAShnR9lLlA2tYcs0-p9AaVKIcD4ElCjxI",
  authDomain: "smartvantracking.firebaseapp.com",
  projectId: "smartvantracking",
  storageBucket: "smartvantracking.firebasestorage.app",
  messagingSenderId: "854049654291",
  appId: "1:854049654291:web:d213a10695aec1e8bce1e6",
  measurementId: "G-Y7H66X8SB9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export the services you need
export const auth = getAuth(app);
export const db = getFirestore(app);
