import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Sparkles, 
  MapPin, 
  CalendarRange, 
  ShieldCheck, 
  TrendingUp, 
  Star, 
  Check, 
  Mail, 
  Phone, 
  MessageSquare,
  ChevronDown,
  Map,
  Play,
  Monitor,
  Sliders,
  Layers,
  BarChart2,
  RefreshCw
} from "lucide-react";

export const Landing: React.FC = () => {
  // FAQ accordion state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  
  // Interactive Campaign Showcase State
  const [activeSlot, setActiveSlot] = useState<string>("times-square");
  const [targetImpressions, setTargetImpressions] = useState<number>(120000);
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "How does the geospatial search functionality operate?",
      a: "Our geospatial system queries billboard listings using radial distance calculation from any coordinate pin. You can overlay daily traffic count estimates, target demographics, and nearby points of interest to locate optimal billboard placement."
    },
    {
      q: "Can I design my ad creative directly inside the platform?",
      a: "Yes! Our AI-powered Design Studio allows you to create high-resolution layouts conforming to precise billboard dimensions using Canvas layers, shapes, custom text, and brand templates. You can preview mockups inside weather-simulated overlays."
    },
    {
      q: "What booking models and pricing options are supported?",
      a: "We support flexible reservation schedules from single-day takeovers to multi-month programmatic campaigns. Pricing is dynamic, scaling based on historical impressions, seasonal demand, and booking duration."
    },
    {
      q: "Is compliance, GDPR, and transaction auditing secure?",
      a: "Absolutely. All platform user interactions, booking files, and contract sign-offs are tracked in secure GDPR-compliant audit logs. Multi-Factor Authentication (MFA) and data export pipelines ensure peak security control."
    }
  ];

  return (
    <div className="flex flex-col gap-28 py-8 md:py-16 scroll-smooth relative overflow-hidden">
      
      {/* Background glowing decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-200/30 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>
      <div className="absolute top-[40%] left-[-200px] w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-[140px] -z-10 animate-pulse-slow" style={{ animationDelay: "2s" }}></div>
      <div className="absolute bottom-10 right-[-100px] w-[500px] h-[500px] bg-purple-100/40 rounded-full blur-[120px] -z-10"></div>

      {/* 1. HERO SECTION (id="home") */}
      <section id="home" className="container mx-auto px-4 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200/80 bg-purple-50/60 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-purple-700 w-fit animate-fade-in shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-purple-600 animate-pulse" />
              <span>Next-Gen Programmatic OOH Marketplace</span>
            </div>
            
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-900 leading-[1.1] animate-fade-in">
              Redefining Billboard <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-650">Advertising</span> Campaigns
            </h1>
            
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              Discover, schedule, negotiate, and audit premium physical & digital out-of-home inventory. Powered by an AI Design Studio, automated contract pipelines, and real-time campaign statistics.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <Link
                href="/auth?tab=register"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 text-sm font-bold text-white hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-purple-605/25 group"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/billboards"
                className="rounded-xl border border-purple-200 bg-white/70 backdrop-blur-md px-6 py-4 text-sm font-bold text-slate-700 hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm"
              >
                <Map className="w-4 h-4 text-purple-600" />
                Explore Interactive Map
              </Link>
            </div>
            
            {/* Quick trust metrics */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-6 border-t border-purple-100/80 mt-4">
              <div>
                <p className="text-2xl font-black text-slate-900">10k+</p>
                <p className="text-[11px] text-slate-500 font-semibold tracking-wide uppercase">OOH Screens</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">99.8%</p>
                <p className="text-[11px] text-slate-500 font-semibold tracking-wide uppercase">SLA Audited</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">2.5s</p>
                <p className="text-[11px] text-slate-500 font-semibold tracking-wide uppercase">AI Preview</p>
              </div>
            </div>
          </div>

          {/* Right Image/Glassmorphism Column */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            {/* Ambient colored glow back of image */}
            <div className="absolute w-72 h-72 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-[80px] -z-10 opacity-30 animate-pulse-slow"></div>
            
            {/* Outer Frosted Glass container */}
            <div className="relative p-4 bg-white/30 backdrop-blur-md border border-white/60 rounded-[32px] shadow-2xl w-full max-w-[420px] overflow-visible">
              
              {/* Telemetry Badge Top Right */}
              <div className="absolute -top-4 -right-4 bg-purple-900/90 backdrop-blur-md text-white border border-purple-500/30 rounded-full px-4 py-2 shadow-lg flex items-center gap-2 text-xs font-semibold z-20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Live Feed Active</span>
              </div>

              {/* Core Image Showcase */}
              <div className="relative overflow-hidden rounded-2xl shadow-inner border border-purple-100/50 aspect-square w-full">
                <img 
                  src="/billboard_hero.png" 
                  alt="Modern Digital Billboard" 
                  className="object-cover w-full h-full transform hover:scale-105 transition-transform duration-700"
                />
                
                {/* Visual Glass Overlay Card at bottom of image */}
                <div className="absolute bottom-3 left-3 right-3 p-4 bg-black/40 backdrop-blur-md border border-white/20 rounded-xl text-white text-left">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300">Target Venue</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">145k Imp/day</span>
                  </div>
                  <h4 className="text-sm font-bold truncate">AETHERIAL // CREATIVE INNOVATION</h4>
                  <p className="text-[10px] text-slate-300 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-purple-300" /> Shibuya Crossing, Tokyo
                  </p>
                </div>
              </div>

              {/* Floating Glass Data Module (Bottom Left) */}
              <div className="absolute -bottom-6 -left-2 sm:-left-6 p-4 bg-white/70 backdrop-blur-lg border border-white/80 rounded-2xl shadow-xl flex items-center gap-3.5 z-20 animate-fade-in max-w-[200px]">
                <div className="h-10 w-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-600/20 shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Impressions</p>
                  <p className="text-sm font-extrabold text-slate-900">+48.2% MoM</p>
                </div>
              </div>

              {/* Mini Glass Stats Module (Top Left) */}
              <div className="absolute top-12 -left-8 p-3 bg-white/80 backdrop-blur-md border border-white/80 rounded-xl shadow-lg text-left hidden sm:block z-20 animate-fade-in max-w-[150px]">
                <div className="flex items-center gap-1.5 text-purple-700 mb-0.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Verified</span>
                </div>
                <p className="text-[11px] text-slate-650 font-bold leading-tight">100% Guaranteed Placements</p>
              </div>

            </div>
          </div>

        </div>
      </section>
      
      {/* 2. SOLUTIONS SECTION (id="solutions") */}
      <section id="solutions" className="container mx-auto px-4 border-t border-purple-100/50 pt-20">
        <div className="text-center max-w-xl mx-auto flex flex-col gap-3 mb-16">
          <span className="text-xs font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full w-fit mx-auto border border-purple-100">Our Services</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-905 tracking-tight">Full-Stack Campaign Ecosystem</h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            From discovering prime physical locations to designing and launching digital artwork, we streamline the OOH media pipeline.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          
          {/* Card 1 */}
          <div className="bg-white/40 backdrop-blur-md border border-white/70 rounded-3xl p-6 sm:p-8 flex flex-col gap-5 text-left transition-all shadow-sm hover:shadow-xl hover:shadow-purple-500/5 hover:border-purple-300/40 hover:-translate-y-1 duration-300 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 border border-purple-100 text-purple-650 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300 shadow-sm">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Geospatial Explorer</h3>
            <p className="text-sm text-slate-650 leading-relaxed">
              Locate high-traffic billboard locations using interactive radial search and coordinate filters. View traffic estimates, demographics, and local weather forecasts.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white/40 backdrop-blur-md border border-white/70 rounded-3xl p-6 sm:p-8 flex flex-col gap-5 text-left transition-all shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-300/40 hover:-translate-y-1 duration-300 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-650 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-sm">
              <CalendarRange className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Dynamic Reservation</h3>
            <p className="text-sm text-slate-650 leading-relaxed">
              Avoid double bookings with transactional schedule locking. Build customized calendar schedules with automated volume discounts and dynamic bidding tools.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white/40 backdrop-blur-md border border-white/70 rounded-3xl p-6 sm:p-8 flex flex-col gap-5 text-left transition-all shadow-sm hover:shadow-xl hover:shadow-purple-500/5 hover:border-purple-300/40 hover:-translate-y-1 duration-300 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 border border-purple-100 text-purple-650 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">AI Design Studio</h3>
            <p className="text-sm text-slate-650 leading-relaxed">
              Create and configure custom billboard designs. Scale and render artwork layouts to exact physical specs and review them inside simulated 3D model environments.
            </p>
          </div>

        </div>
      </section>

      {/* 3. PROGRAMMATIC DOOH SHOWCASE SECTION [NEW] */}
      <section id="dooh-showcase" className="container mx-auto px-4 border-t border-purple-100/50 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left: The Bus Stop Image with Glass Effect */}
          <div className="lg:col-span-6 relative flex justify-center items-center order-2 lg:order-1">
            <div className="absolute w-80 h-80 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-[90px] -z-10 opacity-20"></div>
            
            {/* Frosted Glass Frame for secondary image */}
            <div className="relative p-3.5 bg-white/20 backdrop-blur-md border border-white/50 rounded-[30px] shadow-2xl w-full max-w-[460px]">
              
              {/* Interactive Video/Running Status Glass Tag */}
              <div className="absolute top-5 left-5 bg-black/60 backdrop-blur-md text-white border border-white/10 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 z-10">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                <span>Programmatic Sync</span>
              </div>

              {/* Main Bus Stop Image */}
              <div className="relative overflow-hidden rounded-2xl aspect-square w-full border border-white/20 shadow-inner">
                <img 
                  src="/bus_stop_billboard.png" 
                  alt="Digital Out-Of-Home Bus Shelter Display" 
                  className="object-cover w-full h-full"
                />
                
                {/* Frosted Overlay Controller Bar */}
                <div className="absolute bottom-4 left-4 right-4 p-4 bg-white/90 backdrop-blur-lg border border-white rounded-xl shadow-lg text-slate-800 text-left">
                  <div className="flex justify-between items-center border-b border-purple-100/70 pb-2 mb-2">
                    <div>
                      <h5 className="text-xs font-bold text-slate-905">Velo Nights Campaign</h5>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Device ID: OOH-5847-SH</span>
                    </div>
                    <span className="text-xs font-black text-purple-700">ACTIVE</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                    <div className="bg-purple-50/50 p-1.5 rounded-lg border border-purple-100">
                      <span className="block text-slate-400 font-bold uppercase text-[8px]">Live Reach</span>
                      <strong className="text-purple-700">4,280 / hr</strong>
                    </div>
                    <div className="bg-purple-50/50 p-1.5 rounded-lg border border-purple-100">
                      <span className="block text-slate-400 font-bold uppercase text-[8px]">Next Update</span>
                      <strong className="text-purple-700">10 mins</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Controller Interface & Descriptions */}
          <div className="lg:col-span-6 flex flex-col gap-6 text-left order-1 lg:order-2">
            <span className="text-xs font-bold text-indigo-650 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full w-fit border border-indigo-100">Real-Time DOOH</span>
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl tracking-tight leading-tight">
              Control Digital Billboards Programmatically
            </h2>
            <p className="text-sm text-slate-650 leading-relaxed">
              Connect directly to digital screens across highways, bus shelters, and shopping hubs. Adjust scheduling thresholds, toggle artwork creatives instantly, and scale your target reach dynamically through our controller architecture.
            </p>

            {/* Interactive Controller Simulator Card */}
            <div className="bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Simulator Controller</h4>
                </div>
                <span className="text-[10px] font-mono text-purple-650 font-bold bg-purple-50 border border-purple-100 px-2 py-0.5 rounded">
                  SYS_TIME: {currentTime || "14:21:00"}
                </span>
              </div>

              {/* Slider for impressions control */}
              <div className="flex flex-col gap-2 bg-white/70 p-4 rounded-2xl border border-purple-100/50">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-600">Impressions Budget Threshold</span>
                  <span className="font-extrabold text-purple-700">{targetImpressions.toLocaleString()} imp/week</span>
                </div>
                <input 
                  type="range" 
                  min="20000" 
                  max="500000" 
                  step="5000"
                  value={targetImpressions}
                  onChange={(e) => setTargetImpressions(parseInt(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer h-1.5 bg-purple-100 rounded-lg appearance-none"
                />
                <span className="text-[9px] text-slate-450 italic">Drag to scale your targeted campaign audience budget threshold.</span>
              </div>

              {/* Simulated active nodes */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                {[
                  { name: "Times Square", status: "Active", key: "times-square" },
                  { name: "Shatin Hub", status: "Idle", key: "shatin" },
                  { name: "SOGO Plaza", status: "Active", key: "sogo" }
                ].map((slot) => (
                  <button
                    key={slot.key}
                    onClick={() => setActiveSlot(slot.key)}
                    className={`p-2 sm:p-3 rounded-xl border text-center transition-all ${
                      activeSlot === slot.key 
                        ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-605/20 scale-[1.03]" 
                        : "bg-white/50 text-slate-700 border-purple-100 hover:bg-white/80"
                    }`}
                  >
                    <span className="block text-[11px] font-bold truncate">{slot.name}</span>
                    <span className={`text-[8px] font-bold ${activeSlot === slot.key ? "text-purple-200" : "text-slate-400"}`}>
                      {slot.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. ABOUT SECTION (id="about") */}
      <section id="about" className="container mx-auto px-4 border-t border-purple-100/50 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="flex flex-col gap-6 text-left">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full w-fit border border-purple-100">About Platform</span>
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl tracking-tight leading-tight">
              Connecting Media Owners & Brand Advertisers Globally
            </h2>
            <p className="text-sm text-slate-650 leading-relaxed">
              Billboardify removes middleman fees and fragmented communications by providing a secure, real-time marketplace. We enable companies of all sizes to locate, reserve, and upload creative assets directly to verified local digital screens and static billboards.
            </p>
            <div className="flex flex-col gap-3.5 mt-2">
              {[
                "100% verified location inventory with GIS telemetry and real-time validation.",
                "Automated legal contracts and digital signatures for buying processes.",
                "Encrypted, GDPR-compliant campaign event audit logging."
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs font-semibold text-slate-705">
                  <div className="h-5 w-5 rounded-md bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-605 shrink-0 mt-0.5 shadow-sm">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="leading-tight">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Frame Grid */}
          <div className="relative">
            <div className="absolute w-72 h-72 bg-indigo-300/10 rounded-full blur-[80px] -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="bg-white/40 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/80 shadow-xl flex flex-col gap-6 sm:gap-8">
              <div className="grid grid-cols-2 gap-4 sm:gap-6 text-center">
                
                <div className="bg-purple-50/50 backdrop-blur-sm p-4 sm:p-5 rounded-2xl border border-purple-100/60 flex flex-col gap-1.5 shadow-sm hover:scale-[1.02] transition-transform duration-300">
                  <span className="text-3xl font-black text-purple-700">10K+</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Verified Slots</span>
                </div>
                
                <div className="bg-indigo-50/50 backdrop-blur-sm p-4 sm:p-5 rounded-2xl border border-indigo-100/60 flex flex-col gap-1.5 shadow-sm hover:scale-[1.02] transition-transform duration-300">
                  <span className="text-3xl font-black text-indigo-600">$4.2M</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Campaign Volume</span>
                </div>
                
                <div className="bg-indigo-50/50 backdrop-blur-sm p-4 sm:p-5 rounded-2xl border border-indigo-100/60 flex flex-col gap-1.5 shadow-sm hover:scale-[1.02] transition-transform duration-300">
                  <span className="text-3xl font-black text-indigo-600">99.8%</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">SLA Guarantee</span>
                </div>
                
                <div className="bg-purple-50/50 backdrop-blur-sm p-4 sm:p-5 rounded-2xl border border-purple-100/60 flex flex-col gap-1.5 shadow-sm hover:scale-[1.02] transition-transform duration-300">
                  <span className="text-3xl font-black text-purple-700">2.5s</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">AI Rendering</span>
                </div>

              </div>
              <p className="text-[11px] text-slate-500 text-center italic font-semibold border-t border-purple-150/30 pt-4">
                "Empowering global brands with programmatic Out-Of-Home media campaigns."
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 5. SUCCESS STORIES (id="stories") */}
      <section id="stories" className="container mx-auto px-4 border-t border-purple-100/50 pt-20">
        <div className="text-center max-w-xl mx-auto flex flex-col gap-3 mb-16">
          <span className="text-xs font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full w-fit mx-auto border border-purple-100">Case Studies</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Success Stories</h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Discover how leading advertising agencies leverage Billboardify to scale visual reach.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          
          <div className="bg-white/40 backdrop-blur-md border border-white/70 rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-sm hover:shadow-lg transition-all duration-350">
            <div className="flex flex-col gap-4 text-left">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-xs sm:text-sm text-slate-650 leading-relaxed italic font-medium">
                "We managed to orchestrate a 15-location digital takeover in Manhattan within hours. The coordination was seamless, and real-time verification files saved us weeks of manual auditing."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-purple-100/50">
              <div className="h-9 w-9 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center font-bold text-purple-700 text-xs">
                AM
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-900">Apex Media Agency</h4>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">NYC Campaign Director</p>
              </div>
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-md border border-white/70 rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-sm hover:shadow-lg transition-all duration-350">
            <div className="flex flex-col gap-4 text-left">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-xs sm:text-sm text-slate-650 leading-relaxed italic font-medium">
                "As a billboard owner, filling empty calendar slots was a major hurdle. Billboardify's marketplace automatically routes booking requests and handles the contracts, increasing our yearly revenue by 24%."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-purple-100/50">
              <div className="h-9 w-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-xs">
                BS
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-900">Bob Billboards LLC</h4>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Media Inventory Owner</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 6. PRICING SECTION (id="pricing") */}
      <section id="pricing" className="container mx-auto px-4 border-t border-purple-100/50 pt-20">
        <div className="text-center max-w-xl mx-auto flex flex-col gap-3 mb-16">
          <span className="text-xs font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full w-fit mx-auto border border-purple-100">Simple Plans</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Transparent Campaign Pricing</h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            No hidden listing fees. Pay only when booking verification contracts are generated.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          
          {/* Tier 1 */}
          <div className="bg-white/40 backdrop-blur-md border border-white/70 rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-5 text-left">
              <span className="text-xs font-extrabold text-slate-450 uppercase tracking-wider">Starter</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">$0</span>
                <span className="text-xs text-slate-400 font-bold">/ forever</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Perfect for exploring slots, generating basic designs, and starting simple campaigns.
              </p>
              <div className="h-px bg-purple-100/60 my-1" />
              <ul className="space-y-3.5">
                {["Explore map inventory", "Canvas Editor access", "1 active booking limit"].map((feat, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-xs text-slate-650 font-medium">
                    <Check className="w-4 h-4 text-purple-650 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/auth?tab=register"
              className="w-full text-center bg-white border border-purple-200 hover:bg-purple-50 text-purple-700 font-bold py-3.5 rounded-xl text-xs transition shadow-sm"
            >
              Sign Up Free
            </Link>
          </div>

          {/* Tier 2 (Featured) */}
          <div className="bg-gradient-to-b from-white/90 to-white/50 backdrop-blur-md border-2 border-purple-500 rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-8 shadow-xl relative scale-100 md:scale-[1.03] z-10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-650 text-white text-[9px] font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-md">
              Most Popular
            </div>
            <div className="flex flex-col gap-5 text-left">
              <span className="text-xs font-extrabold text-purple-700 uppercase tracking-wider">Professional</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">$149</span>
                <span className="text-xs text-slate-400 font-bold">/ month</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                For active advertisers requiring priority bookings, bulk telemetry, and team collaboration.
              </p>
              <div className="h-px bg-purple-100/60 my-1" />
              <ul className="space-y-3.5">
                {["Unlimited campaign bookings", "AI Design template prompts", "Real-time impressions analytics", "Shared team workspaces"].map((feat, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-xs text-slate-650 font-medium">
                    <Check className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/auth?tab=register"
              className="w-full text-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold py-3.5 rounded-xl text-xs shadow-md shadow-purple-600/10 transition"
            >
              Unlock Pro Account
            </Link>
          </div>

          {/* Tier 3 */}
          <div className="bg-white/40 backdrop-blur-md border border-white/70 rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-5 text-left">
              <span className="text-xs font-extrabold text-slate-450 uppercase tracking-wider">Enterprise</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">Custom</span>
                <span className="text-xs text-slate-400 font-bold">/ contact sales</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                For major media networks and agencies demanding custom API flows and SLA contracts.
              </p>
              <div className="h-px bg-purple-100/60 my-1" />
              <ul className="space-y-3.5">
                {["API direct hooks", "Custom programmatic scheduling", "Dedicated GIS specialist support", "99.9% GDPR audit SLA"].map((feat, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-xs text-slate-650 font-medium">
                    <Check className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <a
              href="#contact"
              className="w-full text-center bg-white border border-purple-200 hover:bg-purple-50 text-purple-700 font-bold py-3.5 rounded-xl text-xs transition shadow-sm"
            >
              Contact Sales
            </a>
          </div>

        </div>
      </section>

      {/* 7. FAQ SECTION (id="faq") */}
      <section id="faq" className="container mx-auto px-4 border-t border-purple-100/50 pt-20">
        <div className="text-center max-w-xl mx-auto flex flex-col gap-3 mb-16">
          <span className="text-xs font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full w-fit mx-auto border border-purple-100">Questions</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Got queries about campaign launches, specifications, or payments? Find answers here.
          </p>
        </div>

        <div className="max-w-2xl mx-auto w-full flex flex-col gap-4">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div 
                key={index} 
                className="bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl overflow-hidden shadow-sm transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-white/50 transition-colors"
                >
                  <span className="text-sm font-bold text-slate-800 pr-4">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-305 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-purple-100/40 pt-4 bg-white/20">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. CONTACT SECTION (id="contact") */}
      <section id="contact" className="container mx-auto px-4 border-t border-purple-100/50 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          <div className="flex flex-col gap-6 text-left">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full w-fit border border-purple-100">Get in touch</span>
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl tracking-tight leading-tight">
              Ready to Launch Your Next OOH Campaign?
            </h2>
            <p className="text-sm text-slate-650 leading-relaxed">
              Have questions about listing your screens or need help building custom ad slots? Contact our GIS and account management team directly.
            </p>
            
            <div className="flex flex-col gap-5 mt-2">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-650 shadow-sm">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</h4>
                  <span className="text-sm font-semibold text-slate-700">sales@billboardify.com</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-650 shadow-sm">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hotline support</h4>
                  <span className="text-sm font-semibold text-slate-700">+1 (800) 555-0199</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Contact Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              alert("Message sent! Our campaign team will reach out to you within 24 hours.");
              (e.target as HTMLFormElement).reset();
            }}
            className="bg-white/40 backdrop-blur-md border border-white/75 rounded-3xl p-6 md:p-8 flex flex-col gap-5 shadow-xl text-left"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="bg-white/70 border border-purple-105 text-xs sm:text-sm font-semibold text-slate-800 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Business Email</label>
                <input
                  type="email"
                  required
                  placeholder="john@company.com"
                  className="bg-white/70 border border-purple-105 text-xs sm:text-sm font-semibold text-slate-800 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Subject</label>
              <input
                type="text"
                required
                placeholder="Inquiry about Times Square Screen"
                className="bg-white/70 border border-purple-105 text-xs sm:text-sm font-semibold text-slate-800 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Message Description</label>
              <textarea
                required
                rows={3}
                placeholder="Describe your target audience and location preferences..."
                className="bg-white/70 border border-purple-105 text-xs sm:text-sm font-semibold text-slate-800 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-purple-500 resize-none transition-colors"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold py-3.5 rounded-xl text-xs sm:text-sm shadow-md shadow-purple-600/10 transition-all flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Submit Message</span>
            </button>
          </form>
        </div>
      </section>

    </div>
  );
};

export default Landing;
