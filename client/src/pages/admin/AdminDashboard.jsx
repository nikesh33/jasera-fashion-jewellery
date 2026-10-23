import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  TrendingUp,
  Package,
  ShoppingBag,
  Layers,
  Plus,
  ArrowUpRight,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  AlertCircle,
  Truck,
  MapPin,
  Clock,
  Phone,
  Mail,
  LogOut,
  AlertTriangle,
  Search,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  Menu,
  CreditCard,
  Image,
  Sparkles,
  Tag,
  Star,
  FileText,
  Settings,
  Shield,
  Inbox,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Pagination } from "../../components/ui/Pagination";
import { formatPrice } from "../../lib/utils";
import { useAuthStore } from "../../stores/authStore";
import { api } from "../../lib/api";
import { AdminBannersTab } from "./tabs/AdminBannersTab";
import { AdminCollectionsTab } from "./tabs/AdminCollectionsTab";
import { AdminCouponsTab } from "./tabs/AdminCouponsTab";
import { AdminPaymentsTab } from "./tabs/AdminPaymentsTab";
import { AdminInquiriesTab } from "./tabs/AdminInquiriesTab";
import { AdminNewsletterTab } from "./tabs/AdminNewsletterTab";
import { AdminReturnsTab } from "./tabs/AdminReturnsTab";
import { AdminReviewsTab } from "./tabs/AdminReviewsTab";
import { AdminPincodesTab } from "./tabs/AdminPincodesTab";
import { AdminSettingsTab } from "./tabs/AdminSettingsTab";
import { AdminCmsTab } from "./tabs/AdminCmsTab";
import { AdminAuditTab } from "./tabs/AdminAuditTab";
import "./AdminDashboard.css";

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-synced Tab State ('overview' | 'categories' | 'products' | 'orders')
  const activeTab = searchParams.get("tab") || "overview";
  const setActiveTab = (tab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    });
  };

  // Product Search & Filter State
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productStockFilter, setProductStockFilter] = useState("all"); // 'all', 'in_stock', 'low_stock', 'out_of_stock'
  const [productStatusFilter, setProductStatusFilter] = useState("all");
  const [productPage, setProductPage] = useState(1);
  const [productPageSize, setProductPageSize] = useState(10);

  // Category Search & Filter State
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryStatusFilter, setCategoryStatusFilter] = useState("all");
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryPageSize, setCategoryPageSize] = useState(10);

  // Order Search & Filter State
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderPaymentFilter, setOrderPaymentFilter] = useState("all");
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(10);

  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingCodRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCategories: 0,
    lowStockCount: 0,
  });

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Category Modal / Form
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    description: "",
    image_url: "",
    status: "active",
    parent_id: "",
    seo_title: "",
    seo_description: "",
    display_order: 0,
  });

  // Product Modal / Form
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    category_id: "",
    selling_price: "",
    mrp: "",
    cost_price: "",
    material: "Oxidised Silver",
    occasion: "Daily & Festive",
    stock: 20,
    dimensions: "",
    weight_grams: "",
    care_guide: "",
    tags: "",
    image_url: "",
    short_description: "",
    status: "active",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load all initial data from MySQL database
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, catRes, prodRes, ordRes] = await Promise.all([
        api.get("/admin/stats").catch(() => null),
        api.get("/categories/admin").catch(() => api.get("/categories")),
        api.get("/products?limit=150").catch(() => null),
        api.get("/admin/orders").catch(() => null),
      ]);

      if (statsRes?.data?.stats) setStats(statsRes.data.stats);
      if (catRes?.data?.categories) {
        setCategories(catRes.data.categories);
        if (!productForm.category_id && catRes.data.categories.length > 0) {
          setProductForm((prev) => ({
            ...prev,
            category_id: catRes.data.categories[0].id,
          }));
        }
      }
      if (prodRes?.data?.products) setProducts(prodRes.data.products);
      if (ordRes?.data?.orders) setOrders(ordRes.data.orders);
    } catch (err) {
      console.error("Failed to load admin data:", err);
      setErrorMessage("Failed to load database records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const notifySuccess = (msg) => {
    setStatusMessage(msg);
    setErrorMessage(null);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const notifyError = (msg) => {
    setErrorMessage(msg);
    setStatusMessage(null);
    setTimeout(() => setErrorMessage(null), 6000);
  };

  const handleSignOut = () => {
    logout();
    navigate("/admin/login");
  };

  // ---------------- CATEGORY CRUD ----------------

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      slug: "",
      description: "",
      image_url: "",
      status: "active",
      parent_id: "",
      seo_title: "",
      seo_description: "",
      display_order: 0,
    });
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name || "",
      slug: cat.slug || "",
      description: cat.description || "",
      image_url: cat.image_url || "",
      status: cat.status || "active",
      parent_id: cat.parent_id || "",
      seo_title: cat.seo_title || "",
      seo_description: cat.seo_description || "",
      display_order: cat.display_order !== undefined ? cat.display_order : 0,
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      notifyError("Please enter a category name");
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanSlug =
        categoryForm.slug.trim() ||
        categoryForm.name
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]+/g, "");
      const payload = {
        name: categoryForm.name.trim(),
        slug: cleanSlug,
        description:
          categoryForm.description.trim() ||
          "Aesthetic handcrafted jewellery collection",
        image_url:
          categoryForm.image_url.trim() ||
          "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&q=80",
        status: categoryForm.status || "active",
        parent_id: categoryForm.parent_id ? Number(categoryForm.parent_id) : null,
        seo_title: categoryForm.seo_title?.trim() || null,
        seo_description: categoryForm.seo_description?.trim() || null,
        display_order: Number(categoryForm.display_order) || 0,
      };

      if (editingCategory) {
        await api.put(`/categories/admin/${editingCategory.id}`, payload);
        notifySuccess(`Category "${categoryForm.name}" updated successfully!`);
      } else {
        await api.post("/categories/admin", payload);
        notifySuccess(`Category "${categoryForm.name}" created in database!`);
      }

      setShowCategoryModal(false);
      setEditingCategory(null);
      await loadDashboardData();
    } catch (err) {
      notifyError(err.message || "Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (catId, catName) => {
    if (
      !window.confirm(`Are you sure you want to delete category "${catName}"?`)
    )
      return;
    try {
      await api.delete(`/categories/admin/${catId}`);
      notifySuccess(`Category "${catName}" deleted from database.`);
      await loadDashboardData();
    } catch (err) {
      notifyError(err.message || "Failed to delete category");
    }
  };

  // ---------------- PRODUCT CRUD ----------------

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      category_id: categories[0]?.id || "",
      selling_price: "",
      mrp: "",
      cost_price: "",
      material: "Oxidised Silver",
      occasion: "Daily & Festive",
      stock: 20,
      dimensions: "",
      weight_grams: "",
      care_guide: "",
      tags: "",
      image_url: "",
      short_description: "",
      status: "active",
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name || "",
      category_id: prod.category_id || categories[0]?.id || "",
      selling_price: prod.selling_price || "",
      mrp: prod.mrp || "",
      cost_price: prod.cost_price || "",
      material: prod.material || "Oxidised Silver",
      occasion: prod.occasion || "Daily & Festive",
      stock: prod.stock !== undefined ? prod.stock : 20,
      dimensions: prod.dimensions || "",
      weight_grams: prod.weight_grams || "",
      care_guide: prod.care_guide || "",
      tags: prod.tags
        ? typeof prod.tags === "string"
          ? prod.tags
          : Array.isArray(prod.tags)
            ? prod.tags.join(", ")
            : ""
        : "",
      image_url: prod.primary_image || "",
      short_description: prod.short_description || "",
      status: prod.status || "active",
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (
      !productForm.name.trim() ||
      !productForm.selling_price ||
      !productForm.category_id
    ) {
      notifyError("Please fill in product name, category, and selling price.");
      return;
    }

    const price = Number(productForm.selling_price);
    if (isNaN(price) || price <= 0) {
      notifyError("Selling price must be greater than 0.");
      return;
    }

    const stockUnits = Number(
      productForm.stock !== undefined ? productForm.stock : 0,
    );
    if (isNaN(stockUnits) || stockUnits < 0) {
      notifyError("Stock units cannot be negative.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: productForm.name.trim(),
        category_id: productForm.category_id,
        selling_price: price,
        mrp: Number(
          productForm.mrp && Number(productForm.mrp) > price
            ? productForm.mrp
            : price * 1.5,
        ),
        cost_price: productForm.cost_price ? Number(productForm.cost_price) : null,
        material: productForm.material,
        occasion: productForm.occasion,
        stock: stockUnits,
        dimensions: productForm.dimensions?.trim() || null,
        weight_grams: productForm.weight_grams ? Number(productForm.weight_grams) : null,
        care_guide: productForm.care_guide?.trim() || null,
        tags: productForm.tags
          ? productForm.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : null,
        image_url:
          productForm.image_url.trim() ||
          "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&q=80",
        short_description:
          productForm.short_description.trim() ||
          `Handcrafted ${productForm.material} jewellery piece.`,
        status: productForm.status || "active",
      };

      if (editingProduct) {
        await api.put(`/products/admin/${editingProduct.id}`, payload);
        notifySuccess(`Product "${productForm.name}" updated in inventory!`);
      } else {
        await api.post("/products/admin", payload);
        notifySuccess(`Product "${productForm.name}" added to inventory!`);
      }

      setShowProductModal(false);
      setEditingProduct(null);
      await loadDashboardData();
    } catch (err) {
      notifyError(err.message || "Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (prodId, prodName) => {
    if (
      !window.confirm(
        `Are you sure you want to remove or archive "${prodName}"?`,
      )
    )
      return;
    try {
      const res = await api.delete(`/products/admin/${prodId}`);
      notifySuccess(
        res?.message || `Product "${prodName}" removed from catalogue.`,
      );
      await loadDashboardData();
    } catch (err) {
      notifyError(err.message || "Failed to delete product");
    }
  };

  // ---------------- ORDER MANAGEMENT ----------------

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await api.patch(`/admin/orders/${orderId}/status`, {
        status: newStatus,
      });
      setOrders(
        orders.map((o) =>
          o.id === orderId ? { ...o, fulfilment_status: newStatus } : o,
        ),
      );
      notifySuccess(
        res?.message || `Order status updated to "${newStatus}" in MySQL.`,
      );
      await loadDashboardData();
    } catch (err) {
      notifyError(err.message || "Failed to update order status");
    }
  };

  // Quick Action listeners (from mobile sidebar or URL param)
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "add-category") {
      handleOpenAddCategory();
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("action");
          return next;
        },
        { replace: true },
      );
    } else if (action === "add-product") {
      handleOpenAddProduct();
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("action");
          return next;
        },
        { replace: true },
      );
    }
  }, [searchParams]);

  useEffect(() => {
    const handleCustomAction = (e) => {
      if (e.detail === "add-category") handleOpenAddCategory();
      if (e.detail === "add-product") handleOpenAddProduct();
    };
    window.addEventListener("admin-action", handleCustomAction);
    return () => window.removeEventListener("admin-action", handleCustomAction);
  }, [categories]);

  // Filtered Products
  const filteredProducts = products.filter((prod) => {
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase().trim();
      const matchName = prod.name?.toLowerCase().includes(q);
      const matchMaterial = prod.material?.toLowerCase().includes(q);
      const matchId = String(prod.id).includes(q);
      const matchCategory = (prod.category_name || prod.category_slug || "")
        .toLowerCase()
        .includes(q);
      if (!matchName && !matchMaterial && !matchId && !matchCategory)
        return false;
    }
    if (productCategoryFilter !== "all") {
      if (String(prod.category_id) !== String(productCategoryFilter))
        return false;
    }
    if (productStockFilter !== "all") {
      const stock = prod.stock !== undefined ? Number(prod.stock) : 20;
      if (productStockFilter === "in_stock" && stock <= 5) return false;
      if (productStockFilter === "low_stock" && (stock <= 0 || stock > 5))
        return false;
      if (productStockFilter === "out_of_stock" && stock > 0) return false;
    }
    if (productStatusFilter !== "all") {
      if ((prod.status || "active") !== productStatusFilter) return false;
    }
    return true;
  });

  // Filtered Categories
  const filteredCategories = categories.filter((cat) => {
    if (categorySearch.trim()) {
      const q = categorySearch.toLowerCase().trim();
      const matchName = cat.name?.toLowerCase().includes(q);
      const matchSlug = cat.slug?.toLowerCase().includes(q);
      const matchDesc = cat.description?.toLowerCase().includes(q);
      if (!matchName && !matchSlug && !matchDesc) return false;
    }
    if (categoryStatusFilter !== "all") {
      if ((cat.status || "active") !== categoryStatusFilter) return false;
    }
    return true;
  });

  // Filtered Orders
  const filteredOrders = orders.filter((ord) => {
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase().trim();
      const matchNum = ord.order_number?.toLowerCase().includes(q);
      const matchCust = (
        ord.shipping_address?.fullName ||
        ord.shipping_address?.full_name ||
        ord.customer_name ||
        ""
      )
        .toLowerCase()
        .includes(q);
      const matchPhone = (ord.shipping_address?.phone || ord.guest_phone || "")
        .toLowerCase()
        .includes(q);
      const matchEmail = (ord.shipping_address?.email || ord.guest_email || "")
        .toLowerCase()
        .includes(q);
      const matchCity = (ord.shipping_address?.city || "")
        .toLowerCase()
        .includes(q);
      if (!matchNum && !matchCust && !matchPhone && !matchEmail && !matchCity)
        return false;
    }
    if (orderStatusFilter !== "all") {
      if (ord.fulfilment_status !== orderStatusFilter) return false;
    }
    if (orderPaymentFilter !== "all") {
      if (ord.payment_status !== orderPaymentFilter) return false;
    }
    return true;
  });

  // Reset pagination on filter changes
  useEffect(() => {
    setCategoryPage(1);
  }, [categorySearch, categoryStatusFilter]);

  useEffect(() => {
    setProductPage(1);
  }, [
    productSearch,
    productCategoryFilter,
    productStockFilter,
    productStatusFilter,
  ]);

  useEffect(() => {
    setOrderPage(1);
  }, [orderSearch, orderStatusFilter, orderPaymentFilter]);

  // Paginated Slices
  const paginatedCategories = filteredCategories.slice(
    (categoryPage - 1) * categoryPageSize,
    categoryPage * categoryPageSize,
  );

  const paginatedProducts = filteredProducts.slice(
    (productPage - 1) * productPageSize,
    productPage * productPageSize,
  );

  const paginatedOrders = filteredOrders.slice(
    (orderPage - 1) * orderPageSize,
    orderPage * orderPageSize,
  );

  return (
    <div className="admin-page">
      {/* Notifications */}
      {statusMessage && (
        <div className="admin-alert admin-alert-success">
          <CheckCircle2 size={18} />
          <span>{statusMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="admin-alert admin-alert-error">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Admin Header with Brand Logo */}
      <div className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img
            src="/images/jassera-logo.jpg"
            alt="Jassera Jewellery"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '1.5px solid rgba(197, 162, 98, 0.5)',
              objectFit: 'cover',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
            }}
          />
          <div>
            <span className="admin-eyebrow">JASSERA MANAGEMENT PORTAL</span>
            <h1 className="admin-title">Boutique Administration</h1>
          </div>
        </div>
        <Link to="/" target="_blank" rel="noopener noreferrer" className="view-storefront-btn">
          View Storefront <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* Admin Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab-btn ${activeTab === "overview" ? "is-active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <TrendingUp
            size={16}
            style={{ marginRight: "6px", verticalAlign: "middle" }}
          />
          Overview
        </button>

        <button
          className={`admin-tab-btn ${activeTab === "orders" ? "is-active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          <ShoppingBag
            size={16}
            style={{ marginRight: "6px", verticalAlign: "middle" }}
          />
          Orders ({orders.length})
        </button>

        <button
          className={`admin-tab-btn ${activeTab === "products" ? "is-active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          <Package
            size={16}
            style={{ marginRight: "6px", verticalAlign: "middle" }}
          />
          Catalogue ({products.length})
        </button>

        <button
          className={`admin-tab-btn ${activeTab === "categories" ? "is-active" : ""}`}
          onClick={() => setActiveTab("categories")}
        >
          <Layers
            size={16}
            style={{ marginRight: "6px", verticalAlign: "middle" }}
          />
          Categories ({categories.length})
        </button>

        <button
          className={`admin-tab-btn ${activeTab === "payments" ? "is-active" : ""}`}
          onClick={() => setActiveTab("payments")}
        >
          <CreditCard
            size={16}
            style={{ marginRight: "6px", verticalAlign: "middle" }}
          />
          Payments
        </button>

        <button
          className={`admin-tab-btn ${activeTab === "banners" ? "is-active" : ""}`}
          onClick={() => setActiveTab("banners")}
        >
          <Image
            size={16}
            style={{ marginRight: "6px", verticalAlign: "middle" }}
          />
          Banners
        </button>

        <button
          className={`admin-tab-btn ${activeTab === "collections" ? "is-active" : ""}`}
          onClick={() => setActiveTab("collections")}
        >
          <Sparkles
            size={16}
            style={{ marginRight: "6px", verticalAlign: "middle" }}
          />
          Collections
        </button>

        <button
          className={`admin-tab-btn ${activeTab === "coupons" ? "is-active" : ""}`}
          onClick={() => setActiveTab("coupons")}
        >
          <Tag
            size={16}
            style={{ marginRight: "6px", verticalAlign: "middle" }}
          />
          Coupons
        </button>

        <button
          className={`admin-tab-btn ${activeTab === "returns" ? "is-active" : ""}`}
          onClick={() => setActiveTab("returns")}
        >
          <RotateCcw
            size={16}
            style={{ marginRight: "6px", verticalAlign: "middle" }}
          />
          Returns
        </button>

        <button
          className={`admin-tab-btn ${activeTab === "reviews" ? "is-active" : ""}`}
          onClick={() => setActiveTab("reviews")}
        >
          <Star
            size={16}
            style={{ marginRight: "6px", verticalAlign: "middle" }}
          />
          Reviews
        </button>

        <button
          className={`admin-tab-btn ${activeTab === "pincodes" ? "is-active" : ""}`}
          onClick={() => setActiveTab("pincodes")}
        >
          <MapPin
            size={16}
            style={{ marginRight: "6px", verticalAlign: "middle" }}
          />
          Pincodes
        </button>

        <button
          className={`admin-tab-btn ${activeTab === "inquiries" ? "is-active" : ""}`}
          onClick={() => setActiveTab("inquiries")}
        >
          <Mail
            size={16}
            style={{ marginRight: "6px", verticalAlign: "middle" }}
          />
          Inquiries
        </button>

        <button
          className={`admin-tab-btn ${activeTab === "newsletter" ? "is-active" : ""}`}
          onClick={() => setActiveTab("newsletter")}
        >
          <Inbox
            size={16}
            style={{ marginRight: "6px", verticalAlign: "middle" }}
          />
          Subscribers
        </button>

        <button
          className={`admin-tab-btn ${activeTab === "cms" ? "is-active" : ""}`}
          onClick={() => setActiveTab("cms")}
        >
          <FileText
            size={16}
            style={{ marginRight: "6px", verticalAlign: "middle" }}
          />
          CMS Pages
        </button>

        <button
          className={`admin-tab-btn ${activeTab === "settings" ? "is-active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          <Settings
            size={16}
            style={{ marginRight: "6px", verticalAlign: "middle" }}
          />
          Settings
        </button>

        <button
          className={`admin-tab-btn ${activeTab === "audit" ? "is-active" : ""}`}
          onClick={() => setActiveTab("audit")}
        >
          <Shield
            size={16}
            style={{ marginRight: "6px", verticalAlign: "middle" }}
          />
          Audit Trail
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="admin-tab-content">
          <div className="admin-kpi-grid">
            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-label">Paid Net Revenue</span>
                <TrendingUp size={20} className="kpi-icon" />
              </div>
              <strong className="kpi-val">
                {formatPrice(stats.totalRevenue)}
              </strong>
              <span className="kpi-change positive">
                From verified captured payments
              </span>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-label">Pending COD Revenue</span>
                <ShoppingBag size={20} className="kpi-icon" />
              </div>
              <strong className="kpi-val">
                {formatPrice(stats.pendingCodRevenue)}
              </strong>
              <span
                className="kpi-change"
                style={{ color: "var(--color-warning)" }}
              >
                Cash to be collected upon delivery
              </span>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-label">Total Customer Orders</span>
                <ShoppingBag size={20} className="kpi-icon" />
              </div>
              <strong className="kpi-val">{stats.totalOrders}</strong>
              <span className="kpi-change positive">
                All-time customer orders
              </span>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-label">Active Products</span>
                <Package size={20} className="kpi-icon" />
              </div>
              <strong className="kpi-val">{stats.totalProducts}</strong>
              <span className="kpi-change positive">
                Items currently for sale
              </span>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-label">Store Categories</span>
                <Layers size={20} className="kpi-icon" />
              </div>
              <strong className="kpi-val">{categories.length}</strong>
              <span className="kpi-change positive">Database categories</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-label">Low Stock Items</span>
                <AlertTriangle
                  size={20}
                  className="kpi-icon"
                  style={{
                    color: stats.lowStockCount > 0 ? "#B3261E" : "#2E7D5B",
                  }}
                />
              </div>
              <strong
                className="kpi-val"
                style={{
                  color: stats.lowStockCount > 0 ? "#B3261E" : "inherit",
                }}
              >
                {stats.lowStockCount}
              </strong>
              <span
                className="kpi-change"
                style={{
                  color: stats.lowStockCount > 0 ? "#B3261E" : "#2E7D5B",
                }}
              >
                {stats.lowStockCount > 0
                  ? "Items with <= 5 units left"
                  : "All stock levels healthy"}
              </span>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="admin-quick-actions">
            <h3>Store Operations</h3>
            <div className="quick-btn-group">
              <Button
                variant="primary"
                icon={Plus}
                onClick={handleOpenAddCategory}
              >
                Add Category
              </Button>
              <Button variant="gold" icon={Plus} onClick={handleOpenAddProduct}>
                Add Product
              </Button>
              <Button
                variant="outline"
                icon={ShoppingBag}
                onClick={() => setActiveTab("orders")}
              >
                View Customer Orders ({orders.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORIES */}
      {activeTab === "categories" && (
        <div className="admin-tab-content">
          <div className="admin-table-card">
            <div className="table-card-header">
              <div>
                <h3>Categories</h3>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={handleOpenAddCategory}
              >
                Add Category
              </Button>
            </div>

            {/* Category Form Modal */}
            {showCategoryModal && (
              <form onSubmit={handleSaveCategory} className="admin-inline-form">
                <h4>
                  {editingCategory
                    ? `Edit Category: ${editingCategory.name}`
                    : "Create New Category"}
                </h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Category Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Silver Jhumkas, Statement Rings, Chokers"
                      value={categoryForm.name}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Slug (URL key)</label>
                    <input
                      type="text"
                      placeholder="e.g. silver-jhumkas (auto-generated if empty)"
                      value={categoryForm.slug}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          slug: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Image URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={categoryForm.image_url}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          image_url: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={categoryForm.status}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          status: e.target.value,
                        })
                      }
                    >
                      <option value="active">Active (Visible on store)</option>
                      <option value="inactive">Inactive (Hidden)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Parent Category (Hierarchy)</label>
                    <select
                      value={categoryForm.parent_id}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          parent_id: e.target.value,
                        })
                      }
                    >
                      <option value="">None (Top Level Category)</option>
                      {categories
                        .filter((c) => !editingCategory || c.id !== editingCategory.id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Display Order</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={categoryForm.display_order}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          display_order: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>SEO Meta Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Handcrafted Silver Jhumkas | Jassera"
                      value={categoryForm.seo_title}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          seo_title: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>SEO Meta Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Explore royal oxidised silver jhumkas..."
                      value={categoryForm.seo_description}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          seo_description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <label>Short Description</label>
                    <input
                      type="text"
                      placeholder="Brief description for customer shop heading"
                      value={categoryForm.description}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? "Saving..."
                      : editingCategory
                        ? "Update Category"
                        : "Save Category"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCategoryModal(false);
                      setEditingCategory(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Category Search & Filter */}
            <div className="admin-filter-bar">
              <div className="admin-search-input-wrap">
                <Search size={15} className="admin-search-icon" />
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="Search categories by name, slug or description..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                />
              </div>
              <select
                className="admin-filter-select"
                value={categoryStatusFilter}
                onChange={(e) => setCategoryStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active (Visible)</option>
                <option value="inactive">Inactive (Hidden)</option>
              </select>
              {(categorySearch || categoryStatusFilter !== "all") && (
                <button
                  type="button"
                  className="admin-filter-reset"
                  onClick={() => {
                    setCategorySearch("");
                    setCategoryStatusFilter("all");
                  }}
                >
                  <RotateCcw size={13} />
                  Reset
                </button>
              )}
              <span className="admin-filter-count">
                Showing {filteredCategories.length} of {categories.length}
              </span>
            </div>

            <div className="admin-table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Slug</th>
                    <th>Description</th>
                    <th>Active Items</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        style={{ textAlign: "center", padding: "30px" }}
                      >
                        {categories.length === 0
                          ? 'No categories found. Click "Add Category" above to create one.'
                          : "No categories match the active filter criteria."}
                      </td>
                    </tr>
                  ) : (
                    paginatedCategories.map((cat) => (
                      <tr key={cat.id}>
                        <td>
                          <div className="prod-cell">
                            <img
                              src={
                                cat.image_url ||
                                "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=300"
                              }
                              alt={cat.name}
                              className="prod-thumb"
                            />
                            <strong>{cat.name}</strong>
                          </div>
                        </td>
                        <td className="font-mono text-muted">{cat.slug}</td>
                        <td style={{ maxWidth: "280px" }}>
                          {cat.description || "—"}
                        </td>
                        <td>
                          <span className="badge-count">
                            {cat.item_count || 0} Products
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-pill status-${cat.status === "active" ? "delivered" : "cancelled"}`}
                          >
                            {cat.status || "active"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              className="btn-edit"
                              title="Edit Category"
                              onClick={() => handleOpenEditCategory(cat)}
                            >
                              <Edit2 size={15} /> Edit
                            </button>
                            <button
                              type="button"
                              className="btn-delete"
                              title="Delete Category"
                              onClick={() =>
                                handleDeleteCategory(cat.id, cat.name)
                              }
                            >
                              <Trash2 size={15} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={categoryPage}
              totalItems={filteredCategories.length}
              pageSize={categoryPageSize}
              onPageChange={setCategoryPage}
              onPageSizeChange={setCategoryPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTS */}
      {activeTab === "products" && (
        <div className="admin-tab-content">
          <div className="admin-table-card">
            <div className="table-card-header">
              <div>
                <h3>Catalogue</h3>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={handleOpenAddProduct}
              >
                Add Product
              </Button>
            </div>

            {/* Product Form Modal */}
            {showProductModal && (
              <form onSubmit={handleSaveProduct} className="admin-inline-form">
                <h4>
                  {editingProduct
                    ? `Edit Product: ${editingProduct.name}`
                    : "Add New Product"}
                </h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Peacock Chandbali Jhumkas"
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({ ...productForm, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      required
                      value={productForm.category_id}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          category_id: e.target.value,
                        })
                      }
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Selling Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 599"
                      value={productForm.selling_price}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          selling_price: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>MRP / Strike Price (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 999"
                      value={productForm.mrp}
                      onChange={(e) =>
                        setProductForm({ ...productForm, mrp: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Available Stock Units *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={productForm.stock}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          stock: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Material / Finish</label>
                    <input
                      type="text"
                      placeholder="e.g. Oxidised German Silver, Stainless Steel"
                      value={productForm.material}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          material: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={productForm.status}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          status: e.target.value,
                        })
                      }
                    >
                      <option value="active">Active (Visible on shop)</option>
                      <option value="draft">Draft (Hidden)</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Occasion / Style</label>
                    <input
                      type="text"
                      placeholder="e.g. Daily Wear, College, Festive"
                      value={productForm.occasion}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          occasion: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Cost Price (₹)</label>
                    <input
                      type="number"
                      placeholder="Internal cost e.g. 250"
                      value={productForm.cost_price}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          cost_price: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Weight (grams)</label>
                    <input
                      type="number"
                      placeholder="e.g. 18"
                      value={productForm.weight_grams}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          weight_grams: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Dimensions</label>
                    <input
                      type="text"
                      placeholder="e.g. 4.5 cm x 2.2 cm"
                      value={productForm.dimensions}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          dimensions: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Tags (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. festive, bridal, trending, silver"
                      value={productForm.tags}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          tags: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <label>Product Photo Image URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={productForm.image_url}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          image_url: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <label>Care Guide & Storage Tips</label>
                    <input
                      type="text"
                      placeholder="e.g. Keep away from water and perfume. Store in a zip-lock pouch."
                      value={productForm.care_guide}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          care_guide: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <label>Short Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Lightweight oxidised silver jhumkas with hanging bells."
                      value={productForm.short_description}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          short_description: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? "Saving..."
                      : editingProduct
                        ? "Update Product"
                        : "Save Product"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowProductModal(false);
                      setEditingProduct(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Product Search & Filter */}
            <div className="admin-filter-bar">
              <div className="admin-search-input-wrap">
                <Search size={15} className="admin-search-icon" />
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="Search jewellery by title, material, ID..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>
              <select
                className="admin-filter-select"
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
              >
                <option value="all">
                  All Categories ({categories.length})
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                className="admin-filter-select"
                value={productStockFilter}
                onChange={(e) => setProductStockFilter(e.target.value)}
              >
                <option value="all">All Stock Levels</option>
                <option value="in_stock">In Stock (&gt; 5)</option>
                <option value="low_stock">Low Stock (1 - 5)</option>
                <option value="out_of_stock">Out of Stock (0)</option>
              </select>
              <select
                className="admin-filter-select"
                value={productStatusFilter}
                onChange={(e) => setProductStatusFilter(e.target.value)}
              >
                <option value="all">All Visibility</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
              {(productSearch ||
                productCategoryFilter !== "all" ||
                productStockFilter !== "all" ||
                productStatusFilter !== "all") && (
                <button
                  type="button"
                  className="admin-filter-reset"
                  onClick={() => {
                    setProductSearch("");
                    setProductCategoryFilter("all");
                    setProductStockFilter("all");
                    setProductStatusFilter("all");
                  }}
                >
                  <RotateCcw size={13} />
                  Reset
                </button>
              )}
              <span className="admin-filter-count">
                Showing {filteredProducts.length} of {products.length}
              </span>
            </div>

            <div className="admin-table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>MRP</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        style={{ textAlign: "center", padding: "30px" }}
                      >
                        {products.length === 0
                          ? 'No products found. Click "Add Product" above to create one.'
                          : "No products match the active search or filter criteria."}
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((prod) => (
                      <tr key={prod.id}>
                        <td>
                          <div className="prod-cell">
                            <img
                              src={
                                prod.primary_image ||
                                "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=300"
                              }
                              alt={prod.name}
                              className="prod-thumb"
                            />
                            <div>
                              <strong>{prod.name}</strong>
                              <small className="text-muted font-mono">
                                ID: {prod.id} • {prod.material}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>{prod.category_name || prod.category_slug}</td>
                        <td className="text-maroon font-semibold">
                          {formatPrice(prod.selling_price)}
                        </td>
                        <td className="text-muted">{formatPrice(prod.mrp)}</td>
                        <td>
                          <span
                            className="stock-pill"
                            style={{
                              backgroundColor:
                                (prod.stock || 0) <= 5 ? "#FDEDED" : "#E8F5EE",
                              color:
                                (prod.stock || 0) <= 5 ? "#B3261E" : "#2E7D5B",
                            }}
                          >
                            {prod.stock !== undefined ? prod.stock : 20} in
                            stock
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-pill status-${prod.status === "active" ? "delivered" : "cancelled"}`}
                          >
                            {prod.status || "active"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              className="btn-edit"
                              title="Edit product"
                              onClick={() => handleOpenEditProduct(prod)}
                            >
                              <Edit2 size={15} /> Edit
                            </button>
                            <button
                              type="button"
                              className="btn-delete"
                              title="Delete or Archive product"
                              onClick={() =>
                                handleDeleteProduct(prod.id, prod.name)
                              }
                            >
                              <Trash2 size={15} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={productPage}
              totalItems={filteredProducts.length}
              pageSize={productPageSize}
              onPageChange={setProductPage}
              onPageSizeChange={setProductPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      )}

      {/* TAB 4: ORDERS */}
      {activeTab === "orders" && (
        <div className="admin-tab-content">
          <div className="admin-table-card">
            <div className="table-card-header">
              <div>
                <h3> Orders ({orders.length})</h3>
              </div>
            </div>

            {/* Orders Search & Filter */}
            <div className="admin-filter-bar">
              <div className="admin-search-input-wrap">
                <Search size={15} className="admin-search-icon" />
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="Search by order #, customer name, phone, email, city..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>
              <select
                className="admin-filter-select"
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
              >
                <option value="all">All Fulfilment Statuses</option>
                <option value="placed">placed</option>
                <option value="confirmed">confirmed</option>
                <option value="packed">packed</option>
                <option value="shipped">shipped</option>
                <option value="out_for_delivery">out_for_delivery</option>
                <option value="delivered">delivered</option>
                <option value="cancelled">cancelled</option>
              </select>
              <select
                className="admin-filter-select"
                value={orderPaymentFilter}
                onChange={(e) => setOrderPaymentFilter(e.target.value)}
              >
                <option value="all">All Payment Statuses</option>
                <option value="paid">paid</option>
                <option value="pending_cod">pending_cod</option>
                <option value="pending">pending</option>
                <option value="failed">failed</option>
              </select>
              {(orderSearch ||
                orderStatusFilter !== "all" ||
                orderPaymentFilter !== "all") && (
                <button
                  type="button"
                  className="admin-filter-reset"
                  onClick={() => {
                    setOrderSearch("");
                    setOrderStatusFilter("all");
                    setOrderPaymentFilter("all");
                  }}
                >
                  <RotateCcw size={13} />
                  Reset
                </button>
              )}
              <span className="admin-filter-count">
                Showing {filteredOrders.length} of {orders.length}
              </span>
            </div>

            {filteredOrders.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "50px 20px",
                  color: "#6F6A60",
                }}
              >
                <ShoppingBag
                  size={48}
                  style={{ margin: "0 auto 12px", opacity: 0.4 }}
                />
                <h4>
                  {orders.length === 0
                    ? "No Orders Placed Yet"
                    : "No Matching Orders"}
                </h4>
                <p>
                  {orders.length === 0
                    ? "When customers checkout on the store, their orders will appear here for dispatch."
                    : "No customer orders match the current search or status filter."}
                </p>
              </div>
            ) : (
              <>
                <div className="admin-orders-list">
                  {paginatedOrders.map((ord) => (
                    <div key={ord.id} className="admin-order-card">
                      <div className="order-card-top">
                        <div>
                          <span className="order-num font-mono">
                            {ord.order_number}
                          </span>
                          <div className="order-date">
                            <Clock
                              size={13}
                              style={{
                                verticalAlign: "middle",
                                marginRight: "4px",
                              }}
                            />
                            {new Date(ord.placed_at).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </div>
                        </div>

                        <div className="order-status-wrap">
                          <label>Order Status:</label>
                          <select
                            className="admin-status-select"
                            value={ord.fulfilment_status}
                            onChange={(e) =>
                              handleUpdateStatus(ord.id, e.target.value)
                            }
                          >
                            <option value="placed">placed (Received)</option>
                            <option value="confirmed">
                              confirmed (Accepted)
                            </option>
                            <option value="packed">
                              packed (Ready to dispatch)
                            </option>
                            <option value="shipped">
                              shipped (Handed to courier)
                            </option>
                            <option value="out_for_delivery">
                              out_for_delivery
                            </option>
                            <option value="delivered">
                              delivered (Completed)
                            </option>
                            <option value="cancelled">cancelled</option>
                          </select>
                        </div>
                      </div>

                      <div className="order-details-grid">
                        {/* Customer Info */}
                        <div className="order-box">
                          <h5>Shipping Details</h5>
                          <p className="cust-name">
                            <strong>
                              {ord.shipping_address?.fullName ||
                                ord.shipping_address?.full_name ||
                                ord.customer_name ||
                                "Customer"}
                            </strong>
                          </p>
                          <p className="cust-contact">
                            <Phone
                              size={13}
                              style={{
                                verticalAlign: "middle",
                                marginRight: "4px",
                              }}
                            />
                            {ord.shipping_address?.phone ||
                              ord.guest_phone ||
                              "No phone"}
                          </p>
                          <p className="cust-contact">
                            <Mail
                              size={13}
                              style={{
                                verticalAlign: "middle",
                                marginRight: "4px",
                              }}
                            />
                            {ord.shipping_address?.email ||
                              ord.guest_email ||
                              "No email"}
                          </p>
                          <p className="cust-address">
                            <MapPin
                              size={13}
                              style={{
                                verticalAlign: "middle",
                                marginRight: "4px",
                              }}
                            />
                            {ord.shipping_address
                              ? `${ord.shipping_address.addressLine1 || ord.shipping_address.address_line1 || ""}, ${ord.shipping_address.city || ""}, ${ord.shipping_address.state || ""} - ${ord.shipping_address.pincode || ""}`
                              : "Address on file"}
                          </p>
                        </div>

                        {/* Courier Tracking */}
                        <div className="order-box">
                          <h5>Payment</h5>
                          <p>
                            <strong>Payment Method:</strong>{" "}
                            {ord.payment_method?.toUpperCase()}
                          </p>
                          <p>
                            <strong>Payment Status:</strong>{" "}
                            <span
                              style={{
                                fontWeight: 600,
                                color:
                                  ord.payment_status === "paid"
                                    ? "var(--color-success)"
                                    : ord.payment_status === "pending_cod"
                                      ? "#B85C00"
                                      : "#B3261E",
                              }}
                            >
                              {ord.payment_status}
                            </span>
                          </p>
                          <p>
                            <Truck
                              size={14}
                              style={{
                                verticalAlign: "middle",
                                marginRight: "4px",
                              }}
                            />
                            <strong>Courier:</strong>{" "}
                            {ord.carrier || "BlueDart Express"}
                          </p>
                          <p>
                            <strong>Tracking ID:</strong>{" "}
                            <span className="font-mono">
                              {ord.tracking_number}
                            </span>
                          </p>
                          <div style={{ marginTop: "10px" }}>
                            <span className="order-grand-total">
                              Total: {formatPrice(ord.total)}
                            </span>
                          </div>
                        </div>

                        {/* Items Ordered */}
                        <div className="order-box order-items-box">
                          <h5>Ordered Items ({ord.items?.length || 0})</h5>
                          <div className="order-items-scroll">
                            {ord.items && ord.items.length > 0 ? (
                              ord.items.map((item, idx) => (
                                <div key={idx} className="ordered-item-row">
                                  <img
                                    src={
                                      item.product_image ||
                                      "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=150"
                                    }
                                    alt={item.product_name}
                                    className="item-mini-thumb"
                                  />
                                  <div className="item-meta">
                                    <strong>{item.product_name}</strong>
                                    <small className="text-muted">
                                      Qty: {item.quantity} ×{" "}
                                      {formatPrice(item.unit_price)}
                                    </small>
                                  </div>
                                  <span className="item-line-total font-semibold">
                                    {formatPrice(item.total)}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <small className="text-muted">
                                No items breakdown recorded.
                              </small>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination
                  currentPage={orderPage}
                  totalItems={filteredOrders.length}
                  pageSize={orderPageSize}
                  onPageChange={setOrderPage}
                  onPageSizeChange={setOrderPageSize}
                  pageSizeOptions={[5, 10, 20, 50]}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Module Tabs */}
      {activeTab === "payments" && <AdminPaymentsTab />}
      {activeTab === "banners" && <AdminBannersTab />}
      {activeTab === "collections" && <AdminCollectionsTab />}
      {activeTab === "coupons" && <AdminCouponsTab />}
      {activeTab === "returns" && <AdminReturnsTab />}
      {activeTab === "reviews" && <AdminReviewsTab />}
      {activeTab === "pincodes" && <AdminPincodesTab />}
      {activeTab === "inquiries" && <AdminInquiriesTab />}
      {activeTab === "newsletter" && <AdminNewsletterTab />}
      {activeTab === "cms" && <AdminCmsTab />}
      {activeTab === "settings" && <AdminSettingsTab />}
      {activeTab === "audit" && <AdminAuditTab />}
    </div>
  );
}
