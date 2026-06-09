import { prisma } from "@/core/config/db";
import { AppError } from "@/core/errors/AppError";

export class CouponService {
  
  static async createCoupon(data: {
    code: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    maxUsage?: number;
    minOrderAmount?: number;
    expiryDate: string;
    stackable?: boolean;
  }) {
    const code = data.code.toUpperCase().trim();
    
    // Check duplication
    const existing = await prisma.coupon.findUnique({
      where: { code }
    });

    if (existing) {
      throw new AppError("Coupon code already exists.", 400, "COUPON_ALREADY_EXISTS");
    }

    return prisma.coupon.create({
      data: {
        code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxUsage: data.maxUsage || 100,
        minOrderAmount: data.minOrderAmount || 0,
        expiryDate: new Date(data.expiryDate),
        stackable: data.stackable || false,
        active: true
      }
    });
  }

  static async validateCoupon(code: string, subtotal: number) {
    const cleanedCode = code.toUpperCase().trim();
    const coupon = await prisma.coupon.findUnique({
      where: { code: cleanedCode }
    });

    if (!coupon || !coupon.active) {
      throw new AppError("Coupon does not exist or is inactive.", 400, "INVALID_COUPON");
    }

    if (new Date() > new Date(coupon.expiryDate)) {
      throw new AppError("Coupon code has expired.", 400, "EXPIRED_COUPON");
    }

    if (coupon.currentUsage >= coupon.maxUsage) {
      throw new AppError("Coupon code usage limit exceeded.", 400, "COUPON_LIMIT_EXCEEDED");
    }

    if (subtotal < Number(coupon.minOrderAmount)) {
      throw new AppError(
        `Minimum order amount of $${coupon.minOrderAmount} is required for this coupon.`,
        400,
        "MIN_ORDER_NOT_MET"
      );
    }

    let discountAmount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = subtotal * (Number(coupon.discountValue) / 100);
    } else {
      discountAmount = Number(coupon.discountValue);
    }

    return {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      discountAmount: Math.min(subtotal, discountAmount),
      finalAmount: Math.max(0, subtotal - discountAmount)
    };
  }

  static async applyDiscount(code: string, subtotal: number) {
    return this.validateCoupon(code, subtotal);
  }

  static async getCouponAnalytics() {
    const totalCoupons = await prisma.coupon.count();
    const activeCoupons = await prisma.coupon.count({ where: { active: true } });
    const usageStats = await prisma.coupon.aggregate({
      _sum: { currentUsage: true }
    });

    const popularCoupons = await prisma.coupon.findMany({
      orderBy: { currentUsage: "desc" },
      take: 5
    });

    return {
      totalCoupons,
      activeCoupons,
      totalUsage: usageStats._sum.currentUsage || 0,
      popularCoupons
    };
  }
}
