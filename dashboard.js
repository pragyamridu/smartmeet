// ============================================
//  SmartMeet — Dashboard JavaScript
// ============================================

import { initializeApp }            from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth,
         onAuthStateChanged,
         signOut }                   from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore,
         doc,
         getDoc,
         collection,
         onSnapshot,
         setDoc,
         serverTimestamp }           from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// ── Firebase config ──────────────────────────

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBIYhPaUfakThH1dAOLck05Ty1uikYTSCM",
  authDomain: "smartmeet-4fcf9.firebaseapp.com",
  projectId: "smartmeet-4fcf9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── Auth guard: redirect to login if not signed in ──
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  initDashboard(user);
});

// ── Init dashboard with user data ────────────
function initDashboard(user) {
  const displayName = user.displayName || user.email?.split("@")[0] || "there";
  const initials    = displayName.slice(0, 2).toUpperCase();

  document.getElementById("greetName").textContent   = displayName;
  document.getElementById("userAvatar").textContent  = initials;
}

// ============================================
//  LOGOUT
// ============================================
window.handleLogout = async function () {
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (err) {
    console.error("Logout error:", err);
  }
};

// ============================================
//  OPEN MAPS
//  Tries to get current location and open
//  Google Maps centred on the user
// ============================================
window.openMaps = function () {
  if (!navigator.geolocation) {
    alert("Geolocation not supported. Opening Google Maps...");
    window.open("https://www.google.com/maps", "_blank");
    return;
  }

  // Ask for permission
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      // Open maps with your exact location
      window.open(
        `https://www.google.com/maps?q=${lat},${lng}`,
        "_blank"
      );
    },
    (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        alert("Location permission denied. Opening Google Maps...");
      } else {
        alert("Could not get location. Opening Google Maps...");
      }

      // Fallback
      window.open("https://www.google.com/maps", "_blank");
    }
  );
};

// ============================================
//  NAVIGATE TO MEMBER
// ============================================
window.navigateTo = function (memberName) {
  // In production: look up member's live lat/lng from Firestore
  // For now: open Google Maps directions
  alert(`Opening directions to ${memberName}…\n(Wire up their live coordinates from Firestore)`);
};

// ============================================
//  COPY GROUP CODE
// ============================================
window.copyCode = function (btn) {
  const code = document.getElementById("groupCodeDisplay").textContent;
  navigator.clipboard.writeText(code).catch(() => {});
  btn.textContent = "Copied!";
  setTimeout(() => (btn.textContent = "Copy"), 1500);
};

// ============================================
//  MY GROUPS POPUP
// ============================================
window.toggleGroupsPopup = function (e) {
  if (e) e.stopPropagation();
  document.getElementById("groupsPopup").classList.toggle("open");
};

window.closePopups = function () {
  document.getElementById("groupsPopup").classList.remove("open");
};

window.switchGroup = function (code, name) {
  document.getElementById("activeGroupCode").textContent  = code;
  document.getElementById("groupCodeDisplay").textContent = code;
  document.getElementById("groupsPopup").classList.remove("open");
  // In production: fetch this group's members from Firestore and re-render the member list
  console.log(`Switched to group: ${name} (${code})`);
};

// ============================================
//  MODAL
// ============================================
window.openModal = function (type) {
  closePopups();
  const content = document.getElementById("modalContent");

  if (type === "group") {
    content.innerHTML = `
      <div class="modal-title">Group</div>
      <div class="modal-sub">Create a new group or join one with a code</div>
      <div class="modal-tabs">
        <button class="modal-tab active" onclick="setModalTab(this,'create')">Create</button>
        <button class="modal-tab" onclick="setModalTab(this,'join')">Join</button>
      </div>
      <div id="createPane">
        <input class="modal-input" id="groupNameInput" placeholder="Group name (e.g. Campus crew)">
      </div>
      <div id="joinPane" style="display:none;">
        <input class="modal-input" id="joinCodeInput" placeholder="6-char code e.g. SQAD42"
               style="letter-spacing:3px;text-transform:uppercase;" maxlength="6">
      </div>
      <div class="modal-btn-row">
        <button class="modal-confirm" onclick="confirmGroup()">Confirm</button>
        <button class="modal-cancel"  onclick="closeModal()">Cancel</button>
      </div>`;

  } else if (type === "find") {
    content.innerHTML = `
      <div class="modal-title">Find people</div>
      <div class="modal-sub">Search by name or phone number</div>
      <input class="modal-input" id="findInput" placeholder="Name or phone…">
      <div class="modal-btn-row">
        <button class="modal-confirm" onclick="confirmFind()">Search</button>
        <button class="modal-cancel"  onclick="closeModal()">Cancel</button>
      </div>`;

  } else if (type === "ai") {
    content.innerHTML = `
      <div class="modal-title">AI help</div>
      <div class="modal-sub">Ask SmartMeet anything about your squad</div>
      <input class="modal-input" id="aiModalInput" placeholder="e.g. Who is closest to me?">
      <div class="modal-btn-row">
        <button class="modal-confirm" onclick="confirmAIModal()">Ask</button>
        <button class="modal-cancel"  onclick="closeModal()">Cancel</button>
      </div>`;
  }

  document.getElementById("modalOverlay").classList.add("open");
};

window.setModalTab = function (el, pane) {
  document.querySelectorAll(".modal-tab").forEach(t => t.classList.remove("active"));
  el.classList.add("active");
  document.getElementById("createPane").style.display = pane === "create" ? "block" : "none";
  document.getElementById("joinPane").style.display   = pane === "join"   ? "block" : "none";
};

window.closeModal = function () {
  document.getElementById("modalOverlay").classList.remove("open");
};

window.closeModalOutside = function (e) {
  if (e.target.id === "modalOverlay") closeModal();
};

// ── Create or join group ─────────────────────
window.confirmGroup = async function () {
  const isJoin = document.getElementById("joinPane").style.display !== "none";

  if (isJoin) {
    const code = document.getElementById("joinCodeInput")?.value.trim().toUpperCase();
    if (!code || code.length < 4) {
      alert("Please enter a valid group code.");
      return;
    }
    console.log("Joining group:", code);
    // Wire up: add user to Firestore groups/{code}/members/{uid}
    closeModal();
  } else {
    const name = document.getElementById("groupNameInput")?.value.trim();
    if (!name) {
      alert("Please enter a group name.");
      return;
    }
    const code = generateCode();
    console.log("Creating group:", name, "Code:", code);
    // Wire up: create Firestore doc groups/{code} with name + creator
    document.getElementById("activeGroupCode").textContent  = code;
    document.getElementById("groupCodeDisplay").textContent = code;
    closeModal();
  }
};

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Find people ──────────────────────────────
window.confirmFind = function () {
  const query = document.getElementById("findInput")?.value.trim();
  if (!query) return;
  console.log("Searching for:", query);
  // Wire up: query Firestore users collection by name or phone
  closeModal();
};

// ── AI modal ask ─────────────────────────────
function getAIResponse(query) {
  query = query.toLowerCase();

  if (query.includes("priya")) return "Priya is 320m away.";
  if (query.includes("ravi")) return "Ravi is closest to you.";
  if (query.includes("closest")) return "Ravi is closest right now.";

  return "I’m your SmartMeet AI 🤖 Ask about your group!";
}

window.confirmAIModal = function () {
  const q = document.getElementById("aiModalInput")?.value.trim();
  if (!q) return;

  const res = getAIResponse(q);
  alert("AI: " + res);

  closeModal();
};

// ============================================
//  AI ASSISTANT (inline card)
// ============================================
window.fillAI = function (text) {
  document.getElementById("aiInput").value = text;
  document.getElementById("aiInput").focus();
};

window.sendAI = function () {
  const val = document.getElementById("aiInput").value.trim();
  if (!val) return;
  console.log("AI question:", val);
  // Wire up: send val to your AI endpoint or a Cloud Function
  document.getElementById("aiInput").value = "";
};

// ── Allow Enter key in AI input ──────────────
document.getElementById("aiInput")?.addEventListener("keydown", e => {
  if (e.key === "Enter") sendAI();
});

// ── Allow Enter key in search bar ────────────
document.getElementById("searchInput")?.addEventListener("keydown", e => {
  if (e.key !== "Enter") return;
  const q = e.target.value.trim();
  if (!q) return;
  console.log("Searching:", q);
  // Wire up: search Firestore or filter group members list
});

// ============================================
//  LIVE LOCATION (Phase 3 starter)
//  Call startLocationSharing() after group is
//  joined/created to begin writing to Firestore
// ============================================
let watchId = null;

function startLocationSharing(groupCode, uid) {
  if (!navigator.geolocation) return;
  watchId = navigator.geolocation.watchPosition(
    pos => {
      const { latitude, longitude, accuracy } = pos.coords;
      const locationRef = doc(db, "groups", groupCode, "members", uid);
      setDoc(locationRef, {
        lat:       latitude,
        lng:       longitude,
        accuracy:  accuracy,
        updatedAt: serverTimestamp()
      }, { merge: true });
    },
    err => console.warn("Location error:", err),
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
  );
}

function stopLocationSharing() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

// Stop sharing when user leaves the page
window.addEventListener("beforeunload", stopLocationSharing);
