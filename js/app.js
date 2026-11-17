/* =========================================================
   KRISHNA COMPUTER — storefront app (no build step needed)
   Pages are hash routes: #/, #/category/x, #/product/x, #/cart ...
   Cart, login, wishlist and orders are kept in the browser (localStorage);
   orders and enquiries are sent to the shop on WhatsApp.
   ========================================================= */
(() => {
  'use strict';
  const { SHOP, GROUPS, CATEGORIES, PRODUCTS, BRANDS, SERVICES, SLIDES } = window.KC;
  const ART = window.KC_ART;
  const UI = window.KC_UI;

  /* ---------- helpers ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inr = n => '₹' + Number(n).toLocaleString('en-IN');
  const ui = (name, cls = '') => `<svg class="ui ${cls}" viewBox="0 0 24 24" aria-hidden="true">${UI[name]}</svg>`;
  const art = (name, cls = '') => `<svg class="art-svg ${cls}" viewBox="0 0 64 64" aria-hidden="true">${ART[name] || ART.cable}</svg>`;
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } }
  };
  const ss = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* ignore */ } }
  };
  const wa = text => `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(text)}`;
  const tel = n => `tel:+91${n}`;
  const fmtPhone = n => n.replace(/(\d{5})(\d{5})/, '$1 $2');

  const catById = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
  const groupById = Object.fromEntries(GROUPS.map(g => [g.id, g]));
  const prodById = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
  const catsOf = gid => CATEGORIES.filter(c => c.group === gid);
  const groupOf = p => groupById[catById[p.cat].group];
  const discount = p => Math.round((1 - p.price / p.mrp) * 100);
  const byTag = t => PRODUCTS.filter(p => p.tags.includes(t));

  /* ---------- state ---------- */
  const state = {
    cart: store.get('kc_cart', []).filter(i => prodById[i.id]),
    user: store.get('kc_user', null),
    orders: store.get('kc_orders', []),
    wish: store.get('kc_wish', []).filter(id => prodById[id])
  };
  const save = () => {
    store.set('kc_cart', state.cart);
    store.set('kc_user', state.user);
    store.set('kc_orders', state.orders);
    store.set('kc_wish', state.wish);
  };
  const canSeePrice = () => !SHOP.loginToViewPrice || !!state.user;

  /* ---------- cart ---------- */
  const cartCount = () => state.cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = () => state.cart.reduce((s, i) => s + prodById[i.id].price * i.qty, 0);
  const cartMrp = () => state.cart.reduce((s, i) => s + prodById[i.id].mrp * i.qty, 0);

  function addToCart(id, qty) {
    const p = prodById[id];
    if (!p || !p.stock) return;
    qty = Math.max(qty || p.moq, p.moq);
    const line = state.cart.find(i => i.id === id);
    if (line) line.qty += qty; else state.cart.push({ id, qty });
    save(); updateHeader();
    toast(`<b>${esc(p.name)}</b> added to cart`, 'ok', { label: 'View Cart', href: '#/cart' });
    bumpCart();
  }
  function setQty(id, qty) {
    const p = prodById[id];
    const line = state.cart.find(i => i.id === id);
    if (!line) return;
    if (qty < p.moq) {
      if (p.moq > 1) toast(`Minimum order for this item is ${p.moq} pcs. Use the bin icon to remove it.`);
      qty = p.moq;
    }
    line.qty = Math.min(qty, 999);
    save(); updateHeader();
  }
  function removeFromCart(id) {
    state.cart = state.cart.filter(i => i.id !== id);
    save(); updateHeader();
  }
  function bumpCart() {
    $$('.cart-badge').forEach(b => { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); });
  }
  function toggleWish(id) {
    const on = state.wish.includes(id);
    state.wish = on ? state.wish.filter(x => x !== id) : [...state.wish, id];
    save(); updateHeader();
    $$(`[data-wish="${id}"]`).forEach(b => b.classList.toggle('on', !on));
    toast(on ? 'Removed from wishlist' : 'Saved to wishlist', on ? '' : 'ok', on ? null : { label: 'View', href: '#/wishlist' });
  }

  /* ---------- toast ---------- */
  function toast(html, type = '', action = null) {
    const box = $('#toasts');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${type === 'ok' ? ui('check', 'toast-ic') : ''}<span>${html}</span></span>${action ? `<a href="${action.href}">${action.label}</a>` : ''}`;
    box.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3200);
  }

  /* ---------- modal ---------- */
  function openModal(html, cls = '') {
    const m = $('#modal');
    m.className = `modal open ${cls}`;
    $('#modal-body').innerHTML = html;
    document.body.classList.add('no-scroll');
    const f = $('input, select, textarea', m);
    if (f) setTimeout(() => f.focus(), 50);
  }
  function closeModal() {
    $('#modal').className = 'modal';
    $('#modal-body').innerHTML = '';
    document.body.classList.remove('no-scroll');
  }

  /* ---------- login ---------- */
  function loginForm(next = '') {
    const u = state.user || {};
    return `
      <form class="form" data-form="login" data-next="${esc(next)}" novalidate>
        <div class="form-row">
          <label>Full Name *<input name="name" required value="${esc(u.name)}" placeholder="Your name" autocomplete="name"></label>
        </div>
        <div class="form-row">
          <label>Mobile Number *<input name="mobile" required inputmode="numeric" maxlength="10" value="${esc(u.mobile)}" placeholder="10 digit mobile number" autocomplete="tel-national"></label>
        </div>
        <div class="form-row two">
          <label>Business / Shop Name<input name="business" value="${esc(u.business)}" placeholder="Optional"></label>
          <label>City<input name="city" value="${esc(u.city || 'Jaipur')}" placeholder="City"></label>
        </div>
        <div class="form-row">
          <label>GSTIN (optional, for GST billing)<input name="gstin" maxlength="15" value="${esc(u.gstin)}" placeholder="Optional" style="text-transform:uppercase"></label>
        </div>
        <p class="form-err" hidden></p>
        <button class="btn btn-primary btn-block btn-lg" type="submit">${state.user ? 'Save Details' : 'Login / Sign Up'}</button>
        <p class="muted small center">No password needed. Your details stay on this device and are used for your orders.</p>
      </form>`;
  }
  function openLogin(next = '') {
    openModal(`
      <div class="modal-head">
        <div class="login-ic">${ui('user')}</div>
        <h3>${state.user ? 'Edit your details' : 'Login to view prices'}</h3>
        <p class="muted">${state.user ? 'Update your contact and billing details.' : 'Sign in with your mobile number to see wholesale prices and place orders.'}</p>
      </div>${loginForm(next)}`, 'modal-sm');
  }
  function handleLogin(form) {
    const d = Object.fromEntries(new FormData(form));
    const err = $('.form-err', form);
    d.name = d.name.trim(); d.mobile = d.mobile.replace(/\D/g, ''); d.gstin = (d.gstin || '').trim().toUpperCase();
    let msg = '';
    if (d.name.length < 2) msg = 'Please enter your name.';
    else if (!/^[6-9]\d{9}$/.test(d.mobile)) msg = 'Please enter a valid 10 digit mobile number.';
    else if (d.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(d.gstin)) msg = 'GSTIN looks incorrect (15 characters, e.g. 08ABCDE1234F1Z5).';
    if (msg) { err.textContent = msg; err.hidden = false; return; }
    const first = !state.user;
    state.user = { name: d.name, mobile: d.mobile, business: d.business.trim(), city: d.city.trim(), gstin: d.gstin, since: state.user?.since || Date.now() };
    save();
    closeModal();
    toast(first ? `Welcome, <b>${esc(d.name.split(' ')[0])}</b>! Prices are now visible.` : 'Details saved', 'ok');
    const next = form.dataset.next;
    if (next) location.hash = next; else render();
  }
  function logout() {
    state.user = null; save();
    toast('You have been logged out');
    location.hash = '#/';
    render();
  }

  /* ---------- shared bits ---------- */
  function productArt(p, big = false) {
    return `<div class="pimg${big ? ' big' : ''}">
      <img src="${esc(p.img)}" alt="${esc(p.name)}" loading="${big ? 'eager' : 'lazy'}" decoding="async"><span class="pimg-brand">${esc(p.brand)}</span></div>`;
  }
  const catImg = c => `<span class="cat-ic"><img src="${esc(c.img)}" alt="" loading="lazy" decoding="async"></span>`;
  function priceBlock(p, big = false) {
    if (!canSeePrice()) return `<button class="login-price" data-action="login">${ui('tag')} Login to View Price</button>`;
    return `<div class="price${big ? ' big' : ''}"><b>${inr(p.price)}</b><s>${inr(p.mrp)}</s><em>${discount(p)}% off</em></div>`;
  }
  function badges(p) {
    let b = '';
    if (!p.stock) b += '<span class="badge out">Out of stock</span>';
    else if (p.stock === 'low') b += '<span class="badge low">Low stock</span>';
    else if (p.tags.includes('deal')) b += '<span class="badge deal">Deal</span>';
    else if (p.tags.includes('new')) b += '<span class="badge new">New</span>';
    else if (p.tags.includes('lot')) b += '<span class="badge lot">Stock Lot</span>';
    return b;
  }
  function card(p) {
    const wished = state.wish.includes(p.id);
    return `<article class="card">
      <a class="card-img" href="#/product/${p.id}" aria-label="${esc(p.name)}">${productArt(p)}<div class="badges">${badges(p)}</div></a>
      <button class="wish ${wished ? 'on' : ''}" data-wish="${p.id}" aria-label="Add to wishlist">${ui('heart')}</button>
      <div class="card-body">
        <div class="card-cat">${esc(catById[p.cat].name)}</div>
        <a class="card-title" href="#/product/${p.id}">${esc(p.name)}</a>
        ${p.moq > 1 ? `<div class="moq">MOQ: ${p.moq} pcs</div>` : '<div class="moq">&nbsp;</div>'}
        <div class="card-price">${priceBlock(p)}</div>
        ${p.stock
          ? `<button class="btn btn-primary btn-block" data-add="${p.id}">${ui('cart')} Add to Cart</button>`
          : `<a class="btn btn-outline btn-block" href="${wa(`Hi ${SHOP.name}, please notify me when "${p.name}" is back in stock.`)}" target="_blank" rel="noopener">Notify Me</a>`}
      </div>
    </article>`;
  }
  function rail(title, items, href, id) {
    if (!items.length) return '';
    return `<section class="section">
      <div class="wrap">
        <div class="sec-head">
          <h2>${title}</h2>
          <div class="sec-tools">
            <button class="rail-btn" data-rail="${id}" data-dir="-1" aria-label="Scroll left">${ui('left')}</button>
            <button class="rail-btn" data-rail="${id}" data-dir="1" aria-label="Scroll right">${ui('right')}</button>
            ${href ? `<a class="btn btn-dark btn-sm" href="${href}">View All</a>` : ''}
          </div>
        </div>
        <div class="rail" id="${id}">${items.map(card).join('')}</div>
      </div>
    </section>`;
  }
  const crumbs = list => `<nav class="crumbs wrap" aria-label="Breadcrumb"><a href="#/">Home</a>${list.map(([t, h]) => h ? `<span>/</span><a href="${h}">${esc(t)}</a>` : `<span>/</span><b>${esc(t)}</b>`).join('')}</nav>`;
  const pageHead = (title, sub = '') => `<div class="page-head"><div class="wrap"><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div></div>`;
  const empty = (icon, title, text, cta = '<a class="btn btn-primary" href="#/">Continue Shopping</a>') =>
    `<div class="empty"><div class="empty-ic">${ui(icon)}</div><h3>${title}</h3><p class="muted">${text}</p>${cta}</div>`;

  /* ---------- VIEWS ---------- */
  function viewHome() {
    const features = [
      ['shield', 'Genuine Products', 'Quality checked stock'],
      ['rupee', 'Wholesale Prices', 'Best rates for dealers'],
      ['truck', 'Fast Delivery', 'Same day in Jaipur*'],
      ['receipt', 'GST Billing', 'Input tax credit available'],
      ['headset', 'Expert Support', 'Call or WhatsApp us']
    ];
    const topCats = ['hdmi-cable', 'vga-cable', 'power-cable', 'keyboard-mouse', 'mousepad', 'cctv-camera', 'dvr-nvr', 'cartridge', 'toner', 'laptop-adapter', 'laptop-bag', 'type-c', 'lan-cable', 'router', 'hard-drive', 'ssd', 'converter', 'wall-mount'];
    const h = `
      <section class="hero">
        <div class="slides" id="slides">
          ${SLIDES.map((s, i) => s.brand ? `
          <div class="slide slide-brand${i === 0 ? ' active' : ''}">
            <img class="sb-krishna" src="images/brand/krishna.png" alt="Lord Krishna">
            <div class="wrap slide-inner">
              <div class="sb-text">
                <p class="sb-slogan">${esc(SHOP.slogan)}…</p>
                <h2><span>Krishna</span><span>Computer</span></h2>
                <div class="sb-pill">Sales <i></i> Service <i></i> Support</div>
                <p class="sb-made">Technology Made Easy…</p>
                <div class="slide-cta"><a class="btn btn-accent btn-lg" href="#/categories">Shop Now</a>
                <a class="btn btn-wa btn-lg" href="${wa(`Hi ${SHOP.name}, I have an enquiry.`)}" target="_blank" rel="noopener">${ui('whatsapp')} WhatsApp</a></div>
              </div>
              <img class="sb-products" src="images/brand/products.png" alt="Computers, printer and ink — Best Service, Best Price">
            </div>
          </div>` : `
          <div class="slide${i === 0 ? ' active' : ''}" style="--c1:${s.c1};--c2:${s.c2}">
            <div class="wrap slide-inner">
              <div class="slide-text">
                <span class="kicker">${s.kicker}</span>
                <h2>${s.title}</h2>
                <p>${s.text}</p>
                <div class="slide-cta"><a class="btn btn-accent btn-lg" href="${s.href}">${s.cta}</a>
                <a class="btn btn-ghost btn-lg" href="${wa(`Hi ${SHOP.name}, I'd like to know more about ${s.kicker}.`)}" target="_blank" rel="noopener">${ui('whatsapp')} Enquire</a></div>
              </div>
              <div class="slide-art">${s.img ? `<img src="${s.img}" alt="">` : art(s.icon)}</div>
            </div>
          </div>`).join('')}
        </div>
        <button class="hero-arrow prev" data-slide="-1" aria-label="Previous slide">${ui('left')}</button>
        <button class="hero-arrow next" data-slide="1" aria-label="Next slide">${ui('right')}</button>
        <div class="dots">${SLIDES.map((_, i) => `<button class="${i === 0 ? 'active' : ''}" data-dot="${i}" aria-label="Slide ${i + 1}"></button>`).join('')}</div>
      </section>

      <section class="svc-strip"><div class="wrap svc-strip-row">
        ${SERVICES.map(s => `<a class="svc-tile" href="${s.href || '#/services'}">${art(s.icon)}<span>${esc(s.short)}</span></a>`).join('')}
      </div></section>

      <section class="features"><div class="wrap features-row">
        ${features.map(([i, t, s]) => `<div class="feature">${art(i)}<div><b>${t}</b><span>${s}</span></div></div>`).join('')}
      </div></section>

      <section class="section">
        <div class="wrap">
          <div class="sec-head"><h2>Shop by Category</h2><a class="btn btn-dark btn-sm" href="#/categories">All Categories</a></div>
          <div class="cat-grid">
            ${topCats.map(id => { const c = catById[id]; return `
              <a class="cat-tile" href="#/category/${c.id}">
                ${catImg(c)}
                <span>${esc(c.name)}</span>
              </a>`; }).join('')}
          </div>
        </div>
      </section>

      ${rail('New Arrivals', byTag('new'), '#/collection/new', 'rail-new')}

      <section class="section"><div class="wrap promo-row">
        <a class="promo" href="#/collection/deals" style="--c1:#e3141c;--c2:#8f0a10">
          <div><span class="kicker">Daily Deals</span><h3>Up to 50% off</h3><p>Cables, adapters, storage & more</p><span class="btn btn-light btn-sm">Grab Deals</span></div>${art('rupee')}
        </a>
        <a class="promo" href="#/services" style="--c1:#012a6b;--c2:#1d74e8">
          <div><span class="kicker">Service Centre</span><h3>Repair & Installation</h3><p>Laptop, printer, CCTV & networking</p><span class="btn btn-light btn-sm">Book Service</span></div>${art('tools')}
        </a>
      </div></section>

      ${rail('Best Selling Products', byTag('best'), '#/collection/best', 'rail-best')}

      <section class="section alt">
        <div class="wrap">
          <div class="sec-head"><h2>Our Services</h2><a class="btn btn-dark btn-sm" href="#/services">View All</a></div>
          <div class="svc-grid">${SERVICES.slice(0, 4).map(serviceCard).join('')}</div>
        </div>
      </section>

      ${rail('Stock Lot Items', byTag('lot'), '#/collection/lot', 'rail-lot')}

      <section class="section">
        <div class="wrap">
          <div class="sec-head"><h2>Shop by Brands</h2></div>
          <div class="marquee"><div class="marquee-track">
            ${[...BRANDS, ...BRANDS].map(b => `<a class="brand" href="#/brand/${encodeURIComponent(b)}">${esc(b)}</a>`).join('')}
          </div></div>
        </div>
      </section>

      <section class="cta-band">
        <div class="wrap cta-inner">
          <div><h2>Dealer or bulk buyer?</h2><p>Get special prices on bulk orders. Call or WhatsApp us with your requirement list.</p></div>
          <div class="cta-btns">
            <a class="btn btn-light btn-lg" href="${tel(SHOP.phones[0])}">${ui('phone')} ${fmtPhone(SHOP.phones[0])}</a>
            <a class="btn btn-wa btn-lg" href="${wa(`Hi ${SHOP.name}, I want a quotation for a bulk order.`)}" target="_blank" rel="noopener">${ui('whatsapp')} WhatsApp</a>
          </div>
        </div>
      </section>`;
    return { t: `${SHOP.name} | Computer, CCTV & Printer Accessories in Jaipur`, h, after: initHome };
  }

  function serviceCard(s) {
    return `<div class="svc">
      <div class="svc-ic">${art(s.icon)}</div>
      <h3>${s.title}</h3><p>${s.text}</p>
      <a class="btn btn-outline btn-sm" href="${wa(`Hi ${SHOP.name}, I want to book: ${s.title}.`)}" target="_blank" rel="noopener">${ui('whatsapp')} Book on WhatsApp</a>
    </div>`;
  }

  function viewCategories() {
    const h = `${crumbs([['Categories']])}${pageHead('All Categories', `${CATEGORIES.length} categories · ${PRODUCTS.length} products`)}
      <div class="wrap section-tight">
        ${GROUPS.map(g => `
          <div class="group-block">
            <div class="group-head">
              <span class="grp-ic" style="--c1:${g.c1};--c2:${g.c2}">${art(g.icon)}</span>
              <h2>${g.name}</h2>
              <a href="#/category/${g.id}" class="link">View all ${ui('right')}</a>
            </div>
            <div class="cat-grid">
              ${catsOf(g.id).map(c => `<a class="cat-tile" href="#/category/${c.id}">
                ${catImg(c)}
                <span>${esc(c.name)}</span><small>${PRODUCTS.filter(p => p.cat === c.id).length} items</small></a>`).join('')}
            </div>
          </div>`).join('')}
      </div>`;
    return { t: 'All Categories', h };
  }

  /* listing with filters (category, collection, brand, search) */
  function listing({ title, sub, crumbList, items, base, q, side }) {
    const sort = q.get('sort') || 'popular';
    const selBrands = q.getAll('brand');
    const stockOnly = q.get('stock') === '1';
    const brands = [...new Set(items.map(p => p.brand))].sort();
    let list = items.filter(p => (!selBrands.length || selBrands.includes(p.brand)) && (!stockOnly || p.stock));
    const sorters = {
      popular: (a, b) => (b.tags.includes('best') - a.tags.includes('best')) || a.id.localeCompare(b.id),
      newest: (a, b) => (b.tags.includes('new') - a.tags.includes('new')) || b.id.localeCompare(a.id),
      low: (a, b) => a.price - b.price,
      high: (a, b) => b.price - a.price,
      discount: (a, b) => discount(b) - discount(a),
      az: (a, b) => a.name.localeCompare(b.name)
    };
    list = [...list].sort(sorters[sort] || sorters.popular);
    const priceSort = canSeePrice();
    const h = `${crumbs(crumbList)}${pageHead(title, sub)}
      <div class="wrap shop">
        <aside class="filters" id="filters">
          <div class="filters-head"><b>Filters</b><button class="icon-btn only-mobile" data-action="close-filters" aria-label="Close filters">${ui('close')}</button></div>
          <form data-filter="${esc(base)}">
            <input type="hidden" name="sort" value="${esc(sort)}">
            ${side || ''}
            ${brands.length > 1 ? `<div class="f-block"><h4>Brand</h4>
              ${brands.map(b => `<label class="check"><input type="checkbox" name="brand" value="${esc(b)}" ${selBrands.includes(b) ? 'checked' : ''}> ${esc(b)} <small>(${items.filter(p => p.brand === b).length})</small></label>`).join('')}
            </div>` : ''}
            <div class="f-block"><h4>Availability</h4>
              <label class="check"><input type="checkbox" name="stock" value="1" ${stockOnly ? 'checked' : ''}> In stock only</label>
            </div>
            ${selBrands.length || stockOnly ? `<a class="btn btn-outline btn-sm btn-block" href="${base}${sort !== 'popular' ? `${base.includes('?') ? '&' : '?'}sort=${sort}` : ''}">Clear filters</a>` : ''}
          </form>
        </aside>
        <div class="results">
          <div class="toolbar">
            <button class="btn btn-outline btn-sm only-mobile" data-action="open-filters">${ui('filter')} Filters${selBrands.length + stockOnly ? ` (${selBrands.length + stockOnly})` : ''}</button>
            <span class="muted">${list.length} product${list.length === 1 ? '' : 's'}</span>
            <label class="sort">Sort by
              <select data-sort>
                ${[['popular', 'Popularity'], ['newest', 'Newest'], ...(priceSort ? [['low', 'Price: Low to High'], ['high', 'Price: High to Low'], ['discount', 'Discount']] : []), ['az', 'Name: A to Z']]
                  .map(([v, l]) => `<option value="${v}" ${v === sort ? 'selected' : ''}>${l}</option>`).join('')}
              </select>
            </label>
          </div>
          ${list.length ? `<div class="grid">${list.map(card).join('')}</div>`
            : empty('search', 'No products found', 'Try removing a filter, or ask us on WhatsApp — we can arrange most items.',
              `<a class="btn btn-wa" href="${wa(`Hi ${SHOP.name}, I'm looking for: ${title}`)}" target="_blank" rel="noopener">${ui('whatsapp')} Ask on WhatsApp</a>`)}
        </div>
      </div>`;
    return h;
  }

  function viewCategory(q, slug) {
    const g = groupById[slug];
    const c = catById[slug];
    if (!g && !c) return null;
    const group = g || groupById[c.group];
    const ids = g ? catsOf(g.id).map(x => x.id) : [c.id];
    const items = PRODUCTS.filter(p => ids.includes(p.cat));
    const side = `<div class="f-block"><h4>${esc(group.name)}</h4>
      <a class="f-link ${g ? 'on' : ''}" href="#/category/${group.id}">All ${esc(group.name)}</a>
      ${catsOf(group.id).map(x => `<a class="f-link ${c && c.id === x.id ? 'on' : ''}" href="#/category/${x.id}">${esc(x.name)}</a>`).join('')}
    </div>`;
    const title = g ? g.name : c.name;
    return {
      t: title,
      h: listing({ title, sub: g ? `${catsOf(g.id).length} categories` : group.name, crumbList: g ? [['Categories', '#/categories'], [g.name]] : [['Categories', '#/categories'], [group.name, `#/category/${group.id}`], [c.name]], items, base: `#/category/${slug}`, q, side })
    };
  }

  const COLLECTIONS = {
    new: ['New Arrivals', 'Fresh stock just landed', () => byTag('new')],
    best: ['Best Selling Products', 'Most ordered by our customers', () => byTag('best')],
    deals: ['Daily Deals', 'Limited period offers on top products', () => byTag('deal')],
    lot: ['Stock Lot Items', 'Clearance stock at special prices', () => byTag('lot')],
    all: ['All Products', 'Our complete catalogue', () => PRODUCTS]
  };
  function viewCollection(q, key) {
    const col = COLLECTIONS[key];
    if (!col) return null;
    const side = `<div class="f-block"><h4>Collections</h4>${Object.entries(COLLECTIONS).map(([k, v]) => `<a class="f-link ${k === key ? 'on' : ''}" href="#/collection/${k}">${v[0]}</a>`).join('')}</div>`;
    return { t: col[0], h: listing({ title: col[0], sub: col[1], crumbList: [[col[0]]], items: col[2](), base: `#/collection/${key}`, q, side }) };
  }
  function viewBrand(q, raw) {
    const b = decodeURIComponent(raw);
    const items = PRODUCTS.filter(p => p.brand.toLowerCase() === b.toLowerCase());
    const side = `<div class="f-block"><h4>Brands</h4>${[...new Set(PRODUCTS.map(p => p.brand))].sort().map(x => `<a class="f-link ${x.toLowerCase() === b.toLowerCase() ? 'on' : ''}" href="#/brand/${encodeURIComponent(x)}">${esc(x)}</a>`).join('')}</div>`;
    return { t: `${b} Products`, h: listing({ title: `${esc(b)} Products`, sub: `${items.length} products`, crumbList: [['Brands'], [b]], items, base: `#/brand/${encodeURIComponent(b)}`, q, side }) };
  }
  function search(term) {
    const words = term.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return PRODUCTS.filter(p => {
      const hay = `${p.name} ${p.brand} ${catById[p.cat].name} ${groupOf(p).name}`.toLowerCase();
      return words.every(w => hay.includes(w));
    });
  }
  function viewSearch(q) {
    const term = (q.get('q') || '').trim();
    const items = search(term);
    const base = `#/search?q=${encodeURIComponent(term)}`;
    return { t: `Search: ${term}`, h: listing({ title: term ? `Results for “${esc(term)}”` : 'Search', sub: term ? '' : 'Type in the search box above', crumbList: [['Search']], items, base, q }) };
  }

  function viewProduct(q, id) {
    const p = prodById[id];
    if (!p) return null;
    const c = catById[p.cat], g = groupById[c.group];
    const related = PRODUCTS.filter(x => x.cat === p.cat && x.id !== p.id)
      .concat(PRODUCTS.filter(x => x.cat !== p.cat && catById[x.cat].group === g.id)).slice(0, 10);
    const wished = state.wish.includes(p.id);
    const highlights = [
      `${c.name} by ${p.brand}`,
      p.moq > 1 ? `Minimum order quantity: ${p.moq} pieces` : 'Available in single piece & bulk quantity',
      'GST invoice available (input tax credit)',
      'Tested & quality checked before dispatch',
      `Pickup from our shop or delivery across Jaipur`
    ];
    const stock = stockInfo(p);
    const rows = [
      ['hash', 'Product ID', p.id.toUpperCase()],
      p.model && ['box', 'Model', esc(p.model)],
      ['layers', 'Category', `<a href="#/category/${c.id}">${esc(c.name)}</a>`],
      ['shield', 'Warranty Period', esc(p.warranty || 'As per manufacturer warranty')],
      p.moq > 1 && ['cart', 'Min. Order Qty', `${p.moq} pcs`],
      ['pin', 'Pickup / Delivery', 'KL Plaza shop pickup or delivery in Jaipur'],
      p.note && ['check', 'Note', esc(p.note)]
    ].filter(Boolean);
    const h = `${crumbs([[g.name, `#/category/${g.id}`], [c.name, `#/category/${c.id}`], [p.name]])}
      <div class="wrap pd">
        <div class="pd-gallery">
          <div class="pd-main">${productArt(p, true)}<div class="badges">${badges(p)}</div></div>
          ${p.imgs.length > 1 ? `<div class="pd-thumbs">${p.imgs.map((src, i) => `<button class="${i ? '' : 'on'}" data-thumb="${esc(src)}" aria-label="Photo ${i + 1}"><img src="${esc(src)}" alt=""></button>`).join('')}</div>` : ''}
        </div>
        <div class="pd-info">
          <div class="pd-title">
            <div>
              <a class="pd-cat" href="#/category/${c.id}">${esc(c.name)}</a>
              <h1>${esc(p.name)}</h1>
            </div>
            <a class="brand-box" href="#/brand/${encodeURIComponent(p.brand)}" title="More from ${esc(p.brand)}">${esc(p.brand)}</a>
          </div>
          <div class="pd-icons">
            <button class="round-btn wish-btn ${wished ? 'on' : ''}" data-wish="${p.id}" aria-label="Add to wishlist" title="Wishlist">${ui('heart')}</button>
            <button class="round-btn" data-copy="${p.id}" aria-label="Copy product details" title="Copy details">${ui('copy')}</button>
            <button class="round-btn" data-share="${p.id}" aria-label="Copy or share link" title="Share link">${ui('link')}</button>
          </div>
          <table class="pd-details">
            ${rows.map(([ic, k, v]) => `<tr><th>${ui(ic)} ${k}</th><td>${v}</td></tr>`).join('')}
          </table>
          <div class="pd-info-box">${ui('check')} <span>For more information: <a href="${tel(SHOP.phones[0])}">${fmtPhone(SHOP.phones[0])}</a> / <a href="${tel(SHOP.phones[1])}">${fmtPhone(SHOP.phones[1])}</a></span></div>
          <div class="pd-pricebox">
            <div class="pd-price">${priceBlock(p, true)}${canSeePrice() ? '<small class="muted">Inclusive of all taxes</small>' : ''}</div>
            <div class="stock-box ${stock.cls}">${ui(stock.cls === 'out' ? 'close' : 'check')} ${stock.label}</div>
          </div>
          ${p.stock ? `
          <div class="pd-buy">
            <div class="qty" data-qty-box>
              <button type="button" data-step="-1" aria-label="Decrease">${ui('minus')}</button>
              <input type="number" id="pd-qty" value="${p.moq}" min="${p.moq}" max="999" aria-label="Quantity">
              <button type="button" data-step="1" aria-label="Increase">${ui('plus')}</button>
            </div>
            <button class="btn btn-primary btn-lg" data-add-qty="${p.id}">${ui('cart')} Add to Cart</button>
            <button class="btn btn-accent btn-lg" data-buy="${p.id}">Buy Now</button>
          </div>
          ${p.moq > 1 ? `<p class="muted small">Minimum order quantity: <b>${p.moq} pcs</b></p>` : ''}` : `
          <div class="pd-buy"><a class="btn btn-outline btn-lg" href="${wa(`Hi ${SHOP.name}, please notify me when "${p.name}" (${p.id.toUpperCase()}) is back in stock.`)}" target="_blank" rel="noopener">Notify me when available</a></div>`}
          <div class="pd-actions">
            <a class="btn btn-wa" href="${wa(`Hi ${SHOP.name}, I'm interested in "${p.name}" (${p.id.toUpperCase()}). Please share price and availability.`)}" target="_blank" rel="noopener">${ui('whatsapp')} Enquire on WhatsApp</a>
            <a class="btn btn-outline" href="${tel(SHOP.phones[0])}">${ui('phone')} Call Now</a>
          </div>
          <ul class="pd-hl">${highlights.map(x => `<li>${ui('check')} ${esc(x)}</li>`).join('')}</ul>
        </div>
      </div>
      <div class="wrap">
        <div class="tabs" data-tabs>
          <div class="tab-btns">
            <button class="active" data-tab="0">Specifications</button>
            <button data-tab="1">Delivery & Returns</button>
          </div>
          <div class="tab-panel active">
            <table class="spec">
              <tr><th>Product</th><td>${esc(p.name)}</td></tr>
              <tr><th>Brand</th><td>${esc(p.brand)}</td></tr>
              <tr><th>Category</th><td>${esc(g.name)} › ${esc(c.name)}</td></tr>
              <tr><th>SKU</th><td>${p.id.toUpperCase()}</td></tr>
              <tr><th>Min. Order Qty</th><td>${p.moq} pc${p.moq > 1 ? 's' : ''}</td></tr>
              <tr><th>Availability</th><td>${stock.label}</td></tr>
              <tr><th>Billing</th><td>GST invoice (GSTIN ${SHOP.gstin})</td></tr>
            </table>
          </div>
          <div class="tab-panel">
            <ul class="plain">
              <li><b>Store pickup:</b> collect from ${esc(SHOP.shop)} during ${esc(SHOP.hours)}.</li>
              <li><b>Delivery in Jaipur:</b> same / next day. Free on orders above ${inr(SHOP.freeDeliveryAbove)}.</li>
              <li><b>Outside Jaipur:</b> shipped by courier/transport — charges as per actual.</li>
              <li><b>Returns:</b> manufacturing defects are replaced within 7 days with original bill & packing. See our <a href="#/page/returns">return policy</a>.</li>
            </ul>
          </div>
        </div>
      </div>
      ${rail('Related Products', related, `#/category/${c.id}`, 'rail-rel')}
      <div class="pd-sticky" id="pd-sticky">
        <div class="wrap pd-sticky-in">
          <div class="pd-sticky-price">${canSeePrice() ? `<b>${inr(p.price)}</b>` : '<b class="lp">Login for price</b>'}<span class="${stock.cls}">${stock.label}</span></div>
          ${p.stock
            ? `<button class="btn btn-gold btn-lg" data-add-qty="${p.id}">${ui('cart')} Add to Cart</button>`
            : `<a class="btn btn-outline btn-lg" href="${wa(`Hi ${SHOP.name}, please notify me when "${p.name}" (${p.id.toUpperCase()}) is back in stock.`)}" target="_blank" rel="noopener">Notify Me</a>`}
        </div>
      </div>`;
    return { t: p.name, h, after: initProduct };
  }
  function stockInfo(p) {
    if (!p.stock) return { cls: 'out', label: 'Out of Stock' };
    if (p.stock === 'low') return { cls: 'low', label: 'Low Stock' };
    return { cls: 'in', label: 'In Stock' };
  }
  // the sticky "Add to Cart" bar appears once the price box has scrolled up under the header
  function updateSticky() {
    const bar = $('#pd-sticky'), box = $('.pd-pricebox');
    if (!bar || !box) return;
    const show = box.getBoundingClientRect().bottom < 130;
    bar.classList.toggle('show', show);
    document.body.classList.toggle('has-sticky', show);
  }
  function initProduct() { updateSticky(); }
  function copyText(text, done) {
    const fallback = () => {
      const t = document.createElement('textarea');
      t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); toast(done, 'ok'); } catch { toast('Could not copy'); }
      t.remove();
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => toast(done, 'ok'), fallback);
    else fallback();
  }

  function viewCart() {
    if (!state.cart.length) {
      return { t: 'Cart', h: `${crumbs([['Cart']])}${pageHead('Shopping Cart')}<div class="wrap">${empty('cart', 'Your cart is empty', 'Browse our categories and add products to your cart.')}</div>` };
    }
    const show = canSeePrice();
    const save$ = cartMrp() - cartTotal();
    const h = `${crumbs([['Cart']])}${pageHead('Shopping Cart', `${cartCount()} item${cartCount() === 1 ? '' : 's'}`)}
      <div class="wrap cart-layout">
        <div class="cart-lines">
          ${state.cart.map(i => { const p = prodById[i.id]; return `
          <div class="line">
            <a href="#/product/${p.id}" class="line-img">${productArt(p)}</a>
            <div class="line-info">
              <a href="#/product/${p.id}" class="line-title">${esc(p.name)}</a>
              <div class="muted small">${esc(p.brand)} · ${esc(catById[p.cat].name)}${p.moq > 1 ? ` · MOQ ${p.moq}` : ''}</div>
              <div class="line-price">${show ? `${inr(p.price)} <s>${inr(p.mrp)}</s>` : '<span class="muted">Login to view price</span>'}</div>
            </div>
            <div class="qty sm">
              <button data-cart-step="-1" data-id="${p.id}" aria-label="Decrease">${ui('minus')}</button>
              <input type="number" value="${i.qty}" min="${p.moq}" data-cart-qty="${p.id}" aria-label="Quantity">
              <button data-cart-step="1" data-id="${p.id}" aria-label="Increase">${ui('plus')}</button>
            </div>
            <div class="line-total">${show ? inr(p.price * i.qty) : ''}</div>
            <button class="icon-btn" data-remove="${p.id}" aria-label="Remove">${ui('trash')}</button>
          </div>`; }).join('')}
          <div class="cart-foot">
            <a href="#/" class="btn btn-outline">${ui('left')} Continue Shopping</a>
            <button class="btn btn-outline" data-action="clear-cart">${ui('trash')} Clear Cart</button>
          </div>
        </div>
        <aside class="summary">
          <h3>Order Summary</h3>
          ${show ? `
          <div class="sum-row"><span>Items (${cartCount()})</span><span>${inr(cartMrp())}</span></div>
          <div class="sum-row save"><span>Discount</span><span>− ${inr(save$)}</span></div>
          <div class="sum-row"><span>Delivery</span><span>${cartTotal() >= SHOP.freeDeliveryAbove ? 'FREE (Jaipur)' : 'As per location'}</span></div>
          <div class="sum-row total"><span>Total</span><span>${inr(cartTotal())}</span></div>
          <p class="muted small">Prices include GST. You save ${inr(save$)} on this order.</p>
          <a class="btn btn-primary btn-lg btn-block" href="#/checkout">Proceed to Checkout</a>`
          : `<p class="muted">Login to see prices and place your order.</p>
          <button class="btn btn-primary btn-lg btn-block" data-action="login" data-next="#/checkout">Login & Checkout</button>`}
          <a class="btn btn-wa btn-block" href="${wa(cartText())}" target="_blank" rel="noopener">${ui('whatsapp')} Send Cart on WhatsApp</a>
        </aside>
      </div>`;
    return { t: 'Cart', h };
  }
  function cartText() {
    const show = canSeePrice();
    return `Hi ${SHOP.name}, I want to order:\n` + state.cart.map((i, n) => {
      const p = prodById[i.id];
      return `${n + 1}. ${p.name} (${p.id.toUpperCase()}) × ${i.qty}${show ? ` = ${inr(p.price * i.qty)}` : ''}`;
    }).join('\n') + (show ? `\nTotal: ${inr(cartTotal())}` : '');
  }

  function viewCheckout() {
    if (!state.cart.length) { location.replace('#/cart'); return { t: 'Checkout', h: '' }; }
    if (!state.user) {
      return { t: 'Checkout', h: `${crumbs([['Cart', '#/cart'], ['Checkout']])}${pageHead('Checkout')}
        <div class="wrap narrow"><div class="panel"><h3>Login to continue</h3><p class="muted">Enter your details to view prices and place your order.</p>${loginForm('#/checkout')}</div></div>` };
    }
    const u = state.user;
    const h = `${crumbs([['Cart', '#/cart'], ['Checkout']])}${pageHead('Checkout')}
      <div class="wrap cart-layout">
        <form class="panel form" data-form="checkout" novalidate>
          <h3>1. Contact Details</h3>
          <div class="form-row two">
            <label>Full Name *<input name="name" required value="${esc(u.name)}"></label>
            <label>Mobile *<input name="mobile" required inputmode="numeric" maxlength="10" value="${esc(u.mobile)}"></label>
          </div>
          <div class="form-row two">
            <label>Business Name<input name="business" value="${esc(u.business)}"></label>
            <label>GSTIN<input name="gstin" maxlength="15" value="${esc(u.gstin)}" style="text-transform:uppercase"></label>
          </div>
          <h3>2. Delivery</h3>
          <div class="radio-cards">
            <label class="radio-card"><input type="radio" name="delivery" value="Home / Office Delivery" checked><span><b>Delivery</b><small>To your address</small></span></label>
            <label class="radio-card"><input type="radio" name="delivery" value="Store Pickup"><span><b>Store Pickup</b><small>KL Plaza, Agra Road</small></span></label>
          </div>
          <div data-address>
            <div class="form-row"><label>Address *<textarea name="address" rows="2" required placeholder="House / shop no., street, area">${esc(u.address)}</textarea></label></div>
            <div class="form-row two">
              <label>City *<input name="city" required value="${esc(u.city || 'Jaipur')}"></label>
              <label>Pincode *<input name="pincode" required inputmode="numeric" maxlength="6" value="${esc(u.pincode)}"></label>
            </div>
          </div>
          <h3>3. Payment</h3>
          <div class="radio-cards">
            <label class="radio-card"><input type="radio" name="payment" value="Cash on Delivery / Pickup" checked><span><b>Cash</b><small>On delivery / pickup</small></span></label>
            <label class="radio-card"><input type="radio" name="payment" value="UPI"><span><b>UPI</b><small>GPay, PhonePe, Paytm</small></span></label>
            <label class="radio-card"><input type="radio" name="payment" value="Bank Transfer / Credit"><span><b>Bank / Credit</b><small>For dealers</small></span></label>
          </div>
          <div class="form-row"><label>Order Notes<textarea name="notes" rows="2" placeholder="Anything we should know? (optional)"></textarea></label></div>
          <p class="form-err" hidden></p>
          <button class="btn btn-primary btn-lg btn-block" type="submit">${ui('whatsapp')} Place Order on WhatsApp</button>
          <p class="muted small center">Your order is sent to ${SHOP.name} on WhatsApp (+91 ${fmtPhone(SHOP.phones[0])}). We will confirm price, stock and delivery time.</p>
        </form>
        <aside class="summary">
          <h3>Your Order</h3>
          ${state.cart.map(i => { const p = prodById[i.id]; return `<div class="sum-item"><span>${esc(p.name)} <small>× ${i.qty}</small></span><span>${inr(p.price * i.qty)}</span></div>`; }).join('')}
          <div class="sum-row"><span>Delivery</span><span>${cartTotal() >= SHOP.freeDeliveryAbove ? 'FREE (Jaipur)' : 'As per location'}</span></div>
          <div class="sum-row total"><span>Total</span><span>${inr(cartTotal())}</span></div>
          <a href="#/cart" class="link small">${ui('left')} Edit cart</a>
        </aside>
      </div>`;
    return { t: 'Checkout', h, after: syncDelivery };
  }
  function syncDelivery() {
    const f = $('[data-form="checkout"]');
    if (!f) return;
    const pickup = f.delivery.value === 'Store Pickup';
    $('[data-address]', f).hidden = pickup;
  }
  function handleCheckout(form) {
    const d = Object.fromEntries(new FormData(form));
    const err = $('.form-err', form);
    d.mobile = d.mobile.replace(/\D/g, ''); d.gstin = (d.gstin || '').trim().toUpperCase();
    const pickup = d.delivery === 'Store Pickup';
    let msg = '';
    if (d.name.trim().length < 2) msg = 'Please enter your name.';
    else if (!/^[6-9]\d{9}$/.test(d.mobile)) msg = 'Please enter a valid 10 digit mobile number.';
    else if (!pickup && d.address.trim().length < 5) msg = 'Please enter your delivery address.';
    else if (!pickup && !d.city.trim()) msg = 'Please enter your city.';
    else if (!pickup && !/^\d{6}$/.test(d.pincode)) msg = 'Please enter a valid 6 digit pincode.';
    if (msg) { err.textContent = msg; err.hidden = false; err.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }

    const order = {
      id: 'KC' + Date.now().toString().slice(-8),
      date: Date.now(),
      items: state.cart.map(i => ({ id: i.id, name: prodById[i.id].name, qty: i.qty, price: prodById[i.id].price })),
      total: cartTotal(),
      customer: { name: d.name.trim(), mobile: d.mobile, business: d.business.trim(), gstin: d.gstin },
      delivery: d.delivery,
      address: pickup ? '' : `${d.address.trim()}, ${d.city.trim()} – ${d.pincode}`,
      payment: d.payment,
      notes: d.notes.trim(),
      status: 'Sent to shop'
    };
    state.user = { ...state.user, name: order.customer.name, mobile: d.mobile, business: order.customer.business, gstin: d.gstin, address: d.address?.trim(), city: d.city?.trim(), pincode: d.pincode };
    state.orders.unshift(order);
    state.cart = [];
    save(); updateHeader();
    window.open(wa(orderText(order)), '_blank', 'noopener');
    location.hash = `#/orders?placed=${order.id}`;
  }
  function orderText(o) {
    return [
      `*New Order – ${SHOP.name}*`,
      `Order ID: ${o.id}`,
      `Date: ${new Date(o.date).toLocaleString('en-IN')}`,
      '',
      `*Customer:* ${o.customer.name}`,
      `Mobile: ${o.customer.mobile}`,
      o.customer.business ? `Business: ${o.customer.business}` : null,
      o.customer.gstin ? `GSTIN: ${o.customer.gstin}` : null,
      '',
      '*Items:*',
      ...o.items.map((i, n) => `${n + 1}. ${i.name} (${i.id.toUpperCase()}) × ${i.qty} = ${inr(i.price * i.qty)}`),
      '',
      `*Total: ${inr(o.total)}*`,
      `Delivery: ${o.delivery}`,
      o.address ? `Address: ${o.address}` : null,
      `Payment: ${o.payment}`,
      o.notes ? `Notes: ${o.notes}` : null
    ].filter(x => x !== null).join('\n');
  }

  function viewOrders(q) {
    const placed = q.get('placed');
    if (!state.orders.length) {
      return { t: 'My Orders', h: `${crumbs([['My Orders']])}${pageHead('My Orders')}<div class="wrap">${empty('orders', 'No orders yet', 'Orders you place will appear here.')}</div>` };
    }
    const h = `${crumbs([['My Orders']])}${pageHead('My Orders', `${state.orders.length} order${state.orders.length === 1 ? '' : 's'}`)}
      <div class="wrap narrow">
        ${placed ? `<div class="success">${ui('check')}<div><b>Order ${esc(placed)} placed!</b><p>WhatsApp should have opened with your order. If it didn't, tap “Send on WhatsApp” below. We'll call you to confirm.</p></div></div>` : ''}
        ${state.orders.map(o => `
          <div class="order${o.id === placed ? ' hl' : ''}">
            <div class="order-head">
              <div><b>${o.id}</b><span class="muted small">${new Date(o.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
              <span class="pill">${esc(o.status)}</span>
            </div>
            <ul class="order-items">${o.items.map(i => `<li><a href="#/product/${i.id}">${esc(i.name)}</a><span>× ${i.qty}</span><span>${inr(i.price * i.qty)}</span></li>`).join('')}</ul>
            <div class="order-foot">
              <div class="muted small">${esc(o.delivery)} · ${esc(o.payment)}</div>
              <b>Total ${inr(o.total)}</b>
            </div>
            <div class="order-btns">
              <a class="btn btn-wa btn-sm" href="${wa(orderText(o))}" target="_blank" rel="noopener">${ui('whatsapp')} Send on WhatsApp</a>
              <button class="btn btn-outline btn-sm" data-reorder="${o.id}">Reorder</button>
              <button class="btn btn-outline btn-sm" data-print="${o.id}">Print</button>
            </div>
          </div>`).join('')}
      </div>`;
    return { t: 'My Orders', h };
  }

  function viewWishlist() {
    const items = state.wish.map(id => prodById[id]).filter(Boolean);
    const h = `${crumbs([['Wishlist']])}${pageHead('My Wishlist', items.length ? `${items.length} saved item${items.length === 1 ? '' : 's'}` : '')}
      <div class="wrap">${items.length ? `<div class="grid grid-5">${items.map(card).join('')}</div>` : empty('heart', 'Your wishlist is empty', 'Tap the heart on any product to save it here.')}</div>`;
    return { t: 'Wishlist', h };
  }

  function viewAccount() {
    if (!state.user) {
      return { t: 'Login', h: `${crumbs([['Login']])}${pageHead('Login / Sign Up')}
        <div class="wrap narrow"><div class="panel"><h3>Welcome to ${SHOP.name}</h3><p class="muted">Login with your mobile number to see wholesale prices, place orders and download our price list.</p>${loginForm('#/account')}</div></div>` };
    }
    const u = state.user;
    const h = `${crumbs([['My Account']])}${pageHead(`Hello, ${esc(u.name.split(' ')[0])}`, 'Manage your account')}
      <div class="wrap acct">
        <div class="panel">
          <h3>Profile</h3>
          <table class="spec">
            <tr><th>Name</th><td>${esc(u.name)}</td></tr>
            <tr><th>Mobile</th><td>+91 ${esc(u.mobile)}</td></tr>
            <tr><th>Business</th><td>${esc(u.business) || '—'}</td></tr>
            <tr><th>GSTIN</th><td>${esc(u.gstin) || '—'}</td></tr>
            <tr><th>City</th><td>${esc(u.city) || '—'}</td></tr>
          </table>
          <div class="btn-row"><button class="btn btn-primary" data-action="login">Edit Details</button>
          <button class="btn btn-outline" data-action="logout">${ui('logout')} Logout</button></div>
        </div>
        <div class="acct-links">
          <a class="acct-link" href="#/orders">${ui('orders')}<b>My Orders</b><span>${state.orders.length} orders</span></a>
          <a class="acct-link" href="#/cart">${ui('cart')}<b>My Cart</b><span>${cartCount()} items</span></a>
          <a class="acct-link" href="#/wishlist">${ui('heart')}<b>Wishlist</b><span>${state.wish.length} saved</span></a>
          <button class="acct-link" data-action="pricelist">${ui('download')}<b>Price List</b><span>Download (Excel/CSV)</span></button>
        </div>
      </div>`;
    return { t: 'My Account', h };
  }

  function viewServices() {
    const h = `${crumbs([['Services']])}${pageHead('Our Services', 'Sales, service and installation — all under one roof')}
      <div class="wrap section-tight">
        <div class="svc-grid">${SERVICES.map(serviceCard).join('')}</div>
        <div class="steps">
          ${[['1', 'Contact us', 'Call or WhatsApp with your problem or requirement.'], ['2', 'Get a quote', 'We inspect and give a clear, upfront estimate.'], ['3', 'We fix / install', 'Trained technicians complete the job quickly.'], ['4', 'Support', 'Warranty on service and after-sales support.']]
            .map(([n, t, s]) => `<div class="step"><span>${n}</span><b>${t}</b><p>${s}</p></div>`).join('')}
        </div>
      </div>`;
    return { t: 'Services', h };
  }

  function viewAbout() {
    const h = `${crumbs([['About Us']])}${pageHead('About Us', SHOP.tagline)}
      <div class="wrap section-tight about">
        <div class="about-text">
          <h2>Welcome to ${SHOP.name}</h2>
          <p>${SHOP.name} is a trusted computer and IT accessories shop on Agra Road, Jaipur. We supply computer cables, accessories, CCTV cameras and security products, printer consumables, laptop accessories, networking and storage products to homes, offices, shops and dealers.</p>
          <p>Along with sales, we provide computer and laptop repair, CCTV installation, printer servicing and networking solutions. Our goal is simple: genuine products, fair prices and honest service.</p>
          <ul class="pd-hl">
            <li>${ui('check')} Wide range of ${PRODUCTS.length}+ products across ${CATEGORIES.length} categories</li>
            <li>${ui('check')} Retail and wholesale / dealer pricing</li>
            <li>${ui('check')} GST registered — GSTIN ${SHOP.gstin}</li>
            <li>${ui('check')} Quick delivery across Jaipur</li>
          </ul>
          <div class="btn-row"><a class="btn btn-primary" href="#/categories">Browse Products</a><a class="btn btn-outline" href="#/contact">Contact Us</a></div>
        </div>
        <div class="stats">
          ${[[`${PRODUCTS.length}+`, 'Products'], [`${CATEGORIES.length}`, 'Categories'], [`${BRANDS.length}+`, 'Brands'], ['6', 'Services']].map(([n, l]) => `<div class="stat"><b>${n}</b><span>${l}</span></div>`).join('')}
        </div>
      </div>`;
    return { t: 'About Us', h };
  }

  function viewContact() {
    const h = `${crumbs([['Contact Us']])}${pageHead('Contact Us', 'We would love to hear from you')}
      <div class="wrap section-tight contact">
        <div class="contact-cards">
          <div class="c-card">${ui('pin')}<div><b>Shop / Office</b><p>${esc(SHOP.shop)}</p></div></div>
          <div class="c-card">${ui('home')}<div><b>Head Office</b><p>${esc(SHOP.headOffice)}</p></div></div>
          <div class="c-card">${ui('phone')}<div><b>Phone</b><p>${SHOP.phones.map(n => `<a href="${tel(n)}">+91 ${fmtPhone(n)}</a>`).join('<br>')}</p></div></div>
          <div class="c-card">${ui('whatsapp')}<div><b>WhatsApp</b><p><a href="${wa(`Hi ${SHOP.name}`)}" target="_blank" rel="noopener">+91 ${fmtPhone(SHOP.phones[0])}</a></p></div></div>
          <div class="c-card">${ui('clock')}<div><b>Timings</b><p>${esc(SHOP.hours)}</p></div></div>
          <div class="c-card">${ui('receipt')}<div><b>GSTIN</b><p>${SHOP.gstin}</p></div></div>
        </div>
        <form class="panel form" data-form="contact" novalidate>
          <h3>Send us a message</h3>
          <div class="form-row two">
            <label>Name *<input name="name" required value="${esc(state.user?.name)}"></label>
            <label>Mobile *<input name="mobile" required inputmode="numeric" maxlength="10" value="${esc(state.user?.mobile)}"></label>
          </div>
          <div class="form-row"><label>Subject
            <select name="subject"><option>Product enquiry</option><option>Bulk / dealer order</option><option>Repair & service</option><option>CCTV installation</option><option>Other</option></select></label></div>
          <div class="form-row"><label>Message *<textarea name="message" rows="4" required placeholder="How can we help you?"></textarea></label></div>
          <p class="form-err" hidden></p>
          <button class="btn btn-primary btn-lg btn-block" type="submit">${ui('whatsapp')} Send via WhatsApp</button>
        </form>
        <div class="map">
          <iframe title="Map to ${esc(SHOP.name)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=${encodeURIComponent(SHOP.mapQuery)}&z=15&output=embed"></iframe>
          <a class="btn btn-dark btn-sm map-btn" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SHOP.mapQuery)}" target="_blank" rel="noopener">${ui('pin')} Get Directions</a>
        </div>
      </div>`;
    return { t: 'Contact Us', h };
  }
  function handleContact(form) {
    const d = Object.fromEntries(new FormData(form));
    const err = $('.form-err', form);
    d.mobile = d.mobile.replace(/\D/g, '');
    let msg = '';
    if (d.name.trim().length < 2) msg = 'Please enter your name.';
    else if (!/^[6-9]\d{9}$/.test(d.mobile)) msg = 'Please enter a valid 10 digit mobile number.';
    else if (d.message.trim().length < 3) msg = 'Please write your message.';
    if (msg) { err.textContent = msg; err.hidden = false; return; }
    window.open(wa(`*${d.subject}*\nName: ${d.name.trim()}\nMobile: ${d.mobile}\n\n${d.message.trim()}`), '_blank', 'noopener');
    form.reset();
    toast('Opening WhatsApp… thank you for contacting us!', 'ok');
  }

  const POLICIES = {
    privacy: ['Privacy Policy', [
      ['Information we collect', 'When you log in or place an order we ask for your name, mobile number, address and optional business/GST details. These are stored on your own device and shared with us only when you send an order or enquiry on WhatsApp.'],
      ['How we use it', 'Only to process your orders, deliver products, raise GST invoices and contact you about your order. We never sell or share your details with third parties.'],
      ['Your choices', 'You can edit your details or log out any time from My Account. Clearing your browser data removes all saved information.']]],
    terms: ['Terms & Conditions', [
      ['Prices', 'Prices are subject to change without notice. Final price is confirmed by our team at the time of order confirmation.'],
      ['Orders', 'Orders placed on the website are requests and are confirmed only after our team verifies stock and price with you.'],
      ['Warranty', 'Products carry the manufacturer’s warranty wherever applicable. Physical damage, burn marks and tampering are not covered.'],
      ['Jurisdiction', 'All disputes are subject to Jaipur jurisdiction only.']]],
    returns: ['Return & Replacement Policy', [
      ['Replacement', 'Products with manufacturing defects can be replaced within 7 days of purchase with the original bill, box and accessories.'],
      ['Not returnable', 'Cables cut to length, consumables that have been opened or used (ink, toner), and products with physical damage are not returnable.'],
      ['How to request', `Call or WhatsApp us on +91 ${fmtPhone(SHOP.phones[0])} with your order ID and a photo of the product.`]]],
    shipping: ['Shipping & Delivery', [
      ['Jaipur', `Same or next day delivery across Jaipur. Free delivery on orders above ${inr(SHOP.freeDeliveryAbove)}.`],
      ['Outside Jaipur', 'We ship through courier/transport across Rajasthan and India. Charges as per actual weight and location.'],
      ['Store pickup', `You can also collect your order from ${SHOP.shop}.`]]]
  };
  function viewPolicy(q, key) {
    const pol = POLICIES[key];
    if (!pol) return null;
    const h = `${crumbs([[pol[0]]])}${pageHead(pol[0])}
      <div class="wrap narrow section-tight"><div class="panel prose">
        ${pol[1].map(([t, s]) => `<h3>${t}</h3><p>${esc(s)}</p>`).join('')}
        <p class="muted small">For any questions, <a href="#/contact">contact us</a>.</p>
      </div></div>`;
    return { t: pol[0], h };
  }
  function view404() {
    return { t: 'Page not found', h: `<div class="wrap">${empty('search', 'Page not found', 'The page you are looking for does not exist.', '<a class="btn btn-primary" href="#/">Go to Home</a>')}</div>` };
  }

  /* ---------- router ---------- */
  const routes = [
    [/^\/?$/, viewHome],
    [/^\/categories$/, viewCategories],
    [/^\/category\/([\w-]+)$/, viewCategory],
    [/^\/collection\/([\w-]+)$/, viewCollection],
    [/^\/brand\/(.+)$/, viewBrand],
    [/^\/search$/, viewSearch],
    [/^\/product\/([\w-]+)$/, viewProduct],
    [/^\/cart$/, viewCart],
    [/^\/checkout$/, viewCheckout],
    [/^\/orders$/, viewOrders],
    [/^\/wishlist$/, viewWishlist],
    [/^\/(account|login)$/, viewAccount],
    [/^\/services$/, viewServices],
    [/^\/about$/, viewAbout],
    [/^\/contact$/, viewContact],
    [/^\/page\/([\w-]+)$/, viewPolicy]
  ];
  let lastPath = null;
  function parseHash() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const i = raw.indexOf('?');
    return { path: i < 0 ? raw : raw.slice(0, i), q: new URLSearchParams(i < 0 ? '' : raw.slice(i + 1)) };
  }
  function render() {
    const { path, q } = parseHash();
    let out = null;
    for (const [re, fn] of routes) {
      const m = path.match(re);
      if (m) { out = fn(q, ...m.slice(1)); break; }
    }
    if (!out) out = view404();
    stopSlider();
    document.body.classList.remove('has-sticky');
    $('#app').innerHTML = out.h;
    document.title = out.t.includes(SHOP.name) ? out.t : `${out.t} | ${SHOP.name}`;
    if (out.after) out.after();
    if (path !== lastPath) window.scrollTo(0, 0);
    lastPath = path;
    closeDrawer(); closeSuggest(); closeFilters();
    updateHeader();
    $$('.nav a, .bnav a').forEach(a => {
      const href = a.getAttribute('href');
      a.classList.toggle('active', href === '#' + path || (href === '#/' && path === '/'));
    });
    const sq = $('#search-input');
    if (sq && path === '/search') sq.value = q.get('q') || '';
  }

  /* ---------- header / chrome ---------- */
  function updateHeader() {
    const n = cartCount();
    $$('.cart-badge').forEach(b => { b.textContent = n; b.hidden = n === 0; });
    $$('.wish-badge').forEach(b => { b.textContent = state.wish.length; b.hidden = state.wish.length === 0; });
    const u = state.user;
    $('#top-account').innerHTML = u
      ? `<a href="#/account">${ui('user')} Hi, ${esc(u.name.split(' ')[0])}</a><span>|</span><button data-action="logout">Logout</button>`
      : `<button data-action="login">${ui('user')} Login</button><span>|</span><button data-action="login">Sign Up</button>`;
    $('#hdr-account-label').textContent = u ? u.name.split(' ')[0] : 'Login';
  }
  function buildChrome() {
    // top bar
    $('#topbar').innerHTML = `<div class="wrap topbar-inner">
      <div class="top-left">
        <a href="${tel(SHOP.phones[0])}">${ui('phone')} +91 ${fmtPhone(SHOP.phones[0])}</a>
        <a href="${tel(SHOP.phones[1])}" class="hide-sm">+91 ${fmtPhone(SHOP.phones[1])}</a>
        <span class="hide-md">GSTIN: ${SHOP.gstin}</span>
      </div>
      <div class="top-right" id="top-account"></div>
    </div>`;
    // mega menu
    $('#mega').innerHTML = `<div class="wrap mega-inner">${GROUPS.map(g => `
      <div class="mega-col"><a class="mega-title" href="#/category/${g.id}">${g.name}</a>
      ${catsOf(g.id).map(c => `<a href="#/category/${c.id}">${esc(c.name)}</a>`).join('')}</div>`).join('')}
      <div class="mega-col mega-promo"><b>Need something specific?</b><p>We stock many more items in-store.</p>
        <a class="btn btn-wa btn-sm" href="${wa(`Hi ${SHOP.name}, I am looking for a product.`)}" target="_blank" rel="noopener">${ui('whatsapp')} Ask Us</a></div>
    </div>`;
    // drawer (mobile)
    $('#drawer-body').innerHTML = `
      <a href="#/" class="d-link">${ui('home')} Home</a>
      <div class="d-group"><button class="d-link d-toggle" aria-expanded="false">${ui('grid')} Categories ${ui('down', 'chev')}</button>
        <div class="d-sub">${GROUPS.map(g => `
          <div class="d-group"><button class="d-link d-toggle sub" aria-expanded="false">${g.name} ${ui('down', 'chev')}</button>
            <div class="d-sub"><a href="#/category/${g.id}" class="d-link sub2">All ${g.name}</a>${catsOf(g.id).map(c => `<a href="#/category/${c.id}" class="d-link sub2">${esc(c.name)}</a>`).join('')}</div></div>`).join('')}
        </div></div>
      <a href="#/collection/new" class="d-link">New Arrivals</a>
      <a href="#/collection/deals" class="d-link">Daily Deals</a>
      <a href="#/collection/best" class="d-link">Best Selling</a>
      <a href="#/collection/lot" class="d-link">Stock Lot</a>
      <a href="#/services" class="d-link">Services</a>
      <a href="#/orders" class="d-link">${ui('orders')} My Orders</a>
      <a href="#/wishlist" class="d-link">${ui('heart')} Wishlist</a>
      <a href="#/account" class="d-link">${ui('user')} My Account</a>
      <button class="d-link" data-action="pricelist">${ui('download')} Download Price List</button>
      <a href="#/about" class="d-link">About Us</a>
      <a href="#/contact" class="d-link">Contact Us</a>
      <div class="d-contact">
        <a class="btn btn-primary btn-block" href="${tel(SHOP.phones[0])}">${ui('phone')} Call ${fmtPhone(SHOP.phones[0])}</a>
        <a class="btn btn-wa btn-block" href="${wa(`Hi ${SHOP.name}`)}" target="_blank" rel="noopener">${ui('whatsapp')} WhatsApp Us</a>
      </div>`;
    // footer
    $('#footer').innerHTML = `
      <div class="wrap foot-grid">
        <div class="foot-about">
          <a href="#/" class="logo light"><span class="logo-mark">${logoSvg()}</span><span><b>Krishna</b><small>Computer</small></span></a>
          <p class="foot-slogan">${esc(SHOP.slogan)}</p>
          <p>${SHOP.tagline}. Retail & wholesale supplier of IT accessories with sales, service and installation in Jaipur.</p>
          <p class="gst">GSTIN: <b>${SHOP.gstin}</b></p>
          <div class="foot-social">
            <a href="${wa(`Hi ${SHOP.name}`)}" target="_blank" rel="noopener" aria-label="WhatsApp">${ui('whatsapp')}</a>
            <a href="${tel(SHOP.phones[0])}" aria-label="Call">${ui('phone')}</a>
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SHOP.mapQuery)}" target="_blank" rel="noopener" aria-label="Map">${ui('pin')}</a>
          </div>
        </div>
        <div><h4>Information</h4>
          <a href="#/about">About Us</a><a href="#/contact">Contact Us</a><a href="#/services">Our Services</a>
          <a href="#/page/privacy">Privacy Policy</a><a href="#/page/terms">Terms & Conditions</a><a href="#/page/returns">Return Policy</a><a href="#/page/shipping">Shipping & Delivery</a></div>
        <div><h4>My Account</h4>
          <a href="#/account">Login / Sign Up</a><a href="#/orders">My Orders</a><a href="#/cart">My Cart</a><a href="#/wishlist">Wishlist</a>
          <button data-action="pricelist">Download Price List</button><a href="#/categories">All Categories</a></div>
        <div><h4>Head Office</h4>
          <p class="f-ic">${ui('home')} ${esc(SHOP.headOffice)}</p>
          <h4 class="mt">Shop / Office</h4>
          <p class="f-ic">${ui('pin')} ${esc(SHOP.shop)}</p></div>
        <div><h4>Support</h4>
          ${SHOP.phones.map(n => `<a class="f-ic" href="${tel(n)}">${ui('phone')} +91 ${fmtPhone(n)}</a>`).join('')}
          <a class="f-ic" href="${wa(`Hi ${SHOP.name}`)}" target="_blank" rel="noopener">${ui('whatsapp')} WhatsApp Support</a>
          <p class="f-ic">${ui('clock')} ${esc(SHOP.hours)}</p></div>
      </div>
      <div class="foot-bottom"><div class="wrap">© ${new Date().getFullYear()} ${SHOP.name}, Jaipur. All rights reserved.</div></div>`;
    $$('.logo-mark').forEach(el => { el.innerHTML = logoSvg(); });
    $('#fab-wa').href = wa(`Hi ${SHOP.name}, I have an enquiry.`);
    $('#fab-call').href = tel(SHOP.phones[0]);
  }
  function logoSvg() {
    return '<img src="images/brand/kc-logo.png" alt="KC" class="logo-img">';
  }

  /* ---------- voice search (Chrome / Android) ---------- */
  function initVoiceSearch() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const btn = $('#voice-btn');
    if (!SR || !btn) return;
    btn.hidden = false;
    let rec = null;
    btn.addEventListener('click', () => {
      if (rec) { rec.stop(); return; }
      rec = new SR();
      rec.lang = 'en-IN';
      rec.interimResults = true;
      const input = $('#search-input');
      btn.classList.add('listening');
      input.placeholder = 'Listening… say a product name';
      rec.onresult = e => {
        const text = [...e.results].map(r => r[0].transcript).join(' ').trim();
        input.value = text;
        if (e.results[e.results.length - 1].isFinal && text) {
          location.hash = `#/search?q=${encodeURIComponent(text)}`;
          closeSuggest();
        }
      };
      rec.onerror = e => toast(e.error === 'not-allowed' ? 'Please allow the microphone to use voice search' : 'Could not hear you — please try again');
      rec.onend = () => { rec = null; btn.classList.remove('listening'); input.placeholder = input.dataset.ph; };
      rec.start();
    });
  }

  /* ---------- drawer / filters / search ---------- */
  function openDrawer() { $('#drawer').classList.add('open'); document.body.classList.add('no-scroll'); }
  function closeDrawer() { $('#drawer')?.classList.remove('open'); if (!$('#modal').classList.contains('open')) document.body.classList.remove('no-scroll'); }
  function openFilters() { $('#filters')?.classList.add('open'); document.body.classList.add('no-scroll'); }
  function closeFilters() { $('#filters')?.classList.remove('open'); if (!$('#modal').classList.contains('open') && !$('#drawer').classList.contains('open')) document.body.classList.remove('no-scroll'); }

  let suggestIdx = -1;
  function showSuggest(term) {
    const box = $('#suggest');
    term = term.trim();
    if (term.length < 2) { closeSuggest(); return; }
    const prods = search(term).slice(0, 6);
    const tl = term.toLowerCase();
    const cats = CATEGORIES.filter(c => c.name.toLowerCase().includes(tl)).slice(0, 3);
    if (!prods.length && !cats.length) {
      box.innerHTML = `<div class="sg-empty">No match for “${esc(term)}”. <a href="${wa(`Hi ${SHOP.name}, do you have: ${term}?`)}" target="_blank" rel="noopener">Ask on WhatsApp</a></div>`;
    } else {
      box.innerHTML = cats.map(c => `<a class="sg-item" href="#/category/${c.id}">${ui('grid')}<span>${esc(c.name)}<small>Category</small></span></a>`).join('')
        + prods.map(p => `<a class="sg-item" href="#/product/${p.id}"><span class="sg-thumb"><img src="${esc(p.img)}" alt=""></span><span>${esc(p.name)}<small>${esc(p.brand)}${canSeePrice() ? ' · ' + inr(p.price) : ''}</small></span></a>`).join('')
        + `<a class="sg-all" href="#/search?q=${encodeURIComponent(term)}">See all results for “${esc(term)}” ${ui('right')}</a>`;
    }
    box.hidden = false;
    suggestIdx = -1;
  }
  function closeSuggest() { const b = $('#suggest'); if (b) b.hidden = true; suggestIdx = -1; }

  /* ---------- price list download ---------- */
  function downloadPriceList() {
    if (!canSeePrice()) { openLogin(); toast('Please login to download the price list'); return; }
    const rows = [['SKU', 'Product', 'Brand', 'Category', 'Group', 'MOQ', 'MRP (Rs)', 'Our Price (Rs)', 'Discount %', 'Availability']];
    PRODUCTS.forEach(p => rows.push([p.id.toUpperCase(), p.name, p.brand, catById[p.cat].name, groupOf(p).name, p.moq, p.mrp, p.price, discount(p), p.stock ? 'In stock' : 'Out of stock']));
    const csv = '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `Krishna-Computer-Price-List-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Price list downloaded', 'ok');
  }

  function printOrder(id) {
    const o = state.orders.find(x => x.id === id);
    if (!o) return;
    const w = window.open('', '_blank');
    if (!w) { toast('Please allow pop-ups to print'); return; }
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Order ${o.id}</title>
      <style>body{font:14px/1.5 system-ui,sans-serif;margin:32px;color:#111}h1{margin:0}table{width:100%;border-collapse:collapse;margin:16px 0}td,th{border:1px solid #ccc;padding:6px 8px;text-align:left}th{background:#f3f4f6}.r{text-align:right}.muted{color:#666}</style></head><body>
      <h1>${SHOP.name}</h1><div class="muted">${SHOP.shop}<br>Ph: ${SHOP.phones.join(', ')} · GSTIN: ${SHOP.gstin}</div><hr>
      <p><b>Order:</b> ${o.id} &nbsp; <b>Date:</b> ${new Date(o.date).toLocaleString('en-IN')}</p>
      <p><b>Customer:</b> ${esc(o.customer.name)} (${o.customer.mobile})${o.customer.business ? `<br>${esc(o.customer.business)}` : ''}${o.customer.gstin ? `<br>GSTIN: ${o.customer.gstin}` : ''}${o.address ? `<br>${esc(o.address)}` : ''}</p>
      <table><tr><th>#</th><th>Item</th><th>Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr>
      ${o.items.map((i, n) => `<tr><td>${n + 1}</td><td>${esc(i.name)}</td><td>${i.qty}</td><td class="r">${inr(i.price)}</td><td class="r">${inr(i.price * i.qty)}</td></tr>`).join('')}
      <tr><th colspan="4" class="r">Total (incl. GST)</th><th class="r">${inr(o.total)}</th></tr></table>
      <p class="muted">${esc(o.delivery)} · ${esc(o.payment)}${o.notes ? ` · Notes: ${esc(o.notes)}` : ''}</p>
      <p class="muted">This is an order summary, not a tax invoice.</p>
      <script>window.onload=()=>window.print()<\/script></body></html>`);
    w.document.close();
  }

  /* ---------- home slider ---------- */
  let sliderTimer = null, slideIdx = 0;
  function goSlide(i) {
    const slides = $$('#slides .slide');
    if (!slides.length) return;
    slideIdx = (i + slides.length) % slides.length;
    slides.forEach((s, n) => s.classList.toggle('active', n === slideIdx));
    $$('.dots button').forEach((d, n) => d.classList.toggle('active', n === slideIdx));
  }
  function startSlider() { stopSlider(); sliderTimer = setInterval(() => goSlide(slideIdx + 1), 5000); }
  function stopSlider() { clearInterval(sliderTimer); sliderTimer = null; }
  function initHome() {
    slideIdx = 0;
    const hero = $('.hero');
    startSlider();
    hero.addEventListener('mouseenter', stopSlider);
    hero.addEventListener('mouseleave', startSlider);
    let x0 = null;
    hero.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; stopSlider(); }, { passive: true });
    hero.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) goSlide(slideIdx + (dx < 0 ? 1 : -1));
      x0 = null; startSlider();
    });
    if (!ss.get('kc_promo')) {
      setTimeout(() => {
        if (parseHash().path !== '/' || $('#modal').classList.contains('open')) return;
        ss.set('kc_promo', '1');
        openModal(`
          <div class="promo-pop">
            <span class="kicker">Special Offer</span>
            <h3>Bulk Order Benefits</h3>
            <p>Shop for <b>${inr(5000)}+</b> and get an extra discount & free delivery in Jaipur. Dealers get special rates!</p>
            <div class="promo-tiers">
              <div><b>${inr(5000)}+</b><span>Extra 2% off</span></div>
              <div><b>${inr(10000)}+</b><span>Extra 3% off</span></div>
              <div><b>${inr(25000)}+</b><span>Dealer price</span></div>
            </div>
            <div class="btn-row center">
              <a class="btn btn-accent btn-lg" href="#/collection/deals" data-action="close">Shop Deals</a>
              <a class="btn btn-wa btn-lg" href="${wa(`Hi ${SHOP.name}, I want to know about the bulk order offer.`)}" target="_blank" rel="noopener">${ui('whatsapp')} Ask Now</a>
            </div>
          </div>`, 'modal-promo');
      }, 1500);
    }
  }

  /* ---------- events ---------- */
  document.addEventListener('click', e => {
    const t = e.target.closest('button, a, [data-action]');
    if (!t) return;
    const d = t.dataset;

    if (d.add) { e.preventDefault(); addToCart(d.add); return; }
    if (d.addQty) { addToCart(d.addQty, parseInt($('#pd-qty').value, 10)); return; }
    if (d.buy) {
      const qty = parseInt($('#pd-qty').value, 10);
      const p = prodById[d.buy];
      if (!state.cart.find(i => i.id === p.id)) state.cart.push({ id: p.id, qty: Math.max(qty, p.moq) });
      save(); updateHeader();
      location.hash = '#/checkout';
      return;
    }
    if (d.wish) { e.preventDefault(); toggleWish(d.wish); return; }
    if (d.step) {
      const inp = $('input', t.closest('[data-qty-box]'));
      const min = parseInt(inp.min, 10) || 1;
      inp.value = Math.min(999, Math.max(min, (parseInt(inp.value, 10) || min) + parseInt(d.step, 10)));
      return;
    }
    if (d.cartStep) {
      const line = state.cart.find(i => i.id === d.id);
      if (line) { setQty(d.id, line.qty + parseInt(d.cartStep, 10)); render(); }
      return;
    }
    if (d.remove) { removeFromCart(d.remove); toast('Item removed from cart'); render(); return; }
    if (d.rail) {
      const r = $('#' + d.rail);
      r.scrollBy({ left: parseInt(d.dir, 10) * r.clientWidth * 0.85, behavior: 'smooth' });
      return;
    }
    if (d.slide) { goSlide(slideIdx + parseInt(d.slide, 10)); startSlider(); return; }
    if (d.dot) { goSlide(parseInt(d.dot, 10)); startSlider(); return; }
    if (d.tab !== undefined) {
      const box = t.closest('[data-tabs]');
      $$('.tab-btns button', box).forEach((b, i) => b.classList.toggle('active', i === +d.tab));
      $$('.tab-panel', box).forEach((p, i) => p.classList.toggle('active', i === +d.tab));
      return;
    }
    if (d.share) { copyText(location.href, 'Product link copied'); return; }
    if (d.copy) {
      const p = prodById[d.copy];
      copyText(`${p.name}\nProduct ID: ${p.id.toUpperCase()}\nBrand: ${p.brand}${canSeePrice() ? `\nPrice: ${inr(p.price)}` : ''}\n${location.href}\n— ${SHOP.name}, Jaipur · ${SHOP.phones[0]}`, 'Product details copied');
      return;
    }
    if (d.thumb) {
      $('.pd-main .pimg img').src = d.thumb;
      $$('.pd-thumbs button').forEach(b => b.classList.toggle('on', b === t));
      return;
    }
    if (d.reorder) {
      const o = state.orders.find(x => x.id === d.reorder);
      o.items.forEach(i => { if (prodById[i.id]?.stock) { const l = state.cart.find(c => c.id === i.id); if (l) l.qty += i.qty; else state.cart.push({ id: i.id, qty: i.qty }); } });
      save(); updateHeader();
      toast('Items added to cart', 'ok', { label: 'View Cart', href: '#/cart' });
      return;
    }
    if (d.print) { printOrder(d.print); return; }
    if (t.classList.contains('d-toggle')) {
      const g = t.parentElement;
      const open = g.classList.toggle('open');
      t.setAttribute('aria-expanded', open);
      return;
    }

    switch (d.action) {
      case 'login': e.preventDefault(); openLogin(d.next || ''); return;
      case 'logout': logout(); return;
      case 'close': closeModal(); return;
      case 'menu': openDrawer(); return;
      case 'close-drawer': closeDrawer(); return;
      case 'open-filters': openFilters(); return;
      case 'close-filters': closeFilters(); return;
      case 'pricelist': downloadPriceList(); return;
      case 'top': window.scrollTo({ top: 0, behavior: 'smooth' }); return;
      case 'clear-cart':
        if (confirm('Remove all items from your cart?')) { state.cart = []; save(); render(); }
        return;
      case 'search-toggle': $('.hdr-search').classList.toggle('open'); $('#search-input').focus(); return;
    }
  });

  document.addEventListener('submit', e => {
    const f = e.target;
    if (f.id === 'search-form') {
      e.preventDefault();
      const term = $('#search-input').value.trim();
      if (term) { location.hash = `#/search?q=${encodeURIComponent(term)}`; $('#search-input').blur(); closeSuggest(); }
      return;
    }
    const kind = f.dataset.form;
    if (!kind) return;
    e.preventDefault();
    if (kind === 'login') handleLogin(f);
    else if (kind === 'checkout') handleCheckout(f);
    else if (kind === 'contact') handleContact(f);
  });

  document.addEventListener('change', e => {
    const t = e.target;
    const filterForm = t.closest('form[data-filter]');
    if (filterForm) {
      const base = filterForm.dataset.filter;
      const [path, qs] = base.split('?');
      const params = new URLSearchParams(qs || '');
      ['brand', 'stock', 'sort'].forEach(k => params.delete(k));
      new FormData(filterForm).forEach((v, k) => { if (!(k === 'sort' && v === 'popular')) params.append(k, v); });
      const s = params.toString();
      location.hash = path + (s ? '?' + s : '');
      return;
    }
    if (t.matches('[data-sort]')) {
      const form = $('form[data-filter]');
      form.sort.value = t.value;
      form.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    if (t.matches('[data-cart-qty]')) {
      const v = parseInt(t.value, 10);
      setQty(t.dataset.cartQty, isNaN(v) ? 0 : v);
      render();
      return;
    }
    if (t.name === 'delivery') syncDelivery();
  });

  const searchInput = $('#search-input');
  searchInput.addEventListener('input', () => showSuggest(searchInput.value));
  searchInput.addEventListener('focus', () => showSuggest(searchInput.value));
  searchInput.addEventListener('keydown', e => {
    const items = $$('#suggest a');
    if (!items.length || $('#suggest').hidden) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      suggestIdx = (suggestIdx + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((a, i) => a.classList.toggle('hover', i === suggestIdx));
    } else if (e.key === 'Enter' && suggestIdx >= 0) {
      e.preventDefault(); location.hash = items[suggestIdx].getAttribute('href');
    } else if (e.key === 'Escape') closeSuggest();
  });
  document.addEventListener('mousedown', e => { if (!e.target.closest('.hdr-search')) closeSuggest(); });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if ($('#modal').classList.contains('open')) closeModal();
    closeDrawer(); closeFilters();
  });
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal' || e.target.closest('.modal-x')) closeModal(); });
  $('#drawer').addEventListener('click', e => { if (e.target.id === 'drawer') closeDrawer(); });
  document.addEventListener('click', e => { const f = $('#filters.open'); if (f && e.target === f) closeFilters(); });

  // sticky header shadow + back-to-top
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    $('#header').classList.toggle('scrolled', y > 40);
    $('#to-top').classList.toggle('show', y > 600);
    updateSticky();
  }, { passive: true });

  // mega-menu: keep open on click for touch / keyboard
  const navCat = $('#nav-cat');
  navCat.addEventListener('click', e => {
    if (e.target.closest('#mega a')) { navCat.classList.remove('open'); navCat.classList.add('suppress'); return; }
    if (e.target.closest('.nav-cat-btn')) { e.preventDefault(); navCat.classList.toggle('open'); }
  });
  navCat.addEventListener('mouseleave', () => navCat.classList.remove('suppress'));
  document.addEventListener('click', e => { if (!e.target.closest('#nav-cat')) navCat.classList.remove('open'); });
  window.addEventListener('hashchange', () => { navCat.classList.remove('open'); render(); });

  // sync cart across browser tabs
  window.addEventListener('storage', e => {
    if (!e.key?.startsWith('kc_')) return;
    state.cart = store.get('kc_cart', []); state.user = store.get('kc_user', null);
    state.orders = store.get('kc_orders', []); state.wish = store.get('kc_wish', []);
    render();
  });

  buildChrome();
  $('#search-input').dataset.ph = $('#search-input').placeholder;
  initVoiceSearch();
  render();
})();
