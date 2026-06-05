import { prisma } from "@/core/config/db";
import { AppError } from "@/core/errors/AppError";

export class ReferralService {
  
  static async registerReferral(referrerId: string, refereeId: string, referralCode: string) {
    // Check if referee is already referred
    const existing = await prisma.referral.findFirst({
      where: { refereeId }
    });

    if (existing) {
      throw new AppError("This user has already been referred.", 400, "ALREADY_REFERRED");
    }

    return prisma.referral.create({
      data: {
        referrerId,
        refereeId,
        referralCode,
        commissionEarned: 0.00,
        status: "PENDING"
      }
    });
  }

  static async getByUser(userId: string) {
    return prisma.referral.findMany({
      where: {
        OR: [
          { referrerId: userId },
          { refereeId: userId }
        ]
      },
      include: {
        referrer: { select: { id: true, email: true, firstName: true, lastName: true } },
        referee: { select: { id: true, email: true, firstName: true, lastName: true } }
      }
    });
  }

  static async calculateCommission(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payments: true }
    });

    if (!booking) {
      throw new AppError("Booking not found.", 404, "BOOKING_NOT_FOUND");
    }

    // Verify if referee user was referred
    const referral = await prisma.referral.findFirst({
      where: { refereeId: booking.customerId, status: "PENDING" }
    });

    if (!referral) {
      return { success: false, reason: "No pending referral found for the booking customer." };
    }

    const successPayment = booking.payments.find(p => p.status === "SUCCESS");
    if (!successPayment) {
      throw new AppError("No successful payment found on this booking.", 400, "NO_COMPLETED_PAYMENT");
    }

    // Standard 5% commission calculation
    const amount = Number(successPayment.amount);
    const commission = amount * 0.05;

    return prisma.referral.update({
      where: { id: referral.id },
      data: {
        commissionEarned: commission,
        status: "CALCULATED"
      }
    });
  }

  static async getPartnerCommissions(partnerId: string) {
    return prisma.referral.findMany({
      where: { referrerId: partnerId },
      include: {
        referee: { select: { id: true, email: true, firstName: true, lastName: true } }
      }
    });
  }

  static async processPayout(referralId: string) {
    const referral = await prisma.referral.findUnique({
      where: { id: referralId }
    });

    if (!referral) {
      throw new AppError("Referral not found.", 404, "REFERRAL_NOT_FOUND");
    }

    if (referral.status !== "CALCULATED") {
      throw new AppError("Referral is not eligible for payout calculation status.", 400, "INELIGIBLE_PAYOUT");
    }

    return prisma.referral.update({
      where: { id: referralId },
      data: { status: "PAID" }
    });
  }

  static async getReferralAnalytics() {
    const totalReferrals = await prisma.referral.count();
    const paidReferrals = await prisma.referral.count({ where: { status: "PAID" } });
    const pendingCommission = await prisma.referral.aggregate({
      where: { status: "CALCULATED" },
      _sum: { commissionEarned: true }
    });
    const totalPaidCommission = await prisma.referral.aggregate({
      where: { status: "PAID" },
      _sum: { commissionEarned: true }
    });

    return {
      totalReferrals,
      paidReferrals,
      pendingCommission: pendingCommission._sum.commissionEarned || 0,
      totalPaidCommission: totalPaidCommission._sum.commissionEarned || 0
    };
  }
}
