// File: lib/auth.ts
import type { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

interface AuthPayload {
  userId: string;
  role: string;
  email: string;
  iat: number;
  exp: number;
}

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set in environment variables");
  }
  return new TextEncoder().encode(secret);
};

/**
 * Fungsi helper untuk mendapatkan dan memverifikasi data otentikasi dari cookie sebuah request.
 * @param request Objek Request yang masuk.
 * @returns Promise yang berisi payload otentikasi jika token valid, atau null jika tidak.
 */
export async function getAuthFromCookie(
  request: Request | NextRequest
): Promise<AuthPayload | null> {
  // Ambil cookie 'authToken' dari header 'cookie'
  let cookieHeader = "";

  // Handle both Request and NextRequest objects
  if (request instanceof Request) {
    cookieHeader = request.headers.get("cookie") || "";
  } else {
    // NextRequest has a cookies property - cast to any to bypass type checking
    const tokenCookie = (request as any).cookies?.get("authToken")?.value;
    if (tokenCookie) {
      cookieHeader = `authToken=${tokenCookie}`;
    }
  }

  const tokenCookie = cookieHeader.match(/authToken=([^;]+)/);

  if (!tokenCookie || !tokenCookie[1]) {
    return null;
  }

  const token = tokenCookie[1];

  try {
    // Verifikasi token menggunakan jose
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload as unknown as AuthPayload;
  } catch (error) {
    console.error("Invalid token from cookie:", error);
    return null;
  }
}

/**
 * Fungsi helper untuk mendapatkan dan memverifikasi data otentikasi dari Authorization header (untuk mobile clients).
 * @param request Objek Request yang masuk.
 * @returns Promise yang berisi payload otentikasi jika token valid, atau null jika tidak.
 */
export async function getAuthFromHeader(
  request: Request | NextRequest
): Promise<AuthPayload | null> {
  // Ambil token dari Authorization header
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  try {
    // Verifikasi token menggunakan jose
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload as unknown as AuthPayload;
  } catch (error) {
    console.error("Invalid token from Authorization header:", error);
    return null;
  }
}

// Fungsi untuk server-side session
export async function getServerSession(request: NextRequest) {
  const auth = await getAuthFromCookie(request);
  return auth ? { userId: auth.userId, role: auth.role, email: auth.email } : null;
}

// ==============================
// PERMISSION CHECKING HELPERS
// ==============================

// Permission cache to avoid repeated database calls
const permissionCache = new Map<string, { result: boolean; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Check if user has specific permission for resource and action
 * Optimized with caching and efficient database queries
 */
export async function checkUserPermission(
  request: Request | NextRequest,
  resource: string,
  action: string
): Promise<boolean> {
  // Try cookie auth first (for web clients)
  let auth = await getAuthFromCookie(request);

  // If no cookie auth, try Authorization header (for mobile clients)
  if (!auth || !auth.userId) {
    auth = await getAuthFromHeader(request);
  }

  if (!auth?.userId) {
    return false;
  }

  // Admin users always have all permissions
  if (auth.role === 'ADMIN') {
    return true;
  }

  // Create cache key
  const cacheKey = `${auth.userId}_${resource}_${action}`;
  const now = Date.now();

  // Check cache first
  const cached = permissionCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.result;
  }

  try {
    const { prisma } = await import('@/lib/prisma');

    // Optimized query: 2-step approach instead of complex nested joins
    // Step 1: Find permission by resource and action
    const permission = await prisma.permission.findFirst({
      where: {
        resource: resource,
        action: action
      },
      select: { id: true }
    });

    if (!permission) {
      // Permission doesn't exist, cache and return false
      permissionCache.set(cacheKey, { result: false, timestamp: now });
      return false;
    }

    // Step 2: Check if user's role has this permission (direct query)
    const rolePermission = await prisma.rolePermission.findFirst({
      where: {
        roleId: auth.role, // Direct role lookup
        permissionId: permission.id
      },
      select: { id: true } // Only select id for performance
    });

    const result = !!rolePermission;

    // Cache the result
    permissionCache.set(cacheKey, { result, timestamp: now });

    return result;
  } catch (error) {
    console.error('Permission check failed:', error);
    // Don't cache errors, return false
    return false;
  }
}

// Helper to require authentication
export async function requireAuth(request: Request | NextRequest) {
  const auth = await getAuthFromCookie(request);
  if (!auth) {
    throw new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return auth;
}

// Helper to require specific permission
export async function requirePermission(
  request: Request | NextRequest,
  resource: string,
  action: string
) {
  const hasPermission = await checkUserPermission(request, resource, action);
  if (!hasPermission) {
    throw new Response(JSON.stringify({ message: "Forbidden - Insufficient permissions" }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Legacy helper for admin-only operations (should migrate to permission-based)
export async function requireAdmin(request: Request | NextRequest) {
  const auth = await getAuthFromCookie(request);
  if (!auth) {
    throw new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // For now, check role directly - should be migrated to permission system
  if (auth.role !== 'ADMIN') {
    throw new Response(JSON.stringify({ message: "Forbidden - Admin access required" }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return auth;
}
