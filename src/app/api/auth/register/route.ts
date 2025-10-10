import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email } = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        // Note: We're not storing the password in the User model
        // In a real app, you'd have a separate credentials table
        // For now, we'll just create the user
      },
    });

    // Create a default character for the user
    const character = await db.character.create({
      data: {
        name: name,
        level: 1,
        experience: 0,
        health: 100,
        maxHealth: 100,
        attack: 10,
        defense: 5,
        speed: 5,
        perception: 5,
        gold: 100,
        reputation: 0,
        isOnline: false,
        userId: user.id,
      },
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        character: {
          id: character.id,
          name: character.name,
          level: character.level,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
