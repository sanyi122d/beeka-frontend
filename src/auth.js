// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBp2GY7HTbsfY6wnRyoUhbRKHs4SLiAoVQ",
  authDomain: "beekaai.firebaseapp.com",
  projectId: "beekaai",
  storageBucket: "beekaai.firebasestorage.app",
  messagingSenderId: "86576473160",
  appId: "1:86576473160:web:6e95263aa5c25816e6247d",
  measurementId: "G-XX5EBK9PXR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);