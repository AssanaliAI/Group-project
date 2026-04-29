/* =====================================================
   STRIDE — Shop Logic
   Vanilla JavaScript · No frameworks
   Features:
     • Product catalogue rendering
     • Category filtering
     • Cart with localStorage persistence
     • Auto-calculation of totals (subtotal, tax, total)
     • Quantity controls (increase, decrease, remove)
     • Form validation
     • Mobile menu
     • Toast notifications
     • Order success modal
   ===================================================== */

(() => {
  'use strict';

  /* ---------- 1. PRODUCT DATA ---------- */
  const PRODUCTS = [
    {
      id: 1,
      name: 'Velocity Pulse',
      category: 'running',
      price: 189,
      description: 'Lightweight performance trainer with responsive cushioning.',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
      badge: 'New'
    },
    {
      id: 2,
      name: 'Apex Runner',
      category: 'running',
      price: 165,
      description: 'Engineered mesh upper for breathability on long distances.',
      image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&q=80',
      badge: null
    },
    {
      id: 3,
      name: 'Cloud Walker',
      category: 'lifestyle',
      price: 145,
      description: 'Everyday comfort meets refined urban styling.',
      image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&q=80',
      badge: null
    },
    {
      id: 4,
      name: 'Court Classic',
      category: 'basketball',
      price: 220,
      description: 'High-top silhouette built for explosive movement.',
      image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80',
      badge: '-15%'
    },
    {
      id: 5,
      name: 'Studio 88',
      category: 'lifestyle',
      price: 135,
      description: 'Retro-inspired design with premium leather details.',
      image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&q=80',
      badge: null
    },
    {
      id: 6,
      name: 'Trail Pro X',
      category: 'running',
      price: 199,
      description: 'Aggressive grip pattern for off-road adventures.',
      image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=600&q=80',
      badge: null
    },
    {
      id: 7,
      name: 'Skyline Mid',
      category: 'basketball',
      price: 175,
      description: 'Mid-cut profile, foam core, lockdown lacing system.',
      image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=600&q=80',
      badge: 'Hot'
    },
    {
      id: 8,
      name: 'Linen Low',
      category: 'lifestyle',
      price: 119,
      description: 'Soft canvas build for relaxed weekend pace.',
      image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600&q=80',
      badge: null
    }
  ];

  /* ---------- 2. CART STORAGE LAYER ---------- */
  const STORAGE_KEY = 'stride_cart_v1';

  const Cart = {
    get() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      } catch {
        return [];
      }
    },

    save(cart) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    },

    add(productId) {
      const cart = this.get();
      const existing = cart.find(it => it.id === productId);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ id: productId, qty: 1 });
      }
      this.save(cart);
    },

    setQty(productId, qty) {
      let cart = this.get();
      if (qty <= 0) {
        cart = cart.filter(it => it.id !== productId);
      } else {
        const item = cart.find(it => it.id === productId);
        if (item) item.qty = qty;
      }
      this.save(cart);
    },

    remove(productId) {
      const cart = this.get().filter(it => it.id !== productId);
      this.save(cart);
    },

    clear() {
      localStorage.removeItem(STORAGE_KEY);
    },

    count() {
      return this.get().reduce((sum, it) => sum + it.qty, 0);
    },

    /** Returns enriched cart items with product info */
    detailed() {
      return this.get()
        .map(item => {
          const product = PRODUCTS.find(p => p.id === item.id);
          if (!product) return null;
          return { ...product, qty: item.qty, lineTotal: product.price * item.qty };
        })
        .filter(Boolean);
    },

    subtotal() {
      return this.detailed().reduce((sum, it) => sum + it.lineTotal, 0);
    }
  };

  /* ---------- 3. UTILITIES ---------- */
  const $  = (sel, parent = document) => parent.querySelector(sel);
  const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];

  const formatMoney = (amount) =>
    '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /** Toast notification */
  let toastTimer;
  function showToast(message) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
  }

  /* ---------- 4. CART BADGE (in header) ---------- */
  function updateCartBadge(animate = false) {
    const count = Cart.count();
    $$('[data-cart-count]').forEach(badge => {
      badge.textContent = count;
      if (count > 0) {
        badge.classList.add('is-visible');
        if (animate) {
          badge.classList.remove('bump');
          // force reflow to restart animation
          void badge.offsetWidth;
          badge.classList.add('bump');
        }
      } else {
        badge.classList.remove('is-visible');
      }
    });
  }

  /* ---------- 5. CATALOGUE PAGE ---------- */
  function initCataloguePage() {
    const grid = $('#products-grid');
    if (!grid) return;

    let activeFilter = 'all';

    function render() {
      const items = activeFilter === 'all'
        ? PRODUCTS
        : PRODUCTS.filter(p => p.category === activeFilter);

      grid.innerHTML = items.map((p, idx) => `
        <article class="product" style="animation-delay:${idx * 0.06}s">
          <div class="product__media">
            ${p.badge ? `<span class="product__badge">${p.badge}</span>` : ''}
            <img src="${p.image}" alt="${p.name}" loading="lazy" />
          </div>
          <div class="product__body">
            <span class="product__cat">${p.category}</span>
            <h3 class="product__name">${p.name}</h3>
            <p class="product__desc">${p.description}</p>
            <div class="product__foot">
              <span class="product__price">${formatMoney(p.price)}</span>
              <button class="product__add" data-add="${p.id}" aria-label="Add ${p.name} to cart" title="Add to cart">+</button>
            </div>
          </div>
        </article>
      `).join('');

      // Bind add-to-cart buttons
      $$('[data-add]', grid).forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.dataset.add, 10);
          Cart.add(id);
          updateCartBadge(true);
          const product = PRODUCTS.find(p => p.id === id);
          showToast(`${product.name} added to cart`);
        });
      });
    }

    // Filter buttons
    $$('.filter').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.filter').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        activeFilter = btn.dataset.filter;
        render();
      });
    });

    render();
  }

  /* ---------- 6. CART PAGE ---------- */
  function initCartPage() {
    const itemsRoot = $('#cart-items');
    if (!itemsRoot) return;

    function renderCart() {
      const items = Cart.detailed();

      if (items.length === 0) {
        // Replace whole cart-grid with empty state
        const cartGrid = $('.cart-grid');
        const tpl = $('#empty-cart-template');
        if (cartGrid && tpl) {
          cartGrid.replaceWith(tpl.content.cloneNode(true));
          $('#cart-summary-line').textContent = "There's nothing here yet.";
        }
        updateSummary();
        return;
      }

      itemsRoot.innerHTML = items.map(it => `
        <article class="cart-item" data-id="${it.id}">
          <div class="cart-item__media">
            <img src="${it.image}" alt="${it.name}" loading="lazy"/>
          </div>
          <div class="cart-item__body">
            <span class="cart-item__cat">${it.category}</span>
            <h3 class="cart-item__name">${it.name}</h3>
            <span class="cart-item__price-unit">${formatMoney(it.price)} per pair</span>
            <div class="cart-item__controls">
              <div class="qty">
                <button data-action="decrease" aria-label="Decrease quantity">−</button>
                <span class="qty__count">${it.qty}</span>
                <button data-action="increase" aria-label="Increase quantity">+</button>
              </div>
              <button class="cart-item__remove" data-action="remove">Remove</button>
            </div>
          </div>
          <div class="cart-item__total">
            <span>${formatMoney(it.lineTotal)}</span>
          </div>
        </article>
      `).join('');

      // Bind events (delegated would also work)
      $$('.cart-item', itemsRoot).forEach(card => {
        const id = parseInt(card.dataset.id, 10);
        const current = Cart.get().find(it => it.id === id);

        $('[data-action="increase"]', card).addEventListener('click', () => {
          Cart.setQty(id, current.qty + 1);
          renderAll();
        });
        $('[data-action="decrease"]', card).addEventListener('click', () => {
          if (current.qty > 1) {
            Cart.setQty(id, current.qty - 1);
            renderAll();
          } else {
            removeWithAnimation(card, id);
          }
        });
        $('[data-action="remove"]', card).addEventListener('click', () => {
          removeWithAnimation(card, id);
        });
      });

      updateSummary();
    }

    function removeWithAnimation(card, id) {
      card.classList.add('is-removing');
      setTimeout(() => {
        Cart.remove(id);
        renderAll();
      }, 280);
    }

    function updateSummary() {
      const subtotal = Cart.subtotal();
      const tax = subtotal * 0.12;
      const total = subtotal + tax;

      const set = (key, value) => {
        const el = $(`[data-summary="${key}"]`);
        if (el) el.textContent = value;
      };

      set('subtotal', formatMoney(subtotal));
      set('tax',      formatMoney(tax));
      set('total',    formatMoney(total));

      const summaryLine = $('#cart-summary-line');
      const items = Cart.detailed();
      if (summaryLine && items.length > 0) {
        const itemCount = Cart.count();
        summaryLine.textContent = `${itemCount} item${itemCount === 1 ? '' : 's'} ready for checkout.`;
      }
    }

    function renderAll() {
      renderCart();
      updateCartBadge(true);
    }

    /* --------- Form validation --------- */
    const form = $('#checkout-form');
    if (form) {
      const validators = {
        name:    (v) => v.trim().length >= 2 || 'Please enter your full name.',
        email:   (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Enter a valid email address.',
        phone:   (v) => /^[\d\s+\-()]{7,}$/.test(v.trim()) || 'Enter a valid phone number.',
        address: (v) => v.trim().length >= 5 || 'Address is too short.',
        payment: (v) => v.trim().length > 0 || 'Please select a payment method.'
      };

      function validateField(field) {
        const result = validators[field.name](field.value);
        const wrapper = field.closest('.field');
        const errorEl = $(`[data-error-for="${field.name}"]`);
        if (result === true) {
          wrapper.classList.remove('has-error');
          errorEl.textContent = '';
          return true;
        } else {
          wrapper.classList.add('has-error');
          errorEl.textContent = result;
          return false;
        }
      }

      // Real-time validation on blur + input (after first error)
      $$('input, textarea, select', form).forEach(field => {
        if (!validators[field.name]) return;
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => {
          if (field.closest('.field').classList.contains('has-error')) {
            validateField(field);
          }
        });
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (Cart.count() === 0) {
          showToast('Your cart is empty');
          return;
        }

        // Validate all
        const fields = $$('input, textarea, select', form).filter(f => validators[f.name]);
        const allValid = fields.map(validateField).every(Boolean);
        if (!allValid) {
          showToast('Please fix the errors in the form');
          return;
        }

        // Show success modal
        const orderId = Math.floor(100000 + Math.random() * 900000);
        $('#order-id').textContent = orderId;
        $('#order-modal').hidden = false;

        // Clear cart
        Cart.clear();
        updateCartBadge(false);
      });
    }

    // Modal close handlers
    $$('[data-close-modal]').forEach(el => {
      el.addEventListener('click', () => {
        $('#order-modal').hidden = true;
        window.location.href = 'index.html';
      });
    });

    renderAll();
  }

  /* ---------- 7. MOBILE MENU ---------- */
  function initMobileMenu() {
    const burger = $('#burger');
    const nav    = $('.nav');
    if (!burger || !nav) return;

    burger.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      burger.classList.toggle('is-open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
    });

    // Close on link click
    $$('.nav__link', nav).forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        burger.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- 8. INIT ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge(false);
    initMobileMenu();
    initCataloguePage();
    initCartPage();
  });

})();
