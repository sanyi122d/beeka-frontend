import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBp2GY7HTbsfY6wnRyoUhbRKHs4SLiAoVQ",
  authDomain: "beekaai.firebaseapp.com",
  projectId: "beekaai",
  storageBucket: "beekaai.firebasestorage.app",
  messagingSenderId: "86576473160",
  appId: "1:86576473160:web:6e95263aa5c25816e6247d",
  measurementId: "G-XX5EBK9PXR"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 
