import { FavoritesDocument } from "@/types/types";
import { Schema, model, models } from "mongoose";

const FavoritesSchema = new Schema<FavoritesDocument>({
  userId: {
    type: String,
    required: true,
  },
  favorites: {
    type: [Schema.Types.ObjectId],
    default: [],
  },
});

export const Favorites =
  models.Favorites || model("Favorites", FavoritesSchema);
