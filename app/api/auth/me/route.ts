import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/db";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "sunlytix-jwt-secret-key";

/**
 * GET /api/auth/me
 * Returns the current logged-in user's profile from the JWT cookie.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Verify JWT
    let decoded: { userId: string; email: string; name: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as typeof decoded;
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Fetch full user from DB
    const client = await clientPromise;
    const db = client.db("sunlytix");
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { password: 0 } } // exclude password
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        provider: user.provider || "credentials",
        photoURL: user.photoURL || null,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt || null,
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
