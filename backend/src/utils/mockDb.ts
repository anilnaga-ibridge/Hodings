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
  if (isInitialized) return;

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
          type: "textbox",
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
          type: "textbox",
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
          type: "textbox",
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




