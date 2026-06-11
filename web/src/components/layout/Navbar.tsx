import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { 
  Presentation, 
  User, 
  LogOut, 
  ChevronDown, 
  Search, 
  Sparkles, 
  Bell, 
  HelpCircle, 
  Menu, 
  X, 
  Briefcase, 
  TrendingUp, 
  MapPin, 
  CreditCard, 
  MessageSquare, 
  Settings,
  LayoutDashboard,
  Users,
  Compass,
  FileText,
  DollarSign
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();

  // Navigation / UI dropdown toggle states
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const resourcesMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (resourcesMenuRef.current && !resourcesMenuRef.current.contains(e.target as Node)) {
        setIsResourcesOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Close dropdowns on path transition
  useEffect(() => {
    setIsResourcesOpen(false);
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await dispatch(logout());
    router.push("/auth");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      alert(`Searching for: ${searchQuery}`);
      setSearchQuery("");
    }
  };

  const handleAiAssistantClick = () => {
    alert("AI Design Assistant: How can I help you design your billboard today?");
  };

  const handleNotificationClick = () => {
    alert("You have 2 new campaign approvals pending review.");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-purple-100 bg-white/85 backdrop-blur-md shadow-sm">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-10">
        <div className="flex h-16 items-center justify-between gap-2 md:gap-4">
          
          {/* LOGO */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="h-8 w-8 overflow-hidden flex items-center justify-center rounded-lg bg-purple-50 border border-purple-100 p-0.5 shrink-0">
                <img 
                  src="/logo.png" 
                  alt="Billboardify Logo Mark" 
                  className="h-16 w-auto max-w-none transition-transform group-hover:scale-[1.05]" 
                  style={{
                    clipPath: "inset(4% 35% 42% 35%)",
                    transform: "scale(1.7) translateY(-4px)"
                  }}
                />
              </div>
              <span className="bg-gradient-to-r from-purple-700 via-indigo-650 to-purple-900 bg-clip-text text-sm md:text-base font-extrabold tracking-tight text-transparent">
                Billboardify
              </span>
            </Link>
          </div>

          {/* ==================== 1. PUBLIC WEBSITE NAVBAR (BEFORE LOGIN) ==================== */}
          {!user ? (
            <>
              {/* Center Links */}
              <div className="hidden lg:flex items-center space-x-3 xl:space-x-6 text-[11px] xl:text-xs font-semibold text-slate-600">
                <Link href="/" className="hover:text-purple-700 transition-colors">Home</Link>
                <Link href="/#solutions" className="hover:text-purple-700 transition-colors">Solutions</Link>
                <Link href="/billboards" className="hover:text-purple-700 transition-colors">Billboards</Link>
                <button 
                  onClick={() => window.open("/design-studio", "_blank")}
                  className="hover:text-purple-800 transition-colors flex items-center gap-1 text-purple-600 font-bold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Design Studio</span>
                </button>
                <Link href="/#pricing" className="hover:text-purple-700 transition-colors">Pricing</Link>
                
                {/* Resources Hover Dropdown */}
                <div className="relative" ref={resourcesMenuRef}>
                  <button
                    onClick={() => setIsResourcesOpen(!isResourcesOpen)}
                    className="flex items-center gap-0.5 hover:text-purple-700 transition-colors focus:outline-none"
                  >
                    <span>Resources</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isResourcesOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isResourcesOpen && (
                    <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-80 rounded-2xl bg-white border border-purple-100 p-4 shadow-2xl animate-fade-in grid grid-cols-2 gap-3 z-50">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company</p>
                        <Link href="/#about" className="block text-xs font-semibold text-slate-655 hover:text-purple-700 transition-colors">About Us</Link>
                        <Link href="/#team" className="block text-xs font-semibold text-slate-655 hover:text-purple-700 transition-colors">Our Team</Link>
                        <Link href="/#work" className="block text-xs font-semibold text-slate-655 hover:text-purple-700 transition-colors">Our Work</Link>
                        <Link href="/#careers" className="block text-xs font-semibold text-slate-655 hover:text-purple-700 transition-colors flex items-center gap-1">
                          <span>Careers</span>
                          <span className="text-[8px] bg-purple-50 text-purple-700 px-1 rounded border border-purple-100">Hiring</span>
                        </Link>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Content & Help</p>
                        <Link href="/#stories" className="block text-xs font-semibold text-slate-655 hover:text-purple-700 transition-colors">Success Stories</Link>
                        <Link href="/#blog" className="block text-xs font-semibold text-slate-655 hover:text-purple-700 transition-colors">Blog</Link>
                        <Link href="/#faq" className="block text-xs font-semibold text-slate-655 hover:text-purple-700 transition-colors">FAQ</Link>
                        <Link href="/#help" className="block text-xs font-semibold text-slate-655 hover:text-purple-700 transition-colors">Help Center</Link>
                        <Link href="/#contact" className="block text-xs font-semibold text-slate-655 hover:text-purple-700 transition-colors">Contact Us</Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Public Search Bar */}
              <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative max-w-[160px] xl:max-w-[220px] w-full">
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-purple-100 focus:border-purple-500 text-[11px] px-2.5 py-1.5 pl-7 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
                />
                <Search className="w-3 h-3 text-slate-400 absolute left-2.5" />
              </form>

              {/* Right Public Action CTAs */}
              <div className="hidden lg:flex items-center space-x-2 xl:space-x-3 shrink-0">
                <Link href="/#contact" className="text-[11px] font-semibold text-slate-500 hover:text-purple-700 transition-colors">
                  Contact Sales
                </Link>
                <Link href="/auth" className="text-[11px] font-semibold text-slate-700 hover:text-purple-700 transition-colors bg-purple-50/50 border border-purple-100 px-3 py-1.5 rounded-lg hover:bg-purple-50">
                  Login
                </Link>
                <Link href="/auth?tab=register" className="text-[11px] font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-3 py-1.5 rounded-lg shadow-lg shadow-purple-600/20 transition-all">
                  🚀 Get Started
                </Link>
              </div>
            </>
          ) : (
            
            // ==================== 2. APPLICATION NAVBAR (AFTER LOGIN) ====================
            <>
              {/* App Tab Bar Links */}
              <div className="hidden lg:flex items-center space-x-0.5 xl:space-x-1.5 text-[10px] xl:text-xs font-semibold text-slate-600 shrink-0">
                <Link
                  href="/dashboard"
                  className={`px-2 py-1.5 rounded-lg transition ${
                    pathname === "/dashboard" ? "bg-purple-50 text-purple-700 border border-purple-100" : "hover:bg-purple-50/50 hover:text-purple-700"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/billboards"
                  className={`px-2 py-1.5 rounded-lg transition ${
                    pathname === "/billboards" ? "bg-purple-50 text-purple-700 border border-purple-100" : "hover:bg-purple-50/50 hover:text-purple-700"
                  }`}
                >
                  Discover
                </Link>
                <button
                  onClick={() => window.open("/design-studio", "_blank")}
                  className="px-2 py-1.5 rounded-lg hover:bg-purple-50/50 text-purple-600 hover:text-purple-800 transition flex items-center gap-0.5 font-bold"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Design Studio</span>
                </button>
                <Link
                  href="/dashboard?tab=campaigns"
                  className="px-2 py-1.5 rounded-lg hover:bg-purple-50/50 hover:text-purple-750 transition"
                >
                  Campaigns
                </Link>
                <Link
                  href="/dashboard?tab=analytics"
                  className="px-2 py-1.5 rounded-lg hover:bg-purple-50/50 hover:text-purple-750 transition"
                >
                  Analytics
                </Link>
                <Link
                  href="/dashboard?tab=messages"
                  className="px-2 py-1.5 rounded-lg hover:bg-purple-50/50 hover:text-purple-750 transition"
                >
                  Messages
                </Link>
                <Link
                  href="/dashboard?tab=billing"
                  className="px-2 py-1.5 rounded-lg hover:bg-purple-50/50 hover:text-purple-750 transition"
                >
                  Billing
                </Link>
                <Link
                  href="/dashboard?tab=support"
                  className="px-2 py-1.5 rounded-lg hover:bg-purple-50/50 hover:text-purple-750 transition"
                >
                  Support
                </Link>
                <Link
                  href="/dashboard?tab=settings"
                  className="px-2 py-1.5 rounded-lg hover:bg-purple-50/50 hover:text-purple-750 transition"
                >
                  Settings
                </Link>
              </div>

              {/* Global Application Search Bar */}
              <form onSubmit={handleSearchSubmit} className="hidden xl:flex items-center relative max-w-[140px] xl:max-w-[200px] w-full shrink">
                <input
                  type="text"
                  placeholder="🔍 Search anything..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-purple-100 focus:border-purple-500 text-[11px] px-2.5 py-1.5 rounded-xl text-slate-850 placeholder-slate-400 focus:outline-none transition-all"
                />
              </form>

              {/* App Right Action Panel */}
              <div className="hidden lg:flex items-center space-x-2 xl:space-x-3.5 shrink-0">
                <button
                  onClick={handleAiAssistantClick}
                  className="flex items-center gap-1 text-[9px] xl:text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-1 rounded-full hover:bg-purple-100 transition"
                  title="AI Creative Assistant"
                >
                  <Sparkles className="w-3 h-3" />
                  <span className="hidden xl:inline">AI Assistant</span>
                </button>

                <button
                  onClick={handleNotificationClick}
                  className="p-1.5 text-slate-400 hover:text-purple-700 rounded-lg hover:bg-purple-50 relative transition"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full animate-ping" />
                </button>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-1.5 focus:outline-none group"
                  >
                    <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-650 flex items-center justify-center font-bold text-white text-xs ring-2 ring-purple-50 group-hover:scale-105 transition-all">
                      {user.firstName[0].toUpperCase()}
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-purple-700 transition-colors" />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-3 w-52 rounded-2xl bg-white border border-purple-100 p-2 shadow-2xl animate-fade-in z-50">
                      <div className="px-3 py-2 border-b border-purple-50">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.firstName} {user.lastName}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                      </div>
                      
                      <div className="py-1">
                        <Link href="/dashboard?tab=profile" className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-655 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors">
                          <User className="w-3.5 h-3.5" />
                          <span>My Profile</span>
                        </Link>
                        <button 
                          onClick={() => router.push("/dashboard?tab=command-center")}
                          className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-655 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors"
                        >
                          <Presentation className="w-3.5 h-3.5" />
                          <span>My Designs</span>
                        </button>
                        <Link href="/dashboard?tab=campaigns" className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-655 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors">
                          <Compass className="w-3.5 h-3.5" />
                          <span>My Campaigns</span>
                        </Link>
                        <Link href="/dashboard?tab=billing" className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-655 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Billing</span>
                        </Link>
                        <Link href="/dashboard?tab=settings" className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-655 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors">
                          <Settings className="w-3.5 h-3.5" />
                          <span>Settings</span>
                        </Link>
                        <Link href="/dashboard?tab=support" className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-655 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors">
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Help Center</span>
                        </Link>
                      </div>

                      <div className="border-t border-purple-50 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Hamburger Mobile Toggle Button */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-500 hover:text-purple-700 focus:outline-none p-1"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* MOBILE NAV MENU DRAWER */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-purple-100 bg-white px-4 py-4 space-y-4 animate-fade-in max-h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain">
          
          {/* Mobile Public Navigation */}
          {!user ? (
            <div className="flex flex-col space-y-2.5">
              <Link href="/" className="text-sm font-semibold text-slate-655 px-2 py-1.5 rounded hover:bg-purple-50">Home</Link>
              <Link href="/#solutions" className="text-sm font-semibold text-slate-655 px-2 py-1.5 rounded hover:bg-purple-50">Solutions</Link>
              <Link href="/billboards" className="text-sm font-semibold text-slate-655 px-2 py-1.5 rounded hover:bg-purple-50">Billboards</Link>
              <button 
                onClick={() => window.open("/design-studio", "_blank")}
                className="text-left text-sm font-semibold text-purple-700 px-2 py-1.5 rounded hover:bg-purple-50 flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Design Studio</span>
              </button>
              <Link href="/#pricing" className="text-sm font-semibold text-slate-655 px-2 py-1.5 rounded hover:bg-purple-50">Pricing</Link>
              <Link href="/auth" className="text-sm font-semibold text-slate-655 px-2 py-1.5 rounded hover:bg-purple-50">Login</Link>
              <Link href="/auth?tab=register" className="text-sm font-bold text-white bg-purple-650 px-3 py-2 rounded-lg text-center shadow-lg">
                🚀 Get Started
              </Link>
            </div>
          ) : (
            
            // Mobile App Navigation
            <div className="flex flex-col space-y-2">
              <Link href="/dashboard" className="text-sm font-semibold text-slate-655 px-2 py-1.5 rounded hover:bg-purple-50">Dashboard</Link>
              <Link href="/billboards" className="text-sm font-semibold text-slate-655 px-2 py-1.5 rounded hover:bg-purple-50">Discover</Link>
              <button 
                onClick={() => window.open("/design-studio", "_blank")}
                className="text-left text-sm font-semibold text-purple-700 px-2 py-1.5 rounded hover:bg-purple-50 flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Design Studio</span>
              </button>
              <Link href="/dashboard?tab=campaigns" className="text-sm font-semibold text-slate-655 px-2 py-1.5 rounded hover:bg-purple-50">Campaigns</Link>
              <Link href="/dashboard?tab=analytics" className="text-sm font-semibold text-slate-655 px-2 py-1.5 rounded hover:bg-purple-50">Analytics</Link>
              <Link href="/dashboard?tab=messages" className="text-sm font-semibold text-slate-655 px-2 py-1.5 rounded hover:bg-purple-50">Messages</Link>
              <Link href="/dashboard?tab=billing" className="text-sm font-semibold text-slate-655 px-2 py-1.5 rounded hover:bg-purple-50">Billing</Link>
              <Link href="/dashboard?tab=settings" className="text-sm font-semibold text-slate-655 px-2 py-1.5 rounded hover:bg-purple-50">Settings</Link>
              
              <div className="border-t border-purple-50 pt-3 flex flex-col space-y-2">
                <div className="flex items-center gap-3 px-2">
                  <div className="h-9 w-9 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white text-xs">
                    {user.firstName[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{user.firstName} {user.lastName}</p>
                    <p className="text-[10px] text-slate-400">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-left text-sm font-bold text-rose-500 px-2 py-1.5 rounded hover:bg-purple-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </nav>
  );
};
export default Navbar;
