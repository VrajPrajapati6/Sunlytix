import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 * Clears the auth-token cookie to log the user out.
 */
export async function POST() {
  const response = NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 }
  );

  response.cookies.set("auth-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // expire immediately
    path: "/",
  });

  return response;
}
