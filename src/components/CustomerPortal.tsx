import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Phone, 
  Mail, 
  Check, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  Clock, 
  Bell, 
  Utensils, 
  Wifi,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  DollarSign
} from 'lucide-react';
import { MenuItem, CartItem, UserSession, Order } from '../types';
import { MENU_ITEMS } from '../data/menu';

// Highly interactive letter-by-letter wobbly/bouncy text inspired by Crav Burgers hover style
function WobblyText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`${className} inline-flex flex-wrap justify-center`}>
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          className="inline-block origin-bottom select-none"
          whileHover={{ 
            scale: 1.3, 
            rotate: [0, -12, 12, 0],
            color: '#cb4b31',
          }}
          transition={{ type: "spring", stiffness: 450, damping: 12 }}
          style={{ display: char === ' ' ? 'inline' : 'inline-block' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
}

interface CustomerPortalProps {
  assignedTable: string;
  onNewOrder: (order: Order) => void;
}

export default function CustomerPortal({ assignedTable, onNewOrder }: CustomerPortalProps) {
  // Session state
  const [session, setSession] = useState<UserSession | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    consent: true
  });
  const [formError, setFormError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Gamified Crave Meter state
  const [craveLevel, setCraveLevel] = useState(30);
  const [unlockedDiscount, setUnlockedDiscount] = useState(false);
  const [burstEmojis, setBurstEmojis] = useState<{ id: number; emoji: string; x: number; y: number }[]>([]);

  // Menu/Cart state
  const [currentCategory, setCurrentCategory] = useState<string>('Popular');
  const [selectedSizes, setSelectedSizes] = useState<{ [key: string]: string }>({ fries: 'Medium' });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<{ text: string; emoji: string } | null>(null);

  // Success view state
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

  // Load session & cart from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('axionix_user');
    const storedCart = localStorage.getItem('axionix_cart');
    
    if (storedUser) {
      try {
        setSession(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('axionix_user');
      }
    }

    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (e) {
        localStorage.removeItem('axionix_cart');
      }
    }
  }, []);

  // Sync cart to localStorage
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('axionix_cart', JSON.stringify(newCart));
  };

  // Trigger toast notification
  const triggerToast = (text: string, emoji: string) => {
    setActiveToast({ text, emoji });
    setTimeout(() => {
      setActiveToast(null);
    }, 2200);
  };

  // Sign-in submit handler
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Full name is required');
      return;
    }
    if (!/^[6-9][0-9]{9}$/.test(formData.phone)) {
      setFormError('Please enter a valid Indian 10-digit mobile number');
      return;
    }
    if (!formData.consent) {
      setFormError('Consent is required to enable free WiFi access');
      return;
    }

    setIsSigningIn(true);

    // Simulate wifi authentication handshaking
    setTimeout(() => {
      const token = 'AX-' + Math.floor(100000 + Math.random() * 900000);
      const userSession: UserSession = {
        name: formData.name.trim(),
        phone: formData.phone,
        email: formData.email.trim(),
        token: token,
        consent: formData.consent,
        tableNumber: assignedTable
      };

      localStorage.setItem('axionix_user', JSON.stringify(userSession));
      setSession(userSession);
      setIsSigningIn(false);
      triggerToast(`Welcome, ${userSession.name}!`, '🍽️');
    }, 1200);
  };

  // Gamified Crave Meter boost function (triggers explosive floating emoji feedback!)
  const handleBoostCrave = () => {
    if (craveLevel >= 100) {
      triggerToast("Cravings fully satisfied! Code CRAV10 unlocked! 🌟", "🔥");
      return;
    }
    const nextLevel = Math.min(craveLevel + 14, 100);
    setCraveLevel(nextLevel);
    
    const cravingEmojis = ['🍔', '🍟', '🔥', '🍦', '🥤', '🍗', '👅', '✨', '⚡'];
    const newBursts = Array.from({ length: 10 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      emoji: cravingEmojis[Math.floor(Math.random() * cravingEmojis.length)],
      x: (Math.random() - 0.5) * 220, // random left/right disperse
      y: -60 - Math.random() * 150      // random float height up
    }));

    setBurstEmojis(prev => [...prev, ...newBursts]);
    
    if (nextLevel === 100) {
      setUnlockedDiscount(true);
      triggerToast("CRAVE METER hits 100%! Use CRAV10 for 10% off!", "🔥");
    } else {
      triggerToast(`Cravings now at ${nextLevel}%!`, "🔥");
    }

    // Garbage collector for finished animations
    setTimeout(() => {
      setBurstEmojis(prev => prev.filter(e => !newBursts.some(nb => nb.id === e.id)));
    }, 1000);
  };

  // Change selected size for fries
  const handleSizeChange = (itemId: string, sizeLabel: string) => {
    setSelectedSizes(prev => ({
      ...prev,
      [itemId]: sizeLabel
    }));
  };

  // Add Item to Cart
  const addToCart = (item: MenuItem) => {
    let price = item.price;
    let sizeLabel: string | undefined = undefined;
    let cartId = item.id;

    if (item.sizes) {
      sizeLabel = selectedSizes[item.id] || 'Medium';
      const sizeObj = item.sizes.find(s => s.label === sizeLabel);
      price = sizeObj ? sizeObj.price : item.price;
      cartId = `${item.id}-${sizeLabel}`;
    }

    const existingIndex = cart.findIndex(c => c.id === cartId);
    let updatedCart = [...cart];

    if (existingIndex > -1) {
      updatedCart[existingIndex].quantity += 1;
    } else {
      updatedCart.push({
        id: cartId,
        menuItemId: item.id,
        name: item.name,
        description: item.description,
        emoji: item.emoji,
        sizeLabel: sizeLabel,
        unitPrice: price,
        quantity: 1
      });
    }

    saveCart(updatedCart);
    triggerToast(`${item.name} added!`, item.emoji);
  };

  // Update Cart Quantity
  const updateQuantity = (cartId: string, delta: number) => {
    const existingIndex = cart.findIndex(c => c.id === cartId);
    if (existingIndex === -1) return;

    let updatedCart = [...cart];
    updatedCart[existingIndex].quantity += delta;

    if (updatedCart[existingIndex].quantity <= 0) {
      updatedCart.splice(existingIndex, 1);
    }

    saveCart(updatedCart);
    if (updatedCart.length === 0) {
      setIsCartOpen(false);
    }
  };

  // Clear item completely
  const removeCartItem = (cartId: string) => {
    const updatedCart = cart.filter(c => c.id !== cartId);
    saveCart(updatedCart);
    if (updatedCart.length === 0) {
      setIsCartOpen(false);
    }
  };

  // Calculate bill totals
  const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const gstTax = Math.round(subtotal * 0.05); // 5% GST
  const totalAmount = subtotal + gstTax;
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Place Order
  const handlePlaceOrder = () => {
    if (cart.length === 0 || !session) return;

    const orderId = 'AX-' + Math.floor(1000 + Math.random() * 9000);
    const newOrder: Order = {
      id: orderId,
      customerName: session.name,
      phone: session.phone,
      email: session.email,
      tableNumber: assignedTable,
      items: cart,
      subtotal: subtotal,
      tax: gstTax,
      total: totalAmount,
      status: 'Preparing',
      paymentStatus: 'Pay at Counter',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Callback to parent staff dashboard
    onNewOrder(newOrder);

    // Save success state & reset client cart
    setLastPlacedOrder(newOrder);
    saveCart([]);
    setIsCartOpen(false);
  };

  // Reset order to browse again
  const handleOrderMore = () => {
    setLastPlacedOrder(null);
  };

  // Logout/Reset wifi session
  const handleDisconnect = () => {
    localStorage.removeItem('axionix_user');
    localStorage.removeItem('axionix_cart');
    setSession(null);
    setCart([]);
    setLastPlacedOrder(null);
    setFormData({ name: '', phone: '', email: '', consent: true });
  };

  // Filter items based on selected category
  const filteredMenuItems = MENU_ITEMS.filter(item => {
    if (currentCategory === 'Popular') {
      // Return 4 crowd-pleasers
      return ['mcchicken', 'mcaloo-tikki', 'fries', 'mcflurry-oreo'].includes(item.id);
    }
    return item.category === currentCategory;
  });

  // Get custom retro stickers for menu items matching cravburgers aesthetic
  const getItemBadge = (id: string) => {
    switch (id) {
      case 'mcchicken': return { text: 'BEST SELLER ⭐', bg: 'bg-[#dd9d47]', textCol: 'text-[#1c1e19]' };
      case 'mcveggie': return { text: 'CRUNCHY 🥬', bg: 'bg-emerald-100 border-[#1c1e19]', textCol: 'text-emerald-800' };
      case 'mcaloo-tikki': return { text: 'LOCAL HERO 🥔', bg: 'bg-amber-100 border-[#1c1e19]', textCol: 'text-amber-800' };
      case 'fries': return { text: 'CRAVED 🔥', bg: 'bg-[#cb4b31]', textCol: 'text-[#fdfbf7]' };
      case 'mcnuggets': return { text: 'SHAREPACK 🍗', bg: 'bg-orange-100 border-[#1c1e19]', textCol: 'text-orange-800' };
      case 'coke': return { text: 'ICE COLD 🥤', bg: 'bg-sky-100 border-[#1c1e19]', textCol: 'text-sky-800' };
      case 'mcflurry-oreo': return { text: 'SWEET TOOTH 🍦', bg: 'bg-[#cb4b31]', textCol: 'text-[#fdfbf7]' };
      default: return null;
    }
  };

  return (
    <div className="w-full h-[760px] bg-[#fdfbf7] border-4 border-[#1c1e19] rounded-[2.2rem] shadow-retro-xl overflow-hidden flex flex-col font-sans relative select-none">
      
      {/* Draggable retro stamps/stickers inspired by cravburgers.shop */}
      <motion.div
        drag
        dragConstraints={{ left: 10, right: 300, top: 80, bottom: 620 }}
        whileDrag={{ scale: 1.15, rotate: 10, zIndex: 100 }}
        whileHover={{ scale: 1.1, rotate: -5 }}
        className="absolute left-4 top-24 w-16 h-16 bg-[#cb4b31] border-3 border-[#1c1e19] rounded-full flex flex-col items-center justify-center shadow-retro-sm text-center cursor-grab active:cursor-grabbing z-30 transform -rotate-12 select-none"
      >
        <span className="text-[7px] font-black tracking-wider text-[#faf5eb] leading-none uppercase">100%</span>
        <span className="text-[8px] font-black text-[#faf5eb] leading-none uppercase font-display italic">FRESH</span>
        <span className="text-sm">🔥</span>
      </motion.div>

      <motion.div
        drag
        dragConstraints={{ left: 10, right: 300, top: 80, bottom: 620 }}
        whileDrag={{ scale: 1.15, rotate: -10, zIndex: 100 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        className="absolute right-4 top-28 w-16 h-16 bg-[#dd9d47] border-3 border-[#1c1e19] rounded-2xl flex flex-col items-center justify-center shadow-retro-sm text-center cursor-grab active:cursor-grabbing z-30 transform rotate-12 select-none"
      >
        <span className="text-[7px] font-black text-[#1c1e19] leading-none uppercase tracking-widest">ZERO</span>
        <span className="text-[9px] font-black text-[#1c1e19] leading-none uppercase font-display">LAG</span>
        <span className="text-sm">⚡</span>
      </motion.div>

      {/* Captive Portal Premium Header Banner */}
      <div className="bg-[#cb4b31] py-4 px-6 text-center border-b-4 border-[#1c1e19] relative shrink-0 shadow-retro-md">
        <div className="flex justify-center items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#faf5eb] border-2 border-[#1c1e19] flex items-center justify-center font-black text-xl text-[#cb4b31] shadow-retro-sm transform -rotate-6">
            C
          </div>
          <motion.span 
            whileHover={{ scale: 1.05, rotate: -2 }}
            className="font-black text-3xl text-[#faf5eb] tracking-tighter font-display uppercase italic text-3d-retro cursor-default select-none"
          >
            CRAV BISTRO
          </motion.span>
          <span className="text-[9px] bg-[#dd9d47] text-[#1c1e19] font-black px-2 py-0.5 rounded-lg border-2 border-[#1c1e19] uppercase tracking-widest ml-1 shadow-retro-sm transform rotate-3">
            WiFi
          </span>
        </div>
        <p className="text-[9px] text-[#faf5eb] font-extrabold tracking-widest mt-1.5 uppercase opacity-90">
          ★ LOCAL CRAVINGS • INSTANTLY CONNECTED BY AXIONIK ★
        </p>
      </div>

      {/* Crav-style Infinite Scrolling Marquee Banner */}
      <div className="bg-[#dd9d47] border-b-4 border-[#1c1e19] py-1.5 overflow-hidden shrink-0 relative z-10 select-none">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-8 font-display font-black text-[10px] text-[#1c1e19] uppercase tracking-wider">
          <span>★ UNLIMITED HIGH-SPEED WIFI</span>
          <span className="text-[#cb4b31]">★ BURGERS CRAVED CONSTANTLY</span>
          <span>★ ORDER FRESH SEARING BURGERS & SIDES</span>
          <span className="text-[#cb4b31]">★ CRUNCHY GOLDEN FRIES</span>
          <span>★ ZERO LAG • PURE CRUNCH</span>
          <span className="text-[#cb4b31]">★ CRAV BISTRO EXPERIENCE</span>
          {/* Duplicate for seamless infinite loop */}
          <span>★ UNLIMITED HIGH-SPEED WIFI</span>
          <span className="text-[#cb4b31]">★ BURGERS CRAVED CONSTANTLY</span>
          <span>★ ORDER FRESH SEARING BURGERS & SIDES</span>
          <span className="text-[#cb4b31]">★ CRUNCHY GOLDEN FRIES</span>
          <span>★ ZERO LAG • PURE CRUNCH</span>
          <span className="text-[#cb4b31]">★ CRAV BISTRO EXPERIENCE</span>
        </div>
      </div>

      {/* Body content scroll region */}
      <div className="flex-1 overflow-y-auto bg-grid-pattern relative pb-10">
        
        {/* Toast Alerts */}
        <AnimatePresence>
          {activeToast && (
            <motion.div 
              initial={{ top: -50, opacity: 0, x: '-50%' }}
              animate={{ top: 12, opacity: 1, x: '-50%' }}
              exit={{ top: -50, opacity: 0, x: '-50%' }}
              className="absolute left-1/2 bg-[#1c1e19] text-white text-xs font-black py-3 px-5 rounded-xl shadow-retro-md z-50 flex items-center gap-2.5 border-2 border-[#1c1e19] whitespace-nowrap"
            >
              <span className="text-sm">{activeToast.emoji}</span>
              <span className="uppercase tracking-wider">{activeToast.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════════════════════
            PART 1: SIGN-IN FORM
            ══════════════════════════════════════════════════════════════════ */}
        {!session && !lastPlacedOrder && (
          <div className="p-6">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#faf5eb] border-3 border-[#1c1e19] p-6 rounded-[2rem] relative overflow-hidden shadow-retro-lg"
            >
              {/* Decorative graphic elements to give a handcrafted custom boutique feel */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#dd9d47]/8 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#cb4b31]/8 rounded-full blur-2xl pointer-events-none"></div>

              {/* Crav-style Rotating Vintage Stamp */}
              <div className="absolute -top-3 -right-3 w-20 h-20 pointer-events-none z-10 hidden sm:block">
                <div className="w-full h-full animate-spin-slow bg-[#dd9d47] border-3 border-[#1c1e19] rounded-full flex items-center justify-center relative shadow-retro-sm">
                  <div className="absolute inset-1 border border-dashed border-[#1c1e19] rounded-full"></div>
                  <span className="text-[7px] font-black tracking-widest text-[#1c1e19] text-center leading-none uppercase select-none font-display">
                    ★ CRAV ★<br />BISTRO
                  </span>
                </div>
              </div>

              <div className="text-center mb-6 relative">
                <span className="inline-flex items-center justify-center w-14 h-14 bg-[#faf5eb] border-3 border-[#1c1e19] rounded-2xl mb-3 text-3xl shadow-retro-sm animate-sticker transform -rotate-3">
                  🍟
                </span>
                <h2 className="text-2xl font-black text-[#1c1e19] tracking-tight leading-none font-display uppercase italic flex flex-col items-center gap-1">
                  <WobblyText text="CRAVING" />
                  <span className="text-[#cb4b31]"><WobblyText text="HIGH-SPEED" /></span>
                  <WobblyText text="WIFI?" />
                </h2>
                <p className="text-[11px] text-[#606356] font-bold uppercase tracking-wider mt-1.5">
                  Connect to Free WiFi &amp; Order Instantly!
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4 text-left">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border-2 border-[#1c1e19] text-[11px] text-red-700 font-extrabold flex items-center gap-2 shadow-retro-sm">
                    <span>⚠️</span>
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-[#1c1e19] mb-1.5 uppercase tracking-widest">
                    Your Full Name <span className="text-[#cb4b31] font-black">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1c1e19]" />
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                      placeholder="Enter your name"
                      className="w-full bg-white border-3 border-[#1c1e19] rounded-xl py-3.5 pl-10 pr-4 text-xs font-bold text-[#1c1e19] placeholder-[#9c9a8f] shadow-retro-sm focus:bg-white focus:-translate-y-0.5 focus:shadow-retro-md transition-all focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#1c1e19] mb-1.5 uppercase tracking-widest">
                    Mobile Phone <span className="text-[#cb4b31] font-black">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-[#cb4b31] border-r-2 border-[#1c1e19] pr-2.5 select-none font-mono">
                      +91
                    </span>
                    <input 
                      type="tel" 
                      maxLength={10}
                      value={formData.phone}
                      onChange={e => setFormData(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
                      placeholder="Enter 10-digit number"
                      className="w-full bg-white border-3 border-[#1c1e19] rounded-xl py-3.5 pl-14 pr-4 text-xs font-mono font-black text-[#1c1e19] placeholder-[#9c9a8f] shadow-retro-sm focus:bg-white focus:-translate-y-0.5 focus:shadow-retro-md transition-all focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#1c1e19] mb-1.5 uppercase tracking-widest">
                    Email Address <span className="text-[#606356] font-semibold">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1c1e19]" />
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                      placeholder="you@example.com"
                      className="w-full bg-white border-3 border-[#1c1e19] rounded-xl py-3.5 pl-10 pr-4 text-xs font-bold text-[#1c1e19] placeholder-[#9c9a8f] shadow-retro-sm focus:bg-white focus:-translate-y-0.5 focus:shadow-retro-md transition-all focus:outline-none"
                    />
                  </div>
                </div>

                <label className="flex gap-2.5 items-start mt-5 select-none cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.consent}
                    onChange={e => setFormData(p => ({ ...p, consent: e.target.checked }))}
                    className="mt-0.5 rounded-md border-2 border-[#1c1e19] text-[#cb4b31] focus:ring-0 focus:ring-offset-0 w-4 h-4 shadow-retro-sm cursor-pointer"
                  />
                  <span className="text-[10px] text-[#606356] font-bold leading-normal text-left uppercase tracking-tight">
                    I agree to terms of service and consent to receive digital dining notifications &amp; bill receipts.
                  </span>
                </label>

                <button 
                  type="submit" 
                  disabled={isSigningIn}
                  className="w-full bg-[#dd9d47] hover:bg-[#df9f37] text-[#1c1e19] py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border-3 border-[#1c1e19] shadow-retro-md hover:-translate-y-0.5 hover:shadow-retro-lg active:translate-y-0.5 active:shadow-retro-sm transition-all cursor-pointer mt-4"
                >
                  {isSigningIn ? (
                    <div className="flex items-center gap-1.5 py-0.5">
                      <span className="text-sm animate-bounce duration-300">🍔</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#1c1e19]">CONNECTING...</span>
                      <span className="text-sm animate-bounce duration-500 delay-150">🍟</span>
                    </div>
                  ) : (
                    <>
                      <span>AGREE &amp; CONNECT NOW</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PART 2: MENU VIEW
            ══════════════════════════════════════════════════════════════════ */}
        {session && !lastPlacedOrder && (
          <div>
            {/* Header / Table Banner */}
            <div className="px-5 py-4 bg-[#faf5eb] border-b-3 border-[#1c1e19] flex items-center justify-between shrink-0">
              <div>
                <p className="text-[9px] text-[#cb4b31] font-black uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  CRAV BISTRO STATION
                </p>
                <h3 className="text-sm font-black text-[#1c1e19] flex items-center gap-1 mt-0.5 font-display uppercase italic">
                  Hello, <span className="text-[#cb4b31]">{session.name}</span>! 👋
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-[#faf5eb] border-2 border-[#1c1e19] px-3 py-1 rounded-xl text-[10px] font-black text-[#cb4b31] tracking-wider shadow-retro-sm transform -rotate-1">
                  TABLE {assignedTable}
                </div>
                <button 
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border-2 border-[#1c1e19] text-red-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-retro-sm hover:-translate-y-0.5 hover:shadow-retro-md"
                  title="Logout"
                >
                  <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Exit</span>
                </button>
              </div>
            </div>

            {/* Horizontal Categories Scroll */}
            <div className="flex items-center gap-2.5 overflow-x-auto px-5 py-3.5 scrollbar-none shrink-0 sticky top-0 bg-[#faf5eb] z-20 border-b-3 border-[#1c1e19]">
              {(['Popular', 'Burgers', 'Sides', 'Drinks', 'Desserts'] as const).map(cat => {
                const isActive = currentCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCurrentCategory(cat)}
                    className={`px-4.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer border-2 border-[#1c1e19] ${
                      isActive 
                        ? 'bg-[#cb4b31] text-[#faf5eb] shadow-none translate-x-[1px] translate-y-[1px]' 
                        : 'bg-white text-[#1c1e19] shadow-retro-sm hover:-translate-y-[1px] hover:shadow-retro-md'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Playful Interactive "Crave Meter" Game Card */}
            <div className="px-5 pt-5 relative">
              <div className="bg-[#faf5eb] border-3 border-[#1c1e19] rounded-[1.5rem] p-4.5 shadow-retro-md relative overflow-hidden text-left">
                {/* Diagonal lines texture in background */}
                <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

                {/* Animated exploding emojis from click position */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <AnimatePresence>
                    {burstEmojis.map(burst => (
                      <motion.div
                        key={burst.id}
                        initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
                        animate={{ opacity: 0, scale: 1.8, x: burst.x, y: burst.y, rotate: 360 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute bottom-4 left-1/2 text-2xl"
                      >
                        {burst.emoji}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                  <div className="flex-1">
                    <span className="text-[9px] bg-[#cb4b31] text-[#faf5eb] font-black px-2 py-0.5 rounded-md border-2 border-[#1c1e19] uppercase tracking-wider">
                      🔥 CRAV-O-METER
                    </span>
                    <h4 className="text-sm font-black text-[#1c1e19] font-display uppercase italic mt-1.5 flex items-center gap-1">
                      CRAVING LEVEL: <span className="text-[#cb4b31]">{craveLevel}%</span>
                    </h4>
                    <p className="text-[10px] text-[#606356] font-bold uppercase mt-1 leading-normal">
                      {craveLevel < 100 
                        ? "Tap the boost button to fire up your cravings and unlock a 10% promo!"
                        : "🎉 100% MAXIMUM CRUNCH! USE PROMO CODE 'CRAV10' FOR 10% OFF!"}
                    </p>

                    {/* Styled thick progress bar */}
                    <div className="w-full bg-white border-2 border-[#1c1e19] h-5 rounded-full mt-3 overflow-hidden p-0.5 shadow-retro-sm">
                      <motion.div 
                        initial={{ width: '30%' }}
                        animate={{ width: `${craveLevel}%` }}
                        transition={{ type: "spring", stiffness: 100, damping: 15 }}
                        className="h-full bg-gradient-to-r from-[#dd9d47] to-[#cb4b31] rounded-full relative"
                      >
                        {/* Stripes overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:12px_12px] animate-[marquee_2s_linear_infinite]"></div>
                      </motion.div>
                    </div>
                  </div>

                  <button
                    onClick={handleBoostCrave}
                    className="sm:self-end bg-[#dd9d47] hover:bg-[#df9f37] text-[#1c1e19] font-black text-xs px-4 py-3 rounded-xl border-2 border-[#1c1e19] shadow-retro-sm hover:-translate-y-0.5 active:translate-y-0.5 hover:shadow-retro-md transition-all uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>BOOST CRAVING</span>
                    <span className="text-sm animate-bounce">🔥</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Menu Grid */}
            <motion.div 
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.05 }
                }
              }}
              initial="hidden"
              animate="show"
              className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5"
            >
              {filteredMenuItems.map(item => {
                // Determine item price (depending on size if applicable)
                const isFries = item.id === 'fries';
                const friesSize = selectedSizes[item.id] || 'Medium';
                const currentPrice = isFries 
                  ? (item.sizes?.find(s => s.label === friesSize)?.price || item.price)
                  : item.price;

                const badge = getItemBadge(item.id);

                return (
                  <motion.div 
                    layout
                    variants={{
                      hidden: { opacity: 0, scale: 0.9, y: 15 },
                      show: { opacity: 1, scale: 1, y: 0 }
                    }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    key={item.id}
                    className="bg-white border-3 border-[#1c1e19] rounded-2xl p-4.5 flex gap-4 items-center relative group shadow-retro-md hover:shadow-retro-lg hover:-translate-y-1.5 active:translate-y-0.5 active:shadow-retro-sm transition-all duration-200"
                  >
                    {/* Cute sticker badge absolute on card top-right */}
                    {badge && (
                      <span className={`absolute -top-2 right-3.5 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider border-2 border-[#1c1e19] rounded-md ${badge.bg} ${badge.textCol} shadow-retro-sm transform -rotate-2 z-10 group-hover:rotate-3 group-hover:scale-105 transition-all duration-200`}>
                        {badge.text}
                      </span>
                    )}

                    {/* CSS Emoji Icon Frame */}
                    <div className="w-16 h-16 bg-[#faf5eb] border-3 border-[#1c1e19] rounded-xl flex items-center justify-center text-4xl select-none group-hover:animate-wiggle-hover transition-transform duration-200 shrink-0 shadow-retro-sm">
                      {item.emoji}
                    </div>

                    {/* Information */}
                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="text-sm font-black text-[#1c1e19] truncate leading-tight group-hover:text-[#cb4b31] transition-colors font-display uppercase italic">{item.name}</h4>
                      <p className="text-[10px] text-[#606356] leading-relaxed mt-1 line-clamp-2 font-bold uppercase tracking-tight">
                        {item.description}
                      </p>

                      {/* Size option selector for French Fries */}
                      {item.sizes && (
                        <div className="flex items-center gap-1.5 mt-2.5">
                          {item.sizes.map(sz => {
                            const isSzActive = friesSize === sz.label;
                            return (
                              <button
                                key={sz.label}
                                onClick={() => handleSizeChange(item.id, sz.label)}
                                className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border-2 border-[#1c1e19] cursor-pointer transition-all ${
                                  isSzActive 
                                    ? 'bg-[#cb4b31] text-[#faf5eb] shadow-none translate-x-[1px] translate-y-[1px]' 
                                    : 'bg-[#faf5eb] text-[#1c1e19] shadow-retro-sm hover:-translate-y-0.5 hover:shadow-retro-md'
                                }`}
                              >
                                {sz.label}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-2 border-t-2 border-dashed border-[#1c1e19]/10">
                        <span className="text-sm font-black text-[#cb4b31] tracking-tight font-mono">
                          ₹{currentPrice}
                        </span>
                        
                        <button
                          onClick={() => addToCart(item)}
                          className="bg-[#dd9d47] hover:bg-[#df9f37] text-[#1c1e19] font-black text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-xl flex items-center gap-1 border-2 border-[#1c1e19] cursor-pointer shadow-retro-sm hover:-translate-y-0.5 hover:shadow-retro-md active:translate-y-0.5 active:shadow-retro-sm transition-all"
                        >
                          <Plus className="w-3 h-3 stroke-[3]" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PART 4: CHECKOUT / ORDER CONFIRMATION
            ══════════════════════════════════════════════════════════════════ */}
        {lastPlacedOrder && (
          <div className="p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border-3 border-[#1c1e19] p-6 rounded-[2rem] text-center relative shadow-retro-lg"
            >
              <div className="w-14 h-14 bg-[#faf5eb] border-3 border-[#1c1e19] rounded-full flex items-center justify-center mx-auto mb-3.5 shadow-retro-sm transform -rotate-3">
                <Check className="w-7 h-7 text-emerald-600 stroke-[3]" />
              </div>

              <h2 className="text-xl font-black text-[#1c1e19] tracking-tight uppercase font-display italic">ORDER PLACED! 🎉</h2>
              <div className="inline-block bg-[#dd9d47] border-2 border-[#1c1e19] text-[10px] font-black text-[#1c1e19] px-3.5 py-1 rounded-md mt-2 tracking-wider uppercase shadow-retro-sm transform rotate-2">
                Pay at Counter
              </div>

              {/* Bill Details - Styled as a high-contrast vintage paper receipt card */}
              <div className="my-5 bg-[#faf5eb] border-3 border-[#1c1e19] rounded-2xl p-5 text-xs space-y-3.5 text-left shadow-retro-md relative overflow-hidden">
                {/* Receipt jagged edge design at top and bottom */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-grid-pattern opacity-10"></div>
                <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-[#1c1e19]/20">
                  <span className="text-[#606356] font-black uppercase text-[9px] tracking-wider">Order Reference:</span>
                  <strong className="text-[#cb4b31] tracking-widest font-mono text-sm font-black">{lastPlacedOrder.id}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#606356] font-black uppercase text-[9px] tracking-wider">Table Number:</span>
                  <strong className="text-[#1c1e19] font-black uppercase text-xs">Table {lastPlacedOrder.tableNumber}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#606356] font-black uppercase text-[9px] tracking-wider">Est. Prep Time:</span>
                  <strong className="text-[#1c1e19] font-black flex items-center gap-1.5 uppercase text-xs">
                    <Clock className="w-3.5 h-3.5 text-[#cb4b31] stroke-[3]" />
                    <span>15-20 min</span>
                  </strong>
                </div>
                
                <div className="border-t-2 border-dashed border-[#1c1e19]/20 pt-3 mt-3 space-y-2.5">
                  {lastPlacedOrder.items.map(item => (
                    <div key={item.id} className="flex justify-between text-[11px] text-[#1c1e19] font-semibold">
                      <span>
                        {item.emoji} {item.name} {item.sizeLabel && `(${item.sizeLabel})`} <span className="text-[#cb4b31] font-black">x{item.quantity}</span>
                      </span>
                      <span className="font-mono font-bold text-[#1c1e19]">₹{item.unitPrice * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t-3 border-double border-[#1c1e19] pt-3.5 flex justify-between font-black text-[#1c1e19] text-sm uppercase">
                  <span>Grand Total:</span>
                  <span className="text-[#cb4b31] font-black text-lg font-mono">₹{lastPlacedOrder.total}</span>
                </div>
              </div>

              <p className="text-[10px] text-[#606356] font-bold leading-relaxed px-1 uppercase tracking-tight">
                Show Order ID <strong className="text-[#cb4b31] font-mono font-black">{lastPlacedOrder.id}</strong> at the counter to complete cash/card checkout.
              </p>

              <div className="space-y-3 mt-5">
                <button 
                  onClick={handleOrderMore}
                  className="w-full bg-[#cb4b31] hover:bg-[#cc4c35] text-white py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer border-2 border-[#1c1e19] shadow-retro-md hover:-translate-y-0.5 hover:shadow-retro-lg active:translate-y-0.5 active:shadow-retro-sm transition-all"
                >
                  Order More Items
                </button>
                <button 
                  onClick={() => alert('Staff notified! A waiter is on their way to Table ' + lastPlacedOrder.tableNumber)}
                  className="w-full bg-[#dd9d47] hover:bg-[#df9f37] text-[#1c1e19] py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer border-2 border-[#1c1e19] shadow-retro-md hover:-translate-y-0.5 hover:shadow-retro-lg active:translate-y-0.5 active:shadow-retro-sm transition-all"
                >
                  <Bell className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Call Waiter</span>
                </button>
                <button 
                  onClick={handleDisconnect}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-700 py-3 px-4 rounded-xl font-black text-[10px] uppercase tracking-wider cursor-pointer border-2 border-[#1c1e19] shadow-retro-sm hover:-translate-y-0.5 hover:shadow-retro-md transition-all"
                >
                  Disconnect WiFi &amp; Logout
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </div>

      {/* Sticky Bottom View Cart Bar */}
      {session && !lastPlacedOrder && cart.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 h-20 bg-[#1c1e19] border-3 border-[#1c1e19] rounded-2xl z-30 shadow-retro-lg flex items-center justify-between px-5 transition-transform duration-200">
          <div className="text-left">
            <span className="text-[9px] text-[#dd9d47] uppercase tracking-widest font-black block">CRAV BASKET</span>
            <span className="text-xs font-black text-[#faf5eb]">{totalItemsCount} items • <span className="text-[#dd9d47] font-mono">₹{subtotal}</span></span>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="bg-[#cb4b31] hover:bg-[#cc4c35] text-[#faf5eb] font-black text-xs px-4.5 py-3 rounded-xl border-2 border-[#1c1e19] shadow-retro-sm hover:-translate-y-0.5 hover:shadow-retro-md active:translate-y-0.5 active:shadow-retro-sm flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <ShoppingBag className="w-4 h-4 stroke-[3]" />
            <span>View Basket &rarr;</span>
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          PART 3: CART MODAL
          ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Modal Overlay backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/60 z-40"
            />

            {/* Slide-up Sheet - Warm high-contrast light themed cart basket */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute bottom-0 left-0 right-0 max-h-[85%] bg-[#faf5eb] border-t-4 border-l-4 border-r-4 border-[#1c1e19] rounded-t-[2.5rem] z-50 flex flex-col overflow-hidden text-left shadow-[0_-12px_40px_rgba(28,30,25,0.2)]"
            >
              {/* Header */}
              <div className="px-5 py-4.5 border-b-3 border-[#1c1e19] bg-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#cb4b31] stroke-[3]" />
                  <h3 className="text-sm font-black text-[#1c1e19] uppercase tracking-wider font-display">YOUR BASKET</h3>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-lg font-black text-[#1c1e19] border-2 border-[#1c1e19] rounded-xl hover:bg-red-50 hover:text-[#cb4b31] transition-colors shadow-retro-sm cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-grid-pattern">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between pb-4 border-b-2 border-dashed border-[#1c1e19]/15 last:border-b-0">
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl shrink-0">{item.emoji}</span>
                        <h4 className="text-xs font-black text-[#1c1e19] truncate leading-tight uppercase font-display">{item.name}</h4>
                      </div>
                      {item.sizeLabel && (
                        <span className="inline-block bg-[#cb4b31] text-[#faf5eb] text-[8px] font-black px-1.5 py-0.5 rounded-md border border-[#1c1e19] mt-1 tracking-tight uppercase shadow-retro-sm">
                          {item.sizeLabel}
                        </span>
                      )}
                      <p className="text-[10px] font-bold text-[#606356] mt-1.5">
                        ₹{item.unitPrice} each
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center bg-white border-2 border-[#1c1e19] rounded-xl p-1 shadow-retro-sm">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-5 h-5 flex items-center justify-center text-[#1c1e19] hover:text-[#cb4b31] cursor-pointer font-black"
                        >
                          <Minus className="w-3 h-3 stroke-[3]" />
                        </button>
                        <span className="w-6 text-center text-xs font-black text-[#1c1e19] font-mono">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-5 h-5 flex items-center justify-center text-[#1c1e19] hover:text-[#cb4b31] cursor-pointer font-black"
                        >
                          <Plus className="w-3 h-3 stroke-[3]" />
                        </button>
                      </div>

                      <button 
                        onClick={() => removeCartItem(item.id)}
                        className="text-red-600 hover:text-white p-2 bg-red-50 hover:bg-red-500 rounded-xl border-2 border-[#1c1e19] shadow-retro-sm cursor-pointer transition-colors"
                        title="Delete item"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom billing card */}
              <div className="p-5 bg-white border-t-3 border-[#1c1e19] shrink-0">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#606356] font-bold uppercase tracking-wider text-[10px]">
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-[#606356] font-bold uppercase tracking-wider text-[10px]">
                    <span>GST Tax (5%)</span>
                    <span>₹{gstTax}</span>
                  </div>
                  <div className="flex justify-between text-[#1c1e19] font-black text-sm border-t-2 border-dashed border-[#1c1e19]/20 pt-2.5 mt-2.5 uppercase">
                    <span>Grand Total</span>
                    <span className="text-[#cb4b31] font-black font-mono text-base">₹{totalAmount}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5 mt-4.5">
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="border-2 border-[#1c1e19] hover:bg-[#faf5eb] text-[#1c1e19] py-3.5 rounded-xl font-black text-xs uppercase tracking-wider text-center cursor-pointer shadow-retro-sm hover:-translate-y-0.5 hover:shadow-retro-md transition-all active:translate-y-0.5 active:shadow-retro-sm"
                  >
                    Add More
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    className="bg-[#cb4b31] hover:bg-[#cc4c35] text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider text-center cursor-pointer border-2 border-[#1c1e19] shadow-retro-md hover:-translate-y-0.5 hover:shadow-retro-lg active:translate-y-0.5 active:shadow-retro-sm transition-all"
                  >
                    Place Order
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
