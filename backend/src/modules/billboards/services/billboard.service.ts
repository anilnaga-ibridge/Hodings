import { BillboardRepository } from "../repositories/billboard.repository";
import { SearchBillboardsInput, AddMediaInput } from "../dto/billboard.dto";
import { PricingEngineService } from "./pricing-engine.service";
import { AvailabilityEngineService } from "./availability-engine.service";
import { cacheService } from "@/core/services/cache.service";
import { AppError } from "@/core/errors/AppError";

export class BillboardService {
  private static CACHE_TTL_SEARCH = 300; // 5 minutes
  private static CACHE_TTL_DETAIL = 600; // 10 minutes

  static async getDetails(id: string) {
    const cacheKey = `billboards:detail:${id}`;
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) {
      // Background task to track views increment asynchronously
      BillboardRepository.incrementViews(id);
      return cached;
    }

    const billboard = await BillboardRepository.findById(id);
    if (!billboard) {
      throw new AppError("Billboard listing not found.", 404, "BILLBOARD_NOT_FOUND");
    }

    // Increment view count
    await BillboardRepository.incrementViews(id);

    // Re-fetch or manually update views count for the cache
    const updatedBillboard = await BillboardRepository.findById(id);

    await cacheService.set(cacheKey, updatedBillboard, this.CACHE_TTL_DETAIL);
    return updatedBillboard;
  }

  static async findByOwnerId(ownerId: string) {
    return BillboardRepository.findByOwnerId(ownerId);
  }

  static async search(filters: SearchBillboardsInput) {
    const cacheKey = `billboards:search:${JSON.stringify(filters)}`;
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await BillboardRepository.search(filters);
    await cacheService.set(cacheKey, result, this.CACHE_TTL_SEARCH);
    return result;
  }

  static async create(ownerId: string, data: any) {
    const billboard = await BillboardRepository.create(ownerId, data);
    
    // Invalidate search caches
    await cacheService.invalidatePrefix("billboards:search:");
    
    return billboard;
  }

  static async update(id: string, ownerId: string, role: string, data: any) {
    const existing = await BillboardRepository.findById(id);
    if (!existing) {
      throw new AppError("Billboard listing not found.", 404, "BILLBOARD_NOT_FOUND");
    }

    // Security Check: Owner can only edit own, admin can edit all
    if (existing.ownerId !== ownerId && role !== "ADMIN" && role !== "SUPER_ADMIN") {
      throw new AppError("You do not have permission to modify this listing.", 403, "FORBIDDEN");
    }

    const updated = await BillboardRepository.update(id, data);

    // Invalidate caches
    await cacheService.del(`billboards:detail:${id}`);
    await cacheService.invalidatePrefix("billboards:search:");

    return updated;
  }

  static async delete(id: string, ownerId: string, role: string) {
    const existing = await BillboardRepository.findById(id);
    if (!existing) {
      throw new AppError("Billboard listing not found.", 404, "BILLBOARD_NOT_FOUND");
    }

    // Security Check: Owner can only delete own, admin can delete all
    if (existing.ownerId !== ownerId && role !== "ADMIN" && role !== "SUPER_ADMIN") {
      throw new AppError("You do not have permission to delete this listing.", 403, "FORBIDDEN");
    }

    await BillboardRepository.delete(id);

    // Invalidate caches
    await cacheService.del(`billboards:detail:${id}`);
    await cacheService.invalidatePrefix("billboards:search:");

    return { success: true };
  }

  // --- Availability Sub-Service Calls ---
  static async getCalendar(id: string) {
    return AvailabilityEngineService.getCalendar(id);
  }

  static async blockAvailability(id: string, ownerId: string, role: string, dates: string[], isAvailable: boolean, reason: string) {
    const existing = await BillboardRepository.findById(id);
    if (!existing) {
      throw new AppError("Billboard listing not found.", 404, "BILLBOARD_NOT_FOUND");
    }

    // Security check
    if (existing.ownerId !== ownerId && role !== "ADMIN" && role !== "SUPER_ADMIN") {
      throw new AppError("You do not have permission to modify availability for this billboard.", 403, "FORBIDDEN");
    }

    const result = await AvailabilityEngineService.blockDates(id, dates, isAvailable, reason);

    // Invalidate cache
    await cacheService.del(`billboards:detail:${id}`);
    await cacheService.invalidatePrefix("billboards:search:");

    return result;
  }

  // --- Pricing calculations ---
  static async calculatePricing(id: string, startDate: string, endDate: string) {
    const billboard = await BillboardRepository.findById(id);
    if (!billboard) {
      throw new AppError("Billboard listing not found.", 404, "BILLBOARD_NOT_FOUND");
    }

    // Validate minimum booking days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const b = billboard as any;
    if (totalDays < b.minimumBookingDays) {
      throw new AppError(
        `Booking duration (${totalDays} days) is less than the minimum required (${b.minimumBookingDays} days).`,
        400,
        "INVALID_DURATION"
      );
    }

    // Check availability conflicts
    const isAvailable = await AvailabilityEngineService.checkRangeAvailability(id, startDate, endDate);
    if (!isAvailable) {
      throw new AppError("The billboard is already booked or unavailable during these dates.", 400, "DATE_RANGE_UNAVAILABLE");
    }

    const pricePerDay = Number(b.basePrice);
    return PricingEngineService.calculate(pricePerDay, startDate, endDate);
  }

  // --- Media upload association ---
  static async addMedia(id: string, ownerId: string, role: string, data: AddMediaInput) {
    const existing = await BillboardRepository.findById(id);
    if (!existing) {
      throw new AppError("Billboard listing not found.", 404, "BILLBOARD_NOT_FOUND");
    }

    // Security check
    if (existing.ownerId !== ownerId && role !== "ADMIN" && role !== "SUPER_ADMIN") {
      throw new AppError("You do not have permission to add media to this billboard.", 403, "FORBIDDEN");
    }

    const media = await BillboardRepository.addMedia(id, data);

    // Invalidate cache
    await cacheService.del(`billboards:detail:${id}`);

    return media;
  }

  // --- Owner Statistics ---
  static async getOwnerStats(ownerId: string) {
    return BillboardRepository.getOwnerStats(ownerId);
  }
}
