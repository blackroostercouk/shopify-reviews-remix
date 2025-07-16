// Firebase client setup for Remix (JS)
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDvL3LDJi2yZ3PjLyimoStDuj8RuSeA5rg",
    authDomain: "shopify-review-761fb.firebaseapp.com",
    projectId: "shopify-review-761fb",
    storageBucket: "shopify-review-761fb.firebasestorage.app",
    messagingSenderId: "851495741423",
    appId: "1:851495741423:web:1bf37573b29b8f9b8fb81a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
