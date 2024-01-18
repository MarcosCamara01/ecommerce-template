import { AddressDocument, UserDocument } from "@/types/types";
import { Schema, model, models } from "mongoose";

const AddressSchema = new Schema<AddressDocument>({
  city: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  line1: {
    type: String,
    required: true,
  },
  line2: {
    type: String,
    required: false,
  },
  postal_code: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
});

const UserSchema = new Schema<UserDocument>({
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Email is invalid",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    name: {
      type: String,
      required: [true, "Fullname is required"],
      minLength: [3, "fullname must be at least 3 characters"],
      maxLength: [25, "fullname must be at most 25 characters"],
    },
    phone: {
      type: String,
      default: ""
    },
    address: {
      type: AddressSchema,
      default: null 
    }
  },
  {
    timestamps: true,
  }
);

const User = models.User || model<UserDocument>('User', UserSchema);
export default User;