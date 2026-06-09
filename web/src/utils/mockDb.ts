import { UserRole } from "@prisma/client";
import { hashPassword } from "./crypto";

export interface MockUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  mfaEnabled: boolean;
  mfaSecret?: string;
  isEmailVerified: boolean;
  isPhoneVerified?: boolean;
  failedLoginAttempts?: number;
  lockoutUntil?: string | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: string | null;
  emailVerificationCode?: string | null;
  phoneVerificationCode?: string | null;
  createdAt: string;
}

export interface MockProfile {
  id: string;
  userId: string;
  businessName?: string | null;
  businessTaxId?: string | null;
  address?: string | null;
  billingDetails?: any;
  logoUrl?: string | null;
  notificationPreferences?: any;
  privacySettings?: any;
}

// In-memory data store
export const mockUsers: MockUser[] = [];
export const mockProfiles: MockProfile[] = [];

// Dynamic initialization of test data
let isInitialized = false;

export async function initializeMockDb() {
  if (mockDesigns.length > 0) return;

  const defaultPassword = "password123";
  const defaultHash = await hashPassword(defaultPassword);

  // 1. Setup default Customer account
  const customerId = "cust_001";
  mockUsers.push({
    id: customerId,
    email: "customer@billboardify.com",
    passwordHash: defaultHash,
    firstName: "Alice",
    lastName: "Customer",
    phone: "555-0100",
    role: "CUSTOMER",
    mfaEnabled: false,
    isEmailVerified: true,
    createdAt: new Date().toISOString(),
  });

  mockProfiles.push({
    id: "prof_001",
    userId: customerId,
    businessName: "Alice Advertisers Inc.",
    businessTaxId: "VAT-112233",
    address: "100 Broadway, New York, NY",
    notificationPreferences: { email: true, sms: false, push: true, whatsapp: false },
    privacySettings: { shareAnalytics: true },
  });

  // 2. Setup default Media Owner account
  const ownerId = "own_001";
  mockUsers.push({
    id: ownerId,
    email: "owner@billboardify.com",
    passwordHash: defaultHash,
    firstName: "Bob",
    lastName: "Owner",
    phone: "555-0200",
    role: "OWNER",
    mfaEnabled: false,
    isEmailVerified: true,
    createdAt: new Date().toISOString(),
  });

  mockProfiles.push({
    id: "prof_002",
    userId: ownerId,
    businessName: "Bob Billboards LLC",
    businessTaxId: "VAT-445566",
    address: "200 Fifth Ave, New York, NY",
    notificationPreferences: { email: true, sms: true, push: true, whatsapp: true },
    privacySettings: { shareAnalytics: true },
  });

  // 3. Seed Brand Studio Workspace and templates
  const workspaceId = "wsp_001";
  mockWorkspaces.push({
    id: workspaceId,
    name: "Alice's Creative Studio",
    logoUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  mockTeamMembers.push({
    id: "mem_001",
    workspaceId,
    userId: customerId,
    role: "OWNER",
    createdAt: new Date().toISOString(),
  });

  mockFolders.push({
    id: "fold_001",
    name: "Logos & Graphics",
    workspaceId,
    parentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, {
    id: "fold_002",
    name: "Billboard Guidelines",
    workspaceId,
    parentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Seed default template categories
  const catBillboard = "cat_billboard";
  const catBanner = "cat_banner";
  const catPoster = "cat_poster";
  
  mockTemplateCategories.push({
    id: catBillboard,
    name: "Billboard",
    slug: "billboard",
    createdAt: new Date().toISOString(),
  }, {
    id: catBanner,
    name: "Banner",
    slug: "banner",
    createdAt: new Date().toISOString(),
  }, {
    id: catPoster,
    name: "Poster",
    slug: "poster",
    createdAt: new Date().toISOString(),
  });

  // Seed mock designs and templates
  mockDesigns.push({
    id: "design_001",
    name: "Summer Campaign Billboard",
    workspaceId,
    createdById: customerId,
    width: 1920,
    height: 1080,
    canvasJson: JSON.stringify({
      version: "5.3.0",
      objects: [
        {
          type: "rect",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          fill: "#1e1b4b",
          selectable: false,
        },
        {
          type: "i-text",
          left: 100,
          top: 150,
          width: 1720,
          height: 120,
          text: "SUMMER SALE!",
          fontSize: 96,
          fill: "#ffffff",
          fontFamily: "Outfit",
          fontWeight: "bold",
        },
        {
          type: "i-text",
          left: 100,
          top: 300,
          width: 1720,
          height: 80,
          text: "Get up to 50% off on all items this month.",
          fontSize: 48,
          fill: "#06B6D4",
          fontFamily: "Inter",
        }
      ]
    }),
    status: "DRAFT",
    isTemplate: false,
    categoryId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Seed standard billboard template
  mockDesigns.push({
    id: "template_001",
    name: "Modern Billboard Ad Template",
    workspaceId,
    createdById: customerId,
    width: 1920,
    height: 1080,
    canvasJson: JSON.stringify({
      version: "5.3.0",
      objects: [
        {
          type: "rect",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          fill: "#0f172a",
          selectable: false,
        },
        {
          type: "i-text",
          left: 150,
          top: 200,
          width: 1620,
          text: "YOUR HEADING HERE",
          fontSize: 80,
          fill: "#ec4899",
          fontFamily: "Outfit",
          fontWeight: "bold",
        }
      ]
    }),
    status: "APPROVED",
    isTemplate: true,
    categoryId: catBillboard,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Seed Tech Startup Marketing Billboard Template
  mockDesigns.push({
    id: "template_002",
    name: "AI & Tech Startup Marketing",
    workspaceId,
    createdById: customerId,
    width: 1920,
    height: 1080,
    canvasJson: JSON.stringify({
      version: "5.3.0",
      objects: [
        {
          type: "rect",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          fill: "#0f0920",
          selectable: false,
        },
        {
          type: "circle",
          left: 1400,
          top: -200,
          radius: 400,
          fill: "#7c3aed",
          selectable: false,
        },
        {
          type: "i-text",
          left: 150,
          top: 220,
          width: 800,
          text: "THE FUTURE OF OOH IS HERE",
          fontSize: 32,
          fill: "#06b6d4",
          fontFamily: "Outfit",
          fontWeight: "bold",
        },
        {
          type: "i-text",
          left: 150,
          top: 300,
          width: 1500,
          text: "SCALE YOUR BRAND\nGLOBALLY",
          fontSize: 110,
          fill: "#ffffff",
          fontFamily: "Outfit",
          fontWeight: "black",
        },
        {
          type: "i-text",
          left: 150,
          top: 580,
          width: 1200,
          text: "Reach millions of commuters daily with programmatically scheduled digital screens.",
          fontSize: 38,
          fill: "#cbd5e1",
          fontFamily: "Inter",
        },
        {
          type: "rect",
          left: 150,
          top: 730,
          width: 380,
          height: 90,
          fill: "#7c3aed",
          rx: 15,
          ry: 15,
        },
        {
          type: "i-text",
          left: 190,
          top: 760,
          width: 300,
          text: "GET STARTED FREE",
          fontSize: 24,
          fill: "#ffffff",
          fontFamily: "Outfit",
          fontWeight: "bold",
        }
      ]
    }),
    status: "APPROVED",
    isTemplate: true,
    categoryId: catBillboard,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Seed Gourmet Food Smash Burger Template
  mockDesigns.push({
    id: "template_003",
    name: "Gourmet Food - Smash Burger",
    workspaceId,
    createdById: customerId,
    width: 1920,
    height: 1080,
    canvasJson: JSON.stringify({
      version: "5.3.0",
      objects: [
        {
          type: "rect",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          fill: "#110a05",
          selectable: false,
        },
        {
          type: "circle",
          left: 1250,
          top: 150,
          radius: 350,
          fill: "#ea580c",
          selectable: false,
        },
        {
          type: "circle",
          left: 1280,
          top: 180,
          radius: 320,
          fill: "transparent",
          stroke: "#ffffff",
          strokeWidth: 4,
          selectable: false,
        },
        {
          type: "i-text",
          left: 120,
          top: 250,
          width: 800,
          text: "FRESH & HOT DAILY",
          fontSize: 32,
          fill: "#f59e0b",
          fontFamily: "Outfit",
          fontWeight: "bold",
        },
        {
          type: "i-text",
          left: 120,
          top: 320,
          width: 1500,
          text: "THE ULTIMATE\nDOUBLE SMASH",
          fontSize: 100,
          fill: "#ffffff",
          fontFamily: "Outfit",
          fontWeight: "black",
        },
        {
          type: "i-text",
          left: 120,
          top: 580,
          width: 1000,
          text: "Flame-grilled Angus beef, cheddar, house secret sauce.",
          fontSize: 38,
          fill: "#fef3c7",
          fontFamily: "Inter",
        },
        {
          type: "rect",
          left: 120,
          top: 700,
          width: 420,
          height: 100,
          fill: "#ea580c",
          rx: 20,
          ry: 20,
        },
        {
          type: "i-text",
          left: 165,
          top: 732,
          width: 330,
          text: "ORDER NOW | $8.99",
          fontSize: 28,
          fill: "#ffffff",
          fontFamily: "Outfit",
          fontWeight: "bold",
        }
      ]
    }),
    status: "APPROVED",
    isTemplate: true,
    categoryId: catBillboard,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Seed Luxury Real Estate Template
  mockDesigns.push({
    id: "template_004",
    name: "Luxury Real Estate Showcase",
    workspaceId,
    createdById: customerId,
    width: 1920,
    height: 1080,
    canvasJson: JSON.stringify({
      version: "5.3.0",
      objects: [
        {
          type: "rect",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          fill: "#0b131a",
          selectable: false,
        },
        {
          type: "rect",
          left: 1150,
          top: 100,
          width: 650,
          height: 880,
          fill: "#1e293b",
          stroke: "#d97706",
          strokeWidth: 5,
          selectable: false,
        },
        {
          type: "i-text",
          left: 1170,
          top: 500,
          width: 610,
          text: "INSERT PROPERTY IMAGE HERE",
          fontSize: 28,
          fill: "#94a3b8",
          fontFamily: "Inter",
        },
        {
          type: "i-text",
          left: 120,
          top: 250,
          width: 800,
          text: "BEAUTIFUL LIVING",
          fontSize: 32,
          fill: "#fbbf24",
          fontFamily: "Outfit",
          fontWeight: "bold",
        },
        {
          type: "i-text",
          left: 120,
          top: 320,
          width: 1000,
          text: "ELEGANT\nRESIDENCES",
          fontSize: 100,
          fill: "#ffffff",
          fontFamily: "Outfit",
          fontWeight: "black",
        },
        {
          type: "i-text",
          left: 120,
          top: 580,
          width: 900,
          text: "Premium 2 & 3 bedroom apartments starting at $1.2M. Experience comfort like never before.",
          fontSize: 36,
          fill: "#cbd5e1",
          fontFamily: "Inter",
        },
        {
          type: "rect",
          left: 120,
          top: 740,
          width: 380,
          height: 80,
          fill: "#fbbf24",
          rx: 10,
          ry: 10,
        },
        {
          type: "i-text",
          left: 155,
          top: 765,
          width: 310,
          text: "BOOK A PRIVATE TOUR",
          fontSize: 22,
          fill: "#0f172a",
          fontFamily: "Outfit",
          fontWeight: "bold",
        }
      ]
    }),
    status: "APPROVED",
    isTemplate: true,
    categoryId: catBillboard,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Seed Fitness & Health Gym Promo Template
  mockDesigns.push({
    id: "template_005",
    name: "Fitness Gym - Special Offer",
    workspaceId,
    createdById: customerId,
    width: 1920,
    height: 1080,
    canvasJson: JSON.stringify({
      version: "5.3.0",
      objects: [
        {
          type: "rect",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          fill: "#06080a",
          selectable: false,
        },
        {
          type: "rect",
          left: 1800,
          top: 0,
          width: 120,
          height: 1080,
          fill: "#a3e635",
          selectable: false,
        },
        {
          type: "i-text",
          left: 120,
          top: 220,
          width: 800,
          text: "NO EXCUSES",
          fontSize: 32,
          fill: "#a3e635",
          fontFamily: "Outfit",
          fontWeight: "bold",
        },
        {
          type: "i-text",
          left: 120,
          top: 290,
          width: 1500,
          text: "UNLEASH YOUR\nINNER ATHLETE",
          fontSize: 105,
          fill: "#ffffff",
          fontFamily: "Outfit",
          fontWeight: "black",
        },
        {
          type: "i-text",
          left: 120,
          top: 560,
          width: 1200,
          text: "Get access to state-of-the-art strength zones, functional coaching, and premium pools.",
          fontSize: 36,
          fill: "#94a3b8",
          fontFamily: "Inter",
        },
        {
          type: "rect",
          left: 120,
          top: 720,
          width: 380,
          height: 90,
          fill: "#a3e635",
          rx: 45,
          ry: 45,
        },
        {
          type: "i-text",
          left: 155,
          top: 752,
          width: 310,
          text: "CLAIM 30 DAYS FREE",
          fontSize: 22,
          fill: "#000000",
          fontFamily: "Outfit",
          fontWeight: "bold",
        }
      ]
    }),
    status: "APPROVED",
    isTemplate: true,
    categoryId: catBillboard,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Seed Digital Marketing Agency Template
  mockDesigns.push({
    id: "template_006",
    name: "Digital Marketing Agency Promo",
    workspaceId,
    createdById: customerId,
    width: 1920,
    height: 1080,
    canvasJson: JSON.stringify({
      version: "5.3.0",
      objects: [
        {
          type: "rect",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          fill: "#022c22",
          selectable: false,
        },
        {
          type: "circle",
          left: 1300,
          top: 600,
          radius: 350,
          fill: "#10b981",
          selectable: false,
        },
        {
          type: "rect",
          left: 80,
          top: 220,
          width: 8,
          height: 600,
          fill: "#10b981",
          selectable: false,
        },
        {
          type: "i-text",
          left: 120,
          top: 220,
          width: 800,
          text: "GROW YIELD & REACH",
          fontSize: 32,
          fill: "#10b981",
          fontFamily: "Outfit",
          fontWeight: "bold",
        },
        {
          type: "i-text",
          left: 120,
          top: 290,
          width: 1500,
          text: "GROW YOUR BUSINESS\nONLINE WITH US",
          fontSize: 90,
          fill: "#ffffff",
          fontFamily: "Outfit",
          fontWeight: "black",
        },
        {
          type: "i-text",
          left: 120,
          top: 540,
          width: 1100,
          text: "Data-driven SEO, PPC campaigns, and content strategies that optimize search conversions.",
          fontSize: 36,
          fill: "#cbd5e1",
          fontFamily: "Inter",
        },
        {
          type: "rect",
          left: 120,
          top: 690,
          width: 460,
          height: 85,
          fill: "#10b981",
          rx: 12,
          ry: 12,
        },
        {
          type: "i-text",
          left: 155,
          top: 718,
          width: 390,
          text: "GET A FREE MARKETING AUDIT",
          fontSize: 22,
          fill: "#022c22",
          fontFamily: "Outfit",
          fontWeight: "bold",
        }
      ]
    }),
    status: "APPROVED",
    isTemplate: true,
    categoryId: catBillboard,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Seed Fashion Collection / Retail Sale Template
  mockDesigns.push({
    id: "template_007",
    name: "Summer Fashion Collection",
    workspaceId,
    createdById: customerId,
    width: 1920,
    height: 1080,
    canvasJson: JSON.stringify({
      version: "5.3.0",
      objects: [
        {
          type: "rect",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          fill: "#fdf6e2",
          selectable: false,
        },
        {
          type: "rect",
          left: 1180,
          top: 100,
          width: 600,
          height: 880,
          fill: "#e7e5e4",
          stroke: "#b45309",
          strokeWidth: 2,
          selectable: false,
        },
        {
          type: "i-text",
          left: 1200,
          top: 500,
          width: 560,
          text: "DROP FASHION PHOTOGRAPHY HERE",
          fontSize: 24,
          fill: "#78716c",
          fontFamily: "Inter",
        },
        {
          type: "i-text",
          left: 120,
          top: 240,
          width: 800,
          text: "NEW ARRIVALS",
          fontSize: 32,
          fill: "#b45309",
          fontFamily: "Outfit",
          fontWeight: "bold",
        },
        {
          type: "i-text",
          left: 120,
          top: 310,
          width: 1000,
          text: "SUMMER\nCOLLECTION",
          fontSize: 110,
          fill: "#1c1917",
          fontFamily: "Outfit",
          fontWeight: "black",
        },
        {
          type: "i-text",
          left: 120,
          top: 580,
          width: 900,
          text: "Experience lightweight fabrics and curated designs. Up to 40% off storewide.",
          fontSize: 36,
          fill: "#44403c",
          fontFamily: "Inter",
        },
        {
          type: "rect",
          left: 120,
          top: 730,
          width: 360,
          height: 85,
          fill: "#b45309",
          rx: 8,
          ry: 8,
        },
        {
          type: "i-text",
          left: 160,
          top: 758,
          width: 280,
          text: "EXPLORE THE SALE",
          fontSize: 24,
          fill: "#ffffff",
          fontFamily: "Outfit",
          fontWeight: "bold",
        }
      ]
    }),
    status: "APPROVED",
    isTemplate: true,
    categoryId: catBillboard,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Seed Mega Retail Sale / Black Friday Template
  mockDesigns.push({
    id: "template_008",
    name: "Mega Retail Flash Sale",
    workspaceId,
    createdById: customerId,
    width: 1920,
    height: 1080,
    canvasJson: JSON.stringify({
      version: "5.3.0",
      objects: [
        {
          type: "rect",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          fill: "#3f0712",
          selectable: false,
        },
        {
          type: "circle",
          left: 1450,
          top: -100,
          radius: 300,
          fill: "#f59e0b",
          selectable: false,
        },
        {
          type: "i-text",
          left: 150,
          top: 220,
          width: 800,
          text: "LIMITED TIME EXCLUSIVE",
          fontSize: 32,
          fill: "#f59e0b",
          fontFamily: "Outfit",
          fontWeight: "bold",
        },
        {
          type: "i-text",
          left: 150,
          top: 290,
          width: 1500,
          text: "FLASH SALE\nUP TO 50% OFF",
          fontSize: 115,
          fill: "#ffffff",
          fontFamily: "Outfit",
          fontWeight: "black",
        },
        {
          type: "i-text",
          left: 150,
          top: 570,
          width: 1200,
          text: "Get the absolute best deals of the season. Apply code FLASH50 at checkout.",
          fontSize: 36,
          fill: "#fecdd3",
          fontFamily: "Inter",
        },
        {
          type: "rect",
          left: 150,
          top: 710,
          width: 380,
          height: 90,
          fill: "#f59e0b",
          rx: 45,
          ry: 45,
        },
        {
          type: "i-text",
          left: 190,
          top: 742,
          width: 300,
          text: "SHOP THE DEALS",
          fontSize: 24,
          fill: "#3f0712",
          fontFamily: "Outfit",
          fontWeight: "bold",
        }
      ]
    }),
    status: "APPROVED",
    isTemplate: true,
    categoryId: catBillboard,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Seed Automotive Dealership Billboard Template
  mockDesigns.push({
    id: "template_009",
    name: "Automotive Dealership Promo",
    workspaceId,
    createdById: customerId,
    width: 1920,
    height: 1080,
    canvasJson: JSON.stringify({
      version: "5.3.0",
      objects: [
        { type: "rect", left: 0, top: 0, width: 1920, height: 1080, fill: "#0a0a0a", selectable: false },
        { type: "rect", left: 0, top: 900, width: 1920, height: 180, fill: "#dc2626", selectable: false },
        { type: "circle", left: 1350, top: 100, radius: 380, fill: "#1e1e1e", selectable: false },
        { type: "circle", left: 1380, top: 130, radius: 350, fill: "transparent", stroke: "#dc2626", strokeWidth: 4, selectable: false },
        { type: "i-text", left: 120, top: 200, width: 800, text: "PERFORMANCE REDEFINED", fontSize: 30, fill: "#dc2626", fontFamily: "Outfit", fontWeight: "bold" },
        { type: "i-text", left: 120, top: 280, width: 1400, text: "THE ALL-NEW\n2025 SPORT GT", fontSize: 110, fill: "#ffffff", fontFamily: "Outfit", fontWeight: "black" },
        { type: "i-text", left: 120, top: 560, width: 1100, text: "0-60 mph in 3.2s · Twin Turbo V8 · Starting from $49,990", fontSize: 34, fill: "#a3a3a3", fontFamily: "Inter" },
        { type: "rect", left: 120, top: 700, width: 400, height: 85, fill: "#dc2626", rx: 12, ry: 12 },
        { type: "i-text", left: 160, top: 728, width: 320, text: "BOOK A TEST DRIVE", fontSize: 24, fill: "#ffffff", fontFamily: "Outfit", fontWeight: "bold" }
      ]
    }),
    status: "APPROVED",
    isTemplate: true,
    categoryId: catBillboard,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Seed Artisan Coffee / Café Billboard Template
  mockDesigns.push({
    id: "template_010",
    name: "Artisan Coffee House",
    workspaceId,
    createdById: customerId,
    width: 1920,
    height: 1080,
    canvasJson: JSON.stringify({
      version: "5.3.0",
      objects: [
        { type: "rect", left: 0, top: 0, width: 1920, height: 1080, fill: "#1a120b", selectable: false },
        { type: "circle", left: 1300, top: 200, radius: 350, fill: "#78350f", selectable: false },
        { type: "circle", left: 1340, top: 240, radius: 310, fill: "transparent", stroke: "#d97706", strokeWidth: 3, selectable: false },
        { type: "rect", left: 60, top: 180, width: 6, height: 650, fill: "#d97706", selectable: false },
        { type: "i-text", left: 120, top: 200, width: 800, text: "HANDCRAFTED WITH LOVE", fontSize: 28, fill: "#d97706", fontFamily: "Outfit", fontWeight: "bold" },
        { type: "i-text", left: 120, top: 280, width: 1200, text: "FRESHLY\nROASTED DAILY", fontSize: 105, fill: "#fef3c7", fontFamily: "Outfit", fontWeight: "black" },
        { type: "i-text", left: 120, top: 550, width: 1000, text: "Single-origin beans, cold brews, and seasonal lattes made to perfection.", fontSize: 34, fill: "#a3836a", fontFamily: "Inter" },
        { type: "rect", left: 120, top: 690, width: 350, height: 80, fill: "#d97706", rx: 40, ry: 40 },
        { type: "i-text", left: 165, top: 715, width: 260, text: "VISIT US TODAY", fontSize: 22, fill: "#1a120b", fontFamily: "Outfit", fontWeight: "bold" }
      ]
    }),
    status: "APPROVED",
    isTemplate: true,
    categoryId: catBillboard,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Seed E-Commerce / Online Shopping Mega Sale
  mockDesigns.push({
    id: "template_011",
    name: "E-Commerce Mega Sale Event",
    workspaceId,
    createdById: customerId,
    width: 1920,
    height: 1080,
    canvasJson: JSON.stringify({
      version: "5.3.0",
      objects: [
        { type: "rect", left: 0, top: 0, width: 1920, height: 1080, fill: "#0c0a1d", selectable: false },
        { type: "circle", left: -100, top: -200, radius: 500, fill: "#6d28d9", selectable: false },
        { type: "circle", left: 1500, top: 700, radius: 400, fill: "#2563eb", selectable: false },
        { type: "i-text", left: 150, top: 180, width: 1600, text: "★ BIGGEST SALE OF THE YEAR ★", fontSize: 30, fill: "#fbbf24", fontFamily: "Outfit", fontWeight: "bold" },
        { type: "i-text", left: 150, top: 270, width: 1600, text: "MEGA\nSHOPPING FEST", fontSize: 120, fill: "#ffffff", fontFamily: "Outfit", fontWeight: "black" },
        { type: "i-text", left: 150, top: 560, width: 1200, text: "Up to 70% OFF on Electronics, Fashion & Home Essentials. Free shipping on orders $50+", fontSize: 34, fill: "#c4b5fd", fontFamily: "Inter" },
        { type: "rect", left: 150, top: 710, width: 380, height: 85, fill: "#fbbf24", rx: 12, ry: 12 },
        { type: "i-text", left: 190, top: 738, width: 300, text: "SHOP NOW →", fontSize: 26, fill: "#0c0a1d", fontFamily: "Outfit", fontWeight: "bold" },
        { type: "rect", left: 570, top: 710, width: 380, height: 85, fill: "transparent", stroke: "#fbbf24", strokeWidth: 3, rx: 12, ry: 12 },
        { type: "i-text", left: 610, top: 738, width: 300, text: "USE CODE: MEGA70", fontSize: 22, fill: "#fbbf24", fontFamily: "Outfit", fontWeight: "bold" }
      ]
    }),
    status: "APPROVED",
    isTemplate: true,
    categoryId: catBanner,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Seed Healthcare / Medical Wellness Billboard
  mockDesigns.push({
    id: "template_012",
    name: "Healthcare & Wellness Clinic",
    workspaceId,
    createdById: customerId,
    width: 1920,
    height: 1080,
    canvasJson: JSON.stringify({
      version: "5.3.0",
      objects: [
        { type: "rect", left: 0, top: 0, width: 1920, height: 1080, fill: "#f0fdfa", selectable: false },
        { type: "rect", left: 0, top: 0, width: 1920, height: 12, fill: "#0d9488", selectable: false },
        { type: "rect", left: 1250, top: 100, width: 560, height: 880, fill: "#ccfbf1", stroke: "#0d9488", strokeWidth: 2, selectable: false },
        { type: "i-text", left: 1280, top: 490, width: 500, text: "ADD CLINIC PHOTO HERE", fontSize: 24, fill: "#5eead4", fontFamily: "Inter" },
        { type: "i-text", left: 120, top: 220, width: 800, text: "YOUR HEALTH MATTERS MOST", fontSize: 28, fill: "#0d9488", fontFamily: "Outfit", fontWeight: "bold" },
        { type: "i-text", left: 120, top: 290, width: 1100, text: "COMPASSIONATE\nCARE FOR ALL", fontSize: 95, fill: "#134e4a", fontFamily: "Outfit", fontWeight: "black" },
        { type: "i-text", left: 120, top: 550, width: 1000, text: "Board-certified specialists · Modern diagnostics · Walk-in appointments welcome.", fontSize: 34, fill: "#475569", fontFamily: "Inter" },
        { type: "rect", left: 120, top: 700, width: 400, height: 80, fill: "#0d9488", rx: 10, ry: 10 },
        { type: "i-text", left: 160, top: 725, width: 320, text: "BOOK APPOINTMENT", fontSize: 22, fill: "#ffffff", fontFamily: "Outfit", fontWeight: "bold" }
      ]
    }),
    status: "APPROVED",
    isTemplate: true,
    categoryId: catPoster,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Seed Online Education / Course Platform Billboard
  mockDesigns.push({
    id: "template_013",
    name: "Online Education Platform",
    workspaceId,
    createdById: customerId,
    width: 1920,
    height: 1080,
    canvasJson: JSON.stringify({
      version: "5.3.0",
      objects: [
        { type: "rect", left: 0, top: 0, width: 1920, height: 1080, fill: "#0f172a", selectable: false },
        { type: "rect", left: 1400, top: 0, width: 520, height: 1080, fill: "#1e40af", selectable: false },
        { type: "circle", left: 1350, top: 400, radius: 200, fill: "#3b82f6", selectable: false },
        { type: "i-text", left: 140, top: 200, width: 800, text: "📚 LEARN WITHOUT LIMITS", fontSize: 28, fill: "#60a5fa", fontFamily: "Outfit", fontWeight: "bold" },
        { type: "i-text", left: 140, top: 280, width: 1200, text: "MASTER NEW\nSKILLS TODAY", fontSize: 105, fill: "#ffffff", fontFamily: "Outfit", fontWeight: "black" },
        { type: "i-text", left: 140, top: 550, width: 1100, text: "500+ expert-led courses in Tech, Business, Design & Marketing. Start free today.", fontSize: 34, fill: "#94a3b8", fontFamily: "Inter" },
        { type: "rect", left: 140, top: 700, width: 360, height: 85, fill: "#3b82f6", rx: 12, ry: 12 },
        { type: "i-text", left: 180, top: 728, width: 280, text: "ENROLL FOR FREE", fontSize: 24, fill: "#ffffff", fontFamily: "Outfit", fontWeight: "bold" },
        { type: "rect", left: 540, top: 700, width: 360, height: 85, fill: "transparent", stroke: "#3b82f6", strokeWidth: 3, rx: 12, ry: 12 },
        { type: "i-text", left: 580, top: 728, width: 280, text: "BROWSE COURSES", fontSize: 22, fill: "#60a5fa", fontFamily: "Outfit", fontWeight: "bold" }
      ]
    }),
    status: "APPROVED",
    isTemplate: true,
    categoryId: catBanner,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Seed Music Concert / Event Billboard Template
  mockDesigns.push({
    id: "template_014",
    name: "Live Music Concert Event",
    workspaceId,
    createdById: customerId,
    width: 1920,
    height: 1080,
    canvasJson: JSON.stringify({
      version: "5.3.0",
      objects: [
        { type: "rect", left: 0, top: 0, width: 1920, height: 1080, fill: "#09090b", selectable: false },
        { type: "circle", left: 700, top: -300, radius: 600, fill: "#be123c", selectable: false },
        { type: "circle", left: -100, top: 700, radius: 350, fill: "#7c3aed", selectable: false },
        { type: "circle", left: 1500, top: 600, radius: 300, fill: "#0891b2", selectable: false },
        { type: "i-text", left: 150, top: 160, width: 1600, text: "🎵 LIVE AT CENTRAL ARENA · JULY 28, 2025", fontSize: 28, fill: "#fda4af", fontFamily: "Outfit", fontWeight: "bold" },
        { type: "i-text", left: 150, top: 250, width: 1600, text: "NEON PULSE\nSUMMER TOUR", fontSize: 115, fill: "#ffffff", fontFamily: "Outfit", fontWeight: "black" },
        { type: "i-text", left: 150, top: 540, width: 1200, text: "Featuring DJ Nova, The Midnight Echo, and special guests. Gates open at 6 PM.", fontSize: 34, fill: "#d4d4d8", fontFamily: "Inter" },
        { type: "rect", left: 150, top: 690, width: 360, height: 85, fill: "#be123c", rx: 42, ry: 42 },
        { type: "i-text", left: 195, top: 718, width: 270, text: "GET TICKETS", fontSize: 26, fill: "#ffffff", fontFamily: "Outfit", fontWeight: "bold" },
        { type: "i-text", left: 560, top: 718, width: 500, text: "FROM $39 · VIP FROM $149", fontSize: 24, fill: "#a1a1aa", fontFamily: "Inter" }
      ]
    }),
    status: "APPROVED",
    isTemplate: true,
    categoryId: catPoster,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  isInitialized = true;
  console.log("Mock database initialized with default test credentials: password123");
}

export interface MockBillboardAvailability {
  id: string;
  billboardId: string;
  date: string; // ISO Date YYYY-MM-DD
  isAvailable: boolean;
  blockedReason?: string | null;
}

export interface MockBillboardPricing {
  id: string;
  billboardId: string;
  startDate: string; // ISO Date
  endDate: string; // ISO Date
  priceMultiplier: number;
  peakSeason: boolean;
  weekendPricing: boolean;
}

export interface MockBillboardMedia {
  id: string;
  billboardId: string;
  fileUrl: string;
  thumbnailUrl?: string | null;
  fileType: "IMAGE" | "VIDEO" | "PANORAMA";
  displayOrder: number;
}

export interface MockBillboard {
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
  rating: number;
  reviewCount: number;
  views: number;
  ownerId: string;
  createdAt: string;
}

export const mockBillboardAvailability: MockBillboardAvailability[] = [];
export const mockBillboardPricing: MockBillboardPricing[] = [];
export const mockBillboardMedia: MockBillboardMedia[] = [];

export const mockBillboards: MockBillboard[] = [
  {
    id: "bill_001",
    name: "Times Square Digital Mega-Screen",
    description: "High-exposure digital billboard facing north traffic at 42nd St & Broadway.",
    address: "1500 Broadway",
    city: "New York",
    state: "NY",
    country: "USA",
    postalCode: "10036",
    latitude: 40.7563,
    longitude: -73.9863,
    dimensions: "14m x 48m",
    locationType: "DIGITAL",
    pricePerDay: 1500.00,
    minimumBookingDays: 1,
    isAvailable: true,
    rating: 4.8,
    reviewCount: 24,
    views: 1205,
    ownerId: "own_001",
    createdAt: new Date().toISOString(),
  },
  {
    id: "bill_002",
    name: "Sunset Boulevard Highway Archway",
    description: "Premium static double-sided archway panel targeting west Hollywood traffic.",
    address: "8500 Sunset Blvd",
    city: "West Hollywood",
    state: "CA",
    country: "USA",
    postalCode: "90069",
    latitude: 34.0912,
    longitude: -118.3756,
    dimensions: "10m x 30m",
    locationType: "STATIC",
    pricePerDay: 750.00,
    minimumBookingDays: 3,
    isAvailable: true,
    rating: 4.5,
    reviewCount: 12,
    views: 450,
    ownerId: "own_001",
    createdAt: new Date().toISOString(),
  }
];

export interface MockBrandAsset {
  id: string;
  customerId: string;
  name: string;
  logoUrl?: string | null;
  assetUrl: string; // Guidelines file URL
  colorPalette?: { primary: string; secondary: string; accent: string } | null;
  typography?: { headings: string; body: string } | null;
  createdAt: string;
  updatedAt: string;
}

export const mockBrandAssets: MockBrandAsset[] = [
  {
    id: "brand_001",
    customerId: "cust_001",
    name: "Alice Campaign Essentials",
    logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop&q=80",
    assetUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    colorPalette: {
      primary: "#6366F1",
      secondary: "#06B6D4",
      accent: "#EC4899"
    },
    typography: {
      headings: "Outfit",
      body: "Inter"
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export interface MockAuditLog {
  id: string;
  userId?: string | null;
  action: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  payload?: any;
  createdAt: string;
}

export const mockAuditLogs: MockAuditLog[] = [];

// --- Brand Studio & Canva-style design structures ---

export interface MockWorkspace {
  id: string;
  name: string;
  logoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MockTeamMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  createdAt: string;
}

export interface MockFolder {
  id: string;
  name: string;
  workspaceId: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MockDesign {
  id: string;
  name: string;
  workspaceId: string;
  createdById: string;
  width: number;
  height: number;
  canvasJson: string; // JSON configuration
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "ARCHIVED";
  isTemplate: boolean;
  categoryId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MockDesignVersion {
  id: string;
  designId: string;
  canvasJson: string;
  version: number;
  createdByName: string;
  createdAt: string;
}

export interface MockTemplateCategory {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface MockComment {
  id: string;
  designId: string;
  userId: string;
  content: string;
  x: number;
  y: number;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

// In-memory arrays for Canva Brand Studio
export const mockWorkspaces: MockWorkspace[] = [];
export const mockTeamMembers: MockTeamMember[] = [];
export const mockFolders: MockFolder[] = [];
export const mockDesigns: MockDesign[] = [];
export const mockDesignVersions: MockDesignVersion[] = [];
export const mockTemplateCategories: MockTemplateCategory[] = [];
export const mockComments: MockComment[] = [];




