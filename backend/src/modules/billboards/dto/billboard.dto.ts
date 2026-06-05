import { z } from "zod";

export const searchBillboardsSchema = z.object({
  keyword: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  category: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(0).optional(), // in KM
  availableFrom: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid startDate format" }).optional(),
  availableTo: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid endDate format" }).optional(),
  sortBy: z.enum(["newest", "popular", "price_low", "price_high", "rating"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const blockAvailabilitySchema = z.object({
  dates: z.array(z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })).min(1, "At least one date is required"),
  isAvailable: z.boolean().default(false),
  blockedReason: z.string().min(1, "Reason is required when blocking/reserving dates"),
});

export const calculatePricingSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid startDate format" }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid endDate format" }),
});

export const addMediaSchema = z.object({
  fileUrl: z.string().url("fileUrl must be a valid URL"),
  thumbnailUrl: z.string().url("thumbnailUrl must be a valid URL").optional(),
  fileType: z.enum(["IMAGE", "VIDEO", "PANORAMA"]),
  displayOrder: z.number().int().default(0),
});

export type SearchBillboardsInput = z.infer<typeof searchBillboardsSchema>;
export type BlockAvailabilityInput = z.infer<typeof blockAvailabilitySchema>;
export type CalculatePricingInput = z.infer<typeof calculatePricingSchema>;
export type AddMediaInput = z.infer<typeof addMediaSchema>;
