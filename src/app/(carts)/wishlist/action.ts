"use server"

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/auth";
import { Session } from "next-auth";
import { Favorites } from "@/models/Favorites";
import { Schema } from "mongoose";
import { connectDB } from "@/libs/mongodb";

export async function getFavorites() {
    try {
        connectDB();

        const session: Session | null = await getServerSession(authOptions);
        const userId = session?.user._id;

        if (!userId) {
            console.log("User ID not found in session.");
            return null;
        }

        let userFavorites = await Favorites.find({ userId: userId });

        if (!userFavorites) {
            userFavorites = await Favorites.create({ userId });
        }

        const jsonData = JSON.parse(JSON.stringify(userFavorites))
        return jsonData;
    } catch (error) {
        console.error("Error getting user favorites:", error);
        return null;
    }
}

export async function addFavorite(productId: Schema.Types.ObjectId) {
    connectDB();

    try {
        const session: Session | null = await getServerSession(authOptions);
        const userId = session?.user._id;

        if (!userId) {
            throw new Error("User ID not found in session.");
        }

        let userFavorites = await Favorites.findOne({ userId });

        if (!userFavorites) {
            userFavorites = await Favorites.create({ userId, favorites: [productId] });
        } else {
            if (userFavorites.favorites.includes(productId)) {
                userFavorites = await Favorites.findOneAndUpdate(
                    { userId },
                    { $pull: { favorites: productId } },
                    { new: true }
                );
                console.log(userFavorites);
            } else {
                userFavorites.favorites.push(productId);
                userFavorites = await userFavorites.save();
            }
        }

        const favoritesJSON = JSON.stringify(userFavorites.favorites);
        return favoritesJSON;
    } catch (error) {
        console.error("Error adding favorite:", error);
        return null;
    }
}