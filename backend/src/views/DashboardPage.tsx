import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchProfile, updateProfile, forceLogout, toggleMfa } from "@/store/slices/authSlice";
import { fetchOwnerBillboards, createBillboard, updateBillboard, deleteBillboard } from "@/store/slices/billboardSlice";
import { fetchBrandAssets, createBrandAsset, deleteBrandAsset, updateBrandAsset, uploadFile } from "@/store/slices/brandSlice";
import { api } from "@/config/axios";
import { 
  User, ShieldAlert, Sparkles, Download, Trash2, Mail, Bell, 
  Building, Check, RefreshCw, Plus, MapPin, LayoutGrid, DollarSign, 
  Eye, Info, CheckCircle2, AlertTriangle, Palette, Type, FolderOpen,
  ShieldCheck, Copy, ExternalLink, Share2, Users, CheckSquare, Camera
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  const { user, loading: authLoading } = useAppSelector((state) => state.auth);
  const { ownerBillboards, loading: billboardsLoading } = useAppSelector((state) => state.billboards);
  const { brandAssets, loading: brandLoading } = useAppSelector((state) => state.brand);
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Tab controls
  const [activeSubTab, setActiveSubTab] = useState<string>("settings");

  // Settings feedback
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form profile states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessTaxId, setBusinessTaxId] = useState("");
  const [address, setAddress] = useState("");

  // Notification Checkboxes
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [pushNotif, setPushNotif] = useState(true);
  const [whatsappNotif, setWhatsappNotif] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  // New Billboard Form States
  const [billName, setBillName] = useState("");
  const [billDesc, setBillDesc] = useState("");
  const [billAddr, setBillAddr] = useState("");
  const [billCity, setBillCity] = useState("");
  const [billState, setBillState] = useState("");
  const [billCountry, setBillCountry] = useState("USA");
  const [billZip, setBillZip] = useState("");
  const [billLat, setBillLat] = useState("");
  const [billLng, setBillLng] = useState("");
  const [billDims, setBillDims] = useState("10m x 30m");
  const [billType, setBillType] = useState<"INDOOR" | "OUTDOOR" | "DIGITAL" | "STATIC" | "TRANSIT">("OUTDOOR");
  const [billPrice, setBillPrice] = useState("");
  const [billSuccess, setBillSuccess] = useState(false);

  // Brand Asset Form States
  const [brandName, setBrandName] = useState("");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [brandAssetUrl, setBrandAssetUrl] = useState("");
  const [brandPrimary, setBrandPrimary] = useState("#6366F1");
  const [brandSecondary, setBrandSecondary] = useState("#06B6D4");
  const [brandAccent, setBrandAccent] = useState("#EC4899");
  const [brandHeadings, setBrandHeadings] = useState("Outfit");
  const [brandBody, setBrandBody] = useState("Inter");
  const [brandSuccess, setBrandSuccess] = useState(false);

  const [brandEditMode, setBrandEditMode] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoScale, setLogoScale] = useState<number>(1);
  const [guidelineName, setGuidelineName] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<string>("");

  // Referrals and Operations States
  const [copied, setCopied] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [payoutError, setPayoutError] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("PayPal");
  const [payoutAccount, setPayoutAccount] = useState("");
  
  // Operations States
  const [opUploading, setOpUploading] = useState(false);
  const [opUploadSuccess, setOpUploadSuccess] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [opTasks, setOpTasks] = useState([
    { id: "task_1", title: "Verify LED Panel #3 Calibration", billboard: "Times Square Digital Mega-Screen", location: "New York, NY", status: "Pending Verification", date: "June 6, 2026" },
    { id: "task_2", title: "Mount New Vinyl Poster", billboard: "Sunset Boulevard Highway Archway", location: "West Hollywood, CA", status: "Scheduled", date: "June 8, 2026" },
    { id: "task_3", title: "Inspect Structural Integrity", billboard: "Hollywood Highway Archway", location: "Los Angeles, CA", status: "In Progress", date: "June 12, 2026" }
  ]);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  // Adjust default subtab based on role
  useEffect(() => {
    if (user) {
      if (user.role === "CUSTOMER") {
        setActiveSubTab("brands");
      } else if (user.role === "PARTNER") {
        setActiveSubTab("referrals");
      } else if (user.role === "SUB_USER") {
        setActiveSubTab("operations");
      } else {
        setActiveSubTab("inventory");
      }
    }
  }, [user]);

  // Load appropriate data based on role
  useEffect(() => {
    if (user) {
      if (user.role === "CUSTOMER") {
        dispatch(fetchBrandAssets());
      } else if (user.role === "OWNER" || user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
        dispatch(fetchOwnerBillboards());
      }
    }
  }, [user, dispatch]);

  // Sync profile details with store
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");
      setMfaEnabled(user.mfaEnabled || false);
      if (user.profile) {
        setBusinessName(user.profile.businessName || "");
        setBusinessTaxId(user.profile.businessTaxId || "");
        setAddress(user.profile.address || "");
        
        const prefs = user.profile.notificationPreferences || {};
        setEmailNotif(prefs.email ?? true);
        setSmsNotif(prefs.sms ?? false);
        setPushNotif(prefs.push ?? true);
        setWhatsappNotif(prefs.whatsapp ?? false);
      }
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);

    const payload = {
      firstName,
      lastName,
      phone,
      businessName,
      businessTaxId,
      address,
      notificationPreferences: {
        email: emailNotif,
        sms: smsNotif,
        push: pushNotif,
        whatsapp: whatsappNotif,
      },
    };

    const result = await dispatch(updateProfile(payload));
    if (updateProfile.fulfilled.match(result)) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleToggleMfa = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setMfaEnabled(checked);
    await dispatch(toggleMfa({ enabled: checked }));
  };

  const handleCreateBillboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setBillSuccess(false);

    const payload = {
      name: billName,
      description: billDesc,
      address: billAddr,
      city: billCity,
      state: billState,
      country: billCountry,
      postalCode: billZip,
      latitude: parseFloat(billLat) || 0.0,
      longitude: parseFloat(billLng) || 0.0,
      dimensions: billDims,
      locationType: billType,
      pricePerDay: parseFloat(billPrice) || 0.0,
    };

    const result = await dispatch(createBillboard(payload));
    if (createBillboard.fulfilled.match(result)) {
      setBillSuccess(true);
      setBillName("");
      setBillDesc("");
      setBillAddr("");
      setBillCity("");
      setBillState("");
      setBillZip("");
      setBillLat("");
      setBillLng("");
      setBillPrice("");
      setTimeout(() => {
        setBillSuccess(false);
        setActiveSubTab("inventory");
      }, 2000);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Only image files (PNG, JPEG, WEBP, SVG) are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Logo file size exceeds the maximum 5MB limit.");
      return;
    }

    setUploadProgress("Processing logo file stream...");
    const result = await dispatch(uploadFile({ file, purpose: "logo" }));
    if (uploadFile.fulfilled.match(result)) {
      setLogoPreview(result.payload.url);
      setBrandLogoUrl(result.payload.url);
      setUploadProgress("Logo uploaded successfully.");
    } else {
      setUploadProgress("Failed to upload logo image.");
    }
  };

  const handleGuidelineChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedDocs = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedDocs.includes(file.type)) {
      alert("Only document files (PDF, DOC, DOCX) are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Document file size exceeds the maximum 10MB limit.");
      return;
    }

    setGuidelineName(file.name);
    setUploadProgress("Processing document file stream...");
    const result = await dispatch(uploadFile({ file, purpose: "guideline" }));
    if (uploadFile.fulfilled.match(result)) {
      setBrandAssetUrl(result.payload.url);
      setUploadProgress("Guidelines uploaded successfully.");
    } else {
      setUploadProgress("Failed to upload guidelines document.");
    }
  };

  const handleEditClick = (brand: any) => {
    setBrandEditMode(true);
    setEditingBrandId(brand.id);
    setBrandName(brand.name);
    setBrandLogoUrl(brand.logoUrl || "");
    setLogoPreview(brand.logoUrl || "");
    setBrandAssetUrl(brand.assetUrl);
    setGuidelineName("guidelines_file.pdf");
    if (brand.colorPalette) {
      setBrandPrimary(brand.colorPalette.primary || "#6366F1");
      setBrandSecondary(brand.colorPalette.secondary || "#06B6D4");
      setBrandAccent(brand.colorPalette.accent || "#EC4899");
    }
    if (brand.typography) {
      setBrandHeadings(brand.typography.headings || "Outfit");
      setBrandBody(brand.typography.body || "Inter");
    }
    setActiveSubTab("add-brand");
  };

  const handleCreateBrandAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setBrandSuccess(false);

    const payload = {
      name: brandName,
      logoUrl: brandLogoUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop&q=80",
      assetUrl: brandAssetUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      colorPalette: {
        primary: brandPrimary,
        secondary: brandSecondary,
        accent: brandAccent,
      },
      typography: {
        headings: brandHeadings,
        body: brandBody,
      },
    };

    if (brandEditMode && editingBrandId) {
      const result = await dispatch(updateBrandAsset({ id: editingBrandId, data: payload }));
      if (updateBrandAsset.fulfilled.match(result)) {
        setBrandSuccess(true);
        setBrandName("");
        setBrandLogoUrl("");
        setBrandAssetUrl("");
        setLogoPreview("");
        setGuidelineName("");
        setBrandEditMode(false);
        setEditingBrandId(null);
        setUploadProgress("");
        setTimeout(() => {
          setBrandSuccess(false);
          setActiveSubTab("brands");
        }, 2000);
      }
    } else {
      const result = await dispatch(createBrandAsset(payload));
      if (createBrandAsset.fulfilled.match(result)) {
        setBrandSuccess(true);
        setBrandName("");
        setBrandLogoUrl("");
        setBrandAssetUrl("");
        setLogoPreview("");
        setGuidelineName("");
        setUploadProgress("");
        setBrandPrimary("#6366F1");
        setBrandSecondary("#06B6D4");
        setBrandAccent("#EC4899");
        setTimeout(() => {
          setBrandSuccess(false);
          setActiveSubTab("brands");
        }, 2000);
      }
    }
  };

  const toggleAvailability = async (id: string, currentAvailable: boolean) => {
    await dispatch(updateBillboard({ id, data: { isAvailable: !currentAvailable } }));
  };

  const handleDeleteBillboard = async (id: string) => {
    if (confirm("Are you sure you want to remove this billboard listing?")) {
      await dispatch(deleteBillboard(id));
    }
  };

  const handleDeleteBrandAsset = async (id: string) => {
    if (confirm("Are you sure you want to delete this brand library?")) {
      await dispatch(deleteBrandAsset(id));
    }
  };

  const handleGDPRDownload = async () => {
    try {
      setActionLoading(true);
      const response = await api.get("/profile/export", { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `gdpr-export-${user?.id}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error("GDPR export failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setActionLoading(true);
      await api.delete("/profile");
      dispatch(forceLogout());
      router.push("/auth");
    } catch (err) {
      console.error("Account deletion failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center py-20">
        <div className="flex items-center gap-2 text-slate-400">
          <RefreshCw className="h-5 w-5 animate-spin text-purple-650" />
          <span>Retrieving secure session...</span>
        </div>
      </div>
    );
  }

  const isOwner = user.role === "OWNER" || user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  return (
    <div className="flex flex-col gap-6 text-left py-4">
      {/* Header Profile Title card */}
      <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-650 font-bold text-lg text-white uppercase shadow-sm">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Welcome, {user.firstName} {user.lastName}
            </h2>
            <p className="text-xs text-slate-500">{user.email} • Role: <span className="text-purple-650 uppercase font-bold">{user.role}</span></p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-1.5 rounded-lg bg-purple-50 p-1 border border-purple-100 flex-wrap">
          {/* Owner options */}
          {isOwner && (
            <>
              <button
                onClick={() => setActiveSubTab("inventory")}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                  activeSubTab === "inventory"
                    ? "bg-purple-650 text-white shadow-sm"
                    : "text-slate-500 hover:text-purple-700 hover:bg-purple-100/50"
                }`}
              >
                My Inventory
              </button>
              <button
                onClick={() => setActiveSubTab("register")}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                  activeSubTab === "register"
                    ? "bg-purple-650 text-white shadow-sm"
                    : "text-slate-500 hover:text-purple-700 hover:bg-purple-100/50"
                }`}
              >
                Add Billboard
              </button>
              <button
                onClick={() => setActiveSubTab("analytics")}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                  activeSubTab === "analytics"
                    ? "bg-purple-650 text-white shadow-sm"
                    : "text-slate-500 hover:text-purple-700 hover:bg-purple-100/50"
                }`}
              >
                Earnings
              </button>
            </>
          )}

          {/* Customer options */}
          {user.role === "CUSTOMER" && (
            <>
              <button
                onClick={() => setActiveSubTab("brands")}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                  activeSubTab === "brands"
                    ? "bg-purple-650 text-white shadow-sm"
                    : "text-slate-500 hover:text-purple-700 hover:bg-purple-100/50"
                }`}
              >
                Brand Library
              </button>
              <button
                onClick={() => setActiveSubTab("add-brand")}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                  activeSubTab === "add-brand"
                    ? "bg-purple-650 text-white shadow-sm"
                    : "text-slate-500 hover:text-purple-700 hover:bg-purple-100/50"
                }`}
              >
                Add Brand Asset
              </button>
            </>
          )}

          {/* Partner options */}
          {user.role === "PARTNER" && (
            <button
              onClick={() => setActiveSubTab("referrals")}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                activeSubTab === "referrals"
                  ? "bg-purple-650 text-white shadow-sm"
                  : "text-slate-500 hover:text-purple-700 hover:bg-purple-100/50"
              }`}
            >
              Referrals & Link
            </button>
          )}

          {/* Sub-user options */}
          {user.role === "SUB_USER" && (
            <button
              onClick={() => setActiveSubTab("operations")}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                activeSubTab === "operations"
                  ? "bg-purple-650 text-white shadow-sm"
                  : "text-slate-500 hover:text-purple-700 hover:bg-purple-100/50"
              }`}
            >
              Operations Tasks
            </button>
          )}

          {/* Common Settings tab */}
          <button
            onClick={() => setActiveSubTab("settings")}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
              activeSubTab === "settings"
                ? "bg-purple-650 text-white shadow-sm"
                : "text-slate-500 hover:text-purple-700 hover:bg-purple-100/50"
            }`}
          >
            Settings
          </button>

          {/* Design Studio Link */}
          <button
            onClick={() => window.open("/design-studio", "_blank")}
            className="px-4 py-2 text-xs font-semibold rounded-md text-purple-650 hover:text-purple-800 hover:bg-purple-100/30 transition-all flex items-center gap-1 border border-purple-200"
          >
            🎨 Design Studio
          </button>
        </div>
      </div>

      {/* RENDER OPTION 1: SHARED PROFILE SETTINGS */}
      {activeSubTab === "settings" && (
        <div className="grid gap-8 md:grid-cols-3">
          {/* Settings Sidebar */}
          <div className="flex flex-col gap-6">
            {/* GDPR Box */}
            <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-sm flex flex-col gap-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" /> Compliance Vault
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                In compliance with GDPR directives, you are entitled to export a local copy of your data file at any time.
              </p>
              <button
                onClick={handleGDPRDownload}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 rounded-lg border border-purple-100 bg-purple-50 hover:bg-purple-100 text-purple-700 py-2.5 text-xs font-bold disabled:opacity-50 transition-all"
              >
                {actionLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Download GDPR Data (.json)
              </button>
            </div>

            {/* Termination Box */}
            <div className="bg-red-50 rounded-2xl p-6 border border-red-200 flex flex-col gap-4">
              <h4 className="text-sm font-bold text-red-700 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-650" /> Account Termination
              </h4>
              <p className="text-xs text-red-600/80 leading-relaxed">
                Deleting your account will purge all associated campaigns, signatures, and contracts. This is irreversible.
              </p>
              {deleteConfirm ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={actionLoading}
                    className="flex-1 bg-red-600 hover:bg-red-700 py-2.5 rounded-lg text-xs font-bold text-white shadow-sm"
                  >
                    Confirm Delete
                  </button>
                  <button onClick={() => setDeleteConfirm(false)} className="flex-1 border border-slate-205 bg-white py-2.5 rounded-lg text-xs text-slate-700">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-red-100 border border-red-205 hover:bg-red-200/50 py-2.5 text-xs font-semibold text-red-700 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Terminate Account
                </button>
              )}
            </div>
          </div>

          {/* Core Settings Profile Form */}
          <div className="md:col-span-2">
            <form onSubmit={handleUpdate} className="bg-white rounded-2xl p-6 sm:p-8 border border-purple-100 shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-purple-50 pb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-650" /> Profile Configurations
                </h3>
                {saveSuccess && (
                  <span className="flex items-center gap-1 text-xs text-green-755 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                    <Check className="h-3.5 w-3.5 text-green-605" /> Changes Saved
                  </span>
                )}
              </div>

              {/* Name fields */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              {/* Business details */}
              <div className="border-t border-purple-50 pt-6 flex items-center gap-2">
                <Building className="h-4.5 w-4.5 text-purple-650" />
                <h4 className="text-sm font-bold text-slate-900">Business Registration</h4>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Business Name</label>
                  <input
                    type="text"
                    placeholder="Company LLC"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tax Identification ID</label>
                  <input
                    type="text"
                    placeholder="US-123456"
                    value={businessTaxId}
                    onChange={(e) => setBusinessTaxId(e.target.value)}
                    className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Corporate Address</label>
                <textarea
                  rows={2}
                  placeholder="Address details"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none resize-none"
                />
              </div>

              {/* Preferences */}
              <div className="border-t border-purple-50 pt-6 flex items-center gap-2">
                <Bell className="h-4.5 w-4.5 text-purple-650" />
                <h4 className="text-sm font-bold text-slate-900">Notification Settings</h4>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input type="checkbox" checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} className="h-4 w-4 rounded border-purple-200 text-purple-600 focus:ring-purple-500" />
                  <span className="text-xs text-slate-700">Email Campaign Alerts</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input type="checkbox" checked={smsNotif} onChange={(e) => setSmsNotif(e.target.checked)} className="h-4 w-4 rounded border-purple-200 text-purple-600 focus:ring-purple-500" />
                  <span className="text-xs text-slate-700">SMS Booking Notifications</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input type="checkbox" checked={pushNotif} onChange={(e) => setPushNotif(e.target.checked)} className="h-4 w-4 rounded border-purple-200 text-purple-600 focus:ring-purple-500" />
                  <span className="text-xs text-slate-700">Browser Push Alerts</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input type="checkbox" checked={whatsappNotif} onChange={(e) => setWhatsappNotif(e.target.checked)} className="h-4 w-4 rounded border-purple-200 text-purple-600 focus:ring-purple-500" />
                  <span className="text-xs text-slate-700">WhatsApp Updates</span>
                </label>
              </div>

              {/* Security Settings (MFA) */}
              <div className="border-t border-purple-50 pt-6 flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-purple-650" />
                <h4 className="text-sm font-bold text-slate-900">Security Settings (MFA)</h4>
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={mfaEnabled} 
                    onChange={handleToggleMfa} 
                    className="h-4 w-4 rounded border-purple-200 text-purple-600 focus:ring-purple-500" 
                  />
                  <span className="text-xs text-slate-700">Enable Multi-factor Authentication (MFA)</span>
                </label>
                <p className="text-[10px] text-slate-400 ml-7 leading-relaxed">
                  Requires inputting a one-time OTP verification code on every subsequent login for added account security.
                </p>
              </div>

              <button type="submit" disabled={authLoading} className="w-full mt-4 rounded-lg bg-purple-600 py-3 text-xs font-bold text-white hover:bg-purple-700 transition-colors shadow-sm">
                {authLoading ? <RefreshCw className="h-4 w-4 animate-spin mx-auto" /> : "Save Profile Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RENDER OPTION 2: MEDIA OWNER INVENTORY PORTAL */}
      {isOwner && activeSubTab === "inventory" && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-purple-655" /> Active Inventory Listings
            </h3>
            <button
              onClick={() => setActiveSubTab("register")}
              className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-xs font-semibold py-2 px-3.5 rounded-lg text-white shadow-sm transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add New Billboard
            </button>
          </div>

          {/* List display */}
          {billboardsLoading && ownerBillboards.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto text-purple-650 mb-2" />
              Loading active inventory...
            </div>
          ) : ownerBillboards.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-xl border border-purple-100 shadow-sm">
              <AlertTriangle className="h-8 w-8 text-slate-405 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No registered billboards found</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">Register your physical assets to receive advertisement campaign bookings.</p>
              <button
                onClick={() => setActiveSubTab("register")}
                className="bg-purple-50 border border-purple-105 rounded-lg py-2 px-4 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-colors"
              >
                Register Billboard
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {ownerBillboards.map((b) => (
                <div key={b.id} className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <button
                      onClick={() => toggleAvailability(b.id, b.isAvailable)}
                      className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-colors ${
                        b.isAvailable 
                          ? "bg-green-50 border-green-200 text-green-700" 
                          : "bg-amber-50 border-amber-200 text-amber-700"
                      }`}
                    >
                      {b.isAvailable ? "Available" : "Maintenance"}
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded w-max">
                      {b.locationType}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 leading-snug group-hover:text-purple-600 transition-colors">
                      {b.name}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {b.description}
                    </p>

                    <div className="flex flex-col gap-1 border-t border-purple-50 pt-3 mt-1 text-xs text-slate-505">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{b.address}, {b.city}, {b.state} {b.postalCode}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5">
                        <span className="flex items-center gap-1 bg-slate-50 border border-purple-100 px-2 py-0.5 rounded">
                          <LayoutGrid className="h-3 w-3 text-slate-400" /> {b.dimensions}
                        </span>
                        <span className="flex items-center gap-1 text-slate-900 font-semibold">
                          <DollarSign className="h-3.5 w-3.5 text-purple-600" /> {b.pricePerDay.toFixed(2)}/day
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-purple-50 pt-3 mt-4">
                    <button
                      onClick={() => toggleAvailability(b.id, b.isAvailable)}
                      title="Toggle availability status"
                      className="text-xs border border-purple-100 hover:border-purple-200 bg-purple-50/50 py-1.5 px-3 rounded-lg text-purple-700 hover:bg-purple-50 transition-colors"
                    >
                      Toggle Status
                    </button>
                    <button
                      onClick={() => handleDeleteBillboard(b.id)}
                      className="h-8 w-8 flex items-center justify-center border border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100/50 text-red-500 rounded-lg transition-colors"
                      title="Delete listing"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RENDER OPTION 3: REGISTER NEW BILLBOARD (OWNER) */}
      {isOwner && activeSubTab === "register" && (
        <div className="max-w-3xl">
          <form onSubmit={handleCreateBillboard} className="bg-white rounded-2xl p-6 sm:p-8 border border-purple-100 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-purple-50 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-purple-650" /> Register Advertising Billboard
              </h3>
              {billSuccess && (
                <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full animate-fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Registered successfully
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Billboard Name</label>
              <input
                type="text"
                required
                placeholder="Times Square Digital Archway"
                value={billName}
                onChange={(e) => setBillName(e.target.value)}
                className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Listing Description</label>
              <textarea
                rows={3}
                required
                placeholder="Describe visibility traffic counts, surrounding spots, and operational parameters..."
                value={billDesc}
                onChange={(e) => setBillDesc(e.target.value)}
                className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none resize-none"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="1500 Broadway"
                  value={billAddr}
                  onChange={(e) => setBillAddr(e.target.value)}
                  className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">City</label>
                <input
                  type="text"
                  required
                  placeholder="New York"
                  value={billCity}
                  onChange={(e) => setBillCity(e.target.value)}
                  className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">State/Province</label>
                <input
                  type="text"
                  required
                  placeholder="NY"
                  value={billState}
                  onChange={(e) => setBillState(e.target.value)}
                  className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">ZIP/Postal Code</label>
                <input
                  type="text"
                  required
                  placeholder="10036"
                  value={billZip}
                  onChange={(e) => setBillZip(e.target.value)}
                  className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Country</label>
                <input
                  type="text"
                  required
                  placeholder="USA"
                  value={billCountry}
                  onChange={(e) => setBillCountry(e.target.value)}
                  className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Latitude Coordinate</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  placeholder="40.756300"
                  value={billLat}
                  onChange={(e) => setBillLat(e.target.value)}
                  className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:border-purple-500 focus:bg-white focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Longitude Coordinate</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  placeholder="-73.986300"
                  value={billLng}
                  onChange={(e) => setBillLng(e.target.value)}
                  className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:border-purple-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Dimensions</label>
                <input
                  type="text"
                  required
                  placeholder="14m x 48m"
                  value={billDims}
                  onChange={(e) => setBillDims(e.target.value)}
                  className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:border-purple-500 focus:bg-white focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Location Type</label>
                <select
                  value={billType}
                  onChange={(e: any) => setBillType(e.target.value)}
                  className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:border-purple-500 focus:bg-white focus:outline-none"
                >
                  <option value="OUTDOOR">Outdoor Billboard</option>
                  <option value="INDOOR">Indoor Screen</option>
                  <option value="DIGITAL">Digital Panel</option>
                  <option value="STATIC">Static Board</option>
                  <option value="TRANSIT">Transit Overlay</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Price Per Day ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="1200.00"
                  value={billPrice}
                  onChange={(e) => setBillPrice(e.target.value)}
                  className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:border-purple-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <button type="submit" disabled={billboardsLoading} className="w-full mt-4 rounded-lg bg-purple-600 py-3 text-xs font-bold text-white hover:bg-purple-700 transition-colors shadow-sm">
              {billboardsLoading ? <RefreshCw className="h-4 w-4 animate-spin mx-auto" /> : "Register Physical Asset"}
            </button>
          </form>
        </div>
      )}

      {/* RENDER OPTION 4: OWNER ANALYTICS AND EARNINGS */}
      {isOwner && activeSubTab === "analytics" && (
        <div className="flex flex-col gap-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-purple-650" /> Financial Analytics & Earnings
          </h3>

          <div className="grid gap-6 md:grid-cols-4">
            <div className="bg-white p-5 rounded-xl border border-purple-100 shadow-sm flex flex-col gap-1">
              <span className="text-[10px] uppercase text-slate-500 tracking-wider font-semibold">Total Revenue</span>
              <span className="text-2xl font-bold text-slate-900">$4,250.00</span>
              <span className="text-[10px] text-green-600 mt-1 font-medium">+18.5% this week</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-purple-100 shadow-sm flex flex-col gap-1">
              <span className="text-[10px] uppercase text-slate-500 tracking-wider font-semibold">Asset Occupancy</span>
              <span className="text-2xl font-bold text-slate-900">82.4%</span>
              <span className="text-[10px] text-purple-600 mt-1 font-medium">18 Available days blocked</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-purple-100 shadow-sm flex flex-col gap-1">
              <span className="text-[10px] uppercase text-slate-500 tracking-wider font-semibold">Pending Bookings</span>
              <span className="text-2xl font-bold text-slate-900">3 Requests</span>
              <span className="text-[10px] text-amber-600 mt-1 font-medium">Awaiting contract signoff</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-purple-100 shadow-sm flex flex-col gap-1">
              <span className="text-[10px] uppercase text-slate-500 tracking-wider font-semibold">System Escrow</span>
              <span className="text-2xl font-bold text-slate-900">$1,500.00</span>
              <span className="text-[10px] text-slate-400 mt-1 font-medium">Releases on campaign live</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-4">Historical Earning Bookings</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-slate-600">
                <thead>
                  <tr className="border-b border-purple-100 text-slate-500 font-semibold">
                    <th className="py-2.5 text-left">Billboard Asset</th>
                    <th className="py-2.5 text-center">Dates</th>
                    <th className="py-2.5 text-center">Days</th>
                    <th className="py-2.5 text-right">Earning</th>
                    <th className="py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50">
                  <tr>
                    <td className="py-3 font-semibold text-slate-800">Times Square Mega-Screen</td>
                    <td className="py-3 text-center">Jun 10 - Jun 12</td>
                    <td className="py-3 text-center">2 days</td>
                    <td className="py-3 text-right text-green-600 font-semibold">$3,000.00</td>
                    <td className="py-3 text-center">
                      <span className="bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded text-[10px]">Settled</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-800">Sunset Blvd Highway Panel</td>
                    <td className="py-3 text-center">Jun 15 - Jun 17</td>
                    <td className="py-3 text-center">2 days</td>
                    <td className="py-3 text-right text-green-600 font-semibold">$1,500.00</td>
                    <td className="py-3 text-center">
                      <span className="bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded text-[10px]">In Escrow</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RENDER OPTION 5: CUSTOMER BRAND LIBRARIES LIST */}
      {!isOwner && activeSubTab === "brands" && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-purple-650" /> Advertiser Brand Libraries
            </h3>
            <button
              onClick={() => setActiveSubTab("add-brand")}
              className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-xs font-semibold py-2 px-3.5 rounded-lg text-white shadow-sm transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Brand Asset
            </button>
          </div>

          {/* List display */}
          {brandLoading && brandAssets.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto text-purple-650 mb-2" />
              Loading brand assets...
            </div>
          ) : brandAssets.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-xl border border-purple-100 shadow-sm">
              <Palette className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No brand profiles registered</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">Register your corporate designs, logos, and fonts for campaign preview mockups.</p>
              <button
                onClick={() => setActiveSubTab("add-brand")}
                className="bg-purple-50 border border-purple-105 rounded-lg py-2 px-4 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-colors"
              >
                Register Brand Library
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {brandAssets.map((brand) => (
                <div key={brand.id} className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5 flex flex-col justify-between relative overflow-hidden group">
                  <div className="flex flex-col gap-4">
                    {/* Logo & Name block */}
                    <div className="flex items-center gap-4">
                      {brand.logoUrl ? (
                        <img 
                          src={brand.logoUrl} 
                          alt="logo" 
                          className="h-12 w-12 rounded-lg object-cover border border-purple-100 shadow-sm"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-slate-50 rounded-lg border border-purple-100 flex items-center justify-center text-xs text-slate-400">
                          Logo
                        </div>
                      )}
                      <div>
                        <h4 className="text-base font-bold text-slate-900 leading-snug group-hover:text-purple-650 transition-colors">
                          {brand.name}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          Registered: {new Date(brand.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Color Swatches */}
                    {brand.colorPalette && (
                      <div className="flex flex-col gap-1.5 border-t border-purple-50 pt-3">
                        <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-1">
                          <Palette className="h-3 w-3 text-purple-600" /> Palette Swatches
                        </span>
                        <div className="flex gap-2.5 mt-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <span className="h-3.5 w-3.5 rounded-full border border-purple-100" style={{ backgroundColor: brand.colorPalette.primary }} />
                            <span>Primary</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <span className="h-3.5 w-3.5 rounded-full border border-purple-100" style={{ backgroundColor: brand.colorPalette.secondary }} />
                            <span>Secondary</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <span className="h-3.5 w-3.5 rounded-full border border-purple-100" style={{ backgroundColor: brand.colorPalette.accent }} />
                            <span>Accent</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Typography */}
                    {brand.typography && (
                      <div className="flex flex-col gap-1 border-t border-purple-50 pt-3 text-xs text-slate-505">
                        <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-1">
                          <Type className="h-3 w-3 text-purple-600" /> System Typography
                        </span>
                        <div className="flex gap-4 mt-1">
                          <span>Headings: <strong className="text-slate-800 font-semibold">{brand.typography.headings}</strong></span>
                          <span>Body: <strong className="text-slate-800 font-semibold">{brand.typography.body}</strong></span>
                        </div>
                      </div>
                    )}

                    {/* Document Guidelines */}
                    <div className="border-t border-purple-50 pt-3">
                      <a 
                        href={brand.assetUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 underline"
                      >
                        <Info className="h-3.5 w-3.5" /> View Brand Guidelines PDF
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-purple-50 pt-3 mt-4">
                    <button
                      onClick={() => handleEditClick(brand)}
                      className="flex items-center justify-center gap-1.5 border border-purple-100 hover:border-purple-200 bg-purple-50/50 hover:bg-purple-50 py-1.5 px-3 rounded-lg text-purple-700 text-xs transition-colors"
                    >
                      Edit Library
                    </button>
                    <button
                      onClick={() => handleDeleteBrandAsset(brand.id)}
                      className="flex items-center justify-center gap-2 border border-red-200 hover:border-red-305 bg-red-50 hover:bg-red-100/50 py-1.5 px-3 rounded-lg text-red-500 text-xs transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove Brand
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RENDER OPTION 6: REGISTER OR EDIT NEW BRAND ASSET */}
      {!isOwner && activeSubTab === "add-brand" && (
        <div className="max-w-3xl">
          <form onSubmit={handleCreateBrandAsset} className="bg-white rounded-2xl p-6 sm:p-8 border border-purple-100 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-purple-50 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-purple-650" /> {brandEditMode ? "Update Brand Asset Library" : "Register Brand Asset Profile"}
              </h3>
              {brandSuccess && (
                <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full animate-fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Saved successfully
                </span>
              )}
            </div>

            {uploadProgress && (
              <div className="text-[10px] text-purple-700 bg-purple-50 border border-purple-100 px-3 py-2 rounded-lg flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-550 shrink-0" />
                <span>{uploadProgress}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Brand / Library Name</label>
              <input
                type="text"
                required
                placeholder="Corporate Launch Collection"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:border-purple-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Logo Upload with Cropper Preview */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Brand Logo Image Upload (Max 5MB)</label>
                <div className="flex flex-col gap-3 rounded-lg border-2 border-dashed border-purple-200 bg-slate-50 p-4 items-center justify-center text-center relative hover:border-purple-500/40 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {!logoPreview ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <FolderOpen className="h-6 w-6 text-slate-400" />
                      <span className="text-[10px] text-slate-600">Click or drag image file here</span>
                      <span className="text-[8px] text-slate-400">Allowed formats: PNG, JPG, WEBP, SVG</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2.5 w-full z-10">
                      {/* Interactive Visual Bounding Box Cropper */}
                      <div className="h-28 w-28 rounded-full border-2 border-purple-300 bg-slate-100 overflow-hidden flex items-center justify-center relative shadow-sm">
                        <img
                          src={logoPreview}
                          alt="Crop Preview"
                          style={{ transform: `scale(${logoScale})` }}
                          className="h-full w-full object-cover transition-transform duration-100"
                        />
                      </div>
                      <div className="flex flex-col gap-1 w-full px-2">
                        <div className="flex justify-between text-[8px] text-slate-500 font-bold uppercase">
                          <span>Adjust Bounding Crop Zoom</span>
                          <span>{logoScale.toFixed(1)}x</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="3"
                          step="0.1"
                          value={logoScale}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setLogoScale(parseFloat(e.target.value))}
                          className="w-full h-1 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                      </div>
                      <span className="text-[8px] text-slate-400 truncate max-w-full">
                        File Loaded successfully. Click to replace.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Guideline Doc Upload */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Guidelines Document (PDF/Word, Max 10MB)</label>
                <div className="flex flex-col gap-3 rounded-lg border-2 border-dashed border-purple-200 bg-slate-50 p-4 items-center justify-center text-center relative hover:border-purple-500/40 transition-colors h-[166px]">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleGuidelineChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {!guidelineName ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <FolderOpen className="h-6 w-6 text-slate-400" />
                      <span className="text-[10px] text-slate-600">Attach Brand Guideline Document</span>
                      <span className="text-[8px] text-slate-400">Allowed formats: PDF, DOC, DOCX</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 z-10">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 border border-purple-100 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-800 truncate max-w-[200px]">
                        {guidelineName}
                      </span>
                      <span className="text-[8px] text-slate-400">
                        Click or drag to replace attachment
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="border-t border-purple-50 pt-6 flex items-center gap-2">
              <Palette className="h-4.5 w-4.5 text-purple-650" />
              <h4 className="text-sm font-bold text-slate-900">Color Palette Hex Codes</h4>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Primary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={brandPrimary}
                    onChange={(e) => setBrandPrimary(e.target.value)}
                    className="h-8 w-8 rounded border border-purple-100 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    required
                    value={brandPrimary}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBrandPrimary(val);
                    }}
                    className="flex-1 rounded-lg border border-purple-100 bg-slate-50 px-3 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Secondary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={brandSecondary}
                    onChange={(e) => setBrandSecondary(e.target.value)}
                    className="h-8 w-8 rounded border border-purple-100 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    required
                    value={brandSecondary}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBrandSecondary(val);
                    }}
                    className="flex-1 rounded-lg border border-purple-100 bg-slate-50 px-3 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Accent Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={brandAccent}
                    onChange={(e) => setBrandAccent(e.target.value)}
                    className="h-8 w-8 rounded border border-purple-100 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    required
                    value={brandAccent}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBrandAccent(val);
                    }}
                    className="flex-1 rounded-lg border border-purple-100 bg-slate-50 px-3 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="border-t border-purple-50 pt-6 flex items-center gap-2">
              <Type className="h-4.5 w-4.5 text-purple-650" />
              <h4 className="text-sm font-bold text-slate-900">System Typography</h4>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Headings Font Family</label>
                <select
                  value={brandHeadings}
                  onChange={(e) => setBrandHeadings(e.target.value)}
                  className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:border-purple-500 focus:outline-none"
                >
                  <option value="Outfit">Outfit</option>
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Playfair Display">Playfair Display</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Body Font Family</label>
                <select
                  value={brandBody}
                  onChange={(e) => setBrandBody(e.target.value)}
                  className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:border-purple-500 focus:outline-none"
                >
                  <option value="Inter">Inter</option>
                  <option value="Outfit">Outfit</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              {brandEditMode && (
                <button
                  type="button"
                  onClick={() => {
                    setBrandEditMode(false);
                    setEditingBrandId(null);
                    setBrandName("");
                    setBrandLogoUrl("");
                    setLogoPreview("");
                    setBrandAssetUrl("");
                    setGuidelineName("");
                    setUploadProgress("");
                    setActiveSubTab("brands");
                  }}
                  className="flex-1 rounded-lg border border-purple-200 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancel Edit
                </button>
              )}
              <button 
                type="submit" 
                disabled={brandLoading} 
                className="flex-[2] rounded-lg bg-purple-600 py-3 text-xs font-bold text-white hover:bg-purple-700 transition-colors shadow-sm"
              >
                {brandLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
                ) : brandEditMode ? (
                  "Update Brand Library"
                ) : (
                  "Save Brand Asset Profile"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RENDER OPTION 7: AFFILIATE PARTNER DASHBOARD */}
      {activeSubTab === "referrals" && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Share2 className="h-5 w-5 text-purple-650" /> Affiliate Partner Dashboard
            </h3>
            <span className="bg-purple-100/50 border border-purple-200 text-purple-750 px-3 py-1 rounded-full text-xs font-semibold">
              Partner Status: Active
            </span>
          </div>

          {/* Metrics Panel */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Referred Accounts</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">14</span>
                <span className="text-xs text-green-600 font-bold flex items-center">
                  <Users className="h-3.5 w-3.5 mr-0.5" /> +2 this month
                </span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cumulative Commissions</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">$2,450.00</span>
                <span className="text-xs text-purple-650 font-semibold">10% standard tier</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Withdrawable Balance</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-purple-650">$650.00</span>
                <span className="text-xs text-slate-500">Min. payout $100</span>
              </div>
            </div>
          </div>

          {/* Link Generation and Payout Request */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Link Generator */}
            <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm flex flex-col gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Your Referral Code & Link</h4>
                <p className="text-xs text-slate-500 mt-1">Share your unique partner link with advertisers to earn commissions on their bookings.</p>
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-[9px] uppercase font-bold text-slate-400">Referral Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`https://billboardify.com/register?ref=REF-${user.firstName.toUpperCase()}${user.id.substring(Math.max(0, user.id.length - 4))}`}
                    className="flex-1 rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-600 focus:outline-none select-all font-mono"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://billboardify.com/register?ref=REF-${user.firstName.toUpperCase()}${user.id.substring(Math.max(0, user.id.length - 4))}`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3.5 rounded-lg text-xs transition-colors flex items-center gap-1 shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 text-[11px] text-slate-505 bg-purple-50/50 p-3 rounded-lg border border-purple-100/50 mt-1">
                <Sparkles className="h-4 w-5 text-purple-600 shrink-0" />
                <span>Earn 10% commission on the base booking price for every campaign successfully booked by your referred clients in their first 12 months.</span>
              </div>
            </div>

            {/* Withdraw Payout */}
            <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm flex flex-col gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Request Commission Withdrawal</h4>
                <p className="text-xs text-slate-500 mt-1">Submit a withdrawal request. Funds will be transferred within 3-5 business days.</p>
              </div>

              {payoutSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Withdrawal request submitted successfully!</span>
                </div>
              )}

              {payoutError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{payoutError}</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const amt = parseFloat(payoutAmount);
                  if (isNaN(amt) || amt < 100) {
                    setPayoutError("Minimum withdrawal amount is $100.00");
                    setPayoutSuccess(false);
                    return;
                  }
                  if (amt > 650) {
                    setPayoutError("Insufficient balance. Your withdrawable balance is $650.00");
                    setPayoutSuccess(false);
                    return;
                  }
                  setPayoutError("");
                  setPayoutSuccess(true);
                  setPayoutAmount("");
                  setPayoutAccount("");
                }}
                className="flex flex-col gap-3"
              >
                <div className="grid gap-3 grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400">Withdraw Amount ($)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 250"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      className="rounded-lg border border-purple-100 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400">Payout Method</label>
                    <select
                      value={payoutMethod}
                      onChange={(e) => setPayoutMethod(e.target.value)}
                      className="rounded-lg border border-purple-100 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                    >
                      <option value="PayPal">PayPal</option>
                      <option value="Bank Transfer">Bank Wire Transfer</option>
                      <option value="Stripe Payout">Stripe Connect</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Payout Account details</label>
                  <input
                    type="text"
                    required
                    placeholder={payoutMethod === "PayPal" ? "paypal.email@example.com" : "IBAN / Routing & Account number"}
                    value={payoutAccount}
                    onChange={(e) => setPayoutAccount(e.target.value)}
                    className="rounded-lg border border-purple-100 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs shadow-sm transition-colors mt-2"
                >
                  Withdraw Funds
                </button>
              </form>
            </div>
          </div>

          {/* Referred Accounts List */}
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-4">
              <Users className="h-4 w-4 text-purple-600" /> Referred Accounts & Earnings
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-purple-50 text-[10px] uppercase font-bold text-slate-400">
                    <th className="pb-3">Referred User / Business</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-center">Join Date</th>
                    <th className="pb-3 text-right">Commission Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50">
                  <tr>
                    <td className="py-3 font-semibold text-slate-800">
                      <div>Acme Corp (John Smith)</div>
                      <div className="text-[10px] text-slate-400 font-normal">john@acme.com</div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded text-[9px] font-semibold">Active Advertiser</span>
                    </td>
                    <td className="py-3 text-center text-slate-500">May 12, 2026</td>
                    <td className="py-3 text-right text-purple-650 font-bold">$1,250.00</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-800">
                      <div>Pied Piper (Richard H.)</div>
                      <div className="text-[10px] text-slate-400 font-normal">richard@piper.io</div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded text-[9px] font-semibold">Active Advertiser</span>
                    </td>
                    <td className="py-3 text-center text-slate-500">May 20, 2026</td>
                    <td className="py-3 text-right text-purple-650 font-bold">$1,200.00</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-800">
                      <div>Stark Industries (Pepper Potts)</div>
                      <div className="text-[10px] text-slate-400 font-normal">pepper@stark.com</div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="bg-slate-50 border border-slate-200 text-slate-500 px-2 py-0.5 rounded text-[9px]">Registered Only</span>
                    </td>
                    <td className="py-3 text-center text-slate-500">June 2, 2026</td>
                    <td className="py-3 text-right text-slate-400 font-semibold">$0.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RENDER OPTION 8: SUB-USER OPERATIONS DASHBOARD */}
      {activeSubTab === "operations" && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-purple-650" /> Field Operations Tasks
            </h3>
            <span className="bg-purple-100/50 border border-purple-200 text-purple-750 px-3 py-1 rounded-full text-xs font-semibold">
              Assigned Zone: Northeast US
            </span>
          </div>

          {/* Metrics Panel */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pending Tasks</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-600">3</span>
                <span className="text-xs text-slate-500 font-medium">Require action</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">In Progress Schedules</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-blue-600">1</span>
                <span className="text-xs text-slate-500">Scheduled maintenance</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Verified Audits</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-green-600">12</span>
                <span className="text-xs text-green-600 font-bold">+3 this week</span>
              </div>
            </div>
          </div>

          {/* Task Board */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* List of Tasks */}
            <div className="md:col-span-2 flex flex-col gap-4 bg-white p-6 rounded-2xl border border-purple-100 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900">Assigned Operational Tasks</h4>
              <div className="flex flex-col gap-3 mt-2">
                {opTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      selectedTaskId === task.id
                        ? "border-purple-500 bg-purple-50/40 shadow-sm"
                        : "border-purple-100 hover:border-purple-200"
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{task.title}</span>
                        <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-bold uppercase ${
                          task.status.startsWith("Verified")
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : task.status === "Pending Verification"
                            ? "bg-amber-50 text-amber-700 border border-amber-250"
                            : task.status === "In Progress"
                            ? "bg-blue-50 text-blue-700 border border-blue-250"
                            : "bg-purple-50 text-purple-700 border border-purple-250"
                        }`}>
                          {task.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">{task.billboard} • {task.location}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 shrink-0 font-medium">
                      Due: {task.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Verification Panel */}
            <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm flex flex-col gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Proof of Installation Audit</h4>
                <p className="text-xs text-slate-500 mt-1">Select an assigned task to upload calibration logs, photometrics or install photos.</p>
              </div>

              {selectedTaskId ? (
                <div className="flex flex-col gap-4 mt-2">
                  <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Active Selection</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">
                      {opTasks.find(t => t.id === selectedTaskId)?.title}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {opTasks.find(t => t.id === selectedTaskId)?.billboard}
                    </span>
                  </div>

                  {opUploadSuccess ? (
                    <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-3.5 py-3 rounded-lg flex flex-col gap-1 items-center text-center">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      <span className="font-bold mt-1">Upload verified successfully!</span>
                      <span className="text-[10px] text-green-600">Proof sent to billboard manager queue.</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-3 rounded-lg border-2 border-dashed border-purple-200 bg-slate-50 p-6 items-center justify-center text-center relative hover:border-purple-500/40 transition-colors">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          disabled={opUploading}
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              setOpUploading(true);
                              setTimeout(() => {
                                setOpUploading(false);
                                setOpUploadSuccess(true);
                                // Update task status to Verified in state
                                setOpTasks(prev => prev.map(t => t.id === selectedTaskId ? { ...t, status: "Verified & Audit Done" } : t));
                                setTimeout(() => setOpUploadSuccess(false), 4000);
                              }, 2000);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-1.5">
                          {opUploading ? (
                            <>
                              <RefreshCw className="h-6 w-6 animate-spin text-purple-600" />
                              <span className="text-[10px] text-purple-700 font-semibold">Uploading proof...</span>
                            </>
                          ) : (
                            <>
                              <Camera className="h-6 w-6 text-slate-400" />
                              <span className="text-[10px] text-slate-650">Click to upload audit photo</span>
                              <span className="text-[8px] text-slate-400">PDF, PNG, JPG (max 10MB)</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-12 text-slate-400 border border-dashed border-purple-100 rounded-xl bg-purple-50/20">
                  <CheckSquare className="h-8 w-8 text-slate-300 mb-2" />
                  <span className="text-xs font-semibold text-slate-600">No task selected</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Please click on a task on the left to start verification</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DashboardPage;
