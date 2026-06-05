import React, { useState } from "react";
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
  Map
} from "lucide-react";

export const Landing: React.FC = () => {
  // FAQ accordion state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

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
    <div className="flex flex-col gap-24 py-8 md:py-16 scroll-smooth">
      
      {/* 1. HERO SECTION (id="home") */}
      <section id="home" className="text-center flex flex-col items-center gap-6 max-w-3xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3.5 py-1 text-xs font-semibold text-purple-700">
          <Sparkles className="h-3.5 w-3.5 text-purple-650" />
          Enterprise-Grade Out-Of-Home Marketplace
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-900 leading-tight">
          Redefining Billboard Advertising Campaigns
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          Discover, schedule, negotiate, and audit physical & digital out-of-home inventory. 
          Powered by an AI Design Studio, automated contract pipelines, and real-time campaign statistics.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
          <Link
            href="/auth?tab=register"
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-purple-700 transition-all shadow-lg shadow-purple-650/20 group"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/billboards"
            className="rounded-lg border border-purple-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-705 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <Map className="w-4 h-4 text-purple-600" />
            Explore Interactive Map
          </Link>
        </div>
      </section>
      
      {/* 2. SOLUTIONS SECTION (id="solutions") */}
      <section id="solutions" className="flex flex-col gap-12 border-t border-purple-100 pt-16">
        <div className="text-center max-w-xl mx-auto flex flex-col gap-3">
          <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">Our Solutions</span>
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900">Full-Stack Campaign Ecosystem</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            From discovering prime locations to pushing creatives live, we streamline the entire OOH transaction pipeline.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Card 1 */}
          <div className="bg-white border border-purple-100 rounded-2xl p-6 flex flex-col gap-4 text-left transition-all shadow-sm hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Geospatial Explorer</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Locate high-traffic billboards using radial search and coordinate filters. View traffic estimates and visual media overlays.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-purple-100 rounded-2xl p-6 flex flex-col gap-4 text-left transition-all shadow-sm hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-650">
              <CalendarRange className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Dynamic Reservation</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Avoid double bookings with transactional locks. Build multi-location calendar schedules with automated dynamic pricing models.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-purple-100 rounded-2xl p-6 flex flex-col gap-4 text-left transition-all shadow-sm hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 border border-purple-100 text-purple-650">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">AI Design Studio</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Generate custom creative templates with AI. Resize artwork to exact canvas specifications and preview live mockups.
            </p>
          </div>
        </div>
      </section>

      {/* 3. ABOUT SECTION (id="about") */}
      <section id="about" className="flex flex-col gap-12 border-t border-purple-100 pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">About Billboardify</span>
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Connecting Media Owners & Brand Advertisers Globally
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Billboardify removes middleman fees and fragmented communication by providing a secure, real-time marketplace. We enable companies of all sizes to locate, reserve, and upload creative assets directly to verified local digital screens and static billboards.
            </p>
            <div className="flex flex-col gap-3">
              {[
                "100% verified location inventory with GIS telemetry.",
                "Automated legal contract and digital signature generation.",
                "Encrypted, GDPR-compliant campaign audit logs."
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                  <div className="h-5 w-5 rounded bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats frame & Team representation */}
          <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-sm flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-6 text-center">
              <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 flex flex-col gap-1">
                <span className="text-2xl font-black text-purple-700">10K+</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Verified Slots</span>
              </div>
              <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 flex flex-col gap-1">
                <span className="text-2xl font-black text-purple-700">$4.2M</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Campaign Volume</span>
              </div>
              <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 flex flex-col gap-1">
                <span className="text-2xl font-black text-purple-700">99.8%</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">SLA Guarantee</span>
              </div>
              <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 flex flex-col gap-1">
                <span className="text-2xl font-black text-purple-700">2.5s</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">AI Mockups</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 text-center italic">
              Empowering brands with programmatic Out-Of-Home media campaigns.
            </p>
          </div>
        </div>
      </section>

      {/* 4. SUCCESS STORIES (id="stories") */}
      <section id="stories" className="flex flex-col gap-12 border-t border-purple-100 pt-16">
        <div className="text-center max-w-xl mx-auto flex flex-col gap-3">
          <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">Case Studies</span>
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900">Success Stories</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Discover how leading advertising agencies leverage Billboardify to scale visual reach.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="bg-white border border-purple-100 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "We managed to orchestrate a 15-location digital takeover in Manhattan within hours. The coordination was seamless, and real-time verification files saved us weeks of manual auditing."
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-purple-50">
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-700 text-xs">
                AM
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Apex Media Agency</h4>
                <p className="text-[10px] text-slate-400">NYC Campaign Director</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-purple-100 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "As a billboard owner, filling empty calendar slots was a major hurdle. Billboardify's marketplace automatically routes booking requests and handles the contracts, increasing our yearly revenue by 24%."
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-purple-50">
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xs">
                BS
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Bob Billboards LLC</h4>
                <p className="text-[10px] text-slate-400">Media Inventory Owner</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRICING SECTION (id="pricing") */}
      <section id="pricing" className="flex flex-col gap-12 border-t border-purple-100 pt-16">
        <div className="text-center max-w-xl mx-auto flex flex-col gap-3">
          <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">Simple Plans</span>
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900">Transparent Campaign Pricing</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            No listing fees. Pay only when booking verification contracts are generated.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Tier 1 */}
          <div className="bg-white border border-purple-100 rounded-2xl p-6 flex flex-col justify-between gap-6 shadow-sm">
            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Starter</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900">$0</span>
                <span className="text-xs text-slate-400 font-medium">/ forever</span>
              </div>
              <p className="text-xs text-slate-550 leading-relaxed">
                Perfect for exploring slots, generating basic designs, and starting simple campaigns.
              </p>
              <div className="h-px bg-purple-50 my-2" />
              <ul className="space-y-3">
                {["Explore map inventory", "Canvas Editor access", "1 active booking limit"].map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                    <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/auth?tab=register"
              className="w-full text-center bg-purple-50 border border-purple-200 hover:bg-purple-100/60 text-purple-700 font-bold py-2.5 rounded-xl text-xs transition"
            >
              Sign Up Free
            </Link>
          </div>

          {/* Tier 2 (Featured) */}
          <div className="bg-white border-2 border-purple-500 rounded-2xl p-6 flex flex-col justify-between gap-6 shadow-lg relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Professional</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900">$149</span>
                <span className="text-xs text-slate-400 font-medium">/ month</span>
              </div>
              <p className="text-xs text-slate-550 leading-relaxed">
                For active advertisers requiring priority bookings, bulk analytics, and collaboration.
              </p>
              <div className="h-px bg-purple-50 my-2" />
              <ul className="space-y-3">
                {["Unlimited campaign bookings", "AI Design template prompts", "Real-time impressions analytics", "Shared team workspaces"].map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                    <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/auth?tab=register"
              className="w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md shadow-purple-600/10 transition-all"
            >
              Unlock Pro Account
            </Link>
          </div>

          {/* Tier 3 */}
          <div className="bg-white border border-purple-100 rounded-2xl p-6 flex flex-col justify-between gap-6 shadow-sm">
            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enterprise</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900">Custom</span>
                <span className="text-xs text-slate-400 font-medium">/ contact sales</span>
              </div>
              <p className="text-xs text-slate-550 leading-relaxed">
                For major media networks and agencies demanding custom API flows and SLA contracts.
              </p>
              <div className="h-px bg-purple-50 my-2" />
              <ul className="space-y-3">
                {["API direct hooks", "Custom programmatic scheduling", "Dedicated GIS specialist support", "99.9% GDPR audit SLA"].map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                    <Check className="w-3.5 h-3.5 text-purple-650 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <a
              href="#contact"
              className="w-full text-center bg-purple-50 border border-purple-200 hover:bg-purple-100/60 text-purple-700 font-bold py-2.5 rounded-xl text-xs transition"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION (id="faq") */}
      <section id="faq" className="flex flex-col gap-12 border-t border-purple-100 pt-16">
        <div className="text-center max-w-xl mx-auto flex flex-col gap-3">
          <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">Questions</span>
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900">Frequently Asked Questions</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Got queries about campaign launches, specifications, or payments? Find answers here.
          </p>
        </div>

        <div className="max-w-2xl mx-auto w-full flex flex-col gap-4">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div 
                key={index} 
                className="bg-white border border-purple-100 rounded-xl overflow-hidden shadow-sm transition-all"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-5 py-4 text-left flex justify-between items-center hover:bg-purple-50/20 transition-colors"
                >
                  <span className="text-xs font-bold text-slate-800">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-purple-50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. CONTACT SECTION (id="contact") */}
      <section id="contact" className="flex flex-col gap-12 border-t border-purple-100 pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="flex flex-col gap-6">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">Get in touch</span>
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Ready to Launch Your Next OOH Campaign?
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Have questions about listing your screens or need help building custom ad slots? Contact our GIS and account management team directly.
            </p>
            
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</h4>
                  <span className="text-xs font-semibold text-slate-700">sales@billboardify.com</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hotline support</h4>
                  <span className="text-xs font-semibold text-slate-700">+1 (800) 555-0199</span>
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
            className="bg-white border border-purple-100 rounded-2xl p-6 flex flex-col gap-4 shadow-sm"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="bg-slate-50 border border-purple-100 text-xs font-semibold text-slate-800 px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Business Email</label>
                <input
                  type="email"
                  required
                  placeholder="john@company.com"
                  className="bg-slate-50 border border-purple-100 text-xs font-semibold text-slate-800 px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Subject</label>
              <input
                type="text"
                required
                placeholder="Inquiry about Times Square Screen"
                className="bg-slate-50 border border-purple-100 text-xs font-semibold text-slate-800 px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Message Description</label>
              <textarea
                required
                rows={3}
                placeholder="Describe your target audience and location preferences..."
                className="bg-slate-50 border border-purple-100 text-xs font-semibold text-slate-800 px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500 resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md shadow-purple-600/10 transition-all flex items-center justify-center gap-1.5"
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
