import { PrismaClient } from "@prisma/client";

let prismaInstance: any = null;

// Use a Proxy to defer PrismaClient instantiation until the first property is accessed.
// This prevents Next.js static build phase from crashing if DATABASE_URL is invalid/unresolvable.
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!prismaInstance) {
      try {
        prismaInstance = new PrismaClient({
          log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
        });
      } catch (err: any) {
        console.error("Prisma Client initialization failed during lazy-loading:", err.message);
        // Fallback to a dummy object that will return falsy or throw on query execution
        prismaInstance = {
          $queryRaw: async () => { throw new Error("Database offline"); },
          billboard: {
            findUnique: async () => null,
            findMany: async () => [],
            count: async () => 0,
            create: async () => { throw new Error("Database offline"); },
            update: async () => { throw new Error("Database offline"); },
            delete: async () => { throw new Error("Database offline"); },
          },
          billboardAvailability: {
            findMany: async () => [],
            upsert: async () => { throw new Error("Database offline"); },
          },
          billboardMedia: {
            create: async () => { throw new Error("Database offline"); },
          },
          $transaction: async () => { throw new Error("Database offline"); }
        };
      }
    }

    const value = prismaInstance[prop];
    if (typeof value === "function") {
      return value.bind(prismaInstance);
    }
    return value;
  },
});
