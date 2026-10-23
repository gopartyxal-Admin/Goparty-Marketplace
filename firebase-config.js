import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import * as firestore from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyDJAYIomhENVR53lor4zfbOZsh7ywzI9_c",
    authDomain: "goparty-marketplace.firebaseapp.com",
    projectId: "goparty-marketplace",
    storageBucket: "goparty-marketplace.firebasestorage.app",
    messagingSenderId: "95947882678",
    appId: "1:95947882678:web:77c5cd7556cfe9e3dfa617"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = firestore.getFirestore(app);
export const provider = new GoogleAuthProvider();
export const storage = getStorage(app);
export { ref as storageRef, uploadBytes, getDownloadURL };

export const {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} = firestore;

export {
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
