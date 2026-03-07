import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "sunlytix-jwt-secret-key";

export async function POST(req: NextRequest) {
  try {
    const { name, email, uid, photoURL } = await req.json();

    if (!email || !uid) {
      return NextResponse.json(
        { error: "Email and UID are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("sunlytix");
    const users = db.collection("users");

    const existingUser = await users.findOne({ email: email.toLowerCase() });

    let userId: string;
    let userName: string;
    let statusCode: number;
    let message: string;

    if (existingUser) {
      await users.updateOne(
        { _id: existingUser._id },
        {
          $set: {
            lastLoginAt: new Date(),
            ...(photoURL && { photoURL }),
          },
        }
      );
      userId = existingUser._id.toString();
      userName = existingUser.name;
      statusCode = 200;
      message = "Login successful";
    } else {
      const result = await users.insertOne({
        name: name || email.split("@")[0],
        email: email.toLowerCase().trim(),
        firebaseUid: uid,
        photoURL: photoURL || null,
        provider: "google",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      userId = result.insertedId.toString();
      userName = name || email.split("@")[0];
      statusCode = 201;
      message = "Account created successfully";
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId, email: email.toLowerCase(), name: userName },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json(
      {
        message,
        user: { id: userId, name: userName, email: email.toLowerCase() },
      },
      { status: statusCode }
    );

    // Set HTTP-only cookie (same as credentials login)
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

