import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/db";

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

    // Check if user already exists
    const existingUser = await users.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      // Update last login for existing user
      await users.updateOne(
        { _id: existingUser._id },
        {
          $set: {
            lastLoginAt: new Date(),
            ...(photoURL && { photoURL }),
          },
        }
      );

      return NextResponse.json(
        {
          message: "Login successful",
          user: {
            id: existingUser._id.toString(),
            name: existingUser.name,
            email: existingUser.email,
          },
        },
        { status: 200 }
      );
    }

    // Create new user from Google auth
    const result = await users.insertOne({
      name: name || email.split("@")[0],
      email: email.toLowerCase().trim(),
      firebaseUid: uid,
      photoURL: photoURL || null,
      provider: "google",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: result.insertedId.toString(),
          name: name || email.split("@")[0],
          email: email.toLowerCase(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
