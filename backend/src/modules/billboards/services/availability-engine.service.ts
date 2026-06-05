import { BillboardRepository } from "../repositories/billboard.repository";

export class AvailabilityEngineService {
  /**
   * Generates calendar view for a billboard for a specified range (defaults to 30 days from today)
   */
  static async getCalendar(billboardId: string, daysAhead: number = 30) {
    const billboard = await BillboardRepository.findById(billboardId);
    if (!billboard) {
      throw new Error("Billboard not found");
    }

    const blockedDates = await BillboardRepository.getAvailability(billboardId);
    
    // Create map of blocked dates for constant time lookup
    // Key format: YYYY-MM-DD
    const blockedMap = new Map<string, { isAvailable: boolean; reason?: string | null }>();
    blockedDates.forEach((b) => {
      const dateKey = new Date(b.date).toISOString().split("T")[0];
      blockedMap.set(dateKey, {
        isAvailable: b.isAvailable,
        reason: b.blockedReason,
      });
    });

    const calendar = [];
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    for (let i = 0; i < daysAhead; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const dateKey = currentDate.toISOString().split("T")[0];

      const blockedInfo = blockedMap.get(dateKey);
      
      calendar.push({
        date: dateKey,
        isAvailable: blockedInfo ? blockedInfo.isAvailable : billboard.isAvailable,
        blockedReason: blockedInfo ? blockedInfo.reason : null,
      });
    }

    return calendar;
  }

  /**
   * Checks if a date range is fully available for booking
   */
  static async checkRangeAvailability(billboardId: string, startDateStr: string, endDateStr: string): Promise<boolean> {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error("Invalid start or end date.");
    }

    if (endDate < startDate) {
      throw new Error("End date cannot be before start date.");
    }

    // Get all blocked dates for the billboard
    const blockedDates = await BillboardRepository.getAvailability(billboardId);
    
    // Normalize time to start of day for comparison
    const startObj = new Date(startDateStr);
    startObj.setUTCHours(0, 0, 0, 0);
    const endObj = new Date(endDateStr);
    endObj.setUTCHours(23, 59, 59, 999);

    // Look for any date in the range that is blocked (isAvailable = false)
    const hasConflict = blockedDates.some((b) => {
      const d = new Date(b.date);
      return d >= startObj && d <= endObj && !b.isAvailable;
    });

    return !hasConflict;
  }

  /**
   * Block/reserve dates for a billboard (creates blocked availability records)
   */
  static async blockDates(
    billboardId: string,
    dates: string[],
    isAvailable: boolean,
    reason: string
  ) {
    return BillboardRepository.blockDates(billboardId, dates, isAvailable, reason);
  }
}
