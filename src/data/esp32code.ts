export const getESP32Sketch = (customTable: string = "15") => {
  return `/*
 * AXIONIX WiFi Captive Portal & Restaurant Ordering System
 * Target Device: ESP32 (NodeMCU / DevKit)
 * Features:
 *   - Autonomous DNS Captive Portal redirects all requests to 192.168.4.1
 *   - Offline-capable McDonald's Branded Ordering System (Zero CDN deps)
 *   - Local REST Endpoints: 
 *       - POST /api/register (Captures user details, mock-enables Internet)
 *       - GET  /api/table    (Returns assigned Table number)
 *       - POST /api/order    (Accepts food orders and prints to Serial Monitor)
 * 
 * Instructions:
 *   1. Install ESP32 Board support in Arduino IDE (https://dl.espressif.com/dl/package_esp32_index.json)
 *   2. Select "ESP32 Dev Module"
 *   3. Compile and upload. Connect to "AXIONIX McDonald's" on your phone!
 */

#include <WiFi.h>
#include <DNSServer.h>
#include <WebServer.h>

// Web & DNS configuration
const byte DNS_PORT = 53;
IPAddress apIP(192, 168, 4, 1);
DNSServer dnsServer;
WebServer server(80);

// Configuration
const char* ssid = "AXIONIX McDonald's";
const char* tableNumber = "${customTable}"; // Table assigned by admin

// HTML + CSS + JS Single-File Client App
// Tailored to render beautiful McDonald's theme with NO internet requirements
const char portal_html[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AXIONIX Wifi Captive Portal</title>
    <style>
        :root {
            --red: #DA291C;
            --yellow: #FFC72C;
            --dark-bg: #12121e;
            --card-bg: rgba(255, 255, 255, 0.07);
            --border: rgba(255, 255, 255, 0.12);
            --text: #ffffff;
            --text-muted: #94a3b8;
            --success: #10b981;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        body {
            background-color: var(--dark-bg);
            background-image: radial-gradient(circle, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
            background-size: 24px 24px;
            color: var(--text);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            padding-bottom: 80px;
        }
        header {
            background: linear-gradient(135deg, var(--red) 0%, #a81c12 100%);
            padding: 20px 16px;
            text-align: center;
            border-bottom: 3px solid var(--yellow);
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .mcd-logo {
            font-size: 32px;
            font-weight: 900;
            color: var(--yellow);
            text-shadow: 2px 2px 0px rgba(0,0,0,0.4);
            letter-spacing: -1px;
            margin-bottom: 4px;
        }
        .tagline {
            font-size: 13px;
            color: rgba(255,255,255,0.9);
            font-weight: 500;
        }
        .container {
            width: 100%;
            max-width: 500px;
            margin: 0 auto;
            padding: 16px;
        }
        .glass-card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 24px 20px;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            margin-bottom: 20px;
        }
        .title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 18px;
            text-align: center;
            color: white;
        }
        .title span {
            color: var(--yellow);
        }
        .form-group {
            margin-bottom: 16px;
        }
        label {
            display: block;
            font-size: 13px;
            color: var(--text-muted);
            margin-bottom: 6px;
            font-weight: 500;
        }
        .input-wrapper {
            position: relative;
        }
        .input-wrapper span {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
            font-size: 14px;
        }
        input[type="text"], input[type="email"], input[type="tel"] {
            width: 100%;
            background: rgba(255,255,255,0.04);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 12px 12px 12px 38px;
            color: white;
            font-size: 15px;
            transition: all 0.2s;
        }
        input[type="text"]:focus, input[type="email"]:focus, input[type="tel"]:focus {
            outline: none;
            border-color: var(--yellow);
            background: rgba(255,255,255,0.08);
        }
        .phone-wrapper input {
            padding-left: 54px;
        }
        .phone-prefix {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--yellow);
            font-weight: bold;
            font-size: 14px;
        }
        .consent-row {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin: 20px 0;
            cursor: pointer;
        }
        .consent-row input {
            margin-top: 3px;
            accent-color: var(--yellow);
        }
        .consent-text {
            font-size: 12px;
            color: var(--text-muted);
            line-height: 1.4;
        }
        .btn {
            display: block;
            width: 100%;
            background: linear-gradient(135deg, var(--red) 0%, #b81f14 100%);
            border: 1px solid rgba(255,255,255,0.1);
            color: white;
            padding: 14px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: transform 0.1s, opacity 0.2s;
            text-align: center;
            box-shadow: 0 4px 12px rgba(218,41,28,0.3);
        }
        .btn:active {
            transform: scale(0.98);
        }
        .btn-yellow {
            background: linear-gradient(135deg, var(--yellow) 0%, #e6b325 100%);
            color: #12121e;
            box-shadow: 0 4px 12px rgba(255,199,44,0.3);
        }
        /* Menu styles */
        .category-scroll {
            display: flex;
            overflow-x: auto;
            gap: 10px;
            padding: 4px 16px 14px;
            scrollbar-width: none;
        }
        .category-scroll::-webkit-scrollbar {
            display: none;
        }
        .cat-btn {
            background: rgba(255,255,255,0.06);
            border: 1px solid var(--border);
            padding: 8px 16px;
            border-radius: 20px;
            color: var(--text-muted);
            white-space: nowrap;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
        }
        .cat-btn.active {
            background: var(--yellow);
            color: #12121e;
            border-color: var(--yellow);
        }
        .welcome-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            border-bottom: 1px solid var(--border);
            margin-bottom: 12px;
        }
        .welcome-text {
            font-size: 15px;
            font-weight: 600;
        }
        .welcome-text span {
            color: var(--yellow);
        }
        .table-badge {
            background: rgba(255, 199, 44, 0.15);
            border: 1px solid var(--yellow);
            color: var(--yellow);
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }
        .menu-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 14px;
            padding: 0 16px;
        }
        .menu-card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 14px;
            display: flex;
            gap: 14px;
            align-items: center;
            position: relative;
        }
        .item-emoji {
            font-size: 36px;
            background: rgba(255,255,255,0.04);
            width: 60px;
            height: 60px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255,255,255,0.05);
        }
        .item-info {
            flex: 1;
        }
        .item-name {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 3px;
        }
        .item-desc {
            font-size: 12px;
            color: var(--text-muted);
            line-height: 1.3;
            margin-bottom: 6px;
        }
        .item-price-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .item-price {
            font-size: 16px;
            font-weight: bold;
            color: var(--yellow);
        }
        .add-btn {
            background: var(--red);
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 12px;
            cursor: pointer;
        }
        .add-btn:active {
            transform: scale(0.95);
        }
        .size-selector {
            display: flex;
            gap: 6px;
            margin-bottom: 6px;
        }
        .size-opt {
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            background: rgba(255,255,255,0.06);
            border: 1px solid var(--border);
            cursor: pointer;
            color: var(--text-muted);
        }
        .size-opt.active {
            background: var(--yellow);
            color: #12121e;
            border-color: var(--yellow);
        }
        /* Sticky bottom bar */
        .sticky-cart-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #1c1c2e;
            border-top: 2px solid var(--yellow);
            padding: 14px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.5);
            z-index: 100;
        }
        .cart-summary-text {
            font-size: 14px;
            color: var(--text-muted);
        }
        .cart-summary-total {
            font-size: 18px;
            font-weight: bold;
            color: white;
        }
        .view-cart-btn {
            background: var(--yellow);
            color: #12121e;
            padding: 10px 18px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 14px;
            border: none;
            cursor: pointer;
        }
        /* Modals */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.75);
            backdrop-filter: blur(4px);
            z-index: 200;
            display: none;
        }
        .cart-modal {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #181828;
            border-top-left-radius: 20px;
            border-top-right-radius: 20px;
            border-top: 1px solid var(--border);
            max-height: 85vh;
            display: flex;
            flex-direction: column;
            z-index: 210;
            transform: translateY(100%);
            transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .cart-modal.open {
            transform: translateY(0);
        }
        .modal-header {
            padding: 18px 16px;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .modal-title {
            font-size: 18px;
            font-weight: 700;
        }
        .close-btn {
            background: none;
            border: none;
            color: var(--text-muted);
            font-size: 20px;
            cursor: pointer;
        }
        .cart-items-list {
            overflow-y: auto;
            padding: 16px;
            flex: 1;
        }
        .cart-item-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 14px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            margin-bottom: 14px;
        }
        .cart-item-details {
            flex: 1;
        }
        .cart-item-name {
            font-size: 15px;
            font-weight: 600;
        }
        .cart-item-size {
            font-size: 11px;
            color: var(--yellow);
            margin-top: 2px;
        }
        .cart-item-price {
            font-size: 14px;
            font-weight: bold;
            color: white;
            margin-top: 4px;
        }
        .qty-controls {
            display: flex;
            align-items: center;
            gap: 12px;
            background: rgba(255,255,255,0.05);
            border-radius: 6px;
            padding: 4px;
            border: 1px solid var(--border);
        }
        .qty-btn {
            background: none;
            border: none;
            color: white;
            width: 24px;
            height: 24px;
            font-size: 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .qty-val {
            font-size: 14px;
            font-weight: bold;
            width: 16px;
            text-align: center;
        }
        .cart-bill {
            padding: 16px;
            background: rgba(0,0,0,0.2);
            border-top: 1px solid var(--border);
        }
        .bill-row {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            color: var(--text-muted);
            margin-bottom: 8px;
        }
        .bill-row.total {
            font-size: 17px;
            color: white;
            font-weight: bold;
            border-top: 1px solid rgba(255,255,255,0.06);
            padding-top: 10px;
            margin-top: 10px;
        }
        .success-screen {
            text-align: center;
            padding: 30px 16px;
        }
        .success-icon {
            font-size: 56px;
            color: var(--success);
            margin-bottom: 14px;
        }
        .badge {
            display: inline-block;
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid var(--success);
            color: var(--success);
            font-size: 11px;
            padding: 3px 8px;
            border-radius: 4px;
            font-weight: bold;
            margin: 8px 0;
        }
        .toast {
            position: fixed;
            top: -60px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--success);
            color: white;
            padding: 12px 24px;
            border-radius: 30px;
            font-weight: bold;
            font-size: 14px;
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.4);
            transition: top 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .toast.show {
            top: 24px;
        }
        /* Utility views */
        .hidden-view {
            display: none !important;
        }
    </style>
</head>
<body>

    <header>
        <div class="mcd-logo">McD</div>
        <div class="tagline">Good Food, Good WiFi &bull; AXIONIX</div>
    </header>

    <div class="container">
        
        <!-- Toast Notification -->
        <div id="toast" class="toast">Added to Cart! &bull; &#x1F35F;</div>

        <!-- PART 1: SIGN-IN FORM -->
        <div id="formSection" class="glass-card">
            <div class="title">Unlock Free WiFi <span>&amp; Order</span></div>
            <form id="loginForm" onsubmit="handleSignIn(event)">
                <div class="form-group">
                    <label>Full Name</label>
                    <div class="input-wrapper">
                        <span>&#x1F464;</span>
                        <input type="text" id="custName" placeholder="Enter full name" required>
                    </div>
                </div>

                <div class="form-group">
                    <label>Phone Number</label>
                    <div class="input-wrapper phone-wrapper">
                        <span class="phone-prefix">+91</span>
                        <input type="tel" id="custPhone" placeholder="10-digit mobile" pattern="[6-9][0-9]{9}" required>
                    </div>
                </div>

                <div class="form-group">
                    <label>Email Address (Optional)</label>
                    <div class="input-wrapper">
                        <span>&#x2709;</span>
                        <input type="email" id="custEmail" placeholder="name@domain.com">
                    </div>
                </div>

                <label class="consent-row">
                    <input type="checkbox" id="custConsent" required checked>
                    <span class="consent-text">I agree to AXIONIX WiFi terms and consent to receive offers from McDonald's.</span>
                </label>

                <button type="submit" class="btn btn-yellow" id="submitBtn">Order Now &rarr;</button>
            </form>
        </div>

        <!-- PART 2: MENU VIEW -->
        <div id="menuSection" class="hidden-view">
            <div class="welcome-bar">
                <div class="welcome-text">Welcome, <span id="welcomeName">Rahul</span>! &#x1F37D;</div>
                <div class="table-badge">Table <span id="welcomeTable">${customTable}</span></div>
            </div>

            <!-- Categories -->
            <div class="category-scroll">
                <button class="cat-btn active" onclick="filterCategory('Popular', this)">Popular</button>
                <button class="cat-btn" onclick="filterCategory('Burgers', this)">Burgers</button>
                <button class="cat-btn" onclick="filterCategory('Sides', this)">Sides</button>
                <button class="cat-btn" onclick="filterCategory('Drinks', this)">Drinks</button>
                <button class="cat-btn" onclick="filterCategory('Desserts', this)">Desserts</button>
            </div>

            <!-- Menu Grid -->
            <div id="menuGrid" class="menu-grid">
                <!-- Injected via Javascript -->
            </div>
        </div>

        <!-- PART 4: SUCCESS VIEW -->
        <div id="successSection" class="glass-card success-screen hidden-view">
            <div class="success-icon">&#x2705;</div>
            <h2>Order Placed! &#x1F389;</h2>
            <div class="badge">PAY AT COUNTER</div>
            
            <div style="background: rgba(0,0,0,0.2); border-radius: 8px; padding: 14px; margin: 16px 0; text-align: left; font-size: 14px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="color: var(--text-muted);">Order ID:</span>
                    <strong style="color: var(--yellow);" id="successOrderId">AX-7842</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="color: var(--text-muted);">Table assigned:</span>
                    <strong id="successTable">Table ${customTable}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="color: var(--text-muted);">Est. Prep Time:</span>
                    <strong style="color: white;">15-20 minutes</strong>
                </div>
                <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 6px; margin-top: 6px;">
                    <strong style="color: white;">Total Bill:</strong>
                    <strong style="color: var(--yellow);" id="successTotal">₹0</strong>
                </div>
            </div>

            <p style="font-size: 13px; color: var(--text-muted); line-height: 1.4; margin-bottom: 20px;">
                Your order was transmitted to the kitchen. Show your Order ID at the pickup counter to complete the payment and collect your food.
            </p>

            <button class="btn" onclick="resetOrder()">Order More Items</button>
            <button class="btn btn-yellow" style="margin-top: 10px;" onclick="callWaiter()">&#x1F514; Call Waiter</button>
        </div>

    </div>

    <!-- Sticky Bottom Cart Bar -->
    <div id="stickyCartBar" class="sticky-cart-bar hidden-view">
        <div>
            <div class="cart-summary-text"><span id="cartCount">0</span> items</div>
            <div class="cart-summary-total" id="cartTotalText">₹0</div>
        </div>
        <button class="view-cart-btn" onclick="openCart()">View Cart &rarr;</button>
    </div>

    <!-- PART 3: CART MODAL & OVERLAY -->
    <div id="modalOverlay" class="modal-overlay" onclick="closeCart()"></div>
    <div id="cartModal" class="cart-modal">
        <div class="modal-header">
            <div class="modal-title">Your Cart &#x1F6D2;</div>
            <button class="close-btn" onclick="closeCart()">&times;</button>
        </div>
        <div class="cart-items-list" id="cartItemsList">
            <!-- Cart items loaded here -->
        </div>
        <div class="cart-bill">
            <div class="bill-row">
                <span>Subtotal</span>
                <span id="billSubtotal">₹0</span>
            </div>
            <div class="bill-row">
                <span>GST Tax (5%)</span>
                <span id="billTax">₹0</span>
            </div>
            <div class="bill-row total">
                <span>Total Amount</span>
                <span id="billTotal">₹0</span>
            </div>
            
            <button class="btn btn-yellow" style="margin-top: 14px;" onclick="submitOrder()">Place Order &bull; Pay at Counter</button>
            <button class="btn" style="margin-top: 8px; background: rgba(255,255,255,0.06);" onclick="closeCart()">Add More Items</button>
        </div>
    </div>

    <script>
        // Official Menu Items
        const MENU_ITEMS = [
            { id: 'mcchicken', name: 'McChicken', description: 'Crispy chicken patty with creamy mayo.', price: 199, emoji: '🍔', category: 'Burgers' },
            { id: 'mcveggie', name: 'McVeggie', description: 'Veg patty with fresh vegetables.', price: 149, emoji: '🍔', category: 'Burgers' },
            { id: 'mcaloo-tikki', name: 'McAloo Tikki', description: 'Classic Indian favorite with spiced potato patty.', price: 89, emoji: '🥔', category: 'Burgers' },
            { id: 'fries', name: 'French Fries', description: 'World-famous crispy golden fries.', price: 89, sizes: [{label: 'Medium', price: 89}, {label: 'Large', price: 119}], emoji: '🍟', category: 'Sides' },
            { id: 'mcnuggets', name: 'McNuggets (6pc)', description: 'Tender chicken nuggets with a crispy golden coat.', price: 149, emoji: '🍗', category: 'Sides' },
            { id: 'mcegg', name: 'McEgg', description: 'Fresh steamed egg topped with spicy mayo and onions.', price: 129, emoji: '🍳', category: 'Burgers' },
            { id: 'coke', name: 'Coca-Cola', description: 'Refreshing cold carbonated drink.', price: 60, emoji: '🥤', category: 'Drinks' },
            { id: 'mcflurry-oreo', name: 'McFlurry Oreo', description: 'Creamy soft-serve vanilla with Oreo crumbs.', price: 99, emoji: '🍦', category: 'Desserts' }
        ];

        let cart = [];
        let selectedSizes = { fries: 'Medium' };
        let currentUser = null;
        let currentCategory = 'Popular';

        window.onload = function() {
            // Check localStorage
            const storedUser = localStorage.getItem('axionix_user');
            if (storedUser) {
                currentUser = JSON.parse(storedUser);
                loadMenuView();
            }
            
            // Render menu
            renderMenu();
        };

        function showToast(text, emoji) {
            const toast = document.getElementById('toast');
            toast.innerHTML = text + ' &bull; ' + emoji;
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 2000);
        }

        function handleSignIn(e) {
            e.preventDefault();
            const name = document.getElementById('custName').value.trim();
            const phone = document.getElementById('custPhone').value.trim();
            const email = document.getElementById('custEmail').value.trim();
            const consent = document.getElementById('custConsent').checked;

            if(!name || phone.length !== 10 || !consent) {
                alert('Please fill out all required fields.');
                return;
            }

            // Generate mock authorization token
            const token = 'AX-' + Math.floor(Math.random() * 900000 + 100000);
            currentUser = { name, phone, email, token };
            localStorage.setItem('axionix_user', JSON.stringify(currentUser));

            // Transmit registration to ESP32
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/register', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(currentUser));

            // Visual morph transition
            const formCard = document.getElementById('formSection');
            formCard.style.opacity = '0';
            formCard.style.transition = 'opacity 0.4s';
            
            setTimeout(() => {
                formCard.classList.add('hidden-view');
                loadMenuView();
            }, 400);
        }

        function loadMenuView() {
            document.getElementById('welcomeName').innerText = currentUser.name;
            document.getElementById('welcomeTable').innerText = '${customTable}';
            
            const menuSection = document.getElementById('menuSection');
            menuSection.classList.remove('hidden-view');
            menuSection.style.opacity = '0';
            menuSection.style.display = 'block';
            
            setTimeout(() => {
                menuSection.style.transition = 'opacity 0.5s';
                menuSection.style.opacity = '1';
            }, 50);

            updateCartUI();
        }

        function filterCategory(category, button) {
            currentCategory = category;
            
            // Update active buttons
            const buttons = document.querySelectorAll('.cat-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            renderMenu();
        }

        function setItemSize(itemId, sizeLabel) {
            selectedSizes[itemId] = sizeLabel;
            renderMenu();
        }

        function renderMenu() {
            const grid = document.getElementById('menuGrid');
            grid.innerHTML = '';

            const filtered = MENU_ITEMS.filter(item => {
                if(currentCategory === 'Popular') {
                    // Popular serves McChicken, McAloo Tikki, Fries, Oreo McFlurry
                    return ['mcchicken', 'mcaloo-tikki', 'fries', 'mcflurry-oreo'].includes(item.id);
                }
                return item.category === currentCategory;
            });

            filtered.forEach(item => {
                let price = item.price;
                let sizeHTML = '';

                if(item.sizes) {
                    const currentSize = selectedSizes[item.id] || item.sizes[0].label;
                    const sizeObj = item.sizes.find(s => s.label === currentSize);
                    price = sizeObj.price;

                    sizeHTML = '<div class="size-selector">';
                    item.sizes.forEach(sz => {
                        const activeCls = sz.label === currentSize ? 'active' : '';
                        sizeHTML += '<span class="size-opt ' + activeCls + '" onclick="setItemSize(\'' + item.id + '\', \'' + sz.label + '\')">' + sz.label + '</span>';
                    });
                    sizeHTML += '</div>';
                }

                const card = document.createElement('div');
                card.className = 'menu-card';
                card.innerHTML = 
                    '<div class="item-emoji">' + item.emoji + '</div>' +
                    '<div class="item-info">' +
                    '    <div class="item-name">' + item.name + '</div>' +
                    '    <div class="item-desc">' + item.description + '</div>' +
                    '    ' + sizeHTML +
                    '    <div class="item-price-row">' +
                    '        <span class="item-price">₹' + price + '</span>' +
                    '        <button class="add-btn" onclick="addToCart(\'' + item.id + '\')">Add +</button>' +
                    '    </div>' +
                    '</div>';
                grid.appendChild(card);
            });
        }

        function addToCart(itemId) {
            const item = MENU_ITEMS.find(i => i.id === itemId);
            if(!item) return;

            let finalName = item.name;
            let finalPrice = item.price;
            let sizeLabel = null;
            let cartId = item.id;

            if(item.sizes) {
                sizeLabel = selectedSizes[item.id] || item.sizes[0].label;
                const sizeObj = item.sizes.find(s => s.label === sizeLabel);
                finalPrice = sizeObj.price;
                cartId = item.id + '-' + sizeLabel;
                finalName = item.name + ' (' + sizeLabel + ')';
            }

            const existing = cart.find(c => c.id === cartId);
            if(existing) {
                existing.quantity += 1;
            } else {
                cart.push({
                    id: cartId,
                    menuItemId: item.id,
                    name: finalName,
                    price: finalPrice,
                    sizeLabel: sizeLabel,
                    emoji: item.emoji,
                    quantity: 1
                });
            }

            showToast(item.name + ' Added!', item.emoji);
            updateCartUI();
        }

        function updateCartUI() {
            const cartBar = document.getElementById('stickyCartBar');
            const totalCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);
            const totalSum = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

            document.getElementById('cartCount').innerText = totalCount;
            document.getElementById('cartTotalText').innerText = '₹' + totalSum;

            if (totalCount > 0 && currentUser) {
                cartBar.classList.remove('hidden-view');
            } else {
                cartBar.classList.add('hidden-view');
            }
        }

        function openCart() {
            document.getElementById('modalOverlay').style.display = 'block';
            const modal = document.getElementById('cartModal');
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('open');
            }, 10);

            renderCartModalList();
        }

        function closeCart() {
            const modal = document.getElementById('cartModal');
            modal.classList.remove('open');
            setTimeout(() => {
                modal.style.display = 'none';
                document.getElementById('modalOverlay').style.display = 'none';
            }, 300);
        }

        function changeQty(cartId, delta) {
            const index = cart.findIndex(c => c.id === cartId);
            if(index === -1) return;

            cart[index].quantity += delta;
            if(cart[index].quantity <= 0) {
                cart.splice(index, 1);
            }

            renderCartModalList();
            updateCartUI();
            
            if(cart.length === 0) {
                closeCart();
            }
        }

        function renderCartModalList() {
            const list = document.getElementById('cartItemsList');
            list.innerHTML = '';

            let subtotal = 0;
            cart.forEach(item => {
                const rowSum = item.price * item.quantity;
                subtotal += rowSum;

                const row = document.createElement('div');
                row.className = 'cart-item-row';
                row.innerHTML = 
                    '<div class="cart-item-details">' +
                    '    <div class="cart-item-name">' + item.emoji + ' ' + item.name + '</div>' +
                    '    <div class="cart-item-price">₹' + item.price + '</div>' +
                    '</div>' +
                    '<div class="qty-controls">' +
                    '    <button class="qty-btn" onclick="changeQty(\'' + item.id + '\', -1)">&minus;</button>' +
                    '    <span class="qty-val">' + item.quantity + '</span>' +
                    '    <button class="qty-btn" onclick="changeQty(\'' + item.id + '\', 1)">&plus;</button>' +
                    '</div>';
                list.appendChild(row);
            });

            const tax = Math.round(subtotal * 0.05);
            const total = subtotal + tax;

            document.getElementById('billSubtotal').innerText = '₹' + subtotal;
            document.getElementById('billTax').innerText = '₹' + tax;
            document.getElementById('billTotal').innerText = '₹' + total;
        }

        function submitOrder() {
            if(cart.length === 0) return;

            const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
            const tax = Math.round(subtotal * 0.05);
            const total = subtotal + tax;
            const orderId = 'AX-' + Math.floor(Math.random() * 9000 + 1000);

            // POST to ESP32 local endpoint
            const orderData = {
                orderId: orderId,
                customer: currentUser,
                items: cart,
                total: total,
                table: '${customTable}'
            };

            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/order', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(orderData));

            // Close cart view and show success
            closeCart();
            document.getElementById('menuSection').classList.add('hidden-view');
            document.getElementById('stickyCartBar').classList.add('hidden-view');

            document.getElementById('successOrderId').innerText = orderId;
            document.getElementById('successTable').innerText = 'Table ' + '${customTable}';
            document.getElementById('successTotal').innerText = '₹' + total;

            const successSection = document.getElementById('successSection');
            successSection.classList.remove('hidden-view');
            successSection.style.opacity = '0';
            setTimeout(() => {
                successSection.style.transition = 'opacity 0.5s';
                successSection.style.opacity = '1';
            }, 50);

            // Empty cart
            cart = [];
            updateCartUI();
        }

        function resetOrder() {
            document.getElementById('successSection').classList.add('hidden-view');
            loadMenuView();
        }

        function callWaiter() {
            alert('Waiter called to Table ${customTable}. A team member will assist you shortly.');
        }
    </script>
</body>
</html>
)rawliteral";

void handleRoot() {
  server.send_P(200, "text/html", portal_html);
}

void handleRegister() {
  if (server.hasArg("plain") == false) {
    server.send(400, "application/json", "{\\"error\\":\\"Body missing\\"}");
    return;
  }
  
  String body = server.arg("plain");
  Serial.println("\\n>>> [AXIONIX CLIENT SIGN-IN] <<<");
  Serial.println(body);
  Serial.println("Internet mock access granted for this client device.");
  
  server.send(200, "application/json", "{\\"status\\":\\"success\\"}");
}

void handleOrder() {
  if (server.hasArg("plain") == false) {
    server.send(400, "application/json", "{\\"error\\":\\"Body missing\\"}");
    return;
  }

  String body = server.arg("plain");
  Serial.println("\\n=== >>> [NEW ORDER RECEIVED] <<< ===");
  Serial.println(body);
  Serial.println("=====================================");

  server.send(200, "application/json", "{\\"status\\":\\"placed\\"}");
}

void handleTable() {
  String response = "{\\"table\\":\\"" + String(tableNumber) + "\\"\\}";
  server.send(200, "application/json", response);
}

// Redirect captive portal inquiries to 192.168.4.1 (Captive Portal)
void handleNotFound() {
  String host = server.hostHeader();
  if (host != "192.168.4.1") {
    Serial.println("Captive redirection: " + host);
    server.sendHeader("Location", "http://192.168.4.1/", true);
    server.send(302, "text/plain", "");
  } else {
    server.send(404, "text/plain", "Not found");
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("Configuring AXIONIX Access Point...");

  // Start access point
  WiFi.mode(WIFI_AP);
  WiFi.softAPConfig(apIP, apIP, IPAddress(255, 255, 255, 0));
  WiFi.softAP(ssid);

  Serial.print("Access Point Ready. SSID: ");
  Serial.println(ssid);
  Serial.print("AP IP Address: ");
  Serial.println(WiFi.softAPIP());

  // Setup DNS Server capturing all domains
  dnsServer.setErrorReplyCode(DNSReplyCode::NoError);
  dnsServer.start(DNS_PORT, "*", apIP);

  // Setup Server routes
  server.on("/", handleRoot);
  server.on("/api/register", HTTP_POST, handleRegister);
  server.on("/api/order", HTTP_POST, handleOrder);
  server.on("/api/table", HTTP_GET, handleTable);
  
  // Wildcard redirection for captive portal
  server.onNotFound(handleNotFound);

  server.begin();
  Serial.println("AXIONIX Portal Web Server Online on port 80!");
}

void loop() {
  dnsServer.processNextRequest();
  server.handleClient();
}
`;
};
