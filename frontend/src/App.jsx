import React, { useRef, useState, useMemo, Suspense, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  Home,
  Shirt,
  Sparkles,
  Clock,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronLeft,
  RotateCcw,
  Sun,
  GraduationCap,
  Wine,
  Briefcase,
  Heart,
  Grid,
  Check,
  Compass,
  ShoppingBag,
  Eye,
  SlidersHorizontal,
  Layers,
  Scissors,
  Sparkle,
  Footprints,
  Maximize2,
  Tv,
  Upload,
  Camera,
  LogIn,
  LogOut,
  User,
  X,
  Trash2,
  Database
} from 'lucide-react';
import VRScene from './components/VRScene.jsx';
import ProductDetailsModal from './components/ProductDetailsModal.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import WishlistDrawer from './components/WishlistDrawer.jsx';
import GroqAIPanel from './components/GroqAIPanel.jsx';
import UploadClothModal from './components/UploadClothModal.jsx';
import { PRODUCTS, CATEGORIES, getRecommendations } from './data/products.js';
import { analyzeClothingImage } from './services/aiService.js';
import {
  getAuthToken,
  getSavedUser,
  ensureAuth,
  loginUser,
  logoutUser,
  getWardrobe,
  addClothingItem,
  uploadClothingImage,
  deleteClothingItem
} from './services/backendService.js';

// Loading fallback for 3D canvas
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p className="loading-text">Loading Virtual Boutique…</p>
    </div>
  );
}

export default function App() {
  const controlsRef = useRef();

  // --- Avatar Position, Heading & Walking State ---
  const [avatarPosition, setAvatarPosition] = useState([0, 0, 0]);
  const [avatarRotation, setAvatarRotation] = useState([0, 0, 0]);
  const [isWalking, setIsWalking] = useState(false);

  // --- Virtual Try-On Wardrobe Outfit State ---
  const [currentOutfit, setCurrentOutfit] = useState({
    top: PRODUCTS.find((p) => p.id === 'top-1'),
    bottom: PRODUCTS.find((p) => p.id === 'trouser-1'),
    dress: null,
    outerwear: null,
    shoes: PRODUCTS.find((p) => p.id === 'shoe-1'),
    accessory: PRODUCTS.find((p) => p.id === 'acc-1')
  });

  const [isTryOnEffect, setIsTryOnEffect] = useState(false);

  // --- Camera & View State ---
  const [cameraMode, setCameraMode] = useState('follow');
  const [autoRotate, setAutoRotate] = useState(false);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const [isVRActive, setIsVRActive] = useState(false);

  // --- Catalog, Filtering & Modals ---
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeOccasion, setActiveOccasion] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // --- Cart & Wishlist State ---
  const [cartItems, setCartItems] = useState([
    {
      ...PRODUCTS[0],
      selectedSize: 'S',
      selectedColor: PRODUCTS[0].colors[0],
      quantity: 1
    }
  ]);
  const [wishlistItems, setWishlistItems] = useState([PRODUCTS[3], PRODUCTS[10]]);

  // --- Drawers Open/Close ---
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isStylistOpen, setIsStylistOpen] = useState(false);

  // --- Mobile Touch D-Pad State ---
  const [dpadInput, setDpadInput] = useState({ x: 0, y: 0 });
  const dpadTimerRef = useRef(null);

  // --- Upload Cloth Feature ---
  const [uploadedClothes, setUploadedClothes] = useState([]);
  const [isUploadingCloth, setIsUploadingCloth] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [pendingUploadFile, setPendingUploadFile] = useState(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  // --- Wardrobe View Mode: 'wardrobe' (MongoDB) vs 'catalog' (Boutique) ---
  const [panelTab, setPanelTab] = useState('wardrobe');

  // --- Backend Auth & Wardrobe State ---
  const [authToken, setAuthToken] = useState(() => getAuthToken());
  const [currentUser, setCurrentUser] = useState(() => getSavedUser());
  const [backendWardrobe, setBackendWardrobe] = useState([]);
  const [isLoadingWardrobe, setIsLoadingWardrobe] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Helper to trigger toast notification
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  }, []);

  // On mount: ensure authentication and load all MongoDB wardrobe clothes
  useEffect(() => {
    let active = true;
    setIsLoadingWardrobe(true);

    const initWardrobe = async () => {
      try {
        const token = await ensureAuth();
        if (!active) return;
        if (token) {
          setAuthToken(token);
          setCurrentUser(getSavedUser());
        }
        const clothes = await getWardrobe(token);
        if (active && Array.isArray(clothes)) {
          setBackendWardrobe(clothes);
        }
      } catch (err) {
        console.warn('Initial wardrobe load error:', err.message);
      } finally {
        if (active) setIsLoadingWardrobe(false);
      }
    };

    initWardrobe();
    return () => { active = false; };
  }, []);

  // Fetch backend wardrobe whenever token changes or on initial mount
  useEffect(() => {
    setIsLoadingWardrobe(true);
    getWardrobe(authToken)
      .then((items) => {
        if (Array.isArray(items)) {
          setBackendWardrobe(items);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingWardrobe(false));
  }, [authToken]);

  // Login handler
  const handleLogin = useCallback(async (e) => {
    e?.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const data = await loginUser(loginEmail, loginPassword);
      setAuthToken(data.token);
      setCurrentUser(data.user);
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
      showToast('Signed in successfully! Wardrobe synced.');
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  }, [loginEmail, loginPassword, showToast]);

  // Logout handler
  const handleLogout = useCallback(() => {
    logoutUser();
    setAuthToken(null);
    setCurrentUser(null);
    setBackendWardrobe([]);
    showToast('Signed out of WardrobeWise.');
  }, [showToast]);

  // Delete clothing item from MongoDB
  const handleDeleteWardrobeItem = useCallback(async (e, item) => {
    e.stopPropagation();
    if (!window.confirm(`Remove "${item.name}" from your MongoDB wardrobe?`)) return;
    try {
      const token = authToken || (await ensureAuth());
      const ok = await deleteClothingItem(token, item.backendId);
      if (ok) {
        setBackendWardrobe((prev) => prev.filter((i) => i.backendId !== item.backendId));
        setUploadedClothes((prev) => prev.filter((i) => i.id !== item.id));
        showToast(`"${item.name}" deleted from MongoDB`);
      }
    } catch (err) {
      console.warn('Delete error:', err.message);
    }
  }, [authToken, showToast]);

  // --- Handlers: Virtual Try-On ---
  const handleTryOn = (product) => {
    if (!product) return;
    setIsTryOnEffect(true);
    setTimeout(() => setIsTryOnEffect(false), 2000);
    showToast(`Dressed 3D Model in: ${product.name}`);

    setCurrentOutfit((prev) => {
      const next = { ...prev };
      const cat = (product.category || '').toLowerCase();
      const type = (product.garmentType || '').toLowerCase();
      const name = (product.name || '').toLowerCase();

      const silhouette = (product.silhouette || '').toLowerCase();
      const isDress =
        cat === 'dresses' ||
        cat === 'dress' ||
        cat === 'saree' ||
        cat === 'anarkali' ||
        cat === 'lehenga' ||
        cat === 'frock' ||
        type === 'dress' ||
        name.includes('dress') ||
        name.includes('gown') ||
        name.includes('frock') ||
        name.includes('saree') ||
        name.includes('anarkali') ||
        silhouette.includes('frock') ||
        silhouette.includes('saree') ||
        silhouette.includes('anarkali');

      const isTop =
        !isDress &&
        (cat === 'tops' ||
          cat === 'top' ||
          cat === 'shirt' ||
          cat === 't-shirt' ||
          cat === 'kurti' ||
          type === 'top' ||
          name.includes('shirt') ||
          name.includes('top') ||
          name.includes('blouse') ||
          name.includes('tee') ||
          name.includes('sweater') ||
          name.includes('pullover'));

      const isBottom =
        !isDress &&
        (cat === 'trousers' ||
          cat === 'bottom' ||
          cat === 'bottoms' ||
          cat === 'jeans' ||
          cat === 'skirts' ||
          cat === 'skirt' ||
          type === 'bottom' ||
          name.includes('jean') ||
          name.includes('pant') ||
          name.includes('trouser') ||
          name.includes('skirt') ||
          name.includes('slacks'));

      const isOuterwear =
        !isDress &&
        (cat === 'outerwear' ||
          cat === 'jacket' ||
          cat === 'coat' ||
          type === 'outerwear' ||
          name.includes('jacket') ||
          name.includes('coat') ||
          name.includes('trench') ||
          name.includes('blazer'));

      const isShoes =
        cat === 'shoes' ||
        cat === 'footwear' ||
        cat === 'jutti' ||
        type === 'shoes' ||
        name.includes('shoe') ||
        name.includes('sneaker') ||
        name.includes('heel') ||
        name.includes('pump') ||
        name.includes('sandal') ||
        name.includes('boot') ||
        name.includes('loafer') ||
        name.includes('jutti');

      const isAccessory =
        cat === 'accessories' ||
        cat === 'accessory' ||
        cat === 'bags' ||
        cat === 'bag' ||
        type === 'accessory' ||
        name.includes('bag') ||
        name.includes('belt') ||
        name.includes('chain') ||
        name.includes('necklace') ||
        name.includes('jewelry');

      if (isDress) {
        next.dress = product;
        next.top = null;
        next.bottom = null;
      } else if (isTop) {
        next.top = product;
        next.dress = null;
        if (!next.bottom) {
          next.bottom = PRODUCTS.find((p) => p.category === 'trousers');
        }
      } else if (isBottom) {
        next.bottom = product;
        next.dress = null;
        if (!next.top) {
          next.top = PRODUCTS.find((p) => p.category === 'tops');
        }
      } else if (isOuterwear) {
        next.outerwear = prev.outerwear?.id === product.id ? null : product;
      } else if (isShoes) {
        next.shoes = product;
      } else if (isAccessory) {
        next.accessory = prev.accessory?.id === product.id ? null : product;
      }

      return next;
    });
  };

  const handleTryFullOutfit = (items) => {
    setIsTryOnEffect(true);
    setTimeout(() => setIsTryOnEffect(false), 2200);
    showToast('Applied curated outfit on 3D Model!');

    setCurrentOutfit((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        const cat = (item.category || '').toLowerCase();
        const type = (item.garmentType || '').toLowerCase();
        const name = (item.name || '').toLowerCase();

        const isDress =
          cat === 'dresses' ||
          cat === 'dress' ||
          type === 'dress' ||
          name.includes('dress') ||
          name.includes('gown');

        const isTop =
          !isDress &&
          (cat === 'tops' ||
            cat === 'top' ||
            cat === 'shirt' ||
            cat === 't-shirt' ||
            type === 'top');

        const isBottom =
          !isDress &&
          (cat === 'trousers' ||
            cat === 'bottom' ||
            cat === 'bottoms' ||
            cat === 'jeans' ||
            cat === 'skirts' ||
            cat === 'skirt' ||
            type === 'bottom');

        if (isDress) {
          next.dress = item;
          next.top = null;
          next.bottom = null;
        } else if (isTop) {
          next.top = item;
          next.dress = null;
        } else if (isBottom) {
          next.bottom = item;
          next.dress = null;
        } else if (cat === 'outerwear' || cat === 'jacket' || cat === 'coat') {
          next.outerwear = item;
        } else if (cat === 'shoes' || cat === 'footwear') {
          next.shoes = item;
        } else if (cat === 'accessories' || cat === 'accessory') {
          next.accessory = item;
        }
      });
      return next;
    });
  };

  const handleResetOutfit = () => {
    setIsTryOnEffect(true);
    setTimeout(() => setIsTryOnEffect(false), 1500);
    setCurrentOutfit({
      top: PRODUCTS.find((p) => p.id === 'top-1'),
      bottom: PRODUCTS.find((p) => p.id === 'trouser-1'),
      dress: null,
      outerwear: null,
      shoes: PRODUCTS.find((p) => p.id === 'shoe-1'),
      accessory: PRODUCTS.find((p) => p.id === 'acc-1')
    });
  };



  // --- Handlers: Shopping Bag ---
  const handleAddToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (i) =>
          i.id === product.id &&
          i.selectedSize === product.selectedSize &&
          i.selectedColor?.name === product.selectedColor?.name
      );
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...i, quantity: (i.quantity || 1) + (product.quantity || 1) } : i
        );
      }
      return [...prev, { ...product, quantity: product.quantity || 1 }];
    });
  };

  const handleUpdateQuantity = (id, newQty) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item))
    );
  };

  const handleRemoveFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // --- Handlers: Wishlist ---
  const handleToggleWishlist = (product) => {
    setWishlistItems((prev) => {
      const exists = prev.some((i) => i.id === product.id);
      if (exists) {
        return prev.filter((i) => i.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const handleRemoveFromWishlist = (id) => {
    setWishlistItems((prev) => prev.filter((i) => i.id !== id));
  };

  // --- Handlers: Camera Controls ---
  const toggleAutoRotate = () => setAutoRotate((prev) => !prev);

  const toggleCameraMode = () => {
    setCameraMode((prev) => (prev === 'follow' ? 'free' : 'follow'));
  };

  const toggleZoom = () => {
    if (!controlsRef.current) return;
    const ctrl = controlsRef.current;
    if (isZoomedIn) {
      ctrl.object.position.set(0, 1.9, 3.4);
      ctrl.target.set(avatarPosition[0], 1.75, avatarPosition[2]);
      setIsZoomedIn(false);
    } else {
      ctrl.object.position.set(avatarPosition[0], 2.2, avatarPosition[2] + 1.7);
      ctrl.target.set(avatarPosition[0], 2.2, avatarPosition[2]);
      setIsZoomedIn(true);
    }
  };

  const handleToggleWebXR = () => {
    if (navigator.xr && navigator.xr.isSessionSupported) {
      navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
        if (supported) {
          navigator.xr.requestSession('immersive-vr').catch(() => { });
        } else {
          toggleFullscreen();
        }
      });
    } else {
      toggleFullscreen();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
      setIsVRActive(true);
    } else {
      document.exitFullscreen().catch(() => { });
      setIsVRActive(false);
    }
  };

  // --- Mobile D-Pad Touch Controller ---
  const handleDpadPress = (dx, dy) => {
    setDpadInput({ x: dx, y: dy });
    if (dpadTimerRef.current) clearInterval(dpadTimerRef.current);
    dpadTimerRef.current = setInterval(() => {
      setDpadInput({ x: dx, y: dy });
    }, 50);
  };

  const handleDpadRelease = () => {
    if (dpadTimerRef.current) {
      clearInterval(dpadTimerRef.current);
      dpadTimerRef.current = null;
    }
    setDpadInput({ x: 0, y: 0 });
  };

  // --- Upload Cloth: Opens confirmation modal to ask user for real details ---
  const handleClothUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingUploadFile(file);
    setPendingPreviewUrl(URL.createObjectURL(file));
    setIsUploadModalOpen(true);

    if (e.target) e.target.value = '';
  };

  // --- Save Uploaded Cloth to MongoDB Atlas with Exact User-Entered Details ---
  const handleSaveUploadedCloth = async (details) => {
    setIsUploadingCloth(true);
    setUploadStatus('Saving to MongoDB Atlas…');

    try {
      const token = authToken || (await ensureAuth());
      if (token && !authToken) {
        setAuthToken(token);
        setCurrentUser(getSavedUser());
      }

      // 1. Save document to MongoDB with user-provided details
      const savedBackendItem = await addClothingItem(token, {
        name: details.name,
        category: details.category,
        subCategory: details.subCategory,
        color: details.color,
        primaryColor: details.primaryColor,
        pattern: details.pattern,
        material: details.material,
        occasion: details.occasion,
        season: details.season,
        style: details.style,
        description: details.description,
        tags: details.tags,
        size: 'M',
        price: 110
      });

      // 2. Upload actual image file to /api/clothes/:id/image
      if (savedBackendItem?.backendId && pendingUploadFile) {
        setUploadStatus('Uploading Image File to Database…');
        const imageResult = await uploadClothingImage(token, savedBackendItem.backendId, pendingUploadFile);
        if (imageResult?.image) {
          savedBackendItem.image = imageResult.image;
        }
      }

      // 3. Immediately refresh fresh wardrobe from MongoDB Atlas
      const freshList = await getWardrobe(token);
      if (freshList && freshList.length > 0) {
        setBackendWardrobe(freshList);
      } else {
        setBackendWardrobe((prev) => [savedBackendItem, ...prev]);
      }

      // 4. Zero-latency 3D avatar dressing
      handleTryOn(savedBackendItem);
      setSelectedProduct(savedBackendItem);
      setPanelTab('wardrobe');
      showToast(`"${details.name}" saved to MongoDB & added to your Wardrobe!`);

      // 5. Close modal & clear pending file
      setIsUploadModalOpen(false);
      setPendingUploadFile(null);
      setPendingPreviewUrl(null);
    } catch (saveErr) {
      console.warn('MongoDB save error:', saveErr.message);
      showToast(`Upload failed: ${saveErr.message}`);
    } finally {
      setIsUploadingCloth(false);
      setUploadStatus('');
    }
  };

  // Filtered Products for Right Wardrobe Sidebar
  const displayedItems = useMemo(() => {
    let sourceList = panelTab === 'wardrobe'
      ? [...uploadedClothes.filter(u => !backendWardrobe.some(b => b.backendId === u.backendId)), ...backendWardrobe]
      : PRODUCTS;

    if (activeCategory !== 'all') {
      const cat = activeCategory.toLowerCase();
      sourceList = sourceList.filter((p) => {
        const itemCat = (p.category || '').toLowerCase();
        const rawCat = (p.rawCategory || '').toLowerCase();
        const subCat = (p.subCategory || '').toLowerCase();
        const name = (p.name || '').toLowerCase();

        if (cat === 'tops') {
          return itemCat === 'tops' ||
            ['shirt', 't-shirt', 'top', 'blouse', 'sweater', 'hoodie', 'camisole', 'tee'].includes(rawCat) ||
            ['shirt', 't-shirt', 'top', 'blouse', 'sweater', 'hoodie', 'camisole', 'tee'].some(k => subCat.includes(k)) ||
            name.includes('shirt') || name.includes('top') || name.includes('tee') || name.includes('sweater') || name.includes('blouse');
        }
        if (cat === 'trousers') {
          return itemCat === 'trousers' ||
            ['jeans', 'trousers', 'trouser', 'pants', 'pant', 'skirt', 'skirts', 'bottom', 'bottoms', 'slacks', 'shorts', 'denim'].includes(rawCat) ||
            ['jeans', 'trousers', 'pants', 'skirt', 'midi', 'slim', 'straight'].some(k => subCat.includes(k)) ||
            name.includes('jean') || name.includes('trouser') || name.includes('pant') || name.includes('skirt');
        }
        if (cat === 'dresses') {
          return itemCat === 'dresses' ||
            ['dress', 'dresses', 'frock', 'saree', 'sari', 'anarkali', 'lehenga', 'kurti', 'gown', 'suit', 'ethnic', 'traditional'].includes(rawCat) ||
            ['dress', 'frock', 'saree', 'anarkali', 'lehenga', 'kurti', 'gown'].some(k => subCat.includes(k)) ||
            name.includes('dress') || name.includes('frock') || name.includes('saree') || name.includes('anarkali') || name.includes('kurti') || name.includes('lehenga') || name.includes('suit');
        }
        if (cat === 'outerwear') {
          return itemCat === 'outerwear' ||
            ['jacket', 'coat', 'coats', 'blazer', 'cardigan', 'overcoat', 'outerwear'].includes(rawCat) ||
            ['jacket', 'coat', 'blazer', 'cardigan', 'overcoat'].some(k => subCat.includes(k)) ||
            name.includes('jacket') || name.includes('coat') || name.includes('blazer');
        }
        if (cat === 'shoes') {
          return itemCat === 'shoes' ||
            ['shoes', 'shoe', 'sneakers', 'sneaker', 'boots', 'boot', 'heels', 'heel', 'loafers', 'loafer', 'jutti', 'juttis', 'footwear'].includes(rawCat) ||
            ['shoes', 'sneaker', 'boot', 'heel', 'loafer', 'jutti'].some(k => subCat.includes(k)) ||
            name.includes('shoe') || name.includes('sneaker') || name.includes('loafer') || name.includes('jutti') || name.includes('boot');
        }
        if (cat === 'accessories') {
          return itemCat === 'accessories' ||
            ['accessories', 'accessory', 'bag', 'bags', 'belt', 'jewelry', 'handbag', 'wallet', 'scarf'].includes(rawCat) ||
            ['bag', 'belt', 'jewelry', 'accessory'].some(k => subCat.includes(k)) ||
            name.includes('bag') || name.includes('belt') || name.includes('accessory');
        }
        return itemCat === cat;
      });
    }

    if (activeOccasion && activeOccasion !== 'All') {
      const occLower = activeOccasion.toLowerCase();
      const matched = sourceList.filter((p) => {
        const occList = Array.isArray(p.occasion) ? p.occasion : [];
        const tagList = Array.isArray(p.tags) ? p.tags : [];
        return occList.some((o) => o.toLowerCase().includes(occLower)) ||
          tagList.some((t) => t.toLowerCase().includes(occLower));
      });
      if (matched.length > 0) sourceList = matched;
    }
    return sourceList;
  }, [panelTab, activeCategory, activeOccasion, uploadedClothes, backendWardrobe]);

  return (
    <div className="app-root">

      {/* =========================================================
          3D WEBGL VIRTUAL BOUTIQUE CANVAS — Full Viewport Layer
          ========================================================= */}
      <div className="canvas-layer">
        <Canvas
          shadows
          camera={{ position: [0, 1.9, 3.4], fov: 44 }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
          }}
          onCreated={({ gl }) => {
            gl.setClearColor('#14101f', 1);
          }}
        >
          <Suspense fallback={null}>
            <VRScene
              controlsRef={controlsRef}
              autoRotate={autoRotate}
              avatarPosition={avatarPosition}
              setAvatarPosition={setAvatarPosition}
              avatarRotation={avatarRotation}
              setAvatarRotation={setAvatarRotation}
              isWalking={isWalking}
              setIsWalking={setIsWalking}
              currentOutfit={currentOutfit}
              isTryOnEffect={isTryOnEffect}
              selectedProduct={selectedProduct}
              onSelectProduct={(p) => handleTryOn(p)}
              activeCategory={activeCategory}
              cameraMode={cameraMode}
              dpadInput={dpadInput}
              onResetDpad={() => setDpadInput({ x: 0, y: 0 })}
              avatarMode="demo"
              personalizedProfile={null}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Try-On Flash Toast */}
      {isTryOnEffect && (
        <div className="tryon-toast">
          <Sparkles size={15} className="text-pink-300" />
          <span>Trying on outfit…</span>
        </div>
      )}

      {/* MongoDB Database Toast Notification */}
      {toastMessage && (
        <div
          className="tryon-toast"
          style={{
            bottom: 78,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))',
            borderColor: '#34d399',
            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.35)'
          }}
        >
          <Database size={15} style={{ color: '#fff' }} />
          <span style={{ color: '#fff', fontWeight: 600 }}>{toastMessage}</span>
        </div>
      )}

      {/* Movement Hint Pill */}
      <div className="hint-pill">
        <Compass size={13} />
        <span>Walk: <strong>WASD / Arrow Keys</strong> or D-Pad &nbsp;·&nbsp; Click clothes to inspect &amp; try on</span>
      </div>

      {/* =========================================================
          TOP NAVIGATION BAR
          ========================================================= */}
      <header className="topbar">
        {/* Brand */}
        <div className="topbar-brand">
          <div className="brand-icon-wrap">
            <Shirt size={18} />
          </div>
          <div>
            <h1 className="brand-name">WardrobeWise</h1>
            <p className="brand-tagline">Your Style. Your Space. In VR.</p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="topbar-actions">
          <button
            onClick={toggleCameraMode}
            className={`topbar-pill-btn${cameraMode === 'follow' ? ' active' : ''}`}
            title="Toggle camera mode"
          >
            <Eye size={14} />
            <span>{cameraMode === 'follow' ? 'Following' : 'Free Cam'}</span>
          </button>

          <button
            onClick={handleResetOutfit}
            className="topbar-pill-btn"
            title="Reset outfit"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>

          <button
            onClick={() => setIsWishlistOpen(true)}
            className="topbar-icon-btn"
            title="Wishlist"
          >
            <Heart size={17} />
            {wishlistItems.length > 0 && (
              <span className="topbar-badge">{wishlistItems.length}</span>
            )}
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            className="topbar-icon-btn"
            title="Shopping bag"
          >
            <ShoppingBag size={17} />
            {cartItems.length > 0 && (
              <span className="topbar-badge">
                {cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0)}
              </span>
            )}
          </button>

          {currentUser ? (
            <div className="profile-pill" style={{ cursor: 'pointer' }} onClick={handleLogout} title="Click to sign out">
              <div className="profile-avatar" style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg,#9e7bb5,#e879a0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0
              }}>
                {(currentUser.name || currentUser.email || 'U')[0].toUpperCase()}
              </div>
              <span className="profile-name">Hi, {(currentUser.name || currentUser.email || '').split(' ')[0]}</span>
              <LogOut size={13} style={{ opacity: 0.7 }} />
            </div>
          ) : (
            <button
              className="topbar-pill-btn"
              onClick={() => setShowLoginModal(true)}
              title="Sign in to sync your wardrobe"
              style={{ background: 'rgba(158,123,181,0.25)', borderColor: 'rgba(158,123,181,0.5)' }}
            >
              <LogIn size={13} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* =========================================================
          LEFT NAVIGATION DOCK
          ========================================================= */}
      <nav className="left-dock">
        <button
          className={`dock-btn${panelTab === 'catalog' ? ' active' : ''}`}
          title="Boutique Catalog"
          onClick={() => {
            setPanelTab('catalog');
            setActiveCategory('all');
          }}
        >
          <Home size={18} />
          <span>Catalog</span>
        </button>
        <button
          className={`dock-btn${panelTab === 'wardrobe' ? ' active' : ''}`}
          title="My Wardrobe (MongoDB Atlas)"
          onClick={() => {
            setPanelTab('wardrobe');
            setActiveCategory('all');
          }}
        >
          <Shirt size={18} />
          <span>Wardrobe</span>
        </button>
        <button
          className="dock-btn"
          title="AI Stylist"
          onClick={() => setIsStylistOpen(true)}
        >
          <Sparkle size={18} />
          <span>Stylist AI</span>
        </button>
        <button
          className="dock-btn"
          title="My Bag"
          onClick={() => setIsCartOpen(true)}
        >
          <ShoppingBag size={18} />
          <span>My Bag</span>
        </button>
        <button
          className="dock-btn"
          title="Auto-Rotate"
          onClick={toggleAutoRotate}
        >
          <Settings size={18} />
          <span>Rotate</span>
        </button>
      </nav>

      {/* =========================================================
          BOTTOM-LEFT D-PAD CONTROLLER
          ========================================================= */}
      <div className="dpad-wrap">
        <div className="dpad-disc">
          <div className="dpad-dot" />
          <button
            onPointerDown={() => handleDpadPress(0, 1)}
            onPointerUp={handleDpadRelease}
            onPointerLeave={handleDpadRelease}
            className="dpad-btn dpad-up"
            aria-label="Forward"
          >
            <ChevronUp size={15} />
          </button>
          <button
            onPointerDown={() => handleDpadPress(0, -1)}
            onPointerUp={handleDpadRelease}
            onPointerLeave={handleDpadRelease}
            className="dpad-btn dpad-down"
            aria-label="Backward"
          >
            <ChevronDown size={15} />
          </button>
          <button
            onPointerDown={() => handleDpadPress(-1, 0)}
            onPointerUp={handleDpadRelease}
            onPointerLeave={handleDpadRelease}
            className="dpad-btn dpad-left"
            aria-label="Left"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onPointerDown={() => handleDpadPress(1, 0)}
            onPointerUp={handleDpadRelease}
            onPointerLeave={handleDpadRelease}
            className="dpad-btn dpad-right"
            aria-label="Right"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* =========================================================
          BOTTOM CENTER CONTROLS BAR
          ========================================================= */}
      <div className="bottom-bar">
        <button
          onClick={toggleAutoRotate}
          className={`bar-btn${autoRotate ? ' active' : ''}`}
        >
          <RotateCcw size={14} />
          <span>{autoRotate ? 'Rotating' : 'Rotate 360°'}</span>
        </button>
        <button
          onClick={toggleZoom}
          className={`bar-btn${isZoomedIn ? ' active' : ''}`}
        >
          <Maximize2 size={14} />
          <span>{isZoomedIn ? 'Zoom Out' : 'Zoom In'}</span>
        </button>
        <button
          onClick={toggleCameraMode}
          className={`bar-btn${cameraMode === 'follow' ? ' active' : ''}`}
        >
          <Eye size={14} />
          <span>{cameraMode === 'follow' ? 'Follow' : 'Free Cam'}</span>
        </button>
        <button
          onClick={handleToggleWebXR}
          className={`bar-btn${isVRActive ? ' active' : ''}`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="4" />
            <circle cx="8" cy="12" r="2.5" />
            <circle cx="16" cy="12" r="2.5" />
          </svg>
          <span>VR Mode</span>
        </button>
      </div>

      {/* =========================================================
          RIGHT FLOATING WARDROBE PANEL
          ========================================================= */}
      <aside className="wardrobe-panel">

        {/* View Mode Switcher: My Wardrobe (MongoDB) vs Store Catalog */}
        <div className="wardrobe-mode-tabs">
          <button
            type="button"
            className={`wardrobe-mode-tab${panelTab === 'wardrobe' ? ' active' : ''}`}
            onClick={() => {
              setPanelTab('wardrobe');
              setActiveCategory('all');
            }}
          >
            <Shirt size={14} />
            <span>My Wardrobe ({backendWardrobe.length})</span>
          </button>
          <button
            type="button"
            className={`wardrobe-mode-tab${panelTab === 'catalog' ? ' active' : ''}`}
            onClick={() => setPanelTab('catalog')}
          >
            <Grid size={14} />
            <span>Store Catalog</span>
          </button>
        </div>

        {/* Auth Status & Sync Banner */}
        {!currentUser ? (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderRadius: 10, marginBottom: 14,
              background: 'rgba(158,123,181,0.12)', border: '1px solid rgba(158,123,181,0.25)',
              cursor: 'pointer'
            }}
            onClick={() => setShowLoginModal(true)}
          >
            <LogIn size={13} style={{ color: '#9e7bb5', flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>
              <strong style={{ color: '#c4a8e0' }}>Sign in</strong> to sync your wardrobe &amp; save outfits
            </span>
          </div>
        ) : null}

        {/* Clothing Categories */}
        <div>
          <h2 className="panel-heading">Clothing Categories</h2>
          <div className="cat-grid">
            {[
              { key: 'all', label: 'All', Icon: Grid },
              { key: 'tops', label: 'Tops', Icon: Shirt },
              { key: 'trousers', label: 'Bottoms', Icon: Scissors },
              { key: 'dresses', label: 'Dresses', Icon: Sparkles },
              { key: 'outerwear', label: 'Coats', Icon: Layers },
              { key: 'shoes', label: 'Shoes', Icon: Footprints },
              { key: 'accessories', label: 'Accessories', Icon: ShoppingBag },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`cat-tile${activeCategory === key ? ' active' : ''}`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Upload Cloth Feature (Stores directly in MongoDB Atlas) */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleClothUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />

          <div className="catalog-header">
            <h3 className="catalog-title">Upload Cloth to Wardrobe</h3>
          </div>

          {/* Dedicated Upload Button / Dropzone */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="upload-dropzone"
            disabled={isUploadingCloth}
            title="Upload cloth image from your computer to store in MongoDB Atlas and try on 3D avatar"
          >
            <div className="upload-dropzone-inner">
              <div className="upload-icon-circle">
                <Upload size={20} />
              </div>
              <div>
                <p className="upload-primary-text">
                  {isUploadingCloth ? (uploadStatus || 'Saving to MongoDB…') : 'Upload Cloth Image'}
                </p>
                <p className="upload-sub-text">
                  {isUploadingCloth
                    ? 'Processing AI Vision & Database…'
                    : 'Click to upload · Stores in MongoDB & 3D Try-On'}
                </p>
              </div>
            </div>
          </button>

          {/* Active Category Garments List (Directly reflects selected tab & category) */}
          <div style={{ marginTop: '14px' }}>
            <div className="catalog-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h3 className="catalog-title">
                  {panelTab === 'wardrobe' ? 'My Wardrobe Pieces' : 'Store Catalog'}
                </h3>
                {panelTab === 'wardrobe' && null}
              </div>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.55)' }}>
                {displayedItems.length} {displayedItems.length === 1 ? 'piece' : 'pieces'}
              </span>
            </div>

            {displayedItems.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '28px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
                marginTop: '10px'
              }}>
                <Shirt size={28} style={{ color: 'rgba(255,255,255,0.25)', margin: '0 auto 8px', display: 'block' }} />
                <p style={{ margin: '0 0 6px 0', fontSize: '12.5px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                  {panelTab === 'wardrobe' ? 'No saved clothes in this category' : 'No catalog items found'}
                </p>
                <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
                  {panelTab === 'wardrobe'
                    ? (activeCategory !== 'all'
                        ? `You have ${backendWardrobe.length} saved clothes in other categories.`
                        : 'Click "Upload Cloth Image" above to store custom pieces in your MongoDB database!')
                    : 'Select "All" to browse the complete collection.'}
                </p>
                {activeCategory !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setActiveCategory('all')}
                    style={{
                      marginTop: '12px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                      border: 'none',
                      color: 'white',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    View All {panelTab === 'wardrobe' ? `${backendWardrobe.length} Saved Clothes` : 'Catalog Items'}
                  </button>
                )}
              </div>
            ) : (
              <div className="garment-grid">
                {displayedItems.map((item) => {
                  const isSelected = selectedProduct?.id === item.id;
                  const isWearing =
                    currentOutfit.top?.id === item.id ||
                    currentOutfit.bottom?.id === item.id ||
                    currentOutfit.dress?.id === item.id ||
                    currentOutfit.outerwear?.id === item.id ||
                    currentOutfit.shoes?.id === item.id ||
                    currentOutfit.accessory?.id === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTryOn(item)}
                      className={`garment-card${isWearing ? ' selected' : ''}`}
                      title={`${item.name} — Click to wear on 3D avatar`}
                    >
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="garment-img" />
                      ) : (
                        <Shirt size={22} style={{ color: item.primaryColor }} />
                      )}
                      {isWearing && (
                        <span className="wearing-dot" title="Currently wearing on avatar">
                          <Check size={9} strokeWidth={3} />
                        </span>
                      )}
                      {item.backendId && (
                        <span
                          className="wardrobe-delete-btn"
                          onClick={(e) => handleDeleteWardrobeItem(e, item)}
                          title={`Delete "${item.name}" from MongoDB`}
                        >
                          <Trash2 size={11} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Occasion Filter */}
        <div>
          <h2 className="panel-heading">Occasion</h2>
          <div className="occasion-grid">
            {[
              { key: 'Casual', label: 'Casual', Icon: Sun },
              { key: 'College', label: 'College', Icon: GraduationCap },
              { key: 'Party', label: 'Party', Icon: Wine },
              { key: 'Office', label: 'Office', Icon: Briefcase },
              { key: 'Date', label: 'Date', Icon: Heart },
              { key: 'All', label: 'All', Icon: Sparkle }
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveOccasion(key)}
                className={`occasion-pill${activeOccasion === key ? ' active' : ''}`}
              >
                <Icon size={11} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* AI Stylist CTA */}
        <div
          className="ai-cta-card"
          onClick={() => setIsStylistOpen(true)}
          role="button"
          tabIndex={0}
          title="AI Outfit Suggestions"
        >
          <div className="ai-cta-header">
            <Sparkles size={15} className="ai-cta-icon" />
            <h4 className="ai-cta-title">AI Outfit Suggestions</h4>
            <ChevronRight size={13} className="ai-cta-arrow" />
          </div>
          <p className="ai-cta-desc">
            Get personalized outfit ideas based on your style, occasion, and current look.
          </p>
        </div>
      </aside>

      {/* =========================================================
          PRODUCT DETAILS MODAL
          ========================================================= */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onTryOn={handleTryOn}
          onAddToCart={handleAddToCart}
          onToggleWishlist={handleToggleWishlist}
          isWishlisted={wishlistItems.some((i) => i.id === selectedProduct.id)}
          isCurrentlyTriedOn={
            currentOutfit.top?.id === selectedProduct.id ||
            currentOutfit.bottom?.id === selectedProduct.id ||
            currentOutfit.dress?.id === selectedProduct.id ||
            currentOutfit.outerwear?.id === selectedProduct.id ||
            currentOutfit.shoes?.id === selectedProduct.id ||
            currentOutfit.accessory?.id === selectedProduct.id
          }
        />
      )}

      {/* =========================================================
          SHOPPING BAG DRAWER
          ========================================================= */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />

      {/* =========================================================
          WISHLIST DRAWER
          ========================================================= */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistItems={wishlistItems}
        onRemoveFromWishlist={handleRemoveFromWishlist}
        onAddToCart={handleAddToCart}
        onTryOn={handleTryOn}
      />

      {/* =========================================================
          GROQ RAG AI OUTFIT PANEL
          ========================================================= */}
      <GroqAIPanel
        isOpen={isStylistOpen}
        onClose={() => setIsStylistOpen(false)}
        onApplyOutfitToAvatar={(outfit) => {
          if (outfit?.clothingItems && Array.isArray(outfit.clothingItems)) {
            handleTryFullOutfit(outfit.clothingItems);
          } else {
            setCurrentOutfit(outfit);
          }
          setIsTryOnEffect(true);
          setTimeout(() => setIsTryOnEffect(false), 1200);
        }}
        onTryOnItem={handleTryOn}
        mongoClothes={backendWardrobe}
      />

      {/* =========================================================
          UPLOAD CLOTH DETAILS CONFIRMATION MODAL
          ========================================================= */}
      <UploadClothModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setPendingUploadFile(null);
          setPendingPreviewUrl(null);
        }}
        file={pendingUploadFile}
        previewUrl={pendingPreviewUrl}
        onSave={handleSaveUploadedCloth}
        isSubmitting={isUploadingCloth}
        statusMessage={uploadStatus}
      />

      {/* =========================================================
          LOGIN MODAL
          ========================================================= */}
      {showLoginModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(10,8,18,0.85)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowLoginModal(false); }}
        >
          <div style={{
            background: 'linear-gradient(135deg,rgba(30,20,50,0.98),rgba(20,16,38,0.98))',
            border: '1px solid rgba(158,123,181,0.35)',
            borderRadius: 20, padding: '36px 32px', width: 340,
            boxShadow: '0 24px 64px rgba(0,0,0,0.7)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>Sign In</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '4px 0 0' }}>Sync your wardrobe across sessions</p>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 6, fontWeight: 600 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="user@wardrobewise.com"
                  required
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 6, fontWeight: 600 }}>
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {loginError && (
                <p style={{
                  color: '#f87171', fontSize: 12, marginBottom: 14,
                  padding: '8px 12px', background: 'rgba(248,113,113,0.1)',
                  borderRadius: 8, border: '1px solid rgba(248,113,113,0.2)'
                }}>
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                style={{
                  width: '100%', padding: '12px', borderRadius: 12,
                  background: 'linear-gradient(135deg,#9e7bb5,#e879a0)',
                  border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                  opacity: isLoggingIn ? 0.7 : 1, fontFamily: 'inherit',
                  letterSpacing: '0.3px'
                }}
              >
                {isLoggingIn ? 'Signing in…' : 'Sign In'}
              </button>

              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 16 }}>
                Demo: user@wardrobewise.com · Password123!
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
