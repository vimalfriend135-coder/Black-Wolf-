import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider,
  onAuthStateChanged,
  signOut,
  updateProfile
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCxXhSoj7enXOja31NK40BhoinEGVFo8AY",
  authDomain: "cyber-shiled-2f9a7.firebaseapp.com",
  projectId: "cyber-shiled-2f9a7",
  storageBucket: "cyber-shiled-2f9a7.firebasestorage.app",
  messagingSenderId: "1083142821053",
  appId: "1:1083142821053:web:12d648ad7f92b2929a13d4"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { 
  app, 
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  onAuthStateChanged,
  signOut,
  updateProfile
};
