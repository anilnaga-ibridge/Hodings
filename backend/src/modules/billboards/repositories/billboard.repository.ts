import { prisma } from "@/core/config/db";
import {
  mockBillboards,
  mockBillboardAvailability,
  mockBillboardPricing,
  mockBillboardMedia,
  MockBillboard,
} from "@/utils/mockDb";
import { SearchBillboardsInput, AddMediaInput } from "../dto/billboard.dto";
import { Prisma } from "@prisma/client";

// Haversine formula helper for calculating distance in KM
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class BillboardRepository {
  private static async isDbOnline(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  static async findById(id: string) {
    if (await this.isDbOnline()) {
      return prisma.billboard.findUnique({
        where: { id },
        include: {
          media: true,
          availability: true,
          pricing: true,
        },
      });
    }

    // Fallback Mock
    const billboard = mockBillboards.find((b) => b.id === id);
    if (!billboard) return null;

    const media = mockBillboardMedia.filter((m) => m.billboardId === id);
    const availability = mockBillboardAvailability.filter((a) => a.billboardId === id);
    const pricing = mockBillboardPricing.filter((p) => p.billboardId === id);

    return {
      ...billboard,
      basePrice: billboard.pricePerDay,
      media,
      availability,
      pricing,
    } as any;
  }

  static async findByOwnerId(ownerId: string) {
    if (await this.isDbOnline()) {
      return prisma.billboard.findMany({
        where: { ownerId },
        include: { media: true },
      });
    }
    return mockBillboards.filter((b) => b.ownerId === ownerId);
  }

  static async search(filters: SearchBillboardsInput) {
    const {
      keyword,
      city,
      state,
      country,
      minPrice,
      maxPrice,
      category,
      latitude,
      longitude,
      radius,
      availableFrom,
      availableTo,
      sortBy,
      page,
      limit,
    } = filters;

    const skip = (page - 1) * limit;

    if (await this.isDbOnline()) {
      // Build Prisma query dynamic conditions
      const where: Prisma.BillboardWhereInput = {};

      if (keyword) {
        where.OR = [
          { name: { contains: keyword, mode: "insensitive" } },
          { description: { contains: keyword, mode: "insensitive" } },
          { address: { contains: keyword, mode: "insensitive" } },
        ];
      }

      if (city) where.city = { equals: city, mode: "insensitive" };
      if (state) where.state = { equals: state, mode: "insensitive" };
      if (country) where.country = { equals: country, mode: "insensitive" };
      if (minPrice !== undefined) where.basePrice = { gte: minPrice };
      if (maxPrice !== undefined) where.basePrice = { ...((where.basePrice as any) || {}), lte: maxPrice };

      if (category) {
        where.category = { name: { equals: category, mode: "insensitive" } };
      }

      // Filter by availability dates
      if (availableFrom || availableTo) {
        const fromDate = availableFrom ? new Date(availableFrom) : new Date();
        const toDate = availableTo ? new Date(availableTo) : fromDate;

        where.availability = {
          none: {
            date: {
              gte: fromDate,
              lte: toDate,
            },
            isAvailable: false,
          },
        };
      }

      let orderBy: Prisma.BillboardOrderByWithRelationInput = { createdAt: "desc" };
      if (sortBy === "popular") orderBy = { views: "desc" };
      else if (sortBy === "price_low") orderBy = { basePrice: "asc" };
      else if (sortBy === "price_high") orderBy = { basePrice: "desc" };
      else if (sortBy === "rating") orderBy = { rating: "desc" };

      const total = await prisma.billboard.count({ where });
      let billboards = await prisma.billboard.findMany({
        where,
        orderBy,
        include: { media: true },
      });

      // Implement manual Haversine distance filtering if latitude/longitude & radius are provided
      let mappedBillboards = billboards as any[];
      if (latitude !== undefined && longitude !== undefined) {
        mappedBillboards = mappedBillboards
          .map((b) => {
            const distance = calculateDistance(latitude, longitude, b.latitude, b.longitude);
            return { ...b, distanceKm: distance };
          })
          .filter((b) => (radius !== undefined ? b.distanceKm <= radius : true));

        // Sort by distance if nearest
        if (sortBy === "newest") {
          mappedBillboards.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
        }
      }

      const paginatedData = mappedBillboards.slice(skip, skip + limit);

      return {
        billboards: paginatedData,
        total: total,
        page,
        pages: Math.ceil(total / limit),
      };
    }

    // Mock Database Search Logic
    let filtered = [...mockBillboards];

    if (keyword) {
      const kw = keyword.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(kw) ||
          b.description.toLowerCase().includes(kw) ||
          b.address.toLowerCase().includes(kw)
      );
    }

    if (city) filtered = filtered.filter((b) => b.city.toLowerCase() === city.toLowerCase());
    if (state) filtered = filtered.filter((b) => b.state.toLowerCase() === state.toLowerCase());
    if (country) filtered = filtered.filter((b) => b.country.toLowerCase() === country.toLowerCase());
    if (minPrice !== undefined) filtered = filtered.filter((b) => b.pricePerDay >= minPrice);
    if (maxPrice !== undefined) filtered = filtered.filter((b) => b.pricePerDay <= maxPrice);

    // Availability filtering
    if (availableFrom || availableTo) {
      const fromStr = availableFrom ? new Date(availableFrom).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
      const toStr = availableTo ? new Date(availableTo).toISOString().split("T")[0] : fromStr;

      filtered = filtered.filter((b) => {
        // Check if there are any blocked dates in range
        const isBlocked = mockBillboardAvailability.some(
          (a) =>
            a.billboardId === b.id &&
            a.date >= fromStr &&
            a.date <= toStr &&
            !a.isAvailable
        );
        return !isBlocked;
      });
    }

    // Geo-Spatial Distance Filter
    if (latitude !== undefined && longitude !== undefined) {
      filtered = filtered
        .map((b) => {
          const dist = calculateDistance(latitude, longitude, b.latitude, b.longitude);
          return { ...b, distanceKm: dist };
        })
        .filter((b) => (radius !== undefined ? b.distanceKm <= radius : true)) as any[];
    }

    // Sorting
    if (sortBy === "popular") {
      filtered.sort((a, b) => b.views - a.views);
    } else if (sortBy === "price_low") {
      filtered.sort((a, b) => a.pricePerDay - b.pricePerDay);
    } else if (sortBy === "price_high") {
      filtered.sort((a, b) => b.pricePerDay - a.pricePerDay);
    } else if (sortBy === "rating") {
      filtered.sort((a, b) => b.rating - a.rating);
    } else {
      // Default: newest
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    // Map fields and join mock media
    const resultBillboards = paginated.map((b) => {
      const media = mockBillboardMedia.filter((m) => m.billboardId === b.id);
      return {
        ...b,
        basePrice: b.pricePerDay, // Map mock pricePerDay to basePrice decimal
        media,
      };
    });

    return {
      billboards: resultBillboards,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  static async create(ownerId: string, data: any) {
    if (await this.isDbOnline()) {
      return prisma.billboard.create({
        data: {
          ownerId,
          categoryId: data.categoryId,
          name: data.name,
          type: data.type || "STATIC",
          description: data.description,
          width: data.width,
          height: data.height,
          address: data.address,
          city: data.city || "",
          state: data.state || "",
          country: data.country || "",
          postalCode: data.postalCode || "",
          latitude: data.latitude,
          longitude: data.longitude,
          basePrice: new Prisma.Decimal(data.pricePerDay || data.basePrice || 100),
          minimumBookingDays: data.minimumBookingDays || 1,
          isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
          status: "APPROVED",
        },
      });
    }

    const newMock: MockBillboard = {
      id: `bill_${Date.now()}`,
      name: data.name,
      description: data.description,
      address: data.address,
      city: data.city || "",
      state: data.state || "",
      country: data.country || "",
      postalCode: data.postalCode || "",
      latitude: data.latitude,
      longitude: data.longitude,
      dimensions: `${data.width}m x ${data.height}m`,
      locationType: data.locationType || "STATIC",
      pricePerDay: data.pricePerDay || data.basePrice || 100,
      minimumBookingDays: data.minimumBookingDays || 1,
      isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
      rating: 0,
      reviewCount: 0,
      views: 0,
      ownerId,
      createdAt: new Date().toISOString(),
    };

    mockBillboards.push(newMock);
    return {
      ...newMock,
      basePrice: newMock.pricePerDay,
    };
  }

  static async update(id: string, data: any) {
    if (await this.isDbOnline()) {
      return prisma.billboard.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          postalCode: data.postalCode,
          latitude: data.latitude,
          longitude: data.longitude,
          basePrice: data.pricePerDay !== undefined || data.basePrice !== undefined ? new Prisma.Decimal(data.pricePerDay || data.basePrice) : undefined,
          minimumBookingDays: data.minimumBookingDays,
          isAvailable: data.isAvailable,
          status: data.status,
        },
      });
    }

    const idx = mockBillboards.findIndex((b) => b.id === id);
    if (idx === -1) return null;

    const b = mockBillboards[idx];
    if (data.name !== undefined) b.name = data.name;
    if (data.description !== undefined) b.description = data.description;
    if (data.address !== undefined) b.address = data.address;
    if (data.city !== undefined) b.city = data.city;
    if (data.state !== undefined) b.state = data.state;
    if (data.country !== undefined) b.country = data.country;
    if (data.postalCode !== undefined) b.postalCode = data.postalCode;
    if (data.latitude !== undefined) b.latitude = data.latitude;
    if (data.longitude !== undefined) b.longitude = data.longitude;
    if (data.pricePerDay !== undefined) b.pricePerDay = data.pricePerDay;
    if (data.minimumBookingDays !== undefined) b.minimumBookingDays = data.minimumBookingDays;
    if (data.isAvailable !== undefined) b.isAvailable = data.isAvailable;

    return {
      ...b,
      basePrice: b.pricePerDay,
    };
  }

  static async delete(id: string) {
    if (await this.isDbOnline()) {
      return prisma.billboard.delete({
        where: { id },
      });
    }

    const idx = mockBillboards.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    mockBillboards.splice(idx, 1);
    return { id };
  }

  static async incrementViews(id: string) {
    if (await this.isDbOnline()) {
      try {
        await prisma.billboard.update({
          where: { id },
          data: { views: { increment: 1 } },
        });
      } catch (err) {
        console.error("Error incrementing views:", err);
      }
      return;
    }

    const b = mockBillboards.find((x) => x.id === id);
    if (b) b.views += 1;
  }

  static async getAvailability(billboardId: string) {
    if (await this.isDbOnline()) {
      return prisma.billboardAvailability.findMany({
        where: { billboardId },
        orderBy: { date: "asc" },
      });
    }

    return mockBillboardAvailability.filter((a) => a.billboardId === billboardId);
  }

  static async blockDates(billboardId: string, dates: string[], isAvailable: boolean, reason: string) {
    if (await this.isDbOnline()) {
      const transactions = dates.map((d) => {
        const parsedDate = new Date(d);
        // Normalize to YYYY-MM-DD midnight
        parsedDate.setUTCHours(0, 0, 0, 0);

        return prisma.billboardAvailability.upsert({
          where: {
            // Prisma double constraint fallback since we do not have a compound unique key in the base schema,
            // we delete existing records for that date and insert a new one
            id: `block_${billboardId}_${parsedDate.getTime()}`,
          },
          update: {
            isAvailable,
            blockedReason: reason,
          },
          create: {
            id: `block_${billboardId}_${parsedDate.getTime()}`,
            billboardId,
            date: parsedDate,
            isAvailable,
            blockedReason: reason,
          },
        });
      });

      return prisma.$transaction(transactions);
    }

    // Fallback Mock block
    for (const d of dates) {
      const dateStr = new Date(d).toISOString().split("T")[0];
      const idx = mockBillboardAvailability.findIndex(
        (a) => a.billboardId === billboardId && a.date === dateStr
      );

      if (idx !== -1) {
        mockBillboardAvailability[idx].isAvailable = isAvailable;
        mockBillboardAvailability[idx].blockedReason = reason;
      } else {
        mockBillboardAvailability.push({
          id: `block_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          billboardId,
          date: dateStr,
          isAvailable,
          blockedReason: reason,
        });
      }
    }

    return mockBillboardAvailability.filter((a) => a.billboardId === billboardId);
  }

  static async addMedia(billboardId: string, data: AddMediaInput) {
    if (await this.isDbOnline()) {
      return prisma.billboardMedia.create({
        data: {
          billboardId,
          fileUrl: data.fileUrl,
          thumbnailUrl: data.thumbnailUrl || null,
          fileType: data.fileType,
          displayOrder: data.displayOrder,
        },
      });
    }

    const newMedia = {
      id: `media_${Date.now()}`,
      billboardId,
      fileUrl: data.fileUrl,
      thumbnailUrl: data.thumbnailUrl || null,
      fileType: data.fileType,
      displayOrder: data.displayOrder,
    };

    mockBillboardMedia.push(newMedia);
    return newMedia;
  }

  static async getOwnerStats(ownerId: string) {
    if (await this.isDbOnline()) {
      const billboards = await prisma.billboard.findMany({
        where: { ownerId },
        include: { bookings: true },
      });

      const total = billboards.length;
      const active = billboards.filter((b) => b.isAvailable && b.status === "APPROVED").length;

      // Compute bookings
      let upcomingBookings = 0;
      let totalRevenue = 0;
      let bookedDays = 0;

      const now = new Date();
      billboards.forEach((b) => {
        b.bookings.forEach((bk) => {
          if (bk.startDate > now) upcomingBookings++;
          if (bk.status === "CONFIRMED" || bk.status === "COMPLETED") {
            totalRevenue += Number(bk.totalAmount);
            // Calculate length of booking
            const diffTime = Math.abs(bk.endDate.getTime() - bk.startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
            bookedDays += diffDays;
          }
        });
      });

      // Calculate Occupancy rate (assuming last 30 days)
      const occupancyRate = total > 0 ? Math.min(100, Math.round((bookedDays / (total * 30)) * 100)) : 0;

      // Most viewed
      let mostViewed = null;
      if (billboards.length > 0) {
        mostViewed = billboards.reduce((prev, current) => (prev.views > current.views ? prev : current));
      }

      return {
        totalBillboards: total,
        activeBillboards: active,
        upcomingBookings,
        occupancyRate,
        revenue: totalRevenue,
        mostViewedBillboard: mostViewed ? { id: mostViewed.id, name: mostViewed.name, views: mostViewed.views } : null,
      };
    }

    // Fallback Mock Stats
    const billboards = mockBillboards.filter((b) => b.ownerId === ownerId);
    const total = billboards.length;
    const active = billboards.filter((b) => b.isAvailable).length;

    // Static demo stats for mock dashboard
    const upcomingBookings = 3;
    const revenue = billboards.reduce((acc, curr) => acc + curr.pricePerDay * 14, 0); // Simulated 2 weeks of bookings
    const occupancyRate = total > 0 ? 68 : 0;

    let mostViewed = null;
    if (billboards.length > 0) {
      mostViewed = billboards.reduce((prev, current) => (prev.views > current.views ? prev : current));
    }

    return {
      totalBillboards: total,
      activeBillboards: active,
      upcomingBookings,
      occupancyRate,
      revenue,
      mostViewedBillboard: mostViewed ? { id: mostViewed.id, name: mostViewed.name, views: mostViewed.views } : null,
    };
  }
}
