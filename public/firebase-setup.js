// Firebase Setup and Initialization
// This file imports the config and sets up Firebase services

// Import Firebase configuration
import { firebaseConfig } from './config.js';

// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const db = getFirestore(app);
const auth = getAuth(app);

// Make them globally available
window.db = db;
window.auth = auth;

// Import Firestore functions and make them globally available
import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy, 
    where, 
    limit, 
    startAfter, 
    startAt, 
    limitToLast, 
    endBefore, 
    endAt 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Make Firestore functions globally available
window.firestoreFunctions = {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    where,
    limit,
    startAfter,
    startAt,
    limitToLast,
    endBefore,
    endAt
};

window.authFunctions = {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
};

console.log('🚀 Firebase initialized successfully!');

// Dispatch event to let the app know Firebase is ready
window.dispatchEvent(new CustomEvent('firebase-ready'));