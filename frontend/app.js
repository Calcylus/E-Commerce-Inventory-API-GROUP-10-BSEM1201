// ===================== STATE =====================
let token = localStorage.getItem('token') || null;
let currentUser = null;
let allProducts = [];
let allCategories = [];
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let shopPage = 1;

const PAGE_SIZE = 12;

// ===================== API =====================
const API = {
  base: '/api',

  async get(path, auth = true) {
    const headers = {};
    if (auth && token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${this.base}${path}`, { headers });

    if (res.status === 401 && auth) {
      logout(false);
      throw new Error('Session expired. Please sign in again.');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Request failed');
    }

    return res.json();
  },

  async post(path, body = {}, auth = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth && token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${this.base}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (res.status === 401 && auth) {
      logout(false);
      throw new Error('Session expired. Please sign in again.');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Request failed');
    }

    return res.json();
  },

  async put(path, body = {}, auth = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth && token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${this.base}${path}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });

    if (res.status === 401 && auth) {
      logout(false);
      throw new Error('Session expired. Please sign in again.');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Request failed');
    }

    return res.json();
  },

  async del(path, auth = true) {
    const headers = {};
    if (auth && token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${this.base}${path}`, {
      method: 'DELETE',
      headers
    });

    if (res.status === 401 && auth) {
      logout(false);
      throw new Error('Session expired. Please sign in again.');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Request failed');
    }

    return res.json();
  },

  async login(username, password) {
    const form = new URLSearchParams();
    form.append('username', username);
    form.append('password', password);

    const res = await fetch(`${this.base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Login failed');
    }

    return res.json();
  }
};

// ===================== HELPERS =====================
function $(id) {
  return document.getElementById(id);
}

function isAdmin() {
  return currentUser && currentUser.role === 'admin';
}

function safeText(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

function safeJS(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, ' ');
}

function getRegisterButton() {
  return $('registerBtn') || document.querySelector('.nav-auth button[onclick="showRegisterModal()"]');
}

function getContactLink() {
  return $('navContact') || [...document.querySelectorAll('#navLinks a')]
    .find(a => a.textContent.trim().toLowerCase() === 'contact');
}

function setDisplay(id, show, display = '') {
  const el = $(id);
  if (el) el.style.display = show ? display : 'none';
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function cartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function toast(message, type = '') {
  const el = $('toast');
  if (!el) return;

  el.textContent = message;
  el.className = `toast ${type}`;

  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => el.classList.remove('show'), 3500);
}

function fallbackImage(name = 'Product') {
  return `https://placehold.co/500x500/1A1714/EF9F27?text=${encodeURIComponent(name)}`;
}

function handleImageError(img, name) {
  img.onerror = null;
  img.src = fallbackImage(name);
}

function updateCartButton() {
  const btn = $('cartBtn');

  if (btn) {
    btn.textContent = `Cart (${cartCount()})`;
    btn.style.display = isAdmin() ? 'none' : '';
  }

  saveCart();
}

// ===================== AUTH UI =====================
function updateAuthUI() {
  const loggedIn = !!currentUser;
  const admin = isAdmin();

  const registerBtn = getRegisterButton();
  const contactLink = getContactLink();
  const avatarName = $('avatarName');
  const ddMyOrders = $('ddMyOrders');

  setDisplay('loginBtn', !loggedIn);
  if (registerBtn) registerBtn.style.display = loggedIn ? 'none' : '';

  setDisplay('avatarDropdown', loggedIn);

  if (avatarName) {
    avatarName.textContent = '';
    avatarName.style.display = 'none';
  }

  if (contactLink) contactLink.style.display = admin ? 'none' : '';

  setDisplay('navOrders', loggedIn && !admin);
  setDisplay('navDashboard', admin);

  ['ddAdmin', 'ddProducts', 'ddCategories', 'ddOrders', 'ddUsers', 'ddMessages'].forEach(id => {
    setDisplay(id, admin);
  });

  if (ddMyOrders) ddMyOrders.style.display = admin ? 'none' : '';

  updateCartButton();
}

async function loadUser() {
  if (!token) {
    currentUser = null;
    updateAuthUI();
    return;
  }

  try {
    currentUser = await API.get('/users/me');

    const initial = (currentUser.full_name || currentUser.username || 'U')
      .charAt(0)
      .toUpperCase();

    if ($('avatarIcon')) $('avatarIcon').textContent = initial;

    updateAuthUI();
  } catch (err) {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    updateAuthUI();
  }
}

async function login(event) {
  event.preventDefault();

  const msg = $('loginMsg');
  msg.style.display = 'none';
  msg.className = 'form-msg';

  try {
    const username = $('loginUsername').value.trim();
    const password = $('loginPassword').value;

    const data = await API.login(username, password);

    token = data.access_token;
    localStorage.setItem('token', token);

    await loadUser();

    closeModal('loginModal');

    toast('Signed in successfully.', 'success');

    navigate(isAdmin() ? 'dashboard' : 'home');
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'form-msg error';
    msg.style.display = 'block';
  }
}

async function register(event) {
  event.preventDefault();

  const msg = $('registerMsg');
  msg.style.display = 'none';
  msg.className = 'form-msg';

  try {
    await API.post('/auth/register', {
      full_name: $('regName').value.trim(),
      email: $('regEmail').value.trim(),
      username: $('regUsername').value.trim(),
      password: $('regPassword').value
    }, false);

    closeModal('registerModal');
    showLoginModal();

    toast('Account created. Please sign in.', 'success');
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'form-msg error';
    msg.style.display = 'block';
  }
}

function logout(showToast = true) {
  token = null;
  currentUser = null;

  localStorage.removeItem('token');

  updateAuthUI();

  if (showToast) toast('Signed out.');

  navigate('home');
}

// ===================== NAVIGATION =====================
function navigate(page) {
  const admin = isAdmin();

  if (page === 'contact' && admin) page = 'dashboard';
  if (page === 'orders' && admin) page = 'adminOrders';

  const adminPages = [
    'dashboard',
    'adminProducts',
    'adminCategories',
    'adminOrders',
    'adminUsers',
    'adminMessages'
  ];

  if (adminPages.includes(page) && !admin) {
    page = currentUser ? 'shop' : 'home';
  }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  const pageId = 'page' + page.charAt(0).toUpperCase() + page.slice(1);
  const pageEl = $(pageId);

  if (pageEl) pageEl.classList.add('active');

  window.location.hash = page;

  closeDropdown();

  const navLinks = $('navLinks');
  if (navLinks) navLinks.classList.remove('open');

  window.scrollTo({ top: 0, behavior: 'smooth' });

  const loaders = {
    home: loadHome,
    shop: loadShop,
    orders: loadMyOrders,
    dashboard: loadDashboard,
    adminProducts: loadAdminProducts,
    adminCategories: loadAdminCategories,
    adminOrders: loadAdminOrders,
    adminUsers: loadAdminUsers,
    adminMessages: loadAdminMessages,
    profile: loadProfile
  };

  if (loaders[page]) loaders[page]();
}

// ===================== DROPDOWN / MOBILE / MODALS =====================
function toggleDropdown() {
  const menu = $('dropdownMenu');
  if (menu) menu.classList.toggle('show');
}

function closeDropdown() {
  const menu = $('dropdownMenu');
  if (menu) menu.classList.remove('show');
}

function toggleMobileMenu() {
  const navLinks = $('navLinks');
  if (navLinks) navLinks.classList.toggle('open');
}

function showLoginModal() {
  if (currentUser) {
    toast('You are already signed in.', 'success');
    return;
  }

  $('loginModal').classList.add('show');
  $('loginMsg').style.display = 'none';
}

function showRegisterModal() {
  if (currentUser) {
    toast('You are already signed in.', 'error');
    return;
  }

  $('registerModal').classList.add('show');
  $('registerMsg').style.display = 'none';
}

function closeModal(id) {
  const el = $(id);
  if (el) el.classList.remove('show');
}

document.addEventListener('click', e => {
  if (!e.target.closest('.avatar-dropdown')) closeDropdown();
});

// ===================== PRODUCTS / CATEGORIES =====================
function getCategoryName(categoryId) {
  const category = allCategories.find(c => c.id === categoryId);
  return category ? category.name : 'Uncategorized';
}

function productCardHTML(product) {
  const image = product.image_url && product.image_url.trim()
    ? `<img class="product-card-img" src="${product.image_url}" alt="${safeText(product.name)}" loading="lazy" onerror="handleImageError(this, '${safeJS(product.name)}')">`
    : `<img class="product-card-img" src="${fallbackImage(product.name)}" alt="${safeText(product.name)}">`;

  const stockLabel = product.stock_quantity === 0
    ? 'Out of Stock'
    : product.stock_quantity <= 10
      ? 'Low Stock'
      : 'In Stock';

  const stockClass = product.stock_quantity === 0
    ? 'out-of-stock'
    : product.stock_quantity <= 10
      ? 'low-stock'
      : 'in-stock';

  return `
    <div class="product-card" onclick="showProductDetail(${product.id})">
      ${image}
      <div class="product-card-body">
        <div class="category-tag">${safeText(getCategoryName(product.category_id))}</div>
        <h3>${safeText(product.name)}</h3>
        <div class="price">$${Number(product.price).toFixed(2)}</div>
        <span class="stock-badge ${stockClass}">${stockLabel}</span>
      </div>
    </div>
  `;
}

async function loadProductsAndCategories() {
  const [products, categories] = await Promise.all([
    API.get('/products/', false),
    API.get('/categories/', false)
  ]);

  allProducts = products;
  allCategories = categories;

  return { products, categories };
}

async function loadHome() {
  try {
    const { products, categories } = await loadProductsAndCategories();

    const catGrid = $('homeCategories');
    const prodGrid = $('homeProducts');

    if (catGrid) {
      catGrid.innerHTML = categories.slice(0, 6).map(category => `
        <div class="category-card" onclick="filterByCategory(${category.id})">
          <div class="cat-icon">${safeText(category.icon || category.name.charAt(0))}</div>
          <div class="cat-info">
            <h4>${safeText(category.name)}</h4>
            <span>${safeText(category.description || '')}</span>
          </div>
        </div>
      `).join('');
    }

    if (prodGrid) {
      prodGrid.innerHTML = products.slice(0, 8).map(productCardHTML).join('');
    }
  } catch (err) {
    if ($('homeCategories')) $('homeCategories').innerHTML = '<p>Failed to load categories.</p>';
    if ($('homeProducts')) $('homeProducts').innerHTML = '<p>Failed to load products.</p>';
  }
}

async function loadShop() {
  try {
    const { categories } = await loadProductsAndCategories();

    const select = $('shopCategory');
    if (select) {
      select.innerHTML = '<option value="">All Categories</option>' +
        categories.map(c => `<option value="${c.id}">${safeText(c.name)}</option>`).join('');
    }

    renderShopProducts();
  } catch (err) {
    if ($('shopProducts')) $('shopProducts').innerHTML = `<p>${safeText(err.message)}</p>`;
  }
}

function renderShopProducts() {
  const keyword = ($('shopSearch')?.value || '').toLowerCase();
  const catId = $('shopCategory')?.value || '';
  const minPrice = parseFloat($('shopMinPrice')?.value || '');
  const maxPrice = parseFloat($('shopMaxPrice')?.value || '');
  const stock = $('shopStock')?.value || '';

  let filtered = allProducts.filter(product => {
    const name = (product.name || '').toLowerCase();
    const desc = (product.description || '').toLowerCase();

    if (keyword && !name.includes(keyword) && !desc.includes(keyword)) return false;
    if (catId && product.category_id !== Number(catId)) return false;
    if (!Number.isNaN(minPrice) && product.price < minPrice) return false;
    if (!Number.isNaN(maxPrice) && product.price > maxPrice) return false;

    if (stock === 'in_stock' && product.stock_quantity <= 10) return false;
    if (stock === 'low_stock' && (product.stock_quantity <= 0 || product.stock_quantity > 10)) return false;
    if (stock === 'out_of_stock' && product.stock_quantity !== 0) return false;

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  if (shopPage > totalPages) shopPage = totalPages;

  const start = (shopPage - 1) * PAGE_SIZE;
  const items = filtered.slice(start, start + PAGE_SIZE);

  if ($('shopCount')) {
    $('shopCount').textContent = `${filtered.length} product${filtered.length === 1 ? '' : 's'}`;
  }

  const grid = $('shopProducts');
  const pagination = $('shopPagination');

  if (!grid) return;

  if (items.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><p>No products match your filters.</p></div>';
    if (pagination) pagination.innerHTML = '';
    return;
  }

  grid.innerHTML = items.map(productCardHTML).join('');

  if (pagination) {
    pagination.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;gap:1rem;margin-top:1.5rem;font-size:.85rem">
        <button class="btn btn-sm btn-outline" style="color:var(--text);border-color:var(--border)" onclick="prevShopPage()" ${shopPage <= 1 ? 'disabled' : ''}>Prev</button>
        <span>Page ${shopPage} of ${totalPages}</span>
        <button class="btn btn-sm btn-outline" style="color:var(--text);border-color:var(--border)" onclick="nextShopPage(${totalPages})" ${shopPage >= totalPages ? 'disabled' : ''}>Next</button>
      </div>
    `;
  }
}

function prevShopPage() {
  if (shopPage > 1) {
    shopPage--;
    renderShopProducts();
  }
}

function nextShopPage(totalPages) {
  if (shopPage < totalPages) {
    shopPage++;
    renderShopProducts();
  }
}

function filterShop() {
  shopPage = 1;
  renderShopProducts();
}

function resetShopFilters() {
  if ($('shopSearch')) $('shopSearch').value = '';
  if ($('shopCategory')) $('shopCategory').value = '';
  if ($('shopMinPrice')) $('shopMinPrice').value = '';
  if ($('shopMaxPrice')) $('shopMaxPrice').value = '';
  if ($('shopStock')) $('shopStock').value = '';

  shopPage = 1;
  renderShopProducts();
}

function filterByCategory(id) {
  navigate('shop');

  setTimeout(() => {
    if ($('shopCategory')) $('shopCategory').value = id;
    filterShop();
  }, 150);
}

// ===================== PRODUCT DETAILS / REVIEWS =====================
async function showProductDetail(productId) {
  try {
    const product = await API.get(`/products/${productId}`, false);

    const image = product.image_url && product.image_url.trim()
      ? `<img class="product-detail-img" src="${product.image_url}" alt="${safeText(product.name)}" onerror="handleImageError(this, '${safeJS(product.name)}')">`
      : `<img class="product-detail-img" src="${fallbackImage(product.name)}" alt="${safeText(product.name)}">`;

    const stockLabel = product.stock_quantity === 0
      ? 'Out of Stock'
      : product.stock_quantity <= 10
        ? `Low Stock (${product.stock_quantity} available)`
        : `In Stock (${product.stock_quantity} available)`;

    const stockClass = product.stock_quantity === 0
      ? 'out-of-stock'
      : product.stock_quantity <= 10
        ? 'low-stock'
        : 'in-stock';

    $('productDetailContent').innerHTML = `
      <div class="modal-header">
        <h2>${safeText(product.name)}</h2>
        <button class="modal-close" onclick="closeModal('productDetailModal')">&times;</button>
      </div>

      <div class="product-detail">
        <div>${image}</div>

        <div class="product-detail-info">
          <div class="detail-category">${safeText(getCategoryName(product.category_id))}</div>
          <h2>${safeText(product.name)}</h2>
          <div class="detail-price">$${Number(product.price).toFixed(2)}</div>
          <p class="detail-desc">${safeText(product.description || 'No description available.')}</p>

          <div class="detail-stock">
            <span class="stock-badge ${stockClass}">${stockLabel}</span>
          </div>

          ${product.stock_quantity > 0 && !isAdmin() ? `
            <div class="qty-selector">
              <button onclick="changeQty(-1)">-</button>
              <span id="detailQty">1</span>
              <button onclick="changeQty(1, ${product.stock_quantity})">+</button>
            </div>

            <button class="btn btn-primary btn-full" onclick="addToCart(${product.id}, '${safeJS(product.name)}', ${product.price}, ${product.stock_quantity})">
              Add to Cart
            </button>
          ` : `
            <button class="btn btn-full btn-outline" disabled style="color:var(--text-muted);border-color:var(--border)">
              ${isAdmin() ? 'Admin View Only' : 'Unavailable'}
            </button>
          `}
        </div>
      </div>

      <div style="margin-top:1.5rem;border-top:1px solid var(--border);padding-top:1rem">
        <h3 style="font-size:1rem;margin-bottom:.75rem">Reviews</h3>
        <div id="reviewsList">Loading reviews...</div>

        ${currentUser && !isAdmin() ? `
          <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border)">
            <h4 style="font-size:.9rem;margin-bottom:.5rem">Write a Review</h4>

            <div class="form-group">
              <label>Rating</label>
              <select class="form-input" id="reviewRating" style="width:auto">
                <option value="5">★★★★★</option>
                <option value="4">★★★★☆</option>
                <option value="3">★★★☆☆</option>
                <option value="2">★★☆☆☆</option>
                <option value="1">★☆☆☆☆</option>
              </select>
            </div>

            <div class="form-group">
              <label>Comment</label>
              <textarea class="form-input" id="reviewComment" rows="2" placeholder="Share your thoughts..."></textarea>
            </div>

            <button class="btn btn-primary btn-sm" onclick="submitReview(${product.id})">Submit Review</button>
            <div id="reviewMsg" class="form-msg" style="margin-top:.5rem"></div>
          </div>
        ` : '<p style="font-size:.85rem;color:var(--text-muted)">Sign in as a customer to leave a review.</p>'}
      </div>
    `;

    window._detailQty = 1;

    $('productDetailModal').classList.add('show');

    loadReviews(product.id);
  } catch (err) {
    toast(err.message, 'error');
  }
}

function changeQty(delta, maxStock = 999999) {
  window._detailQty = Math.max(1, Math.min(maxStock, (window._detailQty || 1) + delta));

  if ($('detailQty')) $('detailQty').textContent = window._detailQty;
}

function addToCart(id, name, price, maxStock) {
  if (isAdmin()) {
    toast('Admins cannot use the cart.', 'error');
    return;
  }

  const qty = window._detailQty || 1;

  if (qty > maxStock) {
    toast('Not enough stock available.', 'error');
    return;
  }

  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.qty = Math.min(existing.qty + qty, maxStock);
  } else {
    cart.push({ id, name, price, qty });
  }

  saveCart();
  updateCartButton();

  closeModal('productDetailModal');

  toast(`${name} added to cart.`, 'success');
}

async function loadReviews(productId) {
  const list = $('reviewsList');
  if (!list) return;

  try {
    const reviews = await API.get(`/products/${productId}/reviews`, false);

    if (!reviews.length) {
      list.innerHTML = '<p style="font-size:.85rem;color:var(--text-muted)">No reviews yet.</p>';
      return;
    }

    list.innerHTML = reviews.map(review => `
      <div style="padding:.6rem 0;border-bottom:1px solid var(--border);font-size:.85rem">
        <div style="color:var(--accent)">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
        ${review.comment ? `<p style="margin-top:.2rem">${safeText(review.comment)}</p>` : ''}
        <span style="font-size:.75rem;color:var(--text-muted)">
          User #${review.user_id} &middot; ${new Date(review.created_at).toLocaleDateString()}
        </span>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = '<p style="font-size:.85rem;color:var(--text-muted)">Could not load reviews.</p>';
  }
}

async function submitReview(productId) {
  const msg = $('reviewMsg');

  try {
    await API.post(`/products/${productId}/reviews`, {
      rating: Number($('reviewRating').value),
      comment: $('reviewComment').value.trim() || null
    });

    $('reviewComment').value = '';

    msg.textContent = 'Review submitted.';
    msg.className = 'form-msg success';
    msg.style.display = 'block';

    loadReviews(productId);
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'form-msg error';
    msg.style.display = 'block';
  }
}

// ===================== CART / ORDER FLOW =====================
function showOrderModal() {
  if (isAdmin()) {
    toast('Admins oversee the system; cart is for customers only.', 'error');
    return;
  }

  if (!cart.length) {
    toast('Cart is empty.', 'error');
    return;
  }

  if (!currentUser) {
    showLoginModal();
    toast('Sign in to place an order.', 'error');
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  $('orderModalContent').innerHTML = `
    <div class="order-summary">
      ${cart.map(item => `
        <div class="order-summary-item">
          <span>${safeText(item.name)} x${item.qty}</span>
          <span>$${(item.price * item.qty).toFixed(2)}</span>
        </div>
      `).join('')}

      <div class="order-summary-total">
        <span>Total</span>
        <span>$${total.toFixed(2)}</span>
      </div>
    </div>

    <div class="form-group">
      <label>Payment Method</label>
      <select class="form-input" id="orderPayment">
        <option value="cash_on_delivery">Cash on Delivery</option>
        <option value="mobile_money">Mobile Money</option>
        <option value="bank_transfer">Bank Transfer</option>
        <option value="card_payment">Card Payment</option>
      </select>
    </div>

    <fieldset style="border:1px solid var(--border);border-radius:var(--radius);padding:1rem;margin-bottom:1rem">
      <legend style="font-size:.85rem;font-weight:600;color:var(--text-muted);padding:0 .35rem">Shipping Address</legend>

      <div class="form-group">
        <label>Street Address</label>
        <textarea class="form-input" id="orderAddress" rows="2" placeholder="45 Wilkinson Road"></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>City</label>
          <input type="text" class="form-input" id="orderCity" placeholder="Freetown">
        </div>

        <div class="form-group">
          <label>Phone</label>
          <input type="text" class="form-input" id="orderPhone" placeholder="090215788">
        </div>
      </div>
    </fieldset>

    <div class="form-actions">
      <button class="btn btn-outline" style="color:var(--text);border-color:var(--border)" onclick="closeModal('orderModal')">Cancel</button>
      <button class="btn btn-outline" style="color:var(--text);border-color:var(--border)" onclick="checkOrderRisk()">Check Risk</button>
      <button class="btn btn-primary" onclick="placeOrder()">Place Order</button>
    </div>

    <div id="orderRiskResult" style="margin-top:1rem"></div>
  `;

  $('orderModal').classList.add('show');
}

async function checkOrderRisk() {
  const resultArea = $('orderRiskResult');

  try {
    const items = cart.map(item => ({
      product_id: item.id,
      quantity: item.qty
    }));

    const result = await API.post('/orders/check-risk', {
      items,
      payment_method: $('orderPayment')?.value || 'cash_on_delivery'
    });

    if (result.is_risky) {
      resultArea.innerHTML = `
        <div class="form-msg error" style="display:block">
          <strong>Risk Detected:</strong><br>
          ${result.risk_items.map(item => `${safeText(item.product_name)}: ${safeText(item.message)}`).join('<br>')}
        </div>
      `;
    } else {
      resultArea.innerHTML = `
        <div class="form-msg success" style="display:block">
          No major stock risk detected.
        </div>
      `;
    }
  } catch (err) {
    resultArea.innerHTML = `
      <div class="form-msg error" style="display:block">${safeText(err.message)}</div>
    `;
  }
}

async function placeOrder() {
  try {
    const items = cart.map(item => ({
      product_id: item.id,
      quantity: item.qty
    }));

    await API.post('/orders/', {
      items,
      payment_method: $('orderPayment').value,
      shipping_address: $('orderAddress').value.trim() || null,
      city: $('orderCity').value.trim() || null,
      phone: $('orderPhone').value.trim() || null
    });

    cart = [];
    saveCart();
    updateCartButton();

    closeModal('orderModal');

    toast('Order placed successfully.', 'success');

    navigate('orders');
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ===================== CONTACT =====================
async function submitContact(event) {
  event.preventDefault();

  const form = event.target;
  const msg = $('contactMsg');

  msg.style.display = 'none';
  msg.className = 'form-msg';

  try {
    await API.post('/contact/', {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      subject: form.subject.value.trim(),
      message: form.message.value.trim()
    }, false);

    form.reset();

    msg.textContent = 'Message sent successfully.';
    msg.className = 'form-msg success';
    msg.style.display = 'block';
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'form-msg error';
    msg.style.display = 'block';
  }
}

// ===================== ORDERS =====================
function orderCardHTML(order, customerView = true) {
  const addressParts = [];

  if (order.shipping_address) addressParts.push(order.shipping_address);
  if (order.city) addressParts.push(order.city);
  if (order.phone) addressParts.push(`Phone: ${order.phone}`);

  const canCustomerCancel =
    customerView &&
    order.status === 'pending';

  const canAdminMarkPaid =
    !customerView &&
    order.status === 'pending' &&
    order.payment_status !== 'paid';

  const canAdminCancel =
    !customerView &&
    order.status === 'pending';

  return `
    <div class="order-card">
      <div class="order-header">
        <div>
          <span class="order-id">Order #${order.id}</span>
          ${customerView ? '' : ` by User #${order.user_id}`}
          <span class="order-date">${new Date(order.created_at).toLocaleDateString()}</span>
        </div>

        <div style="display:flex;gap:.5rem;align-items:center">
          <span class="status-badge ${order.status}">${safeText(order.status)}</span>
          <span class="status-badge ${order.payment_status}">${safeText(order.payment_status)}</span>
        </div>
      </div>

      ${addressParts.length ? `
        <div style="font-size:.85rem;color:var(--text-muted);margin-bottom:.5rem">
          ${safeText(addressParts.join(' · '))}
        </div>
      ` : ''}

      <div class="order-items">
        ${order.order_items.map(item => `
          <div class="order-item">
            <span>Product #${item.product_id} x${item.quantity}</span>
            <span>$${Number(item.subtotal).toFixed(2)}</span>
          </div>
        `).join('')}

        <div class="order-total">
          <span>Total (${safeText(order.payment_method.replace(/_/g, ' '))})</span>
          <span>$${Number(order.total_amount).toFixed(2)}</span>
        </div>
      </div>

      ${canCustomerCancel ? `
        <div style="margin-top:.75rem">
          <button class="btn btn-sm btn-outline" style="color:var(--danger);border-color:var(--danger)" onclick="cancelMyOrder(${order.id})">
            Cancel Order
          </button>
        </div>
      ` : ''}

      ${!customerView ? `
        <div style="margin-top:.9rem;display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">
          ${canAdminMarkPaid ? `
            <button class="btn btn-sm btn-primary" onclick="markOrderPaid(${order.id})">
              Mark Paid
            </button>
          ` : ''}

          ${canAdminCancel ? `
            <button class="btn btn-sm btn-outline" style="color:var(--danger);border-color:var(--danger)" onclick="adminCancelOrder(${order.id})">
              Cancel Order
            </button>
          ` : ''}

          <label style="font-size:.85rem;font-weight:600;margin-left:.4rem">Manual Status:</label>

          <select class="form-input" style="width:auto;padding:.35rem .6rem;font-size:.85rem" onchange="updateOrderStatus(${order.id}, this.value)" ${order.status === 'completed' || order.status === 'cancelled' ? 'disabled' : ''}>
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </div>
      ` : ''}
    </div>
  `;
}

async function loadMyOrders() {
  if (!currentUser) {
    if ($('ordersList')) $('ordersList').innerHTML = '';
    if ($('ordersEmpty')) $('ordersEmpty').style.display = 'block';
    return;
  }

  if (isAdmin()) {
    navigate('adminOrders');
    return;
  }

  try {
    const params = new URLSearchParams();

    const status = $('myOrderStatus')?.value || '';
    const payStatus = $('myOrderPayStatus')?.value || '';

    if (status) params.set('status', status);
    if (payStatus) params.set('payment_status', payStatus);

    const query = params.toString();
    const orders = await API.get('/orders/my-orders' + (query ? `?${query}` : ''));

    const list = $('ordersList');
    const empty = $('ordersEmpty');

    if (!orders.length) {
      list.innerHTML = '';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    list.innerHTML = orders.map(order => orderCardHTML(order, true)).join('');
  } catch (err) {
    $('ordersList').innerHTML = `<p>${safeText(err.message)}</p>`;
  }
}

async function cancelMyOrder(orderId) {
  if (!confirm('Cancel this order? Stock will be restored.')) return;

  try {
    await API.put(`/orders/${orderId}/cancel`, {});
    toast('Order cancelled.', 'success');
    loadMyOrders();
    loadShop();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ===================== ADMIN DASHBOARD =====================
async function loadDashboard() {
  if (!isAdmin()) return;

  try {
    const [health, recs, sales] = await Promise.all([
      API.get('/products/inventory/health'),
      API.get('/products/restock-recommendations'),
      API.get('/orders/sales/summary')
    ]);

    $('dashStats').innerHTML = `
      <div class="stat-card"><div class="stat-value">${health.total_products}</div><div class="stat-label">Total Products</div></div>
      <div class="stat-card"><div class="stat-value">${health.total_categories}</div><div class="stat-label">Categories</div></div>
      <div class="stat-card"><div class="stat-value">${health.total_orders}</div><div class="stat-label">Orders</div></div>
      <div class="stat-card"><div class="stat-value">${health.low_stock_products}</div><div class="stat-label">Low Stock</div></div>
      <div class="stat-card"><div class="stat-value">${health.out_of_stock_products}</div><div class="stat-label">Out of Stock</div></div>
      <div class="stat-card"><div class="stat-value">$${Number(health.total_inventory_value).toFixed(0)}</div><div class="stat-label">Inventory Value</div></div>
    `;

    $('inventoryHealth').innerHTML = `<p>${safeText(health.message)}</p>`;

    $('restockRecs').innerHTML = recs.length
      ? recs.map(r => `
        <div style="display:flex;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid var(--border);font-size:.85rem">
          <span style="font-weight:600">${safeText(r.product_name)}</span>
          <span>Stock: ${r.current_stock} → Restock: ${r.recommended_restock_quantity}</span>
        </div>
      `).join('')
      : '<p style="color:var(--text-muted)">All products are well-stocked.</p>';

    $('salesSummary').innerHTML = `
      <div class="stats-grid" style="margin:0">
        <div class="stat-card" style="box-shadow:none;border:none;background:var(--bg-alt)">
          <div class="stat-value">${sales.total_orders}</div>
          <div class="stat-label">All Orders</div>
        </div>

        <div class="stat-card" style="box-shadow:none;border:none;background:var(--bg-alt)">
          <div class="stat-value">${sales.pending_orders}</div>
          <div class="stat-label">Pending</div>
        </div>

        <div class="stat-card" style="box-shadow:none;border:none;background:var(--bg-alt)">
          <div class="stat-value">${sales.completed_orders}</div>
          <div class="stat-label">Completed</div>
        </div>

        <div class="stat-card" style="box-shadow:none;border:none;background:var(--bg-alt)">
          <div class="stat-value">$${Number(sales.total_revenue).toFixed(2)}</div>
          <div class="stat-label">Revenue</div>
        </div>
      </div>

      <p>${safeText(sales.message)}</p>
    `;
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ===================== ADMIN PRODUCTS =====================
async function loadAdminProducts() {
  if (!isAdmin()) return;

  try {
    await loadProductsAndCategories();

    $('adminProductsTable').innerHTML = `
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${allProducts.map(product => `
            <tr>
              <td>${product.id}</td>
              <td>${safeText(product.name)}</td>
              <td>$${Number(product.price).toFixed(2)}</td>
              <td>
                <span class="stock-badge ${product.stock_quantity === 0 ? 'out-of-stock' : product.stock_quantity <= 10 ? 'low-stock' : 'in-stock'}">
                  ${product.stock_quantity}
                </span>
              </td>
              <td>${safeText(getCategoryName(product.category_id))}</td>
              <td>
                <div class="table-actions">
                  <button class="edit-btn" onclick="editProduct(${product.id})">Edit</button>
                  <button class="delete-btn" onclick="deleteProduct(${product.id})">Delete</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="padding:1rem;border-top:1px solid var(--border)">
        <button class="btn btn-sm btn-outline" style="color:var(--text);border-color:var(--border)" onclick="showBulkStockUpdate()">
          Bulk Stock Update
        </button>
      </div>
    `;
  } catch (err) {
    $('adminProductsTable').innerHTML = `<p>${safeText(err.message)}</p>`;
  }
}

function showBulkStockUpdate() {
  const wrapper = $('adminProductsTable');
  const existing = wrapper.querySelector('.bulk-stock-panel');

  if (existing) {
    existing.remove();
    return;
  }

  const panel = document.createElement('div');
  panel.className = 'bulk-stock-panel';
  panel.style.cssText = 'padding:1rem;border-top:1px solid var(--border);background:var(--bg-alt)';

  panel.innerHTML = `
    <h4 style="font-size:.9rem;margin-bottom:.75rem">Bulk Stock Update</h4>

    <div id="bulkStockFields">
      ${allProducts.map(product => `
        <div style="display:flex;gap:.5rem;align-items:center;margin-bottom:.35rem;font-size:.85rem">
          <span style="min-width:170px">${safeText(product.name)}</span>
          <input type="number" class="form-input" style="width:90px;padding:.3rem .5rem" data-pid="${product.id}" value="${product.stock_quantity}">
        </div>
      `).join('')}
    </div>

    <div class="form-actions" style="margin-top:.75rem">
      <button class="btn btn-sm btn-outline" style="color:var(--text);border-color:var(--border)" onclick="document.querySelector('.bulk-stock-panel').remove()">Cancel</button>
      <button class="btn btn-sm btn-primary" onclick="applyBulkStockUpdate()">Apply</button>
    </div>

    <div id="bulkStockMsg" class="form-msg" style="margin-top:.5rem"></div>
  `;

  wrapper.appendChild(panel);
}

async function applyBulkStockUpdate() {
  const msg = $('bulkStockMsg');

  try {
    const items = [...document.querySelectorAll('#bulkStockFields input')].map(input => ({
      product_id: Number(input.dataset.pid),
      stock_quantity: Number(input.value)
    }));

    await API.post('/products/bulk-stock-update', { items });

    toast('Stock updated.', 'success');

    document.querySelector('.bulk-stock-panel')?.remove();

    loadAdminProducts();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'form-msg error';
    msg.style.display = 'block';
  }
}

function showProductModal(product = null) {
  const isEdit = !!product;

  $('productFormTitle').textContent = isEdit ? 'Edit Product' : 'Add Product';
  $('pfId').value = product ? product.id : '';
  $('pfName').value = product ? product.name : '';
  $('pfDesc').value = product ? product.description || '' : '';
  $('pfPrice').value = product ? product.price : '';
  $('pfStock').value = product ? product.stock_quantity : '';
  $('pfImage').value = product ? product.image_url || '' : '';

  $('pfCategory').innerHTML = allCategories.map(category => `
    <option value="${category.id}" ${product && product.category_id === category.id ? 'selected' : ''}>
      ${safeText(category.name)}
    </option>
  `).join('');

  $('pfMsg').style.display = 'none';
  $('productFormModal').classList.add('show');
}

function editProduct(id) {
  const product = allProducts.find(p => p.id === id);
  if (product) showProductModal(product);
}

function uploadImage() {
  $('pfImageFile').click();
}

async function handleImageUpload(input) {
  const file = input.files[0];
  if (!file) return;

  try {
    const form = new FormData();
    form.append('file', file);

    const res = await fetch('/api/upload/image', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }

    const data = await res.json();

    $('pfImage').value = data.url;

    toast('Image uploaded.', 'success');
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function saveProduct(event) {
  event.preventDefault();

  const id = $('pfId').value;

  const data = {
    name: $('pfName').value.trim(),
    description: $('pfDesc').value.trim() || null,
    price: Number($('pfPrice').value),
    stock_quantity: Number($('pfStock').value),
    category_id: Number($('pfCategory').value),
    image_url: $('pfImage').value.trim() || null
  };

  const msg = $('pfMsg');
  msg.style.display = 'none';
  msg.className = 'form-msg';

  try {
    if (id) {
      await API.put(`/products/${id}`, data);
      toast('Product updated.', 'success');
    } else {
      await API.post('/products/', data);
      toast('Product created.', 'success');
    }

    closeModal('productFormModal');
    loadAdminProducts();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'form-msg error';
    msg.style.display = 'block';
  }
}

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;

  try {
    await API.del(`/products/${id}`);
    toast('Product deleted.', 'success');
    loadAdminProducts();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ===================== ADMIN CATEGORIES =====================
async function loadAdminCategories() {
  if (!isAdmin()) return;

  try {
    allCategories = await API.get('/categories/', false);

    $('adminCategoriesTable').innerHTML = `
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${allCategories.map(category => `
            <tr>
              <td>${category.id}</td>
              <td>${safeText(category.name)}</td>
              <td>${safeText(category.description || '-')}</td>
              <td>
                <div class="table-actions">
                  <button class="edit-btn" onclick="editCategory(${category.id})">Edit</button>
                  <button class="delete-btn" onclick="deleteCategory(${category.id})">Delete</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    $('adminCategoriesTable').innerHTML = `<p>${safeText(err.message)}</p>`;
  }
}

function showCategoryModal(category = null) {
  $('categoryFormTitle').textContent = category ? 'Edit Category' : 'Add Category';
  $('cfId').value = category ? category.id : '';
  $('cfName').value = category ? category.name : '';
  $('cfDesc').value = category ? category.description || '' : '';
  $('cfIcon').value = category ? category.icon || '' : '';
  $('cfMsg').style.display = 'none';

  $('categoryFormModal').classList.add('show');
}

function editCategory(id) {
  const category = allCategories.find(c => c.id === id);
  if (category) showCategoryModal(category);
}

async function saveCategory(event) {
  event.preventDefault();

  const id = $('cfId').value;

  const data = {
    name: $('cfName').value.trim(),
    description: $('cfDesc').value.trim() || null,
    icon: $('cfIcon').value.trim() || null
  };

  const msg = $('cfMsg');
  msg.style.display = 'none';
  msg.className = 'form-msg';

  try {
    if (id) {
      await API.put(`/categories/${id}`, data);
      toast('Category updated.', 'success');
    } else {
      await API.post('/categories/', data);
      toast('Category created.', 'success');
    }

    closeModal('categoryFormModal');

    loadAdminCategories();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'form-msg error';
    msg.style.display = 'block';
  }
}

async function deleteCategory(id) {
  if (!confirm('Delete this category?')) return;

  try {
    await API.del(`/categories/${id}`);
    toast('Category deleted.', 'success');
    loadAdminCategories();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ===================== ADMIN ORDERS =====================
async function loadAdminOrders() {
  if (!isAdmin()) return;

  try {
    const params = new URLSearchParams();

    const status = $('adminOrderStatus')?.value || '';
    const payStatus = $('adminOrderPayStatus')?.value || '';
    const payment = $('adminOrderPayment')?.value || '';

    if (status) params.set('status', status);
    if (payStatus) params.set('payment_status', payStatus);
    if (payment) params.set('payment_method', payment);

    const query = params.toString();

    const orders = await API.get('/orders/' + (query ? `?${query}` : ''));

    const list = $('adminOrdersList');

    const topActions = `
      <div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;margin-bottom:1rem">
        <button type="button" class="btn btn-primary btn-sm" id="autoCancelBtn">
          Auto-cancel Unpaid Orders
        </button>

        <span style="font-size:.85rem;color:var(--text-muted)">
          Choose 1 minute for testing or 30 minutes for real use.
        </span>
      </div>
    `;

    if (!orders.length) {
      list.innerHTML = `
        ${topActions}
        <div class="empty-state"><p>No orders yet.</p></div>
      `;
    } else {
      list.innerHTML = `
        ${topActions}
        ${orders.map(order => orderCardHTML(order, false)).join('')}
      `;
    }

    const autoCancelBtn = $('autoCancelBtn');
    if (autoCancelBtn) {
      autoCancelBtn.addEventListener('click', autoCancelUnpaidOrders);
    }
  } catch (err) {
    $('adminOrdersList').innerHTML = `<p>${safeText(err.message)}</p>`;
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    await API.put(`/orders/${orderId}/status`, { status });
    toast('Order status updated.', 'success');
    loadAdminOrders();
    loadDashboard();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function markOrderPaid(orderId) {
  if (!confirm(`Mark Order #${orderId} as paid and completed?`)) return;

  try {
    await API.put(`/orders/${orderId}/mark-paid`, {});
    toast('Order marked as paid and completed.', 'success');

    loadAdminOrders();
    loadDashboard();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function adminCancelOrder(orderId) {
  if (!confirm(`Cancel Order #${orderId}? Stock will be restored.`)) return;

  try {
    await API.put(`/orders/${orderId}/status`, {
      status: 'cancelled'
    });

    toast('Order cancelled and stock restored.', 'success');

    loadAdminOrders();
    loadDashboard();
    loadShop();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function autoCancelUnpaidOrders() {
  const minutesInput = prompt(
    'Cancel unpaid pending orders older than how many minutes?\n\nUse 1 for testing.\nUse 30 for real system use.',
    '1'
  );

  if (minutesInput === null) return;

  const timeoutMinutes = Number(minutesInput);

  if (!Number.isInteger(timeoutMinutes) || timeoutMinutes < 1 || timeoutMinutes > 1440) {
    toast('Enter a valid number between 1 and 1440 minutes.', 'error');
    return;
  }

  if (!confirm(`Auto-cancel unpaid pending orders older than ${timeoutMinutes} minute(s)?`)) {
    return;
  }

  try {
    const result = await API.post(`/orders/auto-cancel-unpaid?timeout_minutes=${timeoutMinutes}`, {});

    toast(result.message || 'Unpaid orders checked.', 'success');

    await loadAdminOrders();
    await loadDashboard();
    await loadShop();
  } catch (err) {
    console.error(err);
    toast(err.message || 'Auto-cancel failed.', 'error');
    alert(err.message || 'Auto-cancel failed.');
  }
}

// ===================== ADMIN USERS =====================
async function loadAdminUsers() {
  if (!isAdmin()) return;

  try {
    const users = await API.get('/users/');

    $('adminUsersTable').innerHTML = `
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Username</th>
            <th>Role</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${users.map(user => `
            <tr>
              <td>${user.id}</td>
              <td>${safeText(user.full_name)}</td>
              <td>${safeText(user.email)}</td>
              <td>${safeText(user.username)}</td>
              <td><span class="status-badge ${user.role === 'admin' ? 'completed' : 'pending'}">${safeText(user.role)}</span></td>
              <td>${user.is_active ? 'Yes' : 'No'}</td>
              <td>
                ${user.id !== currentUser.id ? `
                  <div class="table-actions">
                    <button class="delete-btn" onclick="deleteUser(${user.id})">Delete</button>
                  </div>
                ` : '-'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    $('adminUsersTable').innerHTML = `<p>${safeText(err.message)}</p>`;
  }
}

async function deleteUser(id) {
  if (!confirm('Delete this user?')) return;

  try {
    await API.del(`/users/${id}`);
    toast('User deleted.', 'success');
    loadAdminUsers();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ===================== ADMIN MESSAGES =====================
async function loadAdminMessages() {
  if (!isAdmin()) return;

  try {
    const messages = await API.get('/contact/');

    const list = $('adminMessagesList');

    if (!messages.length) {
      list.innerHTML = '<div class="empty-state"><p>No messages yet.</p></div>';
      return;
    }

    list.innerHTML = messages.map(message => `
      <div class="message-card ${message.is_read ? '' : 'unread'}">
        <div class="message-content">
          <h4>${safeText(message.name)}</h4>
          <div class="msg-meta">${safeText(message.email)} &middot; ${new Date(message.created_at).toLocaleString()}</div>
          <div class="msg-subject">${safeText(message.subject)}</div>
          <div class="msg-body">${safeText(message.message)}</div>
        </div>

        <div class="message-actions">
          ${message.is_read
            ? '<span style="font-size:.75rem;color:var(--text-muted)">Read</span>'
            : `<button class="btn btn-sm btn-outline" style="color:var(--text);border-color:var(--border)" onclick="markMessageRead(${message.id})">Mark Read</button>`
          }
        </div>
      </div>
    `).join('');
  } catch (err) {
    $('adminMessagesList').innerHTML = `<p>${safeText(err.message)}</p>`;
  }
}

async function markMessageRead(id) {
  try {
    await API.put(`/contact/${id}/read`, {});
    toast('Message marked as read.', 'success');
    loadAdminMessages();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ===================== PROFILE =====================
function loadProfile() {
  if (!currentUser) {
    navigate('home');
    return;
  }

  const user = currentUser;

  $('profileCard').innerHTML = `
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem">
      <div class="avatar-icon" style="width:56px;height:56px;font-size:1.5rem;background:var(--primary)">
        ${(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
      </div>

      <div>
        <h2 style="font-size:1.25rem">${safeText(user.full_name)}</h2>
        <p style="color:var(--text-muted);font-size:.9rem">${safeText(user.role)}</p>
      </div>
    </div>

    <div class="profile-field"><span class="field-label">Username</span><span class="field-value">${safeText(user.username)}</span></div>
    <div class="profile-field"><span class="field-label">Email</span><span class="field-value">${safeText(user.email)}</span></div>
    <div class="profile-field"><span class="field-label">Role</span><span class="field-value">${safeText(user.role)}</span></div>
    <div class="profile-field"><span class="field-label">Active</span><span class="field-value">${user.is_active ? 'Yes' : 'No'}</span></div>
    <div class="profile-field"><span class="field-label">Joined</span><span class="field-value">${new Date(user.created_at).toLocaleDateString()}</span></div>

    <div class="profile-field" style="border-bottom:none;padding-top:1rem">
      <span class="field-label">Dark Mode</span>

      <label class="toggle">
        <input type="checkbox" ${document.body.classList.contains('dark') ? 'checked' : ''} onchange="toggleDarkMode(this.checked)">
        <span class="toggle-slider"></span>
      </label>
    </div>

    <div style="margin-top:1.25rem;display:flex;gap:.75rem">
      <button class="btn btn-primary btn-sm" onclick="showEditProfile()">Edit Profile</button>
      <button class="btn btn-outline btn-sm" style="color:var(--text);border-color:var(--border)" onclick="showChangePassword()">Change Password</button>
    </div>

    <div id="profileEditArea" style="margin-top:1rem;display:none"></div>
  `;
}

function showEditProfile() {
  const area = $('profileEditArea');

  area.style.display = 'block';

  area.innerHTML = `
    <div style="padding:1rem;border:1px solid var(--border);border-radius:var(--radius-lg);margin-top:.5rem">
      <h3 style="font-size:1rem;margin-bottom:1rem">Edit Profile</h3>

      <div class="form-group">
        <label>Full Name</label>
        <input type="text" class="form-input" id="editName" value="${safeText(currentUser.full_name || '')}">
      </div>

      <div class="form-group">
        <label>Email</label>
        <input type="email" class="form-input" id="editEmail" value="${safeText(currentUser.email || '')}">
      </div>

      <div class="form-actions" style="margin-top:.75rem">
        <button class="btn btn-outline btn-sm" style="color:var(--text);border-color:var(--border)" onclick="$('profileEditArea').style.display='none'">Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="saveProfile()">Save</button>
      </div>

      <div id="editProfileMsg" class="form-msg" style="margin-top:.5rem"></div>
    </div>
  `;
}

async function saveProfile() {
  const msg = $('editProfileMsg');

  try {
    const data = {};

    const name = $('editName').value.trim();
    const email = $('editEmail').value.trim();

    if (name && name !== currentUser.full_name) data.full_name = name;
    if (email && email !== currentUser.email) data.email = email;

    if (!Object.keys(data).length) {
      msg.textContent = 'No changes made.';
      msg.className = 'form-msg error';
      msg.style.display = 'block';
      return;
    }

    currentUser = await API.put('/users/me', data);

    toast('Profile updated.', 'success');

    loadProfile();
    updateAuthUI();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'form-msg error';
    msg.style.display = 'block';
  }
}

function showChangePassword() {
  const area = $('profileEditArea');

  area.style.display = 'block';

  area.innerHTML = `
    <div style="padding:1rem;border:1px solid var(--border);border-radius:var(--radius-lg);margin-top:.5rem">
      <h3 style="font-size:1rem;margin-bottom:1rem">Change Password</h3>

      <div class="form-group">
        <label>Current Password</label>
        <input type="password" class="form-input" id="pwCurrent">
      </div>

      <div class="form-group">
        <label>New Password</label>
        <input type="password" class="form-input" id="pwNew">
      </div>

      <div class="form-actions" style="margin-top:.75rem">
        <button class="btn btn-outline btn-sm" style="color:var(--text);border-color:var(--border)" onclick="$('profileEditArea').style.display='none'">Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="savePassword()">Update Password</button>
      </div>

      <div id="pwMsg" class="form-msg" style="margin-top:.5rem"></div>
    </div>
  `;
}

async function savePassword() {
  const msg = $('pwMsg');

  try {
    await API.put('/users/me/password', {
      current_password: $('pwCurrent').value,
      new_password: $('pwNew').value
    });

    msg.textContent = 'Password changed successfully.';
    msg.className = 'form-msg success';
    msg.style.display = 'block';

    toast('Password changed.', 'success');
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'form-msg error';
    msg.style.display = 'block';
  }
}

function toggleDarkMode(enabled) {
  document.body.classList.toggle('dark', enabled);
  localStorage.setItem('darkMode', enabled ? '1' : '0');
}

// ===================== CART VALIDATION =====================
async function validateCartStock() {
  if (!cart.length) return;

  try {
    const products = await API.get('/products/', false);

    const stockMap = {};
    const validIds = new Set();

    products.forEach(product => {
      validIds.add(product.id);
      stockMap[product.id] = product.stock_quantity;
    });

    cart = cart.filter(item => validIds.has(item.id) && stockMap[item.id] > 0);

    cart.forEach(item => {
      if (item.qty > stockMap[item.id]) item.qty = stockMap[item.id];
    });

    saveCart();
    updateCartButton();
  } catch (err) {
    saveCart();
  }
}

// ===================== INITIAL LOAD =====================
document.addEventListener('DOMContentLoaded', async () => {
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', event => {
      if (event.target === modal) modal.classList.remove('show');
    });
  });

  const navAuth = document.querySelector('.nav-auth');

  if (navAuth && !$('cartBtn')) {
    const cartBtn = document.createElement('button');
    cartBtn.type = 'button';
    cartBtn.className = 'btn btn-sm btn-outline';
    cartBtn.id = 'cartBtn';
    cartBtn.textContent = 'Cart (0)';
    cartBtn.style.marginRight = '.5rem';
    cartBtn.addEventListener('click', showOrderModal);

    navAuth.insertBefore(cartBtn, navAuth.firstChild);
  }

  if (localStorage.getItem('darkMode') === '1') {
    document.body.classList.add('dark');
  }

  await loadUser();
  await validateCartStock();

  updateAuthUI();

  const hash = window.location.hash.replace('#', '');
  const startPage = hash || (isAdmin() ? 'dashboard' : 'home');

  navigate(startPage);
});
// ===================== STEP 4: CLEAN ORDER DISPLAY WITH PRODUCT NAMES =====================

function getProductNameById(productId) {
  const product = allProducts.find(p => p.id === productId);
  return product ? product.name : `Product #${productId}`;
}

async function prepareOrderProducts() {
  try {
    if (!allProducts.length || !allCategories.length) {
      await loadProductsAndCategories();
    }
  } catch (err) {
    console.warn('Could not preload product names:', err);
  }
}

function orderCardHTML(order, customerView = true) {
  const addressParts = [];

  if (order.shipping_address) addressParts.push(order.shipping_address);
  if (order.city) addressParts.push(order.city);
  if (order.phone) addressParts.push(`Phone: ${order.phone}`);

  const canCustomerCancel =
    customerView &&
    order.status === 'pending';

  const canAdminMarkPaid =
    !customerView &&
    order.status === 'pending' &&
    order.payment_status !== 'paid';

  const canAdminCancel =
    !customerView &&
    order.status === 'pending';

  return `
    <div class="order-card">
      <div class="order-header">
        <div>
          <span class="order-id">Order #${order.id}</span>
          ${customerView ? '' : ` by User #${order.user_id}`}
          <span class="order-date">${new Date(order.created_at).toLocaleDateString()}</span>
        </div>

        <div style="display:flex;gap:.5rem;align-items:center">
          <span class="status-badge ${order.status}">${safeText(order.status)}</span>
          <span class="status-badge ${order.payment_status}">${safeText(order.payment_status)}</span>
        </div>
      </div>

      ${addressParts.length ? `
        <div style="font-size:.85rem;color:var(--text-muted);margin-bottom:.5rem">
          ${safeText(addressParts.join(' · '))}
        </div>
      ` : ''}

      <div class="order-items">
        ${order.order_items.map(item => `
          <div class="order-item">
            <span>${safeText(getProductNameById(item.product_id))} x${item.quantity}</span>
            <span>$${Number(item.subtotal).toFixed(2)}</span>
          </div>
        `).join('')}

        <div class="order-total">
          <span>Total (${safeText(order.payment_method.replace(/_/g, ' '))})</span>
          <span>$${Number(order.total_amount).toFixed(2)}</span>
        </div>
      </div>

      ${canCustomerCancel ? `
        <div style="margin-top:.75rem">
          <button class="btn btn-sm btn-outline" style="color:var(--danger);border-color:var(--danger)" onclick="cancelMyOrder(${order.id})">
            Cancel Order
          </button>
        </div>
      ` : ''}

      ${!customerView ? `
        <div style="margin-top:.9rem;display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">
          ${canAdminMarkPaid ? `
            <button class="btn btn-sm btn-primary" onclick="markOrderPaid(${order.id})">
              Mark Paid
            </button>
          ` : ''}

          ${canAdminCancel ? `
            <button class="btn btn-sm btn-outline" style="color:var(--danger);border-color:var(--danger)" onclick="adminCancelOrder(${order.id})">
              Cancel Order
            </button>
          ` : ''}

          <label style="font-size:.85rem;font-weight:600;margin-left:.4rem">Manual Status:</label>

          <select class="form-input" style="width:auto;padding:.35rem .6rem;font-size:.85rem" onchange="updateOrderStatus(${order.id}, this.value)" ${order.status === 'completed' || order.status === 'cancelled' ? 'disabled' : ''}>
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </div>
      ` : ''}
    </div>
  `;
}

async function loadMyOrders() {
  if (!currentUser) {
    if ($('ordersList')) $('ordersList').innerHTML = '';
    if ($('ordersEmpty')) $('ordersEmpty').style.display = 'block';
    return;
  }

  if (isAdmin()) {
    navigate('adminOrders');
    return;
  }

  try {
    await prepareOrderProducts();

    const params = new URLSearchParams();

    const status = $('myOrderStatus')?.value || '';
    const payStatus = $('myOrderPayStatus')?.value || '';

    if (status) params.set('status', status);
    if (payStatus) params.set('payment_status', payStatus);

    const query = params.toString();
    const orders = await API.get('/orders/my-orders' + (query ? `?${query}` : ''));

    const list = $('ordersList');
    const empty = $('ordersEmpty');

    if (!orders.length) {
      list.innerHTML = '';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    list.innerHTML = orders.map(order => orderCardHTML(order, true)).join('');
  } catch (err) {
    $('ordersList').innerHTML = `<p>${safeText(err.message)}</p>`;
  }
}

async function loadAdminOrders() {
  if (!isAdmin()) return;

  try {
    await prepareOrderProducts();

    const params = new URLSearchParams();

    const status = $('adminOrderStatus')?.value || '';
    const payStatus = $('adminOrderPayStatus')?.value || '';
    const payment = $('adminOrderPayment')?.value || '';

    if (status) params.set('status', status);
    if (payStatus) params.set('payment_status', payStatus);
    if (payment) params.set('payment_method', payment);

    const query = params.toString();

    const orders = await API.get('/orders/' + (query ? `?${query}` : ''));

    const list = $('adminOrdersList');

    const topActions = `
      <div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;margin-bottom:1rem">
        <button type="button" class="btn btn-primary btn-sm" id="autoCancelBtn">
          Auto-cancel Unpaid Orders
        </button>

        <span style="font-size:.85rem;color:var(--text-muted)">
          Choose 1 minute for testing or 30 minutes for real use.
        </span>
      </div>
    `;

    if (!orders.length) {
      list.innerHTML = `
        ${topActions}
        <div class="empty-state"><p>No orders yet.</p></div>
      `;
    } else {
      list.innerHTML = `
        ${topActions}
        ${orders.map(order => orderCardHTML(order, false)).join('')}
      `;
    }

    const autoCancelBtn = $('autoCancelBtn');
    if (autoCancelBtn) {
      autoCancelBtn.addEventListener('click', autoCancelUnpaidOrders);
    }
  } catch (err) {
    $('adminOrdersList').innerHTML = `<p>${safeText(err.message)}</p>`;
  }
}
// ===================== STEP 5: FIX ADMIN ORDER PAYMENT FILTER =====================

function fixAdminPaymentFilterOptions() {
  const paymentSelect = $('adminOrderPayment');

  if (!paymentSelect) return;

  paymentSelect.innerHTML = `
    <option value="">All Methods</option>
    <option value="cash_on_delivery">Cash on Delivery</option>
    <option value="mobile_money">Mobile Money</option>
    <option value="bank_transfer">Bank Transfer</option>
    <option value="card_payment">Card Payment</option>
  `;
}

async function loadAdminOrders() {
  if (!isAdmin()) return;

  try {
    await prepareOrderProducts();

    fixAdminPaymentFilterOptions();

    const params = new URLSearchParams();

    const status = $('adminOrderStatus')?.value || '';
    const payStatus = $('adminOrderPayStatus')?.value || '';
    const payment = $('adminOrderPayment')?.value || '';

    if (status) params.set('status', status);
    if (payStatus) params.set('payment_status', payStatus);
    if (payment) params.set('payment_method', payment);

    const query = params.toString();

    const orders = await API.get('/orders/' + (query ? `?${query}` : ''));

    const list = $('adminOrdersList');

    const topActions = `
      <div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;margin-bottom:1rem">
        <button type="button" class="btn btn-primary btn-sm" id="autoCancelBtn">
          Auto-cancel Unpaid Orders
        </button>

        <span style="font-size:.85rem;color:var(--text-muted)">
          Choose 1 minute for testing or 30 minutes for real use.
        </span>
      </div>
    `;

    if (!orders.length) {
      list.innerHTML = `
        ${topActions}
        <div class="empty-state"><p>No orders found.</p></div>
      `;
    } else {
      list.innerHTML = `
        ${topActions}
        ${orders.map(order => orderCardHTML(order, false)).join('')}
      `;
    }

    const autoCancelBtn = $('autoCancelBtn');
    if (autoCancelBtn) {
      autoCancelBtn.addEventListener('click', autoCancelUnpaidOrders);
    }
  } catch (err) {
    $('adminOrdersList').innerHTML = `<p>${safeText(err.message)}</p>`;
  }
}
// ===================== STEP 6: ADMIN SYSTEM CONTROL DASHBOARD =====================

async function loadDashboard() {
  if (!isAdmin()) return;

  try {
    const [health, recs, sales, orders] = await Promise.all([
      API.get('/products/inventory/health'),
      API.get('/products/restock-recommendations'),
      API.get('/orders/sales/summary'),
      API.get('/orders/')
    ]);

    const pendingUnpaidOrders = orders.filter(order =>
      order.status === 'pending' && order.payment_status === 'pending'
    );

    const paidCompletedOrders = orders.filter(order =>
      order.status === 'completed' && order.payment_status === 'paid'
    );

    const cancelledOrders = orders.filter(order =>
      order.status === 'cancelled'
    );

    $('dashStats').innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${health.total_products}</div>
        <div class="stat-label">Total Products</div>
      </div>

      <div class="stat-card">
        <div class="stat-value">${health.total_categories}</div>
        <div class="stat-label">Categories</div>
      </div>

      <div class="stat-card">
        <div class="stat-value">${sales.total_orders}</div>
        <div class="stat-label">Total Orders</div>
      </div>

      <div class="stat-card">
        <div class="stat-value">${pendingUnpaidOrders.length}</div>
        <div class="stat-label">Unpaid Pending</div>
      </div>

      <div class="stat-card">
        <div class="stat-value">${health.low_stock_products}</div>
        <div class="stat-label">Low Stock</div>
      </div>

      <div class="stat-card">
        <div class="stat-value">$${Number(sales.total_revenue).toFixed(2)}</div>
        <div class="stat-label">Paid Revenue</div>
      </div>
    `;

    $('inventoryHealth').innerHTML = `
      <p style="margin-bottom:.75rem">${safeText(health.message)}</p>

      <div style="display:grid;gap:.5rem;font-size:.9rem">
        <div style="display:flex;justify-content:space-between">
          <span>Total Inventory Value</span>
          <strong>$${Number(health.total_inventory_value).toFixed(2)}</strong>
        </div>

        <div style="display:flex;justify-content:space-between">
          <span>Low Stock Products</span>
          <strong>${health.low_stock_products}</strong>
        </div>

        <div style="display:flex;justify-content:space-between">
          <span>Out of Stock Products</span>
          <strong>${health.out_of_stock_products}</strong>
        </div>
      </div>

      <div style="margin-top:1rem;display:flex;gap:.5rem;flex-wrap:wrap">
        <button class="btn btn-sm btn-primary" onclick="navigate('adminProducts')">
          Manage Products
        </button>

        <button class="btn btn-sm btn-outline" style="color:var(--text);border-color:var(--border)" onclick="navigate('adminOrders')">
          Review Orders
        </button>
      </div>
    `;

    $('restockRecs').innerHTML = recs.length
      ? `
        <div style="max-height:260px;overflow-y:auto">
          ${recs.map(r => `
            <div style="display:flex;justify-content:space-between;gap:1rem;padding:.6rem 0;border-bottom:1px solid var(--border);font-size:.85rem">
              <span style="font-weight:600">${safeText(r.product_name)}</span>
              <span>Stock: ${r.current_stock} → Restock: ${r.recommended_restock_quantity}</span>
            </div>
          `).join('')}
        </div>
      `
      : '<p style="color:var(--text-muted)">All products are well-stocked.</p>';

    $('salesSummary').innerHTML = `
      <div class="stats-grid" style="margin:0 0 1rem 0">
        <div class="stat-card" style="box-shadow:none;border:none;background:var(--bg-alt)">
          <div class="stat-value">${paidCompletedOrders.length}</div>
          <div class="stat-label">Paid Completed</div>
        </div>

        <div class="stat-card" style="box-shadow:none;border:none;background:var(--bg-alt)">
          <div class="stat-value">${pendingUnpaidOrders.length}</div>
          <div class="stat-label">Needs Attention</div>
        </div>

        <div class="stat-card" style="box-shadow:none;border:none;background:var(--bg-alt)">
          <div class="stat-value">${cancelledOrders.length}</div>
          <div class="stat-label">Cancelled</div>
        </div>

        <div class="stat-card" style="box-shadow:none;border:none;background:var(--bg-alt)">
          <div class="stat-value">$${Number(sales.total_revenue).toFixed(2)}</div>
          <div class="stat-label">Revenue</div>
        </div>
      </div>

      <div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" onclick="autoCancelUnpaidOrders()">
          Auto-cancel Unpaid Orders
        </button>

        <button class="btn btn-outline btn-sm" style="color:var(--text);border-color:var(--border)" onclick="navigate('adminOrders')">
          Open All Orders
        </button>

        <span style="font-size:.85rem;color:var(--text-muted)">
          Admin control area for payment, cancellation, and stock protection.
        </span>
      </div>
    `;
  } catch (err) {
    toast(err.message, 'error');
  }
}
// ===================== STEP 7: ADMIN PRODUCT TABLE WITH IMAGES =====================

async function loadAdminProducts() {
  if (!isAdmin()) return;

  try {
    await loadProductsAndCategories();

    $('adminProductsTable').innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Image</th>
            <th>ID</th>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${allProducts.map(product => `
            <tr>
              <td>
                <img
                  src="${product.image_url || fallbackImage(product.name)}"
                  alt="${safeText(product.name)}"
                  onerror="handleImageError(this, '${safeJS(product.name)}')"
                  style="width:54px;height:54px;object-fit:cover;border-radius:8px;border:1px solid var(--border);background:var(--bg-alt)"
                >
              </td>

              <td>${product.id}</td>

              <td>
                <strong>${safeText(product.name)}</strong>
                <div style="font-size:.75rem;color:var(--text-muted);max-width:240px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  ${safeText(product.description || 'No description')}
                </div>
              </td>

              <td>$${Number(product.price).toFixed(2)}</td>

              <td>
                <span class="stock-badge ${product.stock_quantity === 0 ? 'out-of-stock' : product.stock_quantity <= 10 ? 'low-stock' : 'in-stock'}">
                  ${product.stock_quantity}
                </span>
              </td>

              <td>${safeText(getCategoryName(product.category_id))}</td>

              <td>
                <div class="table-actions">
                  <button class="edit-btn" onclick="editProduct(${product.id})">Edit</button>
                  <button class="delete-btn" onclick="deleteProduct(${product.id})">Delete</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="padding:1rem;border-top:1px solid var(--border);display:flex;gap:.75rem;flex-wrap:wrap;align-items:center">
        <button class="btn btn-sm btn-outline" style="color:var(--text);border-color:var(--border)" onclick="showBulkStockUpdate()">
          Bulk Stock Update
        </button>

        <span style="font-size:.85rem;color:var(--text-muted)">
          Admin can edit products, replace broken images, and manage stock.
        </span>
      </div>
    `;
  } catch (err) {
    $('adminProductsTable').innerHTML = `<p>${safeText(err.message)}</p>`;
  }
}
// ===================== STEP 8: ADMIN USERS PAGE POLISH =====================

async function loadAdminUsers() {
  if (!isAdmin()) return;

  try {
    const users = await API.get('/users/');

    const totalUsers = users.length;
    const adminUsers = users.filter(user => user.role === 'admin').length;
    const customerUsers = users.filter(user => user.role !== 'admin').length;
    const activeUsers = users.filter(user => user.is_active).length;

    $('adminUsersTable').innerHTML = `
      <div style="padding:1rem;border-bottom:1px solid var(--border);display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.75rem;background:var(--bg-alt)">
        <div>
          <div style="font-size:1.25rem;font-weight:800;color:var(--primary)">${totalUsers}</div>
          <div style="font-size:.8rem;color:var(--text-muted)">Total Users</div>
        </div>

        <div>
          <div style="font-size:1.25rem;font-weight:800;color:var(--primary)">${adminUsers}</div>
          <div style="font-size:.8rem;color:var(--text-muted)">Admins</div>
        </div>

        <div>
          <div style="font-size:1.25rem;font-weight:800;color:var(--primary)">${customerUsers}</div>
          <div style="font-size:.8rem;color:var(--text-muted)">Customers</div>
        </div>

        <div>
          <div style="font-size:1.25rem;font-weight:800;color:var(--primary)">${activeUsers}</div>
          <div style="font-size:.8rem;color:var(--text-muted)">Active Accounts</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Username</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${users.map(user => `
            <tr>
              <td>
                <div style="display:flex;align-items:center;gap:.75rem">
                  <div class="avatar-icon" style="width:36px;height:36px;font-size:.9rem">
                    ${(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <strong>${safeText(user.full_name)}</strong>
                    <div style="font-size:.75rem;color:var(--text-muted)">ID: ${user.id}</div>
                  </div>
                </div>
              </td>

              <td>${safeText(user.email)}</td>
              <td>${safeText(user.username)}</td>

              <td>
                <span class="status-badge ${user.role === 'admin' ? 'completed' : 'pending'}">
                  ${safeText(user.role)}
                </span>
              </td>

              <td>
                <span class="status-badge ${user.is_active ? 'paid' : 'cancelled'}">
                  ${user.is_active ? 'active' : 'inactive'}
                </span>
              </td>

              <td>${new Date(user.created_at).toLocaleDateString()}</td>

              <td>
                ${user.id !== currentUser.id ? `
                  <div class="table-actions">
                    <button class="delete-btn" onclick="deleteUser(${user.id})">Delete</button>
                  </div>
                ` : '<span style="font-size:.8rem;color:var(--text-muted)">Current admin</span>'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="padding:1rem;border-top:1px solid var(--border)">
        <span style="font-size:.85rem;color:var(--text-muted)">
          Admin can monitor users and remove accounts that should not access the system.
        </span>
      </div>
    `;
  } catch (err) {
    $('adminUsersTable').innerHTML = `<p>${safeText(err.message)}</p>`;
  }
}
// ===================== STEP 9: ADMIN MESSAGES PAGE POLISH =====================

async function loadAdminMessages() {
  if (!isAdmin()) return;

  try {
    const messages = await API.get('/contact/');

    const list = $('adminMessagesList');

    const totalMessages = messages.length;
    const unreadMessages = messages.filter(message => !message.is_read).length;
    const readMessages = messages.filter(message => message.is_read).length;

    if (!messages.length) {
      list.innerHTML = `
        <div class="card" style="margin-bottom:1rem">
          <h3>Message Center</h3>
          <p style="color:var(--text-muted);font-size:.9rem">
            Customer contact messages will appear here.
          </p>
        </div>

        <div class="empty-state">
          <p>No messages yet.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-bottom:1rem">
        <div class="stat-card">
          <div class="stat-value">${totalMessages}</div>
          <div class="stat-label">Total Messages</div>
        </div>

        <div class="stat-card">
          <div class="stat-value">${unreadMessages}</div>
          <div class="stat-label">Unread</div>
        </div>

        <div class="stat-card">
          <div class="stat-value">${readMessages}</div>
          <div class="stat-label">Read</div>
        </div>
      </div>

      ${messages.map(message => `
        <div class="message-card ${message.is_read ? '' : 'unread'}">
          <div class="message-content">
            <div style="display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;flex-wrap:wrap">
              <div>
                <h4>${safeText(message.name)}</h4>
                <div class="msg-meta">
                  ${safeText(message.email)} &middot; ${new Date(message.created_at).toLocaleString()}
                </div>
              </div>

              <span class="status-badge ${message.is_read ? 'paid' : 'pending'}">
                ${message.is_read ? 'read' : 'unread'}
              </span>
            </div>

            <div class="msg-subject" style="margin-top:.5rem">
              ${safeText(message.subject)}
            </div>

            <div class="msg-body">
              ${safeText(message.message)}
            </div>
          </div>

          <div class="message-actions">
            ${message.is_read
              ? '<span style="font-size:.75rem;color:var(--text-muted)">Already read</span>'
              : `<button class="btn btn-sm btn-primary" onclick="markMessageRead(${message.id})">Mark Read</button>`
            }
          </div>
        </div>
      `).join('')}

      <div style="font-size:.85rem;color:var(--text-muted);margin-top:1rem">
        Admin can review customer support messages and mark them as read after handling.
      </div>
    `;
  } catch (err) {
    $('adminMessagesList').innerHTML = `<p>${safeText(err.message)}</p>`;
  }
}
// ===================== STEP 10: FOOTER + AUTH DISPLAY FINAL POLISH =====================

function updateFooterLinks() {
  const footerLinks = document.querySelectorAll('.footer a');

  footerLinks.forEach(link => {
    const text = link.textContent.trim().toLowerCase();

    if (currentUser) {
      if (text === 'sign in' || text === 'register') {
        link.style.display = 'none';
      }

      if (text === 'my orders') {
        link.style.display = isAdmin() ? 'none' : '';
      }

      if (text === 'contact' || text === 'help center') {
        link.style.display = isAdmin() ? 'none' : '';
      }
    } else {
      if (text === 'sign in' || text === 'register') {
        link.style.display = '';
      }

      if (text === 'my orders') {
        link.style.display = 'none';
      }

      if (text === 'contact' || text === 'help center') {
        link.style.display = '';
      }
    }
  });
}

function updateAuthUI() {
  const loggedIn = !!currentUser;
  const admin = isAdmin();

  const registerBtn = getRegisterButton();
  const contactLink = getContactLink();
  const avatarName = $('avatarName');
  const ddMyOrders = $('ddMyOrders');

  setDisplay('loginBtn', !loggedIn);

  if (registerBtn) {
    registerBtn.style.display = loggedIn ? 'none' : '';
  }

  setDisplay('avatarDropdown', loggedIn);

  if (avatarName) {
    avatarName.textContent = '';
    avatarName.style.display = 'none';
  }

  if (contactLink) {
    contactLink.style.display = admin ? 'none' : '';
  }

  setDisplay('navOrders', loggedIn && !admin);
  setDisplay('navDashboard', admin);

  ['ddAdmin', 'ddProducts', 'ddCategories', 'ddOrders', 'ddUsers', 'ddMessages'].forEach(id => {
    setDisplay(id, admin);
  });

  if (ddMyOrders) {
    ddMyOrders.style.display = admin ? 'none' : '';
  }

  updateCartButton();
  updateFooterLinks();
}