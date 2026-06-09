import { prisma } from "@/core/config/db";
import { AppError } from "@/core/errors/AppError";
import { ApplyBookingInput, UpdateQuotationInput, ProcessPaymentInput, CreateCampaignInput } from "../dto/booking.dto";
import { AvailabilityEngineService } from "@/modules/billboards/services/availability-engine.service";
import { PricingEngineService } from "@/modules/billboards/services/pricing-engine.service";

export class BookingService {
  
  static async apply(customerId: string, data: ApplyBookingInput) {
    // 1. Verify Billboard exists
    const billboard = await prisma.billboard.findUnique({
      where: { id: data.billboardId }
    });

    if (!billboard) {
      throw new AppError("Billboard listing not found.", 404, "BILLBOARD_NOT_FOUND");
    }

    // 2. Validate dates & Availability
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      throw new AppError("Invalid booking start/end dates.", 400, "INVALID_DATES");
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    if (totalDays < billboard.minimumBookingDays) {
      throw new AppError(
        `Booking duration (${totalDays} days) is less than the minimum required (${billboard.minimumBookingDays} days).`,
        400,
        "INVALID_DURATION"
      );
    }

    const isAvailable = await AvailabilityEngineService.checkRangeAvailability(
      data.billboardId,
      data.startDate,
      data.endDate
    );

    if (!isAvailable) {
      throw new AppError("The billboard is already booked or unavailable during these dates.", 400, "DATE_RANGE_UNAVAILABLE");
    }

    // 3. Locate or create campaign
    let campaignId = data.campaignId;
    if (!campaignId) {
      const campaign = await prisma.campaign.create({
        data: {
          customerId,
          name: data.campaignName || `Campaign for ${billboard.name}`,
          budget: data.campaignBudget || Number(billboard.basePrice) * totalDays,
          startDate: start,
          endDate: end,
          status: "DRAFT"
        }
      });
      campaignId = campaign.id;
    }

    // 4. Calculate initial quotation price
    const pricing = await PricingEngineService.calculate(
      Number(billboard.basePrice),
      data.startDate,
      data.endDate
    );

    // 5. Create Booking & Quotation in database transaction
    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          campaignId: campaignId!,
          customerId,
          billboardId: data.billboardId,
          startDate: start,
          endDate: end,
          totalAmount: pricing.finalAmount,
          status: "PENDING"
        }
      });

      const taxAmount = pricing.finalAmount * 0.18; // 18% standard VAT/tax
      const quotation = await tx.quotation.create({
        data: {
          bookingId: booking.id,
          initialPrice: pricing.baseAmount,
          taxAmount,
          discountAmount: pricing.discountAmount,
          finalPrice: pricing.finalAmount + taxAmount,
          status: "DRAFT"
        }
      });

      return {
        booking,
        quotation
      };
    });
  }

  static async getDetails(id: string, requesterId: string, role: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        billboard: true,
        campaign: true,
        customer: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        quotation: {
          include: {
            contract: true
          }
        },
        payments: true
      }
    });

    if (!booking) {
      throw new AppError("Booking not found.", 404, "BOOKING_NOT_FOUND");
    }

    // Access control: Customer can only see their own. Owner/Admin can see all.
    if (booking.customerId !== requesterId && role !== "ADMIN" && role !== "SUPER_ADMIN" && booking.billboard.ownerId !== requesterId) {
      throw new AppError("You do not have permission to view this booking.", 403, "FORBIDDEN");
    }

    return booking;
  }

  static async updateQuotation(id: string, ownerId: string, role: string, data: UpdateQuotationInput) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { billboard: true, quotation: true }
    });

    if (!booking || !booking.quotation) {
      throw new AppError("Booking or associated quotation not found.", 404, "QUOTATION_NOT_FOUND");
    }

    // Access Check: Owner or Admin
    if (booking.billboard.ownerId !== ownerId && role !== "ADMIN" && role !== "SUPER_ADMIN") {
      throw new AppError("You do not have permission to edit this quotation.", 403, "FORBIDDEN");
    }

    const updatedQuote = await prisma.quotation.update({
      where: { id: booking.quotation.id },
      data: {
        initialPrice: data.initialPrice !== undefined ? data.initialPrice : undefined,
        taxAmount: data.taxAmount !== undefined ? data.taxAmount : undefined,
        discountAmount: data.discountAmount !== undefined ? data.discountAmount : undefined,
        finalPrice: data.finalPrice !== undefined ? data.finalPrice : undefined,
        status: data.status
      }
    });

    // Sync booking amount if accepted
    if (data.status === "ACCEPTED" || data.finalPrice !== undefined) {
      await prisma.booking.update({
        where: { id },
        data: {
          totalAmount: data.finalPrice !== undefined ? data.finalPrice : booking.totalAmount
        }
      });
    }

    return updatedQuote;
  }

  static async approveQuotation(id: string, ownerId: string, role: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { billboard: true, quotation: true }
    });

    if (!booking || !booking.quotation) {
      throw new AppError("Booking or associated quotation not found.", 404, "QUOTATION_NOT_FOUND");
    }

    // Access check
    if (booking.billboard.ownerId !== ownerId && role !== "ADMIN" && role !== "SUPER_ADMIN") {
      throw new AppError("You do not have permission to approve this quotation.", 403, "FORBIDDEN");
    }

    return prisma.$transaction(async (tx) => {
      // 1. Accept Quotation
      const quotation = await tx.quotation.update({
        where: { id: booking.quotation!.id },
        data: { status: "ACCEPTED" }
      });

      // 2. Create Draft Contract
      const contract = await tx.contract.create({
        data: {
          quotationId: quotation.id,
          documentUrl: `https://billboardify-contracts.s3.amazonaws.com/contracts/${booking.id}.pdf`,
          status: "PENDING"
        }
      });

      // 3. Update Booking Status to CONFIRMED
      await tx.booking.update({
        where: { id },
        data: { status: "CONFIRMED" }
      });

      return {
        quotation,
        contract
      };
    });
  }

  static async getByUser(requesterId: string, role: string, targetUserId?: string) {
    // If target userId is specified, ensure permission
    if (targetUserId && targetUserId !== requesterId && role !== "ADMIN" && role !== "SUPER_ADMIN") {
      throw new AppError("You do not have permission to view other users' bookings.", 403, "FORBIDDEN");
    }

    const filterId = targetUserId || requesterId;

    // Admin/SuperAdmin/Owner can fetch all if no targetUserId is set
    if (!targetUserId && (role === "ADMIN" || role === "SUPER_ADMIN")) {
      return prisma.booking.findMany({
        include: { billboard: true, campaign: true }
      });
    }

    return prisma.booking.findMany({
      where: { customerId: filterId },
      include: { billboard: true, campaign: true }
    });
  }

  static async processPayment(data: ProcessPaymentInput) {
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: { quotation: true }
    });

    if (!booking) {
      throw new AppError("Booking details not found.", 404, "BOOKING_NOT_FOUND");
    }

    let discountApplied = 0;
    let couponId: string | undefined;

    if (data.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: data.couponCode.toUpperCase().trim() }
      });

      if (!coupon || !coupon.active) {
        throw new AppError("Coupon is invalid or inactive.", 400, "INVALID_COUPON");
      }

      if (new Date() > new Date(coupon.expiryDate)) {
        throw new AppError("Coupon has expired.", 400, "EXPIRED_COUPON");
      }

      if (coupon.currentUsage >= coupon.maxUsage) {
        throw new AppError("Coupon usage limit exceeded.", 400, "COUPON_LIMIT_REACHED");
      }

      if (Number(booking.totalAmount) < Number(coupon.minOrderAmount)) {
        throw new AppError(`Minimum order amount of $${coupon.minOrderAmount} is required.`, 400, "MIN_ORDER_NOT_MET");
      }

      couponId = coupon.id;
      if (coupon.discountType === "PERCENTAGE") {
        discountApplied = Number(booking.totalAmount) * (Number(coupon.discountValue) / 100);
      } else {
        discountApplied = Number(coupon.discountValue);
      }
    }

    const finalCharge = Math.max(0, Number(booking.totalAmount) - discountApplied);

    return prisma.$transaction(async (tx) => {
      // Create payment
      const payment = await tx.payment.create({
        data: {
          bookingId: booking.id,
          couponId: couponId || null,
          gatewayIntentId: data.gatewayIntentId,
          amount: finalCharge,
          status: "SUCCESS",
          method: data.method
        }
      });

      // Increment coupon usage
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { currentUsage: { increment: 1 } }
        });
      }

      // Update booking status
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "COMPLETED" }
      });

      // Update Campaign status to SCHEDULED
      await tx.campaign.update({
        where: { id: booking.campaignId },
        data: { status: "SCHEDULED" }
      });

      // Block out dates in BillboardAvailability
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      const current = new Date(start);
      while (current <= end) {
        await tx.billboardAvailability.create({
          data: {
            billboardId: booking.billboardId,
            date: new Date(current),
            isAvailable: false,
            blockedReason: `Campaign Booking Reference: ${booking.id}`
          }
        });
        current.setDate(current.getDate() + 1);
      }

      return payment;
    });
  }

  static async getContract(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        quotation: {
          include: { contract: true }
        }
      }
    });

    if (!booking || !booking.quotation || !booking.quotation.contract) {
      throw new AppError("Contract details not found for this booking.", 404, "CONTRACT_NOT_FOUND");
    }

    return booking.quotation.contract;
  }

  // --- Campaign Sub-CRUD Operations ---
  static async createCampaign(customerId: string, data: CreateCampaignInput) {
    return prisma.campaign.create({
      data: {
        customerId,
        name: data.name,
        budget: data.budget,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: "DRAFT"
      }
    });
  }

  static async getCampaigns(customerId: string, role: string) {
    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      return prisma.campaign.findMany({
        include: { bookings: true }
      });
    }
    return prisma.campaign.findMany({
      where: { customerId },
      include: { bookings: true }
    });
  }

  static async getCampaignDetails(id: string, customerId: string, role: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { bookings: { include: { billboard: true } } }
    });

    if (!campaign) {
      throw new AppError("Campaign details not found.", 404, "CAMPAIGN_NOT_FOUND");
    }

    if (campaign.customerId !== customerId && role !== "ADMIN" && role !== "SUPER_ADMIN") {
      throw new AppError("You do not have permission to view this campaign.", 403, "FORBIDDEN");
    }

    return campaign;
  }
}
