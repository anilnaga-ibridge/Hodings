export class PricingEngineService {
  // Peak season months: November, December, January, February (OOH winter peak)
  private static PEAK_SEASON_MONTHS = [10, 11, 0, 1]; // 0-indexed: Nov, Dec, Jan, Feb

  static calculate(
    basePricePerDay: number,
    startDateStr: string,
    endDateStr: string,
    peakSeasonMultiplierOverride?: number
  ) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Ensure dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error("Invalid start or end date.");
    }

    if (endDate < startDate) {
      throw new Error("End date cannot be before start date.");
    }

    // Calculate total days
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    let baseAmount = 0;
    let finalAmount = 0;

    const currentDay = new Date(startDate);

    // Detailed daily calculation to apply weekend and peak season factors dynamically
    for (let i = 0; i < totalDays; i++) {
      let dailyPrice = basePricePerDay;
      const dayOfWeek = currentDay.getDay(); // 0 = Sunday, 6 = Saturday
      const month = currentDay.getMonth();

      // 1. Peak Season Multiplier (1.5x)
      const isPeakMonth = this.PEAK_SEASON_MONTHS.includes(month);
      if (isPeakMonth) {
        const peakMultiplier = peakSeasonMultiplierOverride || 1.5;
        dailyPrice *= peakMultiplier;
      }

      // 2. Weekend Multiplier (1.2x)
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      if (isWeekend) {
        dailyPrice *= 1.2;
      }

      baseAmount += basePricePerDay;
      finalAmount += dailyPrice;

      // Increment day
      currentDay.setDate(currentDay.getDate() + 1);
    }

    // 3. Duration Discounts:
    // >= 30 days: 10% discount
    // >= 7 days: 5% discount
    let discountPercent = 0;
    if (totalDays >= 30) {
      discountPercent = 0.10;
    } else if (totalDays >= 7) {
      discountPercent = 0.05;
    }

    const discountAmount = finalAmount * discountPercent;
    const finalAmountAfterDiscount = finalAmount - discountAmount;

    return {
      days: totalDays,
      baseAmount: Math.round(baseAmount * 100) / 100,
      subtotalAmount: Math.round(finalAmount * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      finalAmount: Math.round(finalAmountAfterDiscount * 100) / 100,
    };
  }
}
