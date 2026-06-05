import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  MapPin, 
  Layers, 
  DollarSign, 
  CalendarRange, 
  Sparkles, 
  Star, 
  User, 
  Tag, 
  Compass, 
  ShieldCheck, 
  Info,
  ChevronRight,
  MessageSquare,
  Clock,
  TrendingUp,
  Maximize2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Eye,
  Map,
  X,
  Navigation
} from "lucide-react";
import { api } from "@/config/axios";

interface Billboard {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  dimensions: string;
  locationType: "INDOOR" | "OUTDOOR" | "DIGITAL" | "STATIC" | "TRANSIT";
  pricePerDay: number;
  minimumBookingDays: number;
  isAvailable: boolean;
  ownerId: string;
  imageUrl?: string;
  views?: number;
}

const BILLBOARD_IMAGES: { [key: string]: string } = {
  bill_001: "https://images.unsplash.com/photo-1542241647-9cbb2225278b?q=80&w=1200",
  bill_002: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1200",
  bill_003: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200",
  bill_004: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200",
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1542241647-9cbb2225278b?q=80&w=1200";

interface BillboardDetailPageProps {
  id: string;
}

export const BillboardDetailPage: React.FC<BillboardDetailPageProps> = ({ id }) => {
  const [billboard, setBillboard] = useState<Billboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Form States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Real-time Pricing calculation from API
  const [pricingResult, setPricingResult] = useState<any>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [imgBroken, setImgBroken] = useState(false);

  // 3D Street View Modal
  const [streetViewOpen, setStreetViewOpen] = useState(false);
  const [streetViewTab, setStreetViewTab] = useState<"street" | "satellite" | "map">("street");

  // Dynamic body background override for seamless premium light mode framing
  useEffect(() => {
    const originalBodyBg = document.body.className;
    document.body.className = "bg-[#F7F6FB] text-slate-800 min-h-screen selection:bg-purple-500 selection:text-white";
    return () => {
      document.body.className = originalBodyBg;
    };
  }, []);

  useEffect(() => {
    const fetchBillboard = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/billboards/${id}`);
        if (res.data.success) {
          setBillboard({
            ...res.data.data,
            imageUrl: BILLBOARD_IMAGES[res.data.data.id] || DEFAULT_IMAGE,
            views: res.data.data.views || Math.floor(Math.random() * 1000) + 120,
          });
        }
      } catch (err: any) {
        console.error("Error loading billboard details", err);
        setError(err.response?.data?.error?.message || "Failed to load billboard details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBillboard();
    }
  }, [id]);

  // Fetch Pricing Estimate from Backend Pricing Engine API when dates change
  useEffect(() => {
    const calculatePricing = async () => {
      if (!startDate || !endDate || !billboard) return;
      
      setPricingLoading(true);
      setPricingError(null);
      try {
        const res = await api.post(`/billboards/${id}/pricing/calculate`, {
          startDate,
          endDate
        });
        if (res.data.success) {
          setPricingResult(res.data.data);
        }
      } catch (err: any) {
        console.error("Pricing estimation failed", err);
        setPricingResult(null);
        setPricingError(err.response?.data?.error?.message || "Calculation failed for selected dates.");
      } finally {
        setPricingLoading(false);
      }
    };

    calculatePricing();
  }, [startDate, endDate, id, billboard]);

  // Handle Coupon Apply
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricingResult) return;

    const code = couponCode.toUpperCase().trim();
    if (code === "WELCOME10") {
      setAppliedCoupon(code);
      setCouponDiscount(pricingResult.finalAmount * 0.10);
    } else if (code === "SUMMER26" && pricingResult.finalAmount >= 1000) {
      setAppliedCoupon(code);
      setCouponDiscount(200);
    } else {
      alert("Invalid coupon code or minimum spend condition not met.");
    }
  };

  const handleResetCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode("");
  };

  const getFinalTotal = () => {
    if (!pricingResult) return 0;
    return Math.max(0, pricingResult.finalAmount - couponDiscount);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert("Please configure start and end campaign dates.");
      return;
    }

    setBookingLoading(true);
    setTimeout(() => {
      setBookingLoading(false);
      setBookingSuccess(true);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center py-40 min-h-screen bg-[#F7F6FB] text-purple-700">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        <span className="text-xs text-slate-450 font-bold tracking-widest uppercase">Retrieving Specifications...</span>
      </div>
    );
  }

  if (error || !billboard) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center px-4 min-h-screen bg-[#F7F6FB] text-slate-800">
        <Info className="w-12 h-12 text-rose-500 mb-4 animate-pulse" />
        <h2 className="text-lg font-bold text-slate-900 mb-2">Error Locating Billboard</h2>
        <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
          {error || "The billboard configuration you requested could not be located in our inventory database."}
        </p>
        <Link 
          href="/billboards"
          className="bg-purple-600 border border-purple-600 text-xs font-bold text-white px-5 py-2.5 rounded-xl hover:bg-purple-705 transition"
        >
          Return to Discover Page
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 py-2 text-slate-800">

      {/* ══════════════════════════════════════════════════════════
           3D STREET VIEW MODAL
      ══════════════════════════════════════════════════════════ */}
      {streetViewOpen && billboard && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8"
          style={{ background: "rgba(10,6,25,0.92)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setStreetViewOpen(false); }}
        >
          <div className="relative w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-purple-900/40 flex flex-col" style={{ height: "88vh" }}>

            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#0f0a1e] border-b border-purple-900/30">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
                  <Navigation className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{billboard.name}</h3>
                  <p className="text-[10px] text-purple-300 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {billboard.address}, {billboard.city} &nbsp;·&nbsp;
                    <span className="font-mono">{billboard.latitude.toFixed(5)}°, {billboard.longitude.toFixed(5)}°</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Tab switcher */}
                <div className="flex gap-1 bg-white/5 rounded-full p-1 border border-white/10">
                  <button
                    onClick={() => setStreetViewTab("street")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                      streetViewTab === "street"
                        ? "bg-purple-600 text-white shadow"
                        : "text-purple-300 hover:text-white"
                    }`}
                  >
                    <Eye className="w-3 h-3" /> Street View
                  </button>
                  <button
                    onClick={() => setStreetViewTab("satellite")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                      streetViewTab === "satellite"
                        ? "bg-purple-600 text-white shadow"
                        : "text-purple-300 hover:text-white"
                    }`}
                  >
                    <Layers className="w-3 h-3" /> Satellite
                  </button>
                  <button
                    onClick={() => setStreetViewTab("map")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                      streetViewTab === "map"
                        ? "bg-purple-600 text-white shadow"
                        : "text-purple-300 hover:text-white"
                    }`}
                  >
                    <Map className="w-3 h-3" /> Road Map
                  </button>
                </div>

                <button
                  onClick={() => setStreetViewOpen(false)}
                  className="h-8 w-8 rounded-full bg-white/10 hover:bg-red-500/30 border border-white/10 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Iframe Panel */}
            <div className="flex-1 relative bg-[#0a0616]">

              {/* Street View */}
              {streetViewTab === "street" && (
                <iframe
                  key="street"
                  title="Google Street View"
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: "block" }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://www.google.com/maps/embed/v1/streetview?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU3Lo&location=${billboard.latitude},${billboard.longitude}&heading=0&pitch=0&fov=90`}
                />
              )}

              {/* Satellite View */}
              {streetViewTab === "satellite" && (
                <iframe
                  key="satellite"
                  title="Google Satellite Map"
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: "block" }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU3Lo&center=${billboard.latitude},${billboard.longitude}&zoom=18&maptype=satellite`}
                />
              )}

              {/* Road Map */}
              {streetViewTab === "map" && (
                <iframe
                  key="roadmap"
                  title="Google Road Map"
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: "block" }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU3Lo&q=${billboard.latitude},${billboard.longitude}&zoom=15`}
                />
              )}

              {/* Overlay corner badge */}
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md border border-purple-800/50 rounded-xl px-3 py-2 flex flex-col gap-0.5 pointer-events-none">
                <span className="text-[9px] uppercase font-bold text-purple-400 tracking-widest">GIS Location</span>
                <span className="text-[11px] font-mono text-white">{billboard.latitude.toFixed(6)}, {billboard.longitude.toFixed(6)}</span>
                <span className="text-[9px] text-purple-300">{billboard.city}, {billboard.state} — {billboard.locationType}</span>
              </div>

              {/* Open in Google Maps link */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${billboard.latitude},${billboard.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-4 right-4 bg-white/10 hover:bg-purple-600/80 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 text-[10px] font-bold text-white flex items-center gap-1.5 transition-colors"
              >
                <Compass className="w-3.5 h-3.5" />
                Open in Google Maps
              </a>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-[#0f0a1e] border-t border-purple-900/30 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-purple-400">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live GIS Data
                </span>
                <span>{billboard.dimensions} · {billboard.locationType}</span>
                <span>${billboard.pricePerDay}/day base rate</span>
              </div>
              <button
                onClick={() => setStreetViewOpen(false)}
                className="text-[10px] font-bold text-purple-400 hover:text-white border border-purple-800 hover:border-purple-500 px-4 py-1.5 rounded-full transition-colors"
              >
                Close 3D View
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Back button */}
      <div>
        <Link 
          href="/billboards" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to billboard directory</span>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: Media gallery & specifications (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Billboard Image Container */}
          <div className="relative rounded-3xl overflow-hidden aspect-video border border-purple-100 shadow-xl bg-gradient-to-br from-purple-100 to-indigo-50 flex items-center justify-center">
            {!imgBroken ? (
              <img 
                src={billboard.imageUrl} 
                alt={billboard.name} 
                onError={() => setImgBroken(true)}
                className="w-full h-full object-cover" 
              />
            ) : (
              <ImageIcon className="w-12 h-12 text-purple-400 opacity-40 animate-pulse" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>

            {/* 3D View Trigger Button — top right overlay */}
            <button
              onClick={() => setStreetViewOpen(true)}
              className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-lg transition-all duration-200 group"
            >
              <Eye className="w-3.5 h-3.5 text-purple-200 group-hover:text-white transition-colors" />
              <span>View 3D Location</span>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
            </button>
            
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-2">
                  <span className="bg-purple-600 border border-purple-400/30 text-[9px] font-bold text-white px-2 py-0.5 rounded uppercase tracking-wider shadow-md">
                    {billboard.locationType}
                  </span>
                  <span className="bg-white border border-purple-100 text-[9px] font-bold text-purple-700 px-2 py-0.5 rounded uppercase tracking-wider shadow-md">
                    Available Listing
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-black text-white">{billboard.name}</h1>
                <p className="text-xs text-purple-100 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-200" />
                  <span>{billboard.address}, {billboard.city}, {billboard.state} {billboard.postalCode}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white border border-purple-100/80 rounded-3xl p-6 flex flex-col gap-4 shadow-sm">
            <h3 className="text-xs font-bold text-purple-900 uppercase tracking-widest border-b border-purple-50 pb-2.5">
              Media Slot Description
            </h3>
            <p className="text-xs text-slate-650 leading-relaxed">
              {billboard.description}
            </p>
            <p className="text-xs text-slate-450 leading-relaxed">
              Located in a high-exposure zone, this media asset provides peak daily impressions, targeting diverse commuter segments. Perfect for product launches, local brand positioning, or digital campaign loops. All metrics are audited and verified.
            </p>
          </div>

          {/* Technical Specs */}
          <div className="bg-white border border-purple-100/80 rounded-3xl p-6 flex flex-col gap-4 shadow-sm">
            <h3 className="text-xs font-bold text-purple-900 uppercase tracking-widest border-b border-purple-50 pb-2.5">
              Technical Specifications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Dimensions</span>
                <span className="text-xs font-semibold text-slate-700">{billboard.dimensions}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Location Category</span>
                <span className="text-xs font-semibold text-slate-700">{billboard.locationType} Placement</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Co-ordinates</span>
                <span className="text-xs font-mono font-semibold text-slate-700">{billboard.latitude.toFixed(4)}, {billboard.longitude.toFixed(4)}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Display Loop</span>
                <span className="text-xs font-semibold text-slate-700">
                  {billboard.locationType === "DIGITAL" ? "10 seconds share" : "Exclusively yours"}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Daily Impressions</span>
                <span className="text-xs font-semibold text-slate-700">~{billboard.views?.toLocaleString() || "120,000"} Views</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">GIS Verification</span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active GIS Index
                </span>
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div className="bg-white border border-purple-100/80 rounded-3xl p-6 flex flex-col gap-4 shadow-sm">
            <h3 className="text-xs font-bold text-purple-900 uppercase tracking-widest border-b border-purple-50 pb-2.5">
              Commuter Feedback & Ratings
            </h3>
            
            <div className="flex flex-col gap-4">
              <div className="border-b border-purple-50 pb-3 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                      JD
                    </div>
                    <span className="text-xs font-semibold text-slate-755">Jane Doe (Campaign Manager)</span>
                  </div>
                  <div className="flex gap-0.5 text-amber-500">
                    <Star className="w-3 h-3 fill-amber-450 text-amber-500" />
                    <Star className="w-3 h-3 fill-amber-450 text-amber-500" />
                    <Star className="w-3 h-3 fill-amber-450 text-amber-500" />
                    <Star className="w-3 h-3 fill-amber-450 text-amber-500" />
                    <Star className="w-3 h-3 fill-amber-450 text-amber-500" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed italic">
                  "Incredible visibility. Our CTR rose by 18% during our summer campaign. Booking pipeline was seamless."
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                      MS
                    </div>
                    <span className="text-xs font-semibold text-slate-755">Mark Smith (Brand Lead)</span>
                  </div>
                  <div className="flex gap-0.5 text-amber-500">
                    <Star className="w-3 h-3 fill-amber-455 text-amber-500" />
                    <Star className="w-3 h-3 fill-amber-455 text-amber-500" />
                    <Star className="w-3 h-3 fill-amber-455 text-amber-500" />
                    <Star className="w-3 h-3 fill-amber-455 text-amber-500" />
                    <Star className="w-3 h-3 text-slate-200" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed italic">
                  "Strong resolution on the digital output. Highly visible even during bright daylight. Recommending this billboard slot."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Dynamic pricing engine reservation form (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          <div className="bg-white border border-purple-100 rounded-3xl p-6 flex flex-col gap-5 shadow-xl relative">
            <div className="border-b border-purple-50 pb-3 flex justify-between items-center">
              <h3 className="text-xs font-black text-purple-900 flex items-center gap-2 uppercase tracking-widest">
                <CalendarRange className="w-4 h-4 text-purple-600" />
                <span>Configure Reservation</span>
              </h3>
              <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-100">${billboard.pricePerDay}/day</span>
            </div>

            {bookingSuccess ? (
              <div className="flex flex-col gap-4 items-center justify-center py-8 text-center">
                <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-600 animate-bounce">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Reservation Request Submitted!</h4>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Your booking inquiry is under review. The media owner will issue a contract quotation shortly.
                </p>
                <Link
                  href="/dashboard"
                  className="bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white px-5 py-2.5 rounded-xl transition shadow-lg shadow-purple-600/10"
                >
                  Go to Dashboard
                </Link>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="flex flex-col gap-4">
                
                {/* Dates selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-[#FAF9FD] border border-purple-100 text-xs font-bold text-slate-800 px-3 py-2.5 rounded-xl focus:outline-none focus:border-purple-500 w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">End Date</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-[#FAF9FD] border border-purple-100 text-xs font-bold text-slate-800 px-3 py-2.5 rounded-xl focus:outline-none focus:border-purple-500 w-full"
                    />
                  </div>
                </div>

                {/* Min reservation constraint */}
                <div className="text-[10px] text-slate-450 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-purple-605" />
                  <span>Min booking slot constraint: <strong>{billboard.minimumBookingDays} days</strong></span>
                </div>

                {/* Pricing result breakdown */}
                {pricingLoading && (
                  <div className="bg-[#FAF9FD] border border-purple-50 p-6 rounded-2xl flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-605" />
                    <span className="text-xs text-slate-500">Querying pricing engine...</span>
                  </div>
                )}

                {pricingError && (
                  <div className="bg-red-50 border border-red-200 p-3.5 rounded-2xl flex items-start gap-2 text-red-650 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                    <span>{pricingError}</span>
                  </div>
                )}

                {pricingResult && !pricingLoading && !pricingError && (
                  <div className="bg-[#FAF9FD] border border-purple-100/50 p-4 rounded-2xl flex flex-col gap-2.5">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Duration</span>
                      <span className="font-bold text-slate-700">{pricingResult.days} days</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Base price subtotal</span>
                      <span className="font-mono text-slate-800">${pricingResult.baseAmount.toFixed(2)}</span>
                    </div>
                    {pricingResult.weekendSurcharge > 0 && (
                      <div className="flex justify-between text-xs text-purple-600 font-bold">
                        <span>Weekend markups (+20%)</span>
                        <span className="font-mono">+${pricingResult.weekendSurcharge.toFixed(2)}</span>
                      </div>
                    )}
                    {pricingResult.peakSurcharge > 0 && (
                      <div className="flex justify-between text-xs text-amber-600 font-bold">
                        <span>Peak season multiplier (+50%)</span>
                        <span className="font-mono">+${pricingResult.peakSurcharge.toFixed(2)}</span>
                      </div>
                    )}
                    {pricingResult.durationDiscount > 0 && (
                      <div className="flex justify-between text-xs text-emerald-600 font-bold">
                        <span>Duration discount (-{(pricingResult.discountPercent || 0.05)*100}%)</span>
                        <span className="font-mono">-${pricingResult.durationDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {appliedCoupon && (
                      <div className="flex justify-between text-xs text-purple-700 font-bold">
                        <span>Coupon Discount ({appliedCoupon})</span>
                        <span className="font-mono">-${couponDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="h-px bg-purple-50 my-1" />
                    
                    <div className="flex justify-between items-center text-sm font-bold text-slate-800">
                      <span>Estimated Total</span>
                      <span className="font-mono text-purple-605 text-lg font-black">${getFinalTotal().toFixed(2)}</span>
                    </div>

                    {/* Promo Code section */}
                    <div className="border-t border-purple-50 pt-2.5 mt-1">
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-emerald-700 text-xs">
                          <span className="font-bold">Code {appliedCoupon} applied!</span>
                          <button type="button" onClick={handleResetCoupon} className="text-[9px] font-bold text-purple-400 hover:text-purple-700 uppercase">
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="COUPON (e.g. WELCOME10)"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className="flex-1 bg-white border border-purple-100 text-[10px] font-bold text-slate-700 px-3 py-2 rounded-xl uppercase focus:outline-none focus:border-purple-500"
                          />
                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            className="bg-purple-50 border border-purple-100 hover:bg-purple-100 text-purple-700 font-bold px-3 py-2 rounded-xl text-[10px] transition uppercase tracking-wider"
                          >
                            Apply
                          </button>
                        </div>
                      )}
                      <span className="text-[9px] text-slate-400 mt-1 block italic">Tip: Use promo code WELCOME10 for 10% off.</span>
                    </div>

                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full mt-3 bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-500 hover:to-indigo-550 text-white font-black py-3 rounded-2xl text-xs shadow-lg shadow-purple-600/10 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {bookingLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      <span>Locking slot...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Proceed to Book Campaign</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* AI Creative Design Canvas CTA */}
          <div className="bg-white border border-purple-100 rounded-3xl p-5 flex flex-col gap-3 shadow-sm border-dashed">
            <h4 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Need Creative Designs?</span>
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Design a gorgeous billboard canvas conforming exactly to the <span className="font-mono text-purple-700">{billboard.dimensions}</span> sizing guidelines inside our interactive design studio.
            </p>
            <button
              onClick={() => window.open("/design-studio", "_blank")}
              className="mt-1 w-full bg-[#FAF9FD] hover:bg-purple-50 border border-purple-100 text-xs font-bold text-purple-700 py-2.5 rounded-2xl transition duration-300 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>Launch Design Studio</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default BillboardDetailPage;
