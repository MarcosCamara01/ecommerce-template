import { connectDB } from "@/libs/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    await connectDB();

    const { fullname, email, password } = await request.json();

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const userFound = await User.findOne({ email });

    if (userFound) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      fullname,
      email,
      password: hashedPassword,
    });

    const savedUser = await user.save();

    console.log(savedUser);

    return NextResponse.json(
      {
        fullname: savedUser.fullname,
        email: savedUser.email,
        createdAt: savedUser.createdAt,
        updatedAt: savedUser.updatedAt,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    } else {
      console.error("Error during signup:", error);
      return NextResponse.error();
    }
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();

    const { userId, fullname, email, password } = await request.json();

    if (password && password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const userToUpdate = await User.findById(userId);

    if (!userToUpdate) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (fullname) {
      userToUpdate.fullname = fullname;
    }

    if (email) {
      userToUpdate.email = email;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      userToUpdate.password = hashedPassword;
    }

    await userToUpdate.save();

    console.log(userToUpdate);

    return NextResponse.json(
      {
        message: "User updated successfully",
        updatedUser: {
          id: userToUpdate._id,
          fullname: userToUpdate.fullname,
          email: userToUpdate.email,
          createdAt: userToUpdate.createdAt,
          updatedAt: userToUpdate.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    } else {
      console.error("Error during user update:", error);
      return NextResponse.error();
    }
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();

    const { userId, itemId } = await request.json();

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (itemId) {
      user.cart = user.cart.filter((cartItem: any) => cartItem._id !== itemId);
      await user.save();
      return NextResponse.json(
        { message: "Cart item deleted successfully" },
        { status: 200 }
      );
    }

    await user.remove();

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error during user/cart item deletion:", error);
    return NextResponse.error();
  }
}