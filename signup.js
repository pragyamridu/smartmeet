// ============================================
//  SmartMeet — Signup Page JavaScript
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// ── Firebase config ──────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDLGn52C30aYGDJoU3G7UOHK7za6YBlcu0",
  authDomain: "smartmeet2-3ef95.firebaseapp.com",
  projectId: "smartmeet2-3ef95",
  storageBucket: "smartmeet2-3ef95.firebasestorage.app",
  messagingSenderId: "972767742229",
  appId: "1:972767742229:web:d94e500df52d500e34411c",
  measurementId: "G-W3W6SRJK8X"
};

const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const db       = getFirestore(app);
const provider = new GoogleAuthProvider();

// ── If already logged in, skip signup ────────
onAuthStateChanged(auth, user => {
  if (user) window.location.href = "dashboard.html";
});

// ============================================
//  HELPERS
// ============================================
function showMsg(text, type = "info") {
  const el = document.getElementById("message");
  if (!el) return;
  el.textContent  = text;
  el.style.color  =
    type === "error"   ? "#c03030" :
    type === "success" ? "#27ae60" : "#4a8aaa";
}

function setLoading(loading) {
  const btn = document.querySelector(".sign-btn");
  if (!btn) return;
  btn.disabled    = loading;
  btn.innerHTML   = loading
    ? "Creating account…"
    : `Create account
       <svg viewBox="0 0 16 16" fill="none">
         <path d="M3 8h10M9 4l4 4-4 4" stroke="#f0d040" stroke-width="1.5"
               stroke-linecap="round" stroke-linejoin="round"/>
       </svg>`;
}

function clearErrors() {
  document.querySelectorAll(".field-input").forEach(el => el.classList.remove("error"));
  showMsg("");
}

// Save user profile to Firestore users collection
async function saveUserProfile(user, firstName, lastName) {
  try {
    await setDoc(doc(db, "users", user.uid), {
      uid:         user.uid,
      firstName:   firstName,
      lastName:    lastName,
      displayName: `${firstName} ${lastName}`.trim(),
      email:       user.email,
      createdAt:   serverTimestamp(),
      groups:      []
    });
  } catch (err) {
    console.warn("Could not save user profile to Firestore:", err);
  }
}

// ============================================
//  PASSWORD STRENGTH CHECKER
// ============================================
window.checkStrength = function (val) {
  const segs  = ["s1", "s2", "s3", "s4"];
  const label = document.getElementById("strengthLabel");

  // Reset
  segs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.className = "strength-seg";
  });
  if (label) { label.textContent = ""; label.className = "strength-label"; }
  if (!val) return;

  let score = 0;
  if (val.length >= 8)           score++;
  if (/[A-Z]/.test(val))         score++;
  if (/[0-9]/.test(val))         score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  const cls  = score <= 1 ? "weak" : score <= 2 ? "fair" : "good";
  const text = score <= 1 ? "Weak" : score <= 2 ? "Fair" : score === 3 ? "Good" : "Strong";

  for (let i = 0; i < score; i++) {
    const seg = document.getElementById(segs[i]);
    if (seg) seg.classList.add(cls);
  }

  if (label) {
    label.textContent = text;
    label.className   = `strength-label ${cls}`;
  }
};

// ============================================
//  SHOW / HIDE PASSWORD TOGGLE
// ============================================
window.togglePassword = function () {
  const input = document.getElementById("password");
  const icon  = document.getElementById("eyeIcon");
  if (!input) return;

  if (input.type === "password") {
    input.type = "text";
    // Slash through the eye icon
    icon.innerHTML = `
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/>
      <circle cx="8" cy="8" r="2"/>
      <line x1="2" y1="2" x2="14" y2="14"/>`;
  } else {
    input.type = "password";
    icon.innerHTML = `
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/>
      <circle cx="8" cy="8" r="2"/>`;
  }
};

// ============================================
//  FORM VALIDATION
// ============================================
function validate() {
  clearErrors();
  let valid = true;

  const firstName = document.getElementById("firstName").value.trim();
  const lastName  = document.getElementById("lastName").value.trim();
  const email     = document.getElementById("email").value.trim();
  const password  = document.getElementById("password").value;
  const confirm   = document.getElementById("confirmPassword").value;
  const terms     = document.getElementById("terms").checked;

  if (!firstName) {
    document.getElementById("firstName").classList.add("error");
    valid = false;
  }
  if (!lastName) {
    document.getElementById("lastName").classList.add("error");
    valid = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById("email").classList.add("error");
    showMsg("Please enter a valid email address.", "error");
    valid = false;
  }
  if (password.length < 8) {
    document.getElementById("password").classList.add("error");
    showMsg("Password must be at least 8 characters.", "error");
    valid = false;
  }
  if (password !== confirm) {
    document.getElementById("confirmPassword").classList.add("error");
    showMsg("Passwords do not match.", "error");
    valid = false;
  }
  if (!terms) {
    showMsg("Please accept the Terms of Service to continue.", "error");
    valid = false;
  }

  return valid;
}

// ============================================
//  EMAIL SIGNUP
// ============================================
window.signup = async function () {
  if (!validate()) return;

  const firstName = document.getElementById("firstName").value.trim();
  const lastName  = document.getElementById("lastName").value.trim();
  const email     = document.getElementById("email").value.trim();
  const password  = document.getElementById("password").value;

  setLoading(true);
  showMsg("Creating your account…");

  try {
    // 1. Create the Firebase Auth user
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // 2. Set the display name on the Auth profile
    await updateProfile(result.user, {
      displayName: `${firstName} ${lastName}`.trim()
    });

    // 3. Persist profile data in Firestore
    await saveUserProfile(result.user, firstName, lastName);

    showMsg("Account created! Redirecting…", "success");
    setTimeout(() => window.location.href = "dashboard.html", 1000);

  } catch (err) {
    setLoading(false);
    switch (err.code) {
      case "auth/email-already-in-use":
        document.getElementById("email").classList.add("error");
        showMsg("An account with this email already exists.", "error");
        break;
      case "auth/invalid-email":
        document.getElementById("email").classList.add("error");
        showMsg("That email address is not valid.", "error");
        break;
      case "auth/weak-password":
        document.getElementById("password").classList.add("error");
        showMsg("Password is too weak. Try adding numbers or symbols.", "error");
        break;
      case "auth/network-request-failed":
        showMsg("Network error. Check your connection and try again.", "error");
        break;
      default:
        showMsg(err.message, "error");
    }
  }
};

// ============================================
//  GOOGLE SIGNUP
// ============================================
window.googleSignup = async function () {
  showMsg("Opening Google sign-in…");

  try {
    const result = await signInWithPopup(auth, provider);
    const user   = result.user;

    // Split displayName into first/last for Firestore
    const parts     = (user.displayName || "").split(" ");
    const firstName = parts[0]  || "";
    const lastName  = parts.slice(1).join(" ") || "";

    await saveUserProfile(user, firstName, lastName);

    showMsg(`Welcome, ${user.displayName || "friend"}!`, "success");
    setTimeout(() => window.location.href = "dashboard.html", 800);

  } catch (err) {
    if (err.code === "auth/popup-closed-by-user") {
      showMsg("Sign-in cancelled.", "info");
    } else if (err.code === "auth/account-exists-with-different-credential") {
      showMsg("An account already exists with this email. Try signing in instead.", "error");
    } else {
      showMsg(err.message, "error");
    }
  }
};

// ============================================
//  ENTER KEY SUPPORT
// ============================================
document.addEventListener("keydown", e => {
  if (e.key === "Enter") window.signup();
});