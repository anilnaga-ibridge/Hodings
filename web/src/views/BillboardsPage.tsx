import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  MapPin, 
  Layers, 
  DollarSign, 
  SlidersHorizontal, 
  Maximize2, 
  Compass, 
  Star, 
  CalendarRange, 
  Sparkles,
  ArrowRight,
  Map,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  Image as ImageIcon
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
  rating?: number;
  reviewCount?: number;
  views?: number;
  imageUrl?: string;
}

const BILLBOARD_IMAGES: { [key: string]: string } = {
  bill_001: "https://images.unsplash.com/photo-1542241647-9cbb2225278b?q=80&w=800",
  bill_002: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=800",
  bill_003: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800",
  bill_004: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800",
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1542241647-9cbb2225278b?q=80&w=800";

const VALID_COUPONS: { [key: string]: { discount: number; type: "PERCENT" | "FLAT"; minSpend: number } } = {
  WELCOME10: { discount: 10, type: "PERCENT", minSpend: 100 },
  SUMMER26: { discount: 200, type: "FLAT", minSpend: 1000 },
  LOYALTY5: { discount: 5, type: "PERCENT", minSpend: 0 },
};

export const BillboardsPage: React.FC = () => {
  const [billboards, setBillboards] = useState<Billboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [selectedCity, setSelectedCity] = useState<string>("ALL");
  const [selectedBillboardId, setSelectedBillboardId] = useState<string | null>(null);
  
  // Track image load failures to gracefully show modern vector fallbacks
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});

  // Active Detail Tab: specs | pricing | calendar
  const [detailTab, setDetailTab] = useState<"specs" | "pricing" | "calendar">("specs");

  // Dynamic Calculator State
  const [calcStartDate, setCalcStartDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [calcEndDate, setCalcEndDate] = useState<string>(
    new Date(Date.now() + 86400000 * 8).toISOString().split("T")[0]
  );
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Radar Animation Sweep State
  const [radarSweeping, setRadarSweeping] = useState(true);

  // Dynamic body background override for seamless premium light mode framing
  useEffect(() => {
    const originalBodyBg = document.body.className;
    document.body.className = "bg-[#F7F6FB] text-slate-800 min-h-screen selection:bg-purple-500 selection:text-white";
    return () => {
      document.body.className = originalBodyBg;
    };
  }, []);

  useEffect(() => {
    const fetchBillboards = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append("keyword", searchQuery);
        if (selectedType !== "ALL") params.append("category", selectedType);
        if (selectedCity !== "ALL") params.append("city", selectedCity);
        params.append("maxPrice", maxPrice.toString());
        params.append("page", "1");
        params.append("limit", "100");

        const res = await api.get(`/billboards/search?${params.toString()}`);
        if (res.data.success) {
          const list = res.data.data.billboards || [];
          const mapped = list.map((b: any) => ({
            ...b,
            imageUrl: BILLBOARD_IMAGES[b.id] || DEFAULT_IMAGE,
            rating: b.rating || 4.8,
            reviewCount: b.reviewCount || Math.floor(Math.random() * 20) + 5,
            views: b.views || Math.floor(Math.random() * 1500) + 100,
          }));
          setBillboards(mapped);
          
          if (mapped.length > 0) {
            setSelectedBillboardId((prev) => {
              if (prev && mapped.find((b: any) => b.id === prev)) return prev;
              return mapped[0].id;
            });
          } else {
            setSelectedBillboardId(null);
          }
        }
      } catch (err) {
        console.error("Error loading billboards", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBillboards();
  }, [searchQuery, selectedType, maxPrice, selectedCity]);

  // Restart radar animation sweep when selection changes
  useEffect(() => {
    setRadarSweeping(true);
    const timer = setTimeout(() => setRadarSweeping(false), 2000);
    return () => clearTimeout(timer);
  }, [selectedBillboardId]);

  const selectedBillboard = billboards.find((b) => b.id === selectedBillboardId);

  const getPricingEstimate = () => {
    if (!selectedBillboard) return null;
    const basePrice = Number(selectedBillboard.pricePerDay || 100);
    
    const start = new Date(calcStartDate);
    const end = new Date(calcEndDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return { error: "Please pick valid start & end dates." };
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    if (totalDays < selectedBillboard.minimumBookingDays) {
      return { error: `Duration is less than the minimum required ${selectedBillboard.minimumBookingDays} days.` };
    }

    let rawAmount = 0;
    let weekendSurcharge = 0;
    let peakSurcharge = 0;

    const currentDay = new Date(start);
    for (let i = 0; i < totalDays; i++) {
      let multiplier = 1;
      const day = currentDay.getDay();
      const month = currentDay.getMonth();

      const isPeak = [10, 11, 0, 1].includes(month);
      if (isPeak) {
        multiplier += 0.5;
        peakSurcharge += basePrice * 0.5;
      }

      const isWeekend = day === 0 || day === 6;
      if (isWeekend) {
        multiplier += 0.2;
        weekendSurcharge += basePrice * 0.2;
      }

      rawAmount += basePrice * multiplier;
      currentDay.setDate(currentDay.getDate() + 1);
    }

    let discountPercent = 0;
    if (totalDays >= 30) discountPercent = 0.10;
    else if (totalDays >= 7) discountPercent = 0.05;

    const durationDiscount = rawAmount * discountPercent;
    let subtotal = rawAmount - durationDiscount;

    let couponDiscount = 0;
    if (appliedCoupon && VALID_COUPONS[appliedCoupon]) {
      const c = VALID_COUPONS[appliedCoupon];
      if (subtotal >= c.minSpend) {
        if (c.type === "PERCENT") {
          couponDiscount = subtotal * (c.discount / 100);
        } else {
          couponDiscount = c.discount;
        }
      }
    }

    const finalAmount = Math.max(0, subtotal - couponDiscount);

    return {
      days: totalDays,
      baseAmount: basePrice * totalDays,
      weekendSurcharge,
      peakSurcharge,
      durationDiscount,
      couponDiscount,
      subtotal,
      finalAmount,
      discountPercent,
    };
  };

  const pricingEstimate = getPricingEstimate();

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);

    const code = couponCode.toUpperCase().trim();
    if (!code) return;

    if (VALID_COUPONS[code]) {
      const c = VALID_COUPONS[code];
      const sub = pricingEstimate && !("error" in pricingEstimate) ? pricingEstimate.subtotal : 0;
      
      if (sub < c.minSpend) {
        setCouponError(`Min spend of $${c.minSpend} required for this coupon.`);
        return;
      }

      setAppliedCoupon(code);
      setCouponSuccess(`Coupon ${code} applied successfully!`);
    } else {
      setCouponError("Invalid coupon code.");
    }
  };

  const handleResetCoupon = () => {
    setAppliedCoupon(null);
    setCouponSuccess(null);
    setCouponError(null);
    setCouponCode("");
  };

  const getTagColor = (type: string) => {
    switch (type) {
      case "DIGITAL": return "border-purple-200 text-purple-700 bg-purple-50";
      case "STATIC": return "border-indigo-200 text-indigo-700 bg-indigo-50";
      case "LED": return "border-violet-200 text-violet-700 bg-violet-50";
      case "INDOOR": return "border-pink-200 text-pink-700 bg-pink-50";
      case "OUTDOOR": return "border-emerald-200 text-emerald-700 bg-emerald-50";
      default: return "border-slate-200 text-slate-655 bg-slate-50";
    }
  };

  return (
    <div className="flex flex-col gap-6 py-2 text-slate-800">
      
      {/* 1. HERO HEADER SECTION - WHITE-MODE PREMIUM */}
      <div className="relative rounded-3xl border border-purple-100/70 bg-white p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-[0_8px_30px_rgb(124,58,237,0.04)] overflow-hidden">
        {/* Abstract Background Design */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-purple-100/20 to-indigo-100/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 w-60 h-60 bg-purple-50/40 rounded-full blur-[60px] pointer-events-none" />
        
        <div className="flex flex-col gap-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-200/80 bg-purple-50 px-3 py-0.5 text-[10px] font-bold text-purple-700 uppercase tracking-widest w-fit">
            <Compass className="h-3 w-3 text-purple-605 animate-spin" /> 
            <span>OOH Directory Radar</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Find Elite Media Placements
          </h1>
          <p className="text-xs md:text-sm text-slate-500 max-w-xl leading-relaxed">
            Locate high-traffic billboard slots, inspect real-time geo-coordinates, simulate campaign pricing structures, and book your outdoor placements instantly.
          </p>
        </div>

        {/* Integrated Search Box */}
        <div className="relative w-full md:max-w-xs relative z-10 shrink-0">
          <div className="relative bg-slate-50 border border-purple-100 hover:border-purple-300 rounded-2xl p-2.5 flex items-center transition shadow-sm">
            <div className="pl-2.5 text-purple-550">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by location or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-0 text-xs px-2.5 py-1 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0"
            />
          </div>
        </div>
      </div>

      {/* 2. THREE COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* COLUMN A: Sidebar Filters (3 Cols) */}
        <aside className="lg:col-span-3 flex flex-col gap-6 bg-white border border-purple-100/80 p-5 rounded-3xl shadow-[0_8px_30px_rgb(124,58,237,0.03)]">
          
          <div className="flex items-center justify-between border-b border-purple-50 pb-3">
            <h3 className="text-[11px] font-black text-purple-900 flex items-center gap-1.5 uppercase tracking-widest">
              <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600" />
              <span>Filters</span>
            </h3>
            <button 
              onClick={() => {
                setSearchQuery("");
                setSelectedType("ALL");
                setMaxPrice(2000);
                setSelectedCity("ALL");
              }}
              className="text-[9px] text-purple-400 hover:text-purple-750 font-bold transition uppercase tracking-wider"
            >
              Reset All
            </button>
          </div>

          {/* Filter by Category */}
          <div className="flex flex-col gap-2.5">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
            <div className="grid grid-cols-2 gap-1.5">
              {["ALL", "DIGITAL", "STATIC", "LED", "INDOOR", "OUTDOOR"].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`text-center text-[10px] font-bold py-2 rounded-xl transition-all border ${
                    selectedType === type
                      ? "bg-purple-600 text-white border-purple-650 shadow-md shadow-purple-600/10"
                      : "bg-[#FDFDFE] border-purple-100/80 text-purple-700 hover:bg-purple-50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Filter by Region Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Region</label>
            <div className="relative">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-[#FAF9FD] border border-purple-100/80 rounded-xl text-xs font-bold text-purple-900 px-3 py-3 focus:outline-none focus:border-purple-400 appearance-none cursor-pointer"
              >
                <option value="ALL">All Regions</option>
                <option value="New York">New York</option>
                <option value="West Hollywood">West Hollywood</option>
              </select>
              <div className="absolute right-3.5 top-3.5 text-purple-400 pointer-events-none">
                <MapPin className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Filter by Daily Price Range */}
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-center">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Max Price / Day</label>
              <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">${maxPrice}</span>
            </div>
            <input
              type="range"
              min="100"
              max="2000"
              step="50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              className="w-full accent-purple-600 h-1 bg-purple-100 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-450 font-mono">
              <span>$100</span>
              <span>$2,000</span>
            </div>
          </div>

          {/* Platform Verified Label */}
          <div className="border-t border-purple-50 pt-3 flex items-center gap-3">
            <Award className="w-7 h-7 text-purple-650 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9.5px] font-bold text-purple-900">Billboardify Verified</span>
              <span className="text-[8.5px] text-slate-400">Traffic metrics fully audited</span>
            </div>
          </div>
        </aside>

        {/* COLUMN B: Billboard Listing Cards (5 Cols) */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-slate-500">
              Showing <span className="text-purple-600 font-bold">{billboards.length}</span> Verified Listings
            </span>
            <div className="text-[9px] font-bold text-purple-750 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
              <Clock className="w-3 h-3 text-purple-600 animate-pulse" />
              <span>Inventory Sync Live</span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col gap-4 items-center justify-center py-32 bg-white border border-purple-100/80 rounded-3xl shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              <span className="text-xs text-slate-400 font-bold tracking-wider">Locating Placements...</span>
            </div>
          ) : billboards.length === 0 ? (
            <div className="flex flex-col gap-4 items-center justify-center py-32 bg-white border border-purple-100/80 rounded-3xl text-center px-6 shadow-sm">
              <Compass className="w-10 h-10 text-purple-350 animate-pulse" />
              <h3 className="text-sm font-bold text-purple-950">No Listings Match Filters</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Try expanding your search parameters or price ranges.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {billboards.map((b) => {
                const isSelected = selectedBillboardId === b.id;
                const isImgBroken = imageErrors[b.id];
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBillboardId(b.id)}
                    className={`group rounded-2xl overflow-hidden flex flex-row gap-4 border p-3.5 cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? "border-purple-500 bg-white shadow-[0_10px_30px_rgba(124,58,237,0.06)] border-l-4 border-l-purple-600"
                        : "border-purple-100/80 bg-white hover:border-purple-300 hover:bg-[#FAF9FE]"
                    }`}
                  >
                    {/* Image Thumbnail with design placeholders */}
                    <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden relative bg-gradient-to-br from-purple-100 to-indigo-50 flex items-center justify-center border border-purple-100">
                      {!isImgBroken ? (
                        <img 
                          src={b.imageUrl} 
                          alt={b.name} 
                          onError={() => setImageErrors(prev => ({ ...prev, [b.id]: true }))}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-purple-400 opacity-50" />
                      )}
                      <div className="absolute top-1.5 left-1.5 shadow-sm">
                        <span className={`text-[7.5px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${getTagColor(b.locationType)}`}>
                          {b.locationType}
                        </span>
                      </div>
                    </div>

                    {/* Meta info layout */}
                    <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                      <div>
                        <div className="flex justify-between items-start gap-1.5">
                          <h4 className="text-xs md:text-sm font-bold text-slate-905 truncate group-hover:text-purple-650 transition-colors">
                            {b.name}
                          </h4>
                          <div className="flex items-center gap-0.5 text-amber-500 text-[10px] font-bold shrink-0">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                            <span>{b.rating}</span>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-purple-400 shrink-0" />
                          <span>{b.address}, {b.city}</span>
                        </p>
                        
                        <p className="text-[10.5px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                          {b.description}
                        </p>
                      </div>

                      {/* Specs boundary bar */}
                      <div className="flex justify-between items-center border-t border-purple-50 pt-2.5 mt-2">
                        <div className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Maximize2 className="w-2.5 h-2.5 text-purple-400" />
                          <span>Size:</span>
                          <span className="text-slate-700 font-mono font-bold">{b.dimensions}</span>
                        </div>
                        <div className="text-[11px] font-mono font-bold text-purple-700 bg-purple-50/70 px-2 py-0.5 rounded border border-purple-100">
                          <DollarSign className="w-3 h-3 text-purple-600 inline-block -mt-0.5" />
                          <span>{b.pricePerDay}</span>
                          <span className="text-[8.5px] text-purple-450 font-normal">/day</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* COLUMN C: Geospatial radar & Pricing Estimate Panel (4 Cols) */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Geospatial Map Visualizer (Light Mode Sonar) */}
          <div className="bg-white border border-purple-100 rounded-3xl overflow-hidden flex flex-col h-80 relative shadow-[0_8px_30px_rgb(124,58,237,0.03)]">
            <div className="px-4 py-3 border-b border-purple-50 bg-[#FAF9FD] flex items-center justify-between">
              <span className="text-xs font-black text-purple-900 flex items-center gap-1.5 uppercase tracking-widest">
                <Map className="w-3.5 h-3.5 text-purple-600" />
                <span>Geospatial Radar</span>
              </span>
              <span className="text-[8.5px] font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-100 animate-pulse">
                {selectedBillboard ? `${selectedBillboard.latitude.toFixed(4)}°, ${selectedBillboard.longitude.toFixed(4)}°` : "SCANNING..."}
              </span>
            </div>

            {/* Radar Sweep Background */}
            <div className="flex-1 bg-purple-50/20 relative overflow-hidden flex items-center justify-center select-none">
              
              {/* Sweep Scan line effect */}
              {radarSweeping && (
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-purple-500/10 to-transparent origin-center animate-spin pointer-events-none" style={{ animationDuration: "3s" }} />
              )}
              
              {/* Sonar Concentric Rings */}
              <div className="absolute h-64 w-64 rounded-full border border-purple-200/40 flex items-center justify-center">
                <div className="h-44 w-44 rounded-full border border-purple-200/30 flex items-center justify-center">
                  <div className="h-24 w-24 rounded-full border border-purple-200/20"></div>
                </div>
              </div>

              {/* Grid map pattern */}
              <div className="absolute inset-0 opacity-40 bg-[linear-gradient(to_right,#e9e3f8_1px,transparent_1px),linear-gradient(to_bottom,#e9e3f8_1px,transparent_1px)] bg-[size:15px_15px]"></div>
              
              {/* Hotspot location pins */}
              {billboards.map((b) => {
                const isSelected = selectedBillboardId === b.id;
                
                let position = { top: "50%", left: "50%" };
                if (b.id === "bill_001") position = { top: "35%", left: "40%" };
                else if (b.id === "bill_002") position = { top: "65%", left: "70%" };
                else if (b.id === "bill_003") position = { top: "25%", left: "75%" };
                else if (b.id === "bill_004") position = { top: "75%", left: "30%" };

                return (
                  <div
                    key={b.id}
                    className="absolute cursor-pointer -translate-x-1/2 -translate-y-1/2 group/marker z-10"
                    style={position}
                    onClick={() => setSelectedBillboardId(b.id)}
                  >
                    <div className="relative flex items-center justify-center">
                      <span className={`absolute inline-flex h-8 w-8 rounded-full opacity-60 ${
                        isSelected ? "animate-ping bg-purple-400" : "bg-purple-500/10"
                      }`} />
                      <div className={`h-6.5 w-6.5 rounded-full flex items-center justify-center border shadow-md transition-all duration-300 ${
                        isSelected 
                          ? "bg-purple-650 border-purple-305 text-white scale-125 shadow-lg shadow-purple-500/20" 
                          : "bg-white border-purple-400 text-purple-655 hover:bg-purple-50 hover:scale-110"
                      }`}>
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="absolute bottom-3 left-3 text-[9px] font-mono text-purple-600 font-bold bg-white px-2 py-0.5 rounded border border-purple-100">
                SCALE: 250m
              </div>
            </div>
          </div>

          {/* Details Specifications / Dynamic cost calculator tab panel */}
          {selectedBillboard ? (
            <div className="bg-white border border-purple-100 rounded-3xl p-5 flex flex-col gap-4 shadow-[0_8px_30px_rgb(124,58,237,0.03)]">
              
              {/* Tab Selector Headers */}
              <div className="grid grid-cols-3 gap-1 bg-[#FAF9FD] p-1 rounded-xl border border-purple-105">
                {[
                  { id: "specs", label: "Specs" },
                  { id: "pricing", label: "Estimator" },
                  { id: "calendar", label: "Schedules" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDetailTab(tab.id as any)}
                    className={`text-center py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                      detailTab === tab.id
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-purple-400 hover:text-purple-750"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT: SPECS */}
              {detailTab === "specs" && (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start border-b border-purple-50 pb-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8.5px] font-bold text-purple-600 uppercase tracking-widest">Selected Media Slot</span>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">{selectedBillboard.name}</h4>
                    </div>
                    <Link
                      href={`/billboards/${selectedBillboard.id}`}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 hover:text-white hover:bg-purple-600 transition-all uppercase tracking-wider bg-purple-50 px-2.5 py-1.5 rounded-lg border border-purple-100 shrink-0"
                    >
                      <span>Explore</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-widest">Type Category</span>
                      <span className="font-bold text-slate-700">{selectedBillboard.locationType} Placement</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-widest">Dimensions</span>
                      <span className="font-mono font-bold text-slate-700">{selectedBillboard.dimensions}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-widest">Base Rate</span>
                      <span className="font-mono font-bold text-purple-750">${selectedBillboard.pricePerDay}/day</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-widest">Estimated Reach</span>
                      <span className="font-bold text-slate-755 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                        <span>~{selectedBillboard.views?.toLocaleString() || "4,500"} Views</span>
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#FAF9FD] border border-purple-100/60 p-3 rounded-2xl flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Booking Constraint</span>
                      <span className="text-xs font-bold text-purple-900">{selectedBillboard.minimumBookingDays} days minimum booking</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: ESTIMATOR */}
              {detailTab === "pricing" && (
                <div className="flex flex-col gap-3.5">
                  <span className="text-[8.5px] font-bold text-purple-600 uppercase tracking-widest">Pricing Calculator</span>
                  
                  {/* Date picker inputs */}
                  <div className="grid grid-cols-2 gap-2.5 bg-purple-50/30 p-2.5 rounded-xl border border-purple-105">
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Start Date</label>
                      <input
                        type="date"
                        value={calcStartDate}
                        onChange={(e) => setCalcStartDate(e.target.value)}
                        className="bg-transparent border-0 text-[10px] font-bold text-purple-950 focus:outline-none focus:ring-0 p-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">End Date</label>
                      <input
                        type="date"
                        value={calcEndDate}
                        onChange={(e) => setCalcEndDate(e.target.value)}
                        className="bg-transparent border-0 text-[10px] font-bold text-purple-950 focus:outline-none focus:ring-0 p-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  {pricingEstimate && "error" in pricingEstimate ? (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-2xl flex items-start gap-2 text-red-650 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                      <span>{pricingEstimate.error}</span>
                    </div>
                  ) : pricingEstimate ? (
                    <div className="flex flex-col gap-2">
                      
                      <div className="flex flex-col gap-1.5 text-xs text-slate-500 border-b border-purple-50 pb-2.5">
                        <div className="flex justify-between">
                          <span>Base Cost ({pricingEstimate.days} days)</span>
                          <span className="font-mono text-slate-800 font-bold">${pricingEstimate.baseAmount.toFixed(2)}</span>
                        </div>
                        {pricingEstimate.weekendSurcharge > 0 && (
                          <div className="flex justify-between text-purple-600 font-medium">
                            <span>Weekend Markup (+20%)</span>
                            <span className="font-mono">+${pricingEstimate.weekendSurcharge.toFixed(2)}</span>
                          </div>
                        )}
                        {pricingEstimate.peakSurcharge > 0 && (
                          <div className="flex justify-between text-amber-600 font-medium">
                            <span>Peak Season markup (+50%)</span>
                            <span className="font-mono">+${pricingEstimate.peakSurcharge.toFixed(2)}</span>
                          </div>
                        )}
                        {pricingEstimate.durationDiscount > 0 && (
                          <div className="flex justify-between text-emerald-600 font-semibold">
                            <span>Volume Discount (-{pricingEstimate.discountPercent * 100}%)</span>
                            <span className="font-mono">-${pricingEstimate.durationDiscount.toFixed(2)}</span>
                          </div>
                        )}
                        {pricingEstimate.couponDiscount > 0 && (
                          <div className="flex justify-between text-purple-700 font-semibold">
                            <span>Coupon Discount ({appliedCoupon})</span>
                            <span className="font-mono">-${pricingEstimate.couponDiscount.toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs font-bold text-slate-500 uppercase">Estimated Total</span>
                        <span className="text-lg font-mono font-black text-purple-600">${pricingEstimate.finalAmount.toFixed(2)}</span>
                      </div>

                      {/* Coupon Application widget */}
                      <div className="mt-2 border-t border-purple-50 pt-2.5">
                        {appliedCoupon ? (
                          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-emerald-700 text-xs shadow-sm">
                            <span className="font-bold">Code {appliedCoupon} applied!</span>
                            <button
                              type="button"
                              onClick={handleResetCoupon}
                              className="text-[9px] font-bold text-purple-400 hover:text-purple-750 uppercase"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <form onSubmit={handleApplyCoupon} className="flex gap-2">
                            <input
                              type="text"
                              placeholder="PROMO CODE (e.g. WELCOME10)"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value)}
                              className="flex-1 bg-[#FAF9FD] border border-purple-100 text-[10px] font-bold text-purple-900 placeholder-purple-300 px-3 py-2 rounded-xl focus:outline-none focus:border-purple-500 uppercase"
                            />
                            <button
                              type="submit"
                              className="bg-purple-50 border border-purple-100 hover:bg-purple-100 text-purple-700 font-bold px-3 py-2 rounded-xl text-[10px] transition uppercase tracking-wider"
                            >
                              Apply
                            </button>
                          </form>
                        )}
                        {couponError && (
                          <span className="text-[9px] text-red-500 mt-1 block font-semibold">{couponError}</span>
                        )}
                        {couponSuccess && (
                          <span className="text-[9px] text-emerald-600 mt-1 block font-semibold">{couponSuccess}</span>
                        )}
                      </div>

                    </div>
                  ) : null}

                </div>
              )}

              {/* TAB CONTENT: CALENDAR */}
              {detailTab === "calendar" && (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[8.5px] font-bold text-purple-450 uppercase tracking-widest">Availability Projection</span>
                    <span className="text-[8.5px] text-emerald-705 bg-emerald-55/70 px-2 py-0.5 rounded border border-emerald-200 font-bold uppercase">Active Listing</span>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-1">
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                      const d = new Date();
                      d.setDate(d.getDate() + i + 1);
                      const isWeekend = [0, 6].includes(d.getDay());
                      const dateString = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                      return (
                        <div key={i} className="flex justify-between items-center text-xs bg-[#FAF9FD] p-2 rounded-xl border border-purple-50">
                          <span className="font-bold text-slate-705">{dateString}</span>
                          <span className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            isWeekend 
                              ? "bg-amber-100/60 text-amber-705 border border-amber-200/50"
                              : "bg-emerald-100/60 text-emerald-705 border border-emerald-200/50"
                          }`}>
                            {isWeekend ? "Peak Weekend" : "Available"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action commands */}
              <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-purple-50">
                <Link
                  href={`/billboards/${selectedBillboard.id}`}
                  className="w-full text-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-3 rounded-2xl text-xs shadow-md shadow-purple-600/10 transition-all duration-300 flex items-center justify-center gap-1.5 tracking-wider uppercase"
                >
                  <CalendarRange className="w-3.5 h-3.5" />
                  <span>Configure Campaign</span>
                </Link>
                <button
                  onClick={() => {
                    window.open("/design-studio", "_blank");
                  }}
                  className="w-full bg-slate-50 border border-purple-100/80 hover:bg-purple-50 text-purple-750 font-bold py-2 rounded-2xl text-[10.5px] transition duration-300 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-605" />
                  <span>Launch Creative Canvas</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-purple-105 rounded-3xl p-5 flex items-center justify-center text-center text-xs text-slate-400 min-h-[160px]">
              Select a billboard location from the list to display interactive pricing estimation, availability details, and campaign booking commands.
            </div>
          )}

        </section>

      </div>
    </div>
  );
};

export default BillboardsPage;
