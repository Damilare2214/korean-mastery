/**
 * Korean Mastery Nigeria - Frontend Controller & Application Engine
 * Handles JWT Auth, Paystack Popups, Auto-Reconciliation, SRS Flashcards,
 * Canvas Writing, Dialogue Simulation, Quizzes, and PDF Certificate Generation.
 */

// Application State
const state = {
  user: null,
  token: localStorage.getItem('km_token') || null,
  activeTab: 'tier1_hangul',
  progress: {},
  flashcards: [],
  currentCardIndex: 0,
  isCardFlipped: false,
  canvasDrawing: false
};

// API Base URL (Auto-switches to Render Production Backend or local proxy)
const API_BASE = window.location.hostname.includes('netlify.app') 
  ? 'https://korean-mastery-backend.onrender.com/api' 
  : '/api';

// ==============================================================================
// INITIALIZATION & EVENT LISTENERS
// ==============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupAuthModals();
  setupLegalModals();

  if (state.token) {
    await fetchCurrentUser();
  } else {
    updateUIForGuest();
  }

  // Load initial tab
  renderTabContent(state.activeTab);

  // Check URL hash for payment return or tab routing
  handleUrlHash();
});

function handleUrlHash() {
  const hash = window.location.hash;
  if (hash === '#payment-success') {
    showNotification("Payment verified successfully! Welcome to your upgraded tier! 🇰🇷", "success");
    if (state.token) fetchCurrentUser();
  } else if (hash.startsWith('#tab-')) {
    const tabName = hash.replace('#tab-', '');
    switchTab(tabName);
  }
}

// ==============================================================================
// AUTHENTICATION & SESSION MANAGEMENT
// ==============================================================================

async function fetchCurrentUser() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const data = await res.json();

    if (res.ok && data.status === 'success') {
      state.user = data.user;
      updateUIForUser();
      loadUserProgress();
    } else {
      logout();
    }
  } catch (err) {
    console.warn("Auth check error:", err);
  }
}

function updateUIForUser() {
  const navAuth = document.getElementById('navAuthContainer');
  const userTier = state.user.tier || 1;
  const tierName = state.user.tier_name || (userTier === 3 ? "Fluency Suite" : userTier === 2 ? "Survival Korean" : "Free Foundation");

  let badgeClass = 'badge-free';
  if (userTier === 2) badgeClass = 'badge-tier2';
  if (userTier === 3) badgeClass = 'badge-tier3';

  navAuth.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <span class="badge ${badgeClass}">${tierName}</span>
      <span style="font-weight: 700; font-size: 0.9rem; color: #1e293b;">${escapeHtml(state.user.full_name)}</span>
      <button class="btn btn-outline btn-sm" onclick="logout()">Logout</button>
    </div>
  `;

  // Update Portal Sidebar
  const sidebarUser = document.getElementById('sidebarUserInfo');
  if (sidebarUser) {
    sidebarUser.innerHTML = `
      <div class="user-status-card">
        <div class="user-name">${escapeHtml(state.user.full_name)}</div>
        <div class="user-email">${escapeHtml(state.user.email)}</div>
        <div style="margin-top: 0.5rem;"><span class="badge ${badgeClass}">${tierName}</span></div>
      </div>
    `;
  }

  // Update Lock Status on Sidebar items
  updateSidebarLocks();
}

function updateUIForGuest() {
  const navAuth = document.getElementById('navAuthContainer');
  navAuth.innerHTML = `
    <button class="btn btn-outline btn-sm" onclick="openModal('loginModal')">Log In</button>
    <button class="btn btn-primary btn-sm" onclick="openModal('registerModal')">Get Started Free</button>
  `;

  const sidebarUser = document.getElementById('sidebarUserInfo');
  if (sidebarUser) {
    sidebarUser.innerHTML = `
      <div class="user-status-card">
        <div class="user-name">Guest Learner</div>
        <div class="user-email">Free Hangul Foundation Active</div>
        <div style="margin-top: 0.5rem;"><span class="badge badge-free">Free Foundation</span></div>
      </div>
    `;
  }
  updateSidebarLocks();
}

function logout() {
  localStorage.removeItem('km_token');
  state.token = null;
  state.user = null;
  updateUIForGuest();
  showNotification("You have been safely logged out.", "info");
  renderTabContent('tier1_hangul');
}

async function handleRegister(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerText;
  
  const full_name = form.full_name.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value.trim();

  submitBtn.disabled = true;
  submitBtn.innerText = "Creating account...";

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name, email, password })
    });
    const data = await res.json();

    if (res.ok && data.status === 'success') {
      state.token = data.token;
      state.user = data.user;
      localStorage.setItem('km_token', data.token);
      closeModal('registerModal');
      updateUIForUser();
      showNotification("Account created! Free Foundation unlocked! 🇰🇷", "success");
      form.reset();
    } else {
      alert(data.message || "Registration failed. Please check your details.");
    }
  } catch (err) {
    alert("The server is waking up. Please wait 10 seconds and tap the button again!");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = originalBtnText;
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerText;

  const email = form.email.value.trim();
  const password = form.password.value.trim();

  submitBtn.disabled = true;
  submitBtn.innerText = "Logging in...";

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (res.ok && data.status === 'success') {
      state.token = data.token;
      state.user = data.user;
      localStorage.setItem('km_token', data.token);
      closeModal('loginModal');
      updateUIForUser();
      showNotification(`Welcome back, ${state.user.full_name}! 🇰🇷`, "success");
      form.reset();
    } else {
      alert(data.message || "Invalid email or password.");
    }
  } catch (err) {
    alert("The server is waking up. Please wait 10 seconds and tap the button again!");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = originalBtnText;
  }
}

// ==============================================================================
// PAYSTACK PAYMENT & CHECKOUT ENGINE
// ==============================================================================

async function startCheckout(tier) {
  if (!state.user) {
    openModal('registerModal');
    showNotification("Please create your account first to link your course access.", "info");
    return;
  }

  const currentTier = state.user.tier || 1;
  if (currentTier >= tier) {
    showNotification(`You already have full access to ${tier === 3 ? "Fluency Suite" : "Survival Korean"}!`, "info");
    return;
  }

  showNotification("Connecting to Paystack secure checkout...", "info");

  try {
    const res = await fetch(`${API_BASE}/paystack/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ tier })
    });
    const data = await res.json();

    if (!res.ok || data.status !== 'success') {
      alert(data.message || "Failed to initialize Paystack checkout. Please try again.");
      return;
    }

    // 1. If Paystack returned a live authorization URL:
    if (data.authorization_url) {
      if (typeof PaystackPop !== 'undefined' && data.public_key && !data.public_key.startsWith('pk_test_demo')) {
        const handler = PaystackPop.setup({
          key: data.public_key,
          email: state.user.email,
          amount: data.amount_kobo,
          ref: data.reference,
          currency: 'NGN',
          callback: async function(response) {
            showNotification("Payment received! Activating your course...", "info");
            await verifyPaymentServer(response.reference, tier);
          },
          onClose: function() {
            showNotification("Checking payment status...", "info");
            fetchCurrentUser();
          }
        });
        handler.openIframe();
      } else {
        // Direct redirect to Paystack Checkout page
        window.location.href = data.authorization_url;
      }
      return;
    }

    // 2. Demo fallback if no live keys
    showPaymentSimulationModal(tier, data.reference, data.amount_kobo);

  } catch (err) {
    alert("Server is connecting. Please wait 5 seconds and click Unlock again!");
  }
}

function showPaymentSimulationModal(tier, reference, amountKobo) {
  const tierName = tier === 3 ? "Fluency & Career Suite (Tier 3)" : "Survival Korean (Tier 2)";
  const priceNaira = (amountKobo / 100).toLocaleString();

  const modalHtml = `
    <div class="modal-card" style="text-align: center;">
      <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">💳</div>
      <h3 style="font-size: 1.4rem; font-weight: 800; margin-bottom: 0.5rem; color: #0f172a;">Paystack Secure Checkout</h3>
      <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem;">Enrolling in <strong>${tierName}</strong></p>
      
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem; text-align: left;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: #64748b;">Amount Due:</span>
          <strong style="color: #0f172a; font-size: 1.1rem;">₦${priceNaira}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: #64748b;">Customer:</span>
          <span style="font-weight: 600; color: #334155;">${escapeHtml(state.user.email)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748b;">Reference:</span>
          <code style="font-size: 0.75rem; background: #e2e8f0; padding: 2px 4px; border-radius: 4px;">${reference}</code>
        </div>
      </div>

      <button class="btn btn-primary btn-lg" style="width: 100%; margin-bottom: 0.75rem;" onclick="completeDemoPayment('${reference}', ${tier})">
        Confirm & Activate ₦${priceNaira} Access
      </button>
      <button class="btn btn-outline btn-sm" style="width: 100%;" onclick="closeModal('paymentModal')">Cancel</button>
    </div>
  `;

  let pModal = document.getElementById('paymentModal');
  if (!pModal) {
    pModal = document.createElement('div');
    pModal.id = 'paymentModal';
    pModal.className = 'modal-backdrop';
    document.body.appendChild(pModal);
  }
  pModal.innerHTML = modalHtml;
  pModal.classList.add('active');
}

async function completeDemoPayment(reference, tier) {
  closeModal('paymentModal');
  await verifyPaymentServer(reference, tier);
}

async function verifyPaymentServer(reference, tier) {
  try {
    const res = await fetch(`${API_BASE}/paystack/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ reference, tier })
    });
    const data = await res.json();

    if (res.ok && data.status === 'success') {
      state.user.tier = data.tier;
      state.user.tier_name = data.tier_name;
      updateUIForUser();
      showNotification(`Payment verified! ${data.tier_name} is now fully unlocked! 🇰🇷`, "success");
      switchTab(tier === 3 ? 'tier3_epstopik' : 'tier2_numbers');
    } else {
      alert(data.message || "Payment verification failed.");
    }
  } catch (err) {
    alert("Network error during payment verification.");
  }
}

// ==============================================================================
// COURSE TABS & CONTENT RENDERER
// ==============================================================================

function switchTab(tabId) {
  const userTier = (state.user && state.user.tier) ? state.user.tier : 1;

  // Enforce Tier Access
  if (tabId.startsWith('tier2_') && userTier < 2) {
    showUpgradeModal(2);
    return;
  }
  if (tabId.startsWith('tier3_') && userTier < 3) {
    showUpgradeModal(3);
    return;
  }

  state.activeTab = tabId;

  // Update active class on sidebar
  document.querySelectorAll('.portal-nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-tab') === tabId) {
      item.classList.add('active');
    }
  });

  renderTabContent(tabId);
}

function updateSidebarLocks() {
  const userTier = (state.user && state.user.tier) ? state.user.tier : 1;

  document.querySelectorAll('.portal-nav-item').forEach(item => {
    const tab = item.getAttribute('data-tab');
    const lockIcon = item.querySelector('.lock-icon');

    if (tab.startsWith('tier2_')) {
      if (userTier < 2) {
        item.classList.add('locked');
        if (lockIcon) lockIcon.style.display = 'inline';
      } else {
        item.classList.remove('locked');
        if (lockIcon) lockIcon.style.display = 'none';
      }
    } else if (tab.startsWith('tier3_')) {
      if (userTier < 3) {
        item.classList.add('locked');
        if (lockIcon) lockIcon.style.display = 'inline';
      } else {
        item.classList.remove('locked');
        if (lockIcon) lockIcon.style.display = 'none';
      }
    }
  });
}

function renderTabContent(tabId) {
  const area = document.getElementById('portalContentArea');
  if (!area) return;

  const data = window.KOREAN_DATA;

  switch (tabId) {
    // ------------------ TIER 1 ------------------
    case 'tier1_hangul':
      area.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <div>
            <span class="badge badge-free">Tier 1: Free Foundation</span>
            <h2 style="font-size: 1.75rem; font-weight: 800; margin-top: 0.25rem;">Hangul Vowels & Consonants</h2>
          </div>
          <button class="btn btn-outline btn-sm" onclick="playKoreanAudio('안녕하세요')">🔊 Test Audio</button>
        </div>
        <p style="color: #64748b; margin-bottom: 1.5rem;">
          Hangul was scientifically invented in 1443 by King Sejong the Great. Each vowel represents Heaven, Earth, and Human, while consonants mimic your mouth and vocal tract shapes.
        </p>

        <h3 style="font-size: 1.15rem; font-weight: 700; color: #1e3a8a; margin-top: 1.5rem;">1. The 10 Basic Vowels (모음)</h3>
        <div class="hangul-grid">
          ${data.hangul.vowels.map(v => `
            <div class="char-card" onclick="playKoreanAudio('${v.char}')">
              <div class="char-glyph">${v.char}</div>
              <div class="char-rom">${v.rom}</div>
              <div class="char-desc">${v.desc}</div>
              <button class="audio-btn">🔊 Listen</button>
            </div>
          `).join('')}
        </div>

        <h3 style="font-size: 1.15rem; font-weight: 700; color: #1e3a8a; margin-top: 2rem;">2. The 14 Basic Consonants (자음)</h3>
        <div class="hangul-grid">
          ${data.hangul.consonants.map(c => `
            <div class="char-card" onclick="playKoreanAudio('${c.char}')">
              <div class="char-glyph">${c.char}</div>
              <div class="char-rom">${c.rom}</div>
              <div class="char-desc">${c.desc}</div>
              <button class="audio-btn">🔊 Listen</button>
            </div>
          `).join('')}
        </div>

        <h3 style="font-size: 1.15rem; font-weight: 700; color: #1e3a8a; margin-top: 2rem;">3. Syllable Block Construction Rules</h3>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; margin-top: 1rem;">
          ${data.hangul.blocksGuide.map(b => `
            <div style="margin-bottom: 1rem;">
              <strong style="color: #1e293b;">• ${b.type}:</strong>
              <p style="color: #475569; font-size: 0.9rem; margin-top: 0.2rem;">${b.rule}</p>
            </div>
          `).join('')}
        </div>

        <div style="text-align: center; margin-top: 2.5rem;">
          <button class="btn btn-primary btn-lg" onclick="switchTab('tier1_words')">Next: 25 Daily Starter Words →</button>
        </div>
      `;
      break;

    case 'tier1_words':
      area.innerHTML = `
        <div>
          <span class="badge badge-free">Tier 1: Free Foundation</span>
          <h2 style="font-size: 1.75rem; font-weight: 800; margin: 0.25rem 0 1.5rem;">25 Essential Core Korean Words</h2>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.25rem;">
          ${data.hangul.starterWords.map(w => `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <span class="hangul-text" style="font-size: 1.5rem; font-weight: 800; color: #1e3a8a;">${w.hangul}</span>
                  <button class="audio-btn" onclick="playKoreanAudio('${w.hangul}')">🔊</button>
                </div>
                <div style="color: #dc2626; font-size: 0.85rem; font-weight: 600; margin-top: 0.2rem;">${w.rom}</div>
                <div style="color: #0f172a; font-weight: 700; margin-top: 0.5rem;">${w.meaning}</div>
              </div>
              <div style="font-size: 0.75rem; color: #64748b; margin-top: 0.75rem; border-top: 1px dashed #cbd5e1; padding-top: 0.5rem;">
                ${w.breakdown}
              </div>
            </div>
          `).join('')}
        </div>

        <div style="text-align: center; margin-top: 2.5rem;">
          <button class="btn btn-primary btn-lg" onclick="switchTab('tier1_quiz')">Take the Hangul Mastery Quiz →</button>
        </div>
      `;
      break;

    case 'tier1_quiz':
      renderQuiz(area, 'hangul_quiz');
      break;

    // ------------------ TIER 2 ------------------
    case 'tier2_numbers':
      area.innerHTML = `
        <div>
          <span class="badge badge-tier2">Tier 2: Survival Korean (₦500)</span>
          <h2 style="font-size: 1.75rem; font-weight: 800; margin: 0.25rem 0 1rem;">The Dual Number Systems</h2>
          <div style="background: #fef3c7; border: 1px solid #fde68a; padding: 1rem; border-radius: 8px; color: #92400e; font-weight: 600; font-size: 0.9rem; margin-bottom: 1.5rem;">
            ${data.survival.numbers.ruleGuide}
          </div>
        </div>

        <h3 style="font-size: 1.2rem; font-weight: 700; color: #1e3a8a; margin-top: 1rem;">1. Sino-Korean (일, 이, 삼) — Money, Dates, Minutes</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 0.85rem; margin-top: 0.75rem;">
          ${data.survival.numbers.sino.map(n => `
            <div class="char-card" onclick="playKoreanAudio('${n.hangul}')">
              <div style="font-size: 1.1rem; font-weight: 800; color: #64748b;">${n.digit}</div>
              <div class="char-glyph" style="font-size: 1.7rem;">${n.hangul}</div>
              <div class="char-rom">${n.rom}</div>
              <div class="char-desc">${n.usage}</div>
            </div>
          `).join('')}
        </div>

        <h3 style="font-size: 1.2rem; font-weight: 700; color: #1e3a8a; margin-top: 2rem;">2. Native Korean (하나, 둘, 셋) — Counting Items, People, Hours</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 0.85rem; margin-top: 0.75rem;">
          ${data.survival.numbers.native.map(n => `
            <div class="char-card" onclick="playKoreanAudio('${n.hangul.split(' ')[0]}')">
              <div style="font-size: 1.1rem; font-weight: 800; color: #64748b;">${n.digit}</div>
              <div class="char-glyph" style="font-size: 1.7rem;">${n.hangul}</div>
              <div class="char-rom">${n.rom}</div>
              <div class="char-desc">${n.usage}</div>
            </div>
          `).join('')}
        </div>

        <div style="text-align: center; margin-top: 2.5rem;">
          <button class="btn btn-primary btn-lg" onclick="switchTab('tier2_daily')">Next: Restaurant & Travel Survival →</button>
        </div>
      `;
      break;

    case 'tier2_daily':
      area.innerHTML = `
        <div>
          <span class="badge badge-tier2">Tier 2: Survival Korean (₦500)</span>
          <h2 style="font-size: 1.75rem; font-weight: 800; margin: 0.25rem 0 1.5rem;">Restaurant, Transport & Daily Survival</h2>
        </div>

        <h3 style="font-size: 1.2rem; font-weight: 700; color: #1e3a8a; margin-bottom: 0.75rem;">🍜 Restaurant & Food Survival</h3>
        <div style="display: grid; grid-template-columns: 1fr; gap: 1rem; margin-bottom: 2rem;">
          ${data.survival.restaurant.map(r => `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span class="hangul-text" style="font-size: 1.35rem; font-weight: 800; color: #0f172a;">${r.phrase}</span>
                <span style="color: #dc2626; font-size: 0.85rem; font-weight: 600; margin-left: 0.5rem;">[${r.rom}]</span>
                <div style="font-weight: 700; color: #2563eb; margin-top: 0.25rem;">${r.meaning}</div>
                <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.25rem;">💡 ${r.note}</div>
              </div>
              <button class="btn btn-outline btn-sm" onclick="playKoreanAudio('${r.phrase}')">🔊 Listen</button>
            </div>
          `).join('')}
        </div>

        <h3 style="font-size: 1.2rem; font-weight: 700; color: #1e3a8a; margin-bottom: 0.75rem;">🚕 Transport & Commuting</h3>
        <div style="display: grid; grid-template-columns: 1fr; gap: 1rem; margin-bottom: 2rem;">
          ${data.survival.transport.map(t => `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span class="hangul-text" style="font-size: 1.35rem; font-weight: 800; color: #0f172a;">${t.phrase}</span>
                <span style="color: #dc2626; font-size: 0.85rem; font-weight: 600; margin-left: 0.5rem;">[${t.rom}]</span>
                <div style="font-weight: 700; color: #2563eb; margin-top: 0.25rem;">${t.meaning}</div>
                <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.25rem;">💡 ${t.note}</div>
              </div>
              <button class="btn btn-outline btn-sm" onclick="playKoreanAudio('${t.phrase}')">🔊 Listen</button>
            </div>
          `).join('')}
        </div>

        <div style="text-align: center; margin-top: 2rem;">
          <button class="btn btn-primary btn-lg" onclick="switchTab('tier2_quiz')">Take Survival Korean Exam →</button>
        </div>
      `;
      break;

    case 'tier2_quiz':
      renderQuiz(area, 'survival_quiz');
      break;

    // ------------------ TIER 3 ------------------
    case 'tier3_epstopik':
      area.innerHTML = `
        <div>
          <span class="badge badge-tier3">Tier 3: Fluency & Career Tools (₦2,000)</span>
          <h2 style="font-size: 1.75rem; font-weight: 800; margin: 0.25rem 0 1rem;">EPS-TOPIK & Industrial Workplace Terms</h2>
          <p style="color: #64748b; margin-bottom: 1.5rem;">
            Essential high-frequency terminology for the South Korea E-9 Employment Permit System exam, factory operations, and industrial safety.
          </p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem;">
          ${data.fluency.epstopik.map(item => `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <span class="badge" style="background:#fee2e2; color:#991b1b; font-size: 0.7rem; margin-bottom: 0.5rem;">${item.category}</span>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.25rem;">
                  <span class="hangul-text" style="font-size: 1.35rem; font-weight: 800; color: #1e3a8a;">${item.term}</span>
                  <button class="audio-btn" onclick="playKoreanAudio('${item.term.split(' ')[0]}')">🔊</button>
                </div>
                <div style="font-weight: 700; color: #0f172a; margin-top: 0.35rem;">${item.meaning}</div>
              </div>
              <div style="font-size: 0.8rem; color: #475569; background: #ffffff; padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid #e2e8f0; margin-top: 0.75rem;">
                <strong>Exam Usage:</strong> ${item.example}
              </div>
            </div>
          `).join('')}
        </div>

        <div style="text-align: center; margin-top: 2.5rem;">
          <button class="btn btn-primary btn-lg" onclick="switchTab('tier3_srs')">Launch SRS Flashcards Engine →</button>
        </div>
      `;
      break;

    case 'tier3_srs':
      renderFlashcardsStage(area);
      break;

    case 'tier3_writing':
      renderWritingCanvas(area);
      break;

    case 'tier3_dialogue':
      renderDialogueSimulator(area);
      break;

    case 'tier3_certificate':
      renderCertificateSection(area);
      break;

    default:
      area.innerHTML = `<p>Section loading...</p>`;
  }
}

// ==============================================================================
// QUIZ ENGINE
// ==============================================================================

function renderQuiz(container, quizKey) {
  const quiz = window.KOREAN_DATA.quizzes[quizKey];
  if (!quiz) return;

  container.innerHTML = `
    <div>
      <span class="badge badge-primary">Interactive Assessment</span>
      <h2 style="font-size: 1.75rem; font-weight: 800; margin: 0.25rem 0 1.5rem;">${quiz.title}</h2>
    </div>

    <form id="quizForm" onsubmit="submitQuiz(event, '${quizKey}')">
      ${quiz.questions.map((q, idx) => `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
          <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 1rem; color: #0f172a;">
            ${idx + 1}. ${q.q}
          </h4>
          <div style="display: flex; flex-direction: column; gap: 0.6rem;">
            ${q.options.map((opt, optIdx) => `
              <label style="display: flex; align-items: center; gap: 0.75rem; background: white; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #cbd5e1; cursor: pointer; transition: border-color 0.2s;">
                <input type="radio" name="q_${idx}" value="${optIdx}" required>
                <span style="font-size: 0.92rem; font-weight: 500;">${opt}</span>
              </label>
            `).join('')}
          </div>
          <div id="explain_${idx}" style="display: none; margin-top: 0.75rem; font-size: 0.85rem; padding: 0.5rem 0.75rem; border-radius: 6px;"></div>
        </div>
      `).join('')}

      <div style="text-align: center; margin-top: 2rem;">
        <button type="submit" class="btn btn-primary btn-lg">Submit & Verify Assessment</button>
      </div>
    </form>
    <div id="quizResultBox" style="display: none; text-align: center; margin-top: 2rem;"></div>
  `;
}

async function submitQuiz(e, quizKey) {
  e.preventDefault();
  const quiz = window.KOREAN_DATA.quizzes[quizKey];
  const form = e.target;
  let correctCount = 0;

  quiz.questions.forEach((q, idx) => {
    const selected = form[`q_${idx}`].value;
    const expBox = document.getElementById(`explain_${idx}`);
    expBox.style.display = 'block';

    if (parseInt(selected) === q.answer) {
      correctCount++;
      expBox.style.background = '#dcfce7';
      expBox.style.color = '#15803d';
      expBox.innerHTML = `✅ <strong>Correct!</strong> ${q.explain}`;
    } else {
      expBox.style.background = '#fee2e2';
      expBox.style.color = '#991b1b';
      expBox.innerHTML = `❌ <strong>Incorrect.</strong> ${q.explain}`;
    }
  });

  const percentage = Math.round((correctCount / quiz.questions.length) * 100);
  const passed = percentage >= quiz.passScore;
  const resultBox = document.getElementById('quizResultBox');
  resultBox.style.display = 'block';

  resultBox.innerHTML = `
    <div style="background: ${passed ? '#dcfce7' : '#fef3c7'}; border: 2px solid ${passed ? '#22c55e' : '#f59e0b'}; padding: 2rem; border-radius: 12px; max-width: 500px; margin: 0 auto;">
      <h3 style="font-size: 1.5rem; font-weight: 800; color: #0f172a;">${passed ? '🎉 Congratulations!' : '📚 Keep Reviewing!'}</h3>
      <p style="font-size: 1.2rem; font-weight: 700; margin: 0.5rem 0;">Your Score: ${percentage}% (${correctCount}/${quiz.questions.length})</p>
      <p style="font-size: 0.9rem; color: #475569;">${passed ? 'You have officially passed this module assessment.' : 'You need 70% to pass. Review the materials and try again!'}</p>
    </div>
  `;

  // Update progress to server if logged in
  if (state.token) {
    try {
      await fetch(`${API_BASE}/progress/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({ lesson_id: quizKey, completed: passed, score: percentage })
      });
      loadUserProgress();
    } catch (err) {
      console.warn("Failed to record quiz progress", err);
    }
  }
}

// ==============================================================================
// SRS FLASHCARD SYSTEM (TIER 3)
// ==============================================================================

function renderFlashcardsStage(container) {
  state.flashcards = window.KOREAN_DATA.flashcardsDeck;
  state.currentCardIndex = 0;
  state.isCardFlipped = false;

  container.innerHTML = `
    <div>
      <span class="badge badge-tier3">Tier 3: Fluency & Career Tools</span>
      <h2 style="font-size: 1.75rem; font-weight: 800; margin: 0.25rem 0 0.5rem;">Spaced Repetition (SRS) Flashcards</h2>
      <p style="color: #64748b; font-size: 0.9rem;">Powered by Leitner algorithm intervals. Click card to flip.</p>
    </div>

    <div class="flashcard-stage">
      <div id="flashcardBox" class="flashcard-box" onclick="toggleCardFlip()">
        <!-- Dynamic card content -->
      </div>

      <div class="fc-controls" id="fcControls" style="display: none;">
        <button class="btn btn-sm" style="background:#ef4444; color:white;" onclick="handleSrsRating(1)">Again (1d)</button>
        <button class="btn btn-sm" style="background:#f59e0b; color:white;" onclick="handleSrsRating(2)">Hard (2d)</button>
        <button class="btn btn-sm" style="background:#3b82f6; color:white;" onclick="handleSrsRating(3)">Good (4d)</button>
        <button class="btn btn-sm" style="background:#10b981; color:white;" onclick="handleSrsRating(4)">Easy (7d)</button>
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; font-size: 0.85rem; color: #64748b;">
        <span id="fcProgressLabel">Card 1 of ${state.flashcards.length}</span>
        <button class="btn btn-outline btn-sm" onclick="playCurrentCardAudio()">🔊 Hear Word</button>
      </div>
    </div>
  `;

  updateFlashcardView();
}

function updateFlashcardView() {
  const card = state.flashcards[state.currentCardIndex];
  const box = document.getElementById('flashcardBox');
  const controls = document.getElementById('fcControls');
  const label = document.getElementById('fcProgressLabel');

  if (!card) return;

  label.innerText = `Card ${state.currentCardIndex + 1} of ${state.flashcards.length} (${card.tag})`;

  if (!state.isCardFlipped) {
    box.innerHTML = `
      <span class="badge" style="background:rgba(255,255,255,0.15); color:white; margin-bottom:1rem;">${card.tag}</span>
      <div class="fc-hangul">${card.front}</div>
      <div class="fc-rom">${card.rom}</div>
      <span style="font-size: 0.8rem; color: #94a3b8; margin-top: 1rem;">(Click or tap to reveal meaning)</span>
    `;
    controls.style.display = 'none';
  } else {
    box.innerHTML = `
      <span class="badge" style="background:rgba(255,255,255,0.15); color:white; margin-bottom:1rem;">${card.tag}</span>
      <div class="fc-hangul" style="font-size: 2.5rem;">${card.front}</div>
      <div class="fc-meaning">${card.back}</div>
      <div class="fc-rom" style="margin-top: 0.5rem;">${card.rom}</div>
    `;
    controls.style.display = 'grid';
  }
}

function toggleCardFlip() {
  state.isCardFlipped = !state.isCardFlipped;
  updateFlashcardView();
}

async function handleSrsRating(rating) {
  const card = state.flashcards[state.currentCardIndex];

  // Submit to server if token exists
  if (state.token) {
    fetch(`${API_BASE}/flashcards/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ card_id: card.id, rating })
    }).catch(console.warn);
  }

  // Next card
  state.currentCardIndex = (state.currentCardIndex + 1) % state.flashcards.length;
  state.isCardFlipped = false;
  updateFlashcardView();
}

function playCurrentCardAudio() {
  const card = state.flashcards[state.currentCardIndex];
  if (card) playKoreanAudio(card.front);
}

// ==============================================================================
// HANGUL STROKE WRITING CANVAS (TIER 3)
// ==============================================================================

function renderWritingCanvas(container) {
  container.innerHTML = `
    <div>
      <span class="badge badge-tier3">Tier 3: Fluency & Career Tools</span>
      <h2 style="font-size: 1.75rem; font-weight: 800; margin: 0.25rem 0 0.5rem;">Interactive Stroke Writing Canvas</h2>
      <p style="color: #64748b; font-size: 0.9rem;">Practice writing Korean characters stroke by stroke directly on screen.</p>
    </div>

    <div class="canvas-container">
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; margin-bottom: 0.5rem;">
        ${['가', '나', '다', '한', '국', '안', '녕', '물', '밥', '일'].map(c => `
          <button class="btn btn-outline btn-sm hangul-text" style="font-size:1.1rem; font-weight:700;" onclick="setCanvasPrompt('${c}')">${c}</button>
        `).join('')}
      </div>

      <div style="position: relative;">
        <canvas id="writingCanvas" width="340" height="340"></canvas>
        <div id="canvasGhost" class="hangul-text" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 11rem; color: #f1f5f9; pointer-events: none; user-select: none;">가</div>
      </div>

      <div style="display: flex; gap: 0.75rem;">
        <button class="btn btn-outline btn-sm" onclick="clearCanvas()">Clear Canvas</button>
        <button class="btn btn-primary btn-sm" onclick="showNotification('Great job! Practice gives stroke muscle memory.', 'success')">Verify Stroke</button>
      </div>
    </div>
  `;

  initCanvasEvents();
}

function initCanvasEvents() {
  const canvas = document.getElementById('writingCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#1e3a8a';

  let drawing = false;

  function start(e) {
    drawing = true;
    draw(e);
  }
  function stop() {
    drawing = false;
    ctx.beginPath();
  }
  function draw(e) {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mouseup', stop);
  canvas.addEventListener('mousemove', draw);

  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); start(e); });
  canvas.addEventListener('touchend', (e) => { e.preventDefault(); stop(); });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e); });
}

function setCanvasPrompt(char) {
  const ghost = document.getElementById('canvasGhost');
  if (ghost) ghost.innerText = char;
  clearCanvas();
  playKoreanAudio(char);
}

function clearCanvas() {
  const canvas = document.getElementById('writingCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ==============================================================================
// INTERACTIVE DIALOGUE SIMULATOR (TIER 3)
// ==============================================================================

function renderDialogueSimulator(container) {
  const scenarios = window.KOREAN_DATA.dialogues;

  container.innerHTML = `
    <div>
      <span class="badge badge-tier3">Tier 3: Fluency & Career Tools</span>
      <h2 style="font-size: 1.75rem; font-weight: 800; margin: 0.25rem 0 1rem;">Interactive Korean Dialogue Simulator</h2>
      <p style="color: #64748b; margin-bottom: 1.5rem;">Practice real-life conversational branching scenarios.</p>
    </div>

    <div style="display: flex; gap: 0.75rem; margin-bottom: 2rem;">
      ${scenarios.map((s, idx) => `
        <button class="btn ${idx === 0 ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="loadDialogueScenario('${s.id}')">
          ${s.title}
        </button>
      `).join('')}
    </div>

    <div id="dialogueChatStage" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.75rem; min-height: 380px;">
      <!-- Dynamic chat tree -->
    </div>
  `;

  loadDialogueScenario(scenarios[0].id);
}

function loadDialogueScenario(scenarioId) {
  const scenario = window.KOREAN_DATA.dialogues.find(d => d.id === scenarioId);
  const stage = document.getElementById('dialogueChatStage');
  if (!scenario || !stage) return;

  stage.innerHTML = `
    <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem; margin-bottom: 1.25rem;">
      <h4 style="font-size: 1.1rem; font-weight: 800; color: #0f172a;">${scenario.title}</h4>
      <p style="font-size: 0.85rem; color: #64748b;">${scenario.desc}</p>
    </div>
    <div id="dialogueStepContainer"></div>
  `;

  renderDialogueStep(scenario, 0);
}

function renderDialogueStep(scenario, stepIndex) {
  const container = document.getElementById('dialogueStepContainer');
  if (stepIndex >= scenario.steps.length) {
    container.innerHTML += `
      <div style="background: #dcfce7; border: 1px solid #86efac; border-radius: 8px; padding: 1.25rem; text-align: center; margin-top: 1.5rem;">
        <h4 style="color: #15803d; font-weight: 800; font-size: 1.2rem;">🎉 Scenario Completed!</h4>
        <p style="font-size: 0.9rem; color: #166534; margin-top: 0.25rem;">You handled all conversation prompts with cultural fluency.</p>
      </div>
    `;
    return;
  }

  const step = scenario.steps[stepIndex];
  const stepDiv = document.createElement('div');
  stepDiv.style.marginBottom = '1.5rem';

  stepDiv.innerHTML = `
    <div style="display: flex; gap: 0.75rem; align-items: flex-start; margin-bottom: 1rem;">
      <div style="background: #1e3a8a; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0;">🇰🇷</div>
      <div style="background: white; border: 1px solid #cbd5e1; border-radius: 12px; padding: 1rem; max-width: 80%;">
        <div style="font-size: 0.8rem; font-weight: 700; color: #64748b;">${step.speaker}</div>
        <div class="hangul-text" style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0.25rem 0;">${step.korean}</div>
        <div style="font-size: 0.85rem; color: #475569;">${step.english}</div>
        <button class="audio-btn" style="margin-top: 0.5rem;" onclick="playKoreanAudio('${step.korean}')">🔊 Listen</button>
      </div>
    </div>

    <div style="margin-left: 48px; display: flex; flex-direction: column; gap: 0.6rem;">
      <div style="font-size: 0.8rem; font-weight: 700; color: #64748b;">Choose your reply:</div>
      ${step.options.map((opt, optIdx) => `
        <button class="btn btn-outline" style="text-align: left; justify-content: flex-start; font-size: 0.88rem; font-weight: 600;" onclick="selectDialogueChoice('${scenario.id}', ${stepIndex}, ${optIdx})">
          ${opt.text}
        </button>
      `).join('')}
    </div>
  `;

  container.appendChild(stepDiv);
}

function selectDialogueChoice(scenarioId, stepIndex, optionIndex) {
  const scenario = window.KOREAN_DATA.dialogues.find(d => d.id === scenarioId);
  const step = scenario.steps[stepIndex];
  const choice = step.options[optionIndex];

  if (!choice.correct) {
    alert(`Feedback: ${choice.feedback}`);
    return;
  }

  showNotification(`Correct! ${choice.feedback}`, "success");
  renderDialogueStep(scenario, stepIndex + 1);
}

// ==============================================================================
// VERIFIABLE CERTIFICATE OF COMPLETION (TIER 3)
// ==============================================================================

function renderCertificateSection(container) {
  const studentName = (state.user && state.user.full_name) ? state.user.full_name : "Your Name";
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  container.innerHTML = `
    <div>
      <span class="badge badge-tier3">Tier 3: Fluency & Career Tools</span>
      <h2 style="font-size: 1.75rem; font-weight: 800; margin: 0.25rem 0 0.5rem;">Official Digital Certificate of Completion</h2>
      <p style="color: #64748b; font-size: 0.9rem;">Verifiable credential suitable for EPS-TOPIK profiles, GKS applications, and LinkedIn.</p>
    </div>

    <div class="cert-preview-card">
      <div style="color: #64748b; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.05em;">KOREAN MASTERY NIGERIA • 한국어 마스터</div>
      <h3 style="color: #dc2626; font-size: 1.85rem; font-weight: 900; margin: 0.5rem 0;">CERTIFICATE OF COMPLETION</h3>
      <p style="font-size: 0.9rem; color: #475569;">This is to officially certify that</p>
      
      <div style="font-size: 1.75rem; font-weight: 900; color: #0f172a; margin: 1rem 0 0.5rem; text-decoration: underline; text-underline-offset: 6px; text-decoration-color: #2563eb;">
        ${escapeHtml(studentName.toUpperCase())}
      </div>
      
      <p style="font-size: 0.88rem; color: #334155; max-width: 650px; margin: 0.75rem auto 1.5rem; line-height: 1.5;">
        has successfully demonstrated verified mastery of Korean Hangul script, Sino & Native Korean number systems, conversational survival structures, corporate etiquette, and foundational EPS-TOPIK vocational competencies.
      </p>

      <div class="cert-seal">
        <span>VERIFIED</span>
        <span>KM-NG</span>
        <span>2026</span>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700; color: #64748b; margin-top: 1.5rem; border-top: 1px solid #e2e8f0; padding-top: 1rem;">
        <span>Issue Date: ${today}</span>
        <span>Credential: Verifiable Digital Document</span>
      </div>
    </div>

    <div style="text-align: center; margin-top: 2rem;">
      <button class="btn btn-primary btn-lg" onclick="generateAndDownloadCert()">
        📥 Download Official PDF Certificate
      </button>
    </div>
  `;
}

async function generateAndDownloadCert() {
  if (!state.token) {
    openModal('registerModal');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/certificate/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      }
    });
    const data = await res.json();

    if (res.ok && data.status === 'success') {
      window.location.href = data.download_url;
      showNotification(`Certificate generated! Verification code: ${data.cert_code}`, "success");
    } else {
      alert(data.message || "Failed to generate certificate.");
    }
  } catch (err) {
    alert("Network error generating certificate.");
  }
}

// ==============================================================================
// AUDIO PRONUNCIATION SYNTHESIS
// ==============================================================================

function playKoreanAudio(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.85;

    // Look for Korean native voice
    const voices = window.speechSynthesis.getVoices();
    const koVoice = voices.find(v => v.lang.startsWith('ko'));
    if (koVoice) utterance.voice = koVoice;

    window.speechSynthesis.speak(utterance);
  } else {
    showNotification(`Pronouncing: "${text}"`, "info");
  }
}

// ==============================================================================
// PROGRESS TRACKING & DATA SYNC
// ==============================================================================

async function loadUserProgress() {
  if (!state.token) return;

  try {
    const res = await fetch(`${API_BASE}/progress`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const data = await res.json();
    if (res.ok && data.status === 'success') {
      state.progress = data.progress || {};
      updateProgressBar();
    }
  } catch (err) {
    console.warn("Could not load user progress", err);
  }
}

function updateProgressBar() {
  const totalLessons = 6;
  const completedCount = Object.keys(state.progress).filter(k => state.progress[k].completed).length;
  const pct = Math.min(100, Math.round((completedCount / totalLessons) * 100));

  const bar = document.getElementById('progressBarFill');
  const label = document.getElementById('progressPercentageLabel');
  if (bar) bar.style.width = `${pct}%`;
  if (label) label.innerText = `${pct}%`;
}

// ==============================================================================
// MODAL CONTROLLERS
// ==============================================================================

function setupNavigation() {
  document.querySelectorAll('.portal-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });
}

function setupAuthModals() {
  const regForm = document.getElementById('registerForm');
  if (regForm) regForm.addEventListener('submit', handleRegister);

  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
}

function setupLegalModals() {
  // Bound through inline onclick
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

function showUpgradeModal(tier) {
  const modal = document.getElementById('upgradeModal');
  const title = document.getElementById('upgradeModalTitle');
  const price = document.getElementById('upgradeModalPrice');
  const btn = document.getElementById('upgradeModalBtn');

  if (tier === 3) {
    title.innerText = "Unlock Tier 3: Fluency & Career Tools";
    price.innerText = "₦2,000";
    btn.onclick = () => { closeModal('upgradeModal'); startCheckout(3); };
  } else {
    title.innerText = "Unlock Tier 2: Survival Korean";
    price.innerText = "₦500";
    btn.onclick = () => { closeModal('upgradeModal'); startCheckout(2); };
  }

  modal.classList.add('active');
}

function showNotification(message, type = 'info') {
  let toast = document.getElementById('toastNotification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotification';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0f172a;
      color: white;
      padding: 14px 22px;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.25);
      font-size: 0.92rem;
      font-weight: 600;
      z-index: 9999;
      transition: opacity 0.3s, transform 0.3s;
      border-left: 4px solid #2563eb;
    `;
    document.body.appendChild(toast);
  }

  if (type === 'success') toast.style.borderLeftColor = '#22c55e';
  if (type === 'error') toast.style.borderLeftColor = '#ef4444';
  if (type === 'info') toast.style.borderLeftColor = '#3b82f6';

  toast.innerText = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
