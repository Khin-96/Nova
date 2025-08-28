document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const searchBtn = document.getElementById("search-btn");
  const searchInput = document.getElementById("search-input");
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileShopBtn = document.getElementById("mobile-shop-btn");
  const mobileCategories = document.getElementById("mobile-categories");
  const cartBtn = document.getElementById("cart-btn");
  const cartSidebar = document.getElementById("cart-sidebar");
  const closeCartBtn = document.getElementById("close-cart");
  const contactForm = document.getElementById("contact-form");
  const newsletterForm = document.getElementById("newsletter-form");
  const productsContainer = document.getElementById("featured-products");
  const heroSection = document.querySelector(".relative.bg-black.text-white");
  const heroShopNowBtn = document.getElementById("hero-shop-now-btn");
  const mpesaCheckoutBtn = document.getElementById("mpesa-checkout-btn");
  const mpesaPhoneInput = document.getElementById("mpesa-phone");
  const mpesaResponseEl = document.getElementById("mpesa-response");
  const deliveryLocationSelect = document.getElementById("delivery-location");
  const deliveryFeeEl = document.getElementById("delivery-fee");
  const cartTotalEl = document.getElementById("cart-total");
  const cartSubtotalEl = document.getElementById("cart-subtotal");
  const cartItemsContainer = document.getElementById("cart-items");
  const cartCount = document.getElementById("cart-count");

  // Base URL for API endpoints
  const API_BASE_URL = "https://novawear.onrender.com";
  
  // Fallback products data if API fails
  const FALLBACK_PRODUCTS = [
    {
      id: "fallback1",
      name: "Classic Hoodie",
      price: 2499,
      image: "/images/fallback-hoodie.jpg",
      category: "hoodies",
      sizes: ["S", "M", "L", "XL"],
      tags: ["new"]
    },
    {
      id: "fallback2",
      name: "Basic T-Shirt",
      price: 1299,
      image: "/images/fallback-tshirt.jpg",
      category: "tshirts",
      sizes: ["S", "M", "L"],
      tags: ["sale"]
    },
    {
      id: "fallback3",
      name: "Slim Fit Pants",
      price: 1899,
      image: "/images/fallback-pants.jpg",
      category: "pants",
      sizes: ["M", "L", "XL"],
      tags: []
    },
    {
      id: "fallback4",
      name: "Denim Jacket",
      price: 3499,
      image: "/images/fallback-jacket.jpg",
      category: "outerwear",
      sizes: ["S", "M", "L"],
      tags: ["new"]
    }
  ];

  // --- State ---
  let searchTimeout = null;
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const DELIVERY_FEE = 450; // KES for locations outside Mombasa/Kilifi
  const VALID_SIZES = ["S", "M", "L", "XL"]; // Define valid sizes

  // --- Initialize ---
  updateCartUI();
  showHomePage();

  // --- Event Listeners ---
  searchBtn?.addEventListener("click", toggleSearch);
  searchInput?.addEventListener("input", handleSearchInput);
  searchInput?.addEventListener("keypress", handleSearchEnter);
  mobileMenuBtn?.addEventListener("click", toggleMobileMenu);
  mobileShopBtn?.addEventListener("click", toggleMobileCategories);
  cartBtn?.addEventListener("click", openCart);
  closeCartBtn?.addEventListener("click", closeCart);
  heroShopNowBtn?.addEventListener("click", openCartFromHero);
  mpesaCheckoutBtn?.addEventListener("click", handleMpesaCheckout);
  deliveryLocationSelect?.addEventListener("change", updateDeliveryFee);
  contactForm?.addEventListener("submit", handleContactFormSubmit);
  newsletterForm?.addEventListener("submit", handleNewsletterSubmit);

  // Add event delegation for category links, about links
  document.addEventListener("click", (e) => {
    // Handle category links
    const categoryLink = e.target.closest("[data-category]");
    if (categoryLink) {
      e.preventDefault();
      const category = categoryLink.getAttribute("data-category");
      loadProductsByCategory(category);
      return;
    }

    // Handle about links
    const aboutLink = e.target.closest("#about-link, #footer-about-link, #mobile-about-link");
    if (aboutLink) {
      e.preventDefault();
      showAboutSection();
      return;
    }
  });

  // Event delegation for cart buttons
  cartItemsContainer?.addEventListener("click", (e) => {
    const target = e.target.closest("button");
    if (!target) return;

    const id = target.getAttribute("data-id");
    const size = target.getAttribute("data-size");

    if (!id || !size || !VALID_SIZES.includes(size)) {
        console.error(`Invalid ID ('${id}') or Size ('${size}') for cart action.`);
        return;
    }

    if (target.classList.contains("remove-from-cart")) {
        removeFromCart(id, size);
    } else if (target.classList.contains("decrease-btn")) {
        updateCartItemQuantity(id, size, "decrease");
    } else if (target.classList.contains("increase-btn")) {
        updateCartItemQuantity(id, size, "increase");
    }
  });

  // --- Navigation Functions ---
  function toggleSearch() {
    if (searchInput.classList.contains("hidden")) {
      searchInput.classList.remove("hidden");
      searchInput.focus();
    } else {
      if (searchInput.value.trim() !== "") {
        performSearch(searchInput.value.trim());
      }
    }
  }

  function handleSearchInput() {
    clearTimeout(searchTimeout);
    const query = searchInput.value.trim();
    if (query.length > 1) {
      searchTimeout = setTimeout(() => performSearch(query), 300);
    } else if (query.length === 0) {
      showHomePage();
    }
  }

  function handleSearchEnter(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      clearTimeout(searchTimeout);
      const query = searchInput.value.trim();
      if (query) performSearch(query);
    }
  }

  function toggleMobileMenu() {
    mobileMenu.classList.toggle("hidden");
  }

  function toggleMobileCategories() {
    mobileCategories.classList.toggle("hidden");
  }

  function openCart() {
    cartSidebar.classList.remove("cart-closed");
    cartSidebar.classList.add("cart-open");
  }

  function closeCart() {
    cartSidebar.classList.remove("cart-open");
    cartSidebar.classList.add("cart-closed");
  }

  function openCartFromHero(event) {
    event.preventDefault();
    openCart();
  }

  function showAboutSection() {
    hideAllSections();
    const aboutSection = document.getElementById("about-section-content");
    if (aboutSection) aboutSection.classList.remove("hidden");
    updatePageTitle("About Us - Nova Wear");
  }

  // --- Cart Functions ---
  function addToCart(product, size) {
    if (!VALID_SIZES.includes(size)) {
        console.error(`Attempted to add product with invalid size: ${size}.`);
        alert(`Invalid size selected: ${size}. Please select a valid size.`);
        return;
    }
    
    if (!product || !product.id) {
        console.error("Attempted to add product without a valid ID:", product);
        alert("Cannot add this item to the cart. Product ID is missing.");
        return;
    }

    const existingItem = cart.find(
      (item) => item.id === product.id && item.size === size
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      const cartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        size: size,
        quantity: 1,
        category: product.category,
        tags: product.tags,
        sizes: product.sizes
      };
      cart.push(cartItem);
    }

    saveCart();
    updateCartUI();
    openCart();
  }

  function removeFromCart(productId, size) {
    const initialLength = cart.length;
    cart = cart.filter(
      (item) => !(item.id === productId && item.size === size)
    );
    if (cart.length < initialLength) {
      saveCart();
      updateCartUI();
    } else {
      console.error("Failed to find item to remove.");
    }
  }

  function updateCartItemQuantity(productId, size, action) {
    const item = cart.find(
      (item) => item.id === productId && item.size === size
    );

    if (!item) {
      console.error("Item not found for quantity update.");
      return;
    }

    if (action === "increase") {
      item.quantity += 1;
    } else if (action === "decrease") {
      item.quantity -= 1;
      if (item.quantity <= 0) {
        removeFromCart(productId, size);
        return;
      }
    }

    saveCart();
    updateCartUI();
  }

  function saveCart() {
    const cartToSave = Array.isArray(cart) ? cart : [];
    localStorage.setItem("cart", JSON.stringify(cartToSave));
  }

  function clearCart() {
    cart = [];
    saveCart();
    updateCartUI();
  }

  function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    if (cartCount) cartCount.textContent = totalItems;

    if (!cartItemsContainer) {
      console.error("Cart items container not found!");
      return;
    }

    if (cart.length === 0) {
      cartItemsContainer.innerHTML =
        '<p class="text-gray-500 text-center py-6">Your cart is empty</p>';
    } else {
      cartItemsContainer.innerHTML = cart
        .map(
          (item) => {
            if (!item || !item.id || !item.size || !VALID_SIZES.includes(item.size) || !item.quantity || item.quantity <= 0) {
                console.warn("Skipping invalid cart item:", item);
                return '';
            }

            const imageUrl = item.image && item.image.startsWith("http") ? item.image : `${API_BASE_URL}${item.image || ''}`;
            return `
              <div class="flex items-center py-4 border-b">
                <div class="w-16 h-16 flex-shrink-0 mr-4">
                  <img src="${imageUrl}?${Date.now()}" alt="${item.name || 'Product'}" class="w-full h-full object-cover rounded">
                </div>
                <div class="flex-grow">
                  <h4 class="font-medium">${item.name || 'Unknown Product'}</h4>
                  <p class="text-sm text-gray-600">Size: ${item.size}</p>
                  <div class="flex justify-between mt-1">
                    <div class="flex items-center">
                      <button class="cart-qty-btn decrease-btn px-2 py-0.5 border rounded" 
                              data-id="${item.id}" data-size="${item.size}">-</button>
                      <span class="mx-2">${item.quantity}</span>
                      <button class="cart-qty-btn increase-btn px-2 py-0.5 border rounded" 
                              data-id="${item.id}" data-size="${item.size}">+</button>
                    </div>
                    <span>KES ${((item.price || 0) * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
                <button class="remove-from-cart ml-4 text-gray-400 hover:text-red-500" 
                        data-id="${item.id}" data-size="${item.size}">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            `;
          }
        )
        .join("");
    }

    updateDeliveryFee();
  }

  function updateDeliveryFee() {
    const subtotal = cart.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
      0
    );
    const location = deliveryLocationSelect?.value || "mombasa";
    const deliveryFee = location === "other" ? DELIVERY_FEE : 0;
    const total = subtotal + deliveryFee;

    if (cartSubtotalEl) cartSubtotalEl.textContent = `KES ${subtotal.toFixed(2)}`;
    if (deliveryFeeEl) deliveryFeeEl.textContent = `KES ${deliveryFee.toFixed(2)}`;
    if (cartTotalEl) cartTotalEl.textContent = `KES ${total.toFixed(2)}`;
  }

  // --- Product Display Functions ---
  async function showHomePage() {
    hideAllSections();
    heroSection?.classList.remove("hidden");
    document.getElementById("featured-products-section")?.classList.remove("hidden");
    document.getElementById("contact")?.classList.remove("hidden");
    document.querySelector(".bg-gray-900")?.classList.remove("hidden");
    document.querySelector(".py-16.bg-gray-50")?.classList.remove("hidden");
    loadFeaturedProducts();
    updatePageTitle("Nova Wear - We Style You");
  }

  async function loadFeaturedProducts() {
    const featuredProductsContainer = document.getElementById("featured-products");
    if (!featuredProductsContainer) return;
    
    try {
      const response = await fetchWithFallback(`${API_BASE_URL}/api/products/featured`);
      displayProducts(response, featuredProductsContainer);
    } catch (error) {
      console.error("Error loading featured products:", error);
      displayProducts(FALLBACK_PRODUCTS, featuredProductsContainer);
    }
  }

  async function loadProductsByCategory(category) {
    hideAllSections();
    const productSection = document.getElementById("product-display-section");
    const productGrid = document.getElementById("product-grid");
    const categoryTitleEl = document.getElementById("category-title");

    if (!productSection || !productGrid || !categoryTitleEl) {
      console.error("Required elements for category display not found.");
      return;
    }

    productSection.classList.remove("hidden");
    const categoryTitle = category === "all" ? "All Products" :
                         category.charAt(0).toUpperCase() + category.slice(1);
    categoryTitleEl.textContent = categoryTitle;
    productGrid.innerHTML = 
      `<div class="animate-pulse bg-gray-200 rounded-lg h-80 col-span-full md:col-span-2 lg:col-span-4"></div>`;
    updatePageTitle(`Shop ${categoryTitle} - Nova Wear`);

    try {
      const endpoint = category === "all" ? "/api/products" :
                     `/api/products?category=${encodeURIComponent(category)}`;
      const response = await fetchWithFallback(`${API_BASE_URL}${endpoint}`);
      displayProducts(response, productGrid);
    } catch (error) {
      console.error(`Error loading ${category} products:`, error);
      displayProducts(FALLBACK_PRODUCTS.filter(p => category === "all" || p.category === category), productGrid);
    }
  }

  function displayProducts(products, container) {
    if (!container) return;
    
    container.innerHTML = ''; 

    if (!Array.isArray(products) || products.length === 0) {
      const noProductsMsg = document.createElement("p");
      noProductsMsg.className = "text-gray-500 text-center col-span-full";
      noProductsMsg.textContent = "No products found.";
      container.appendChild(noProductsMsg);
      return;
    }

    products.forEach((product) => {
      if (!product || !product.id) {
          console.warn("Skipping display of product with missing ID:", product);
          return;
      }

      const productCard = document.createElement("div");
      productCard.className =
        "product-card bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow duration-300";

      const tagsHTML = product.tags?.map(tag => `
        <span class="tag tag-${tag}">${formatTagName(tag)}</span>
      `).join('') || '';

      const imageUrl = product.image && product.image.startsWith("http") ? product.image : `${API_BASE_URL}${product.image || ''}`;

      productCard.innerHTML = `
        <div class="relative overflow-hidden h-48 md:h-64">
          ${tagsHTML}
          <img src="${imageUrl}?${Date.now()}" alt="${product.name || 'Product'}" class="product-image w-full h-full object-cover">
          <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white px-3 py-2">
            <span class="text-sm">${product.category || 'Uncategorized'}</span>
          </div>
        </div>
        <div class="p-4">
          <h3 class="font-medium text-lg">${product.name || 'Unknown Product'}</h3>
          <div class="mt-2 mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Size</label>
            <div class="flex space-x-2">
              ${(product.sizes && product.sizes.length > 0 ? product.sizes : VALID_SIZES).map(size => 
                `<button class="size-option border rounded px-2 py-1 text-sm hover:bg-gray-100" data-size="${size}">${size}</button>`
              ).join("")}
            </div>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-900 font-bold">KES ${(product.price || 0).toFixed(2)}</span>
            <button class="add-to-cart bg-black text-white px-3 py-1 rounded-md text-sm hover:bg-gray-800" data-product-id="${product.id}">
              Add to Cart
            </button>
          </div>
        </div>
      `;
      container.appendChild(productCard);

      const sizeOptions = productCard.querySelectorAll(".size-option");
      if (sizeOptions.length > 0) {
        const defaultSizeBtn = productCard.querySelector('.size-option[data-size="M"]') || sizeOptions[0];
        defaultSizeBtn.classList.add("bg-black", "text-white");
      }

      const addToCartBtn = productCard.querySelector(".add-to-cart");
      addToCartBtn.addEventListener("click", () => {
        const selectedSizeBtn = productCard.querySelector(".size-option.bg-black");
        const selectedSize = selectedSizeBtn ? selectedSizeBtn.getAttribute("data-size") : (productCard.querySelector('.size-option[data-size="M"]') || sizeOptions[0])?.getAttribute("data-size"); 
        
        if (!selectedSize) {
            alert("Please select a size before adding to cart.");
            return;
        }

        addToCart(product, selectedSize);
      });

      sizeOptions.forEach((option) => {
        option.addEventListener("click", (e) => {
          e.preventDefault();
          sizeOptions.forEach((opt) =>
            opt.classList.remove("bg-black", "text-white")
          );
          option.classList.add("bg-black", "text-white");
        });
      });
    });
  }

  function formatTagName(tag) {
    const names = {
      new: "New",
      "out-of-stock": "Out of Stock",
      "coming-soon": "Coming Soon",
      sale: "Sale",
    };
    return names[tag] || tag;
  }

  // --- Search Functionality ---
  async function performSearch(query) {
    hideAllSections();
    const productSection = document.getElementById("product-display-section");
    const productGrid = document.getElementById("product-grid");
    const categoryTitleEl = document.getElementById("category-title");

    if (!productSection || !productGrid || !categoryTitleEl) {
      console.error("Required elements for search display not found.");
      return;
    }

    productSection.classList.remove("hidden");
    categoryTitleEl.textContent = `Search Results for "${query}"`;
    productGrid.innerHTML = 
      `<div class="animate-pulse bg-gray-200 rounded-lg h-80 col-span-full md:col-span-2 lg:col-span-4"></div>`;
    updatePageTitle(`Search Results for "${query}" - Nova Wear`);

    try {
      const response = await fetchWithFallback(`${API_BASE_URL}/api/products?search=${encodeURIComponent(query)}`);
      displayProducts(response, productGrid);
    } catch (error) {
      console.error("Error performing search:", error);
      const filteredProducts = FALLBACK_PRODUCTS.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) || 
        p.category.toLowerCase().includes(query.toLowerCase())
      );
      displayProducts(filteredProducts, productGrid);
    }
  }

  // --- API Helper Function ---
  async function fetchWithFallback(url) {
    try {
      const response = await fetch(`${url}?nocache=${Date.now()}`);
      
      // First check if response is HTML (error page)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Server returned HTML instead of JSON');
      }
      
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request to ${url} failed:`, error);
      throw error; // Re-throw to allow caller to handle fallback
    }
  }

   // --- Form Handling - Updated for Formspree ---
   async function handleContactFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const responseDiv = document.getElementById("contact-response");
    const submitButton = form.querySelector("button[type='submit']");
    const originalButtonText = submitButton.textContent;

    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Sending...';
    showResponse(responseDiv, "", "");

    try {
      const formData = new FormData(form);
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        showResponse(responseDiv, "Message sent successfully! We'll get back to you soon.", "success");
        form.reset();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      showResponse(responseDiv, `Error: ${error.message || "Could not send message."}`, "error");
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    }
  }

  async function handleNewsletterSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const responseDiv = document.getElementById("newsletter-response");
    const submitButton = form.querySelector("button[type='submit']");
    const originalButtonText = submitButton.textContent;

    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Subscribing...';
    showResponse(responseDiv, "", "");

    try {
      const formData = new FormData(form);
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        showResponse(responseDiv, "Thanks for subscribing!", "success");
        form.reset();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to subscribe');
      }
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      showResponse(responseDiv, `Error: ${error.message || "Could not subscribe."}`, "error");
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    }
  }


  // --- M-Pesa Checkout ---
  async function handleMpesaCheckout() {
    if (!mpesaPhoneInput || !mpesaResponseEl) return;

    const phone = mpesaPhoneInput.value.trim();
    const totalText = cartTotalEl.textContent;
    const amountMatch = totalText.match(/KES (\d+\.?\d*)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

    if (!phone || !/^254\d{9}$/.test(phone)) {
      showMpesaResponse("Please enter a valid M-Pesa number (e.g., 254712345678).", "error");
      return;
    }
    if (amount <= 0) {
      showMpesaResponse("Your cart is empty or total is zero.", "error");
      return;
    }

    showMpesaResponse("Processing payment...", "info");
    mpesaCheckoutBtn.disabled = true;
    mpesaCheckoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';

    try {
      const response = await fetch(`${API_BASE_URL}/api/mpesa/stkpush`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, amount }),
      });

      // Check if response is HTML
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Payment service unavailable');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.msg || `STK Push failed: ${response.statusText}`);
      }

      showMpesaResponse(
        "STK Push sent! Please check your phone to complete the payment.",
        "success"
      );
      await createOrderAfterPaymentAttempt(phone, amount);

    } catch (error) {
      console.error("M-Pesa Checkout Error:", error);
      showMpesaResponse(`Error: ${error.message}`, "error");
    } finally {
      mpesaCheckoutBtn.disabled = false;
      mpesaCheckoutBtn.innerHTML = 'Pay with M-Pesa <i class="fas fa-lock ml-2"></i>';
    }
  }

  async function createOrderAfterPaymentAttempt(phone, amount) {
    const location = deliveryLocationSelect?.value || "mombasa";
    const deliveryFee = location === "other" ? DELIVERY_FEE : 0;
    const subtotal = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
    const total = subtotal + deliveryFee;

    const orderData = {
      items: cart.map(item => ({ 
        productId: item.id, 
        name: item.name,
        size: item.size, 
        quantity: item.quantity, 
        price: item.price,
        image: item.image
      })),
      customerName: "Online Customer",
      phone: phone,
      location: location,
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      total: total,
      paymentMethod: "M-Pesa",
      status: "pending" 
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });
      
      // Check if response is HTML
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Order service unavailable');
      }
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.msg || "Failed to create order");
      }
      
      console.log("Order created successfully:", result.orderId);
      clearCart(); 
      showMpesaResponse("Payment initiated and order placed (pending confirmation). Thank you!", "success", true);
      setTimeout(closeCart, 3000); 

    } catch (error) {
      console.error("Error creating order:", error);
      showMpesaResponse(`Payment initiated, but failed to save order: ${error.message}. Please contact support.`, "error", true);
    }
  }

  function showMpesaResponse(message, type, keepVisible = false) {
    if (!mpesaResponseEl) return;
    mpesaResponseEl.textContent = message;
    mpesaResponseEl.className = `p-3 rounded-md text-sm ${type === "success" 
      ? "bg-green-100 border border-green-400 text-green-700" 
      : type === "error" 
      ? "bg-red-100 border border-red-400 text-red-700" 
      : "bg-blue-100 border border-blue-400 text-blue-700"}`;
    mpesaResponseEl.classList.remove("hidden");

    if (!keepVisible) {
      setTimeout(() => {
        mpesaResponseEl.classList.add("hidden");
        mpesaResponseEl.textContent = "";
        mpesaResponseEl.className = "";
      }, 5000);
    }
  }

  // --- Helper Functions ---
  function hideAllSections() {
    heroSection?.classList.add("hidden");
    document.getElementById("featured-products-section")?.classList.add("hidden");
    document.getElementById("contact")?.classList.add("hidden");
    document.querySelector(".bg-gray-900")?.classList.add("hidden");
    document.querySelector(".py-16.bg-gray-50")?.classList.add("hidden");
    document.getElementById("about-section-content")?.classList.add("hidden");
    document.getElementById("product-display-section")?.classList.add("hidden");
  }

  function showResponse(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = `py-3 px-4 rounded-md ${type === "success" 
      ? "bg-green-100 text-green-800" 
      : "bg-red-100 text-red-800"}`;
    element.classList.remove("hidden");

    setTimeout(() => {
      element.classList.add("hidden");
    }, 5000);
  }

  function updatePageTitle(title) {
    document.title = title;
  }

  // --- Initial Setup ---
  function initializeProductDisplayArea() {
    const mainContentArea = document.querySelector('body'); 
    if (!document.getElementById('product-display-section')) {
      const displaySection = document.createElement('section');
      displaySection.id = 'product-display-section';
      displaySection.className = 'hidden py-16 bg-white'; 
      displaySection.innerHTML = `
        <div class="container mx-auto px-4">
          <h2 id="category-title" class="text-3xl font-bold mb-12 text-center"></h2>
          <div id="product-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <!-- Products will be loaded here -->
          </div>
        </div>
      `;
      const header = document.querySelector('header');
      if (header) {
        header.insertAdjacentElement('afterend', displaySection);
      } else {
        mainContentArea.insertBefore(displaySection, mainContentArea.firstChild);
      }
    }
  }

  initializeProductDisplayArea(); 
});