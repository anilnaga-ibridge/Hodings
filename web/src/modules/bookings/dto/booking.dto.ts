import { z } from "zod";

export const applyBookingSchema = z.object({
  campaignId: z.string().uuid("Invalid campaignId format").optional(),
  campaignName: z.string().min(1, "Campaign name is required").optional(), // used if creating new campaign in-place
  campaignBudget: z.coerce.number().min(0).optional(),
  billboardId: z.string().uuid("Invalid billboardId format"),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid startDate format" }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid endDate format" }),
});

export const updateQuotationSchema = z.object({
  initialPrice: z.coerce.number().min(0).optional(),
  taxAmount: z.coerce.number().min(0).optional(),
  discountAmount: z.coerce.number().min(0).optional(),
  finalPrice: z.coerce.number().min(0).optional(),
  status: z.enum(["DRAFT", "OFFERED", "COUNTERED", "ACCEPTED", "REJECTED", "EXPIRED"]),
});

export const processPaymentSchema = z.object({
  bookingId: z.string().uuid("Invalid bookingId format"),
  couponCode: z.string().optional(),
  gatewayIntentId: z.string().min(1, "Gateway Intent ID is required"),
  method: z.enum(["STRIPE", "RAZORPAY", "PAYPAL"]),
  amount: z.coerce.number().min(0),
});

export const createCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  budget: z.coerce.number().min(0),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid startDate format" }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid endDate format" }),
});

export type ApplyBookingInput = z.infer<typeof applyBookingSchema>;
export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>;
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
