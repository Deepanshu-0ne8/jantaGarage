import mongoose from "mongoose";
import { DEFAULT_DP } from "../config/env.js";

const departmentList = [
  "Water Supply & Sewage Department",
  "Public Health & Sanitation Department",
  "Roads & Infrastructure Department",
  "Street Lighting Department",
  "Parks & Horticulture Department",
  "Building & Construction Department",
  "Drainage Department",
  "Electricity Department",
  "Public Works Department",
  "Traffic & Transportation Department",
  "Solid Waste Management Department",
  "Animal Control Department",
  "Health & Hospital Services",
  "Fire & Emergency Services",
  "Environmental Department",
  "Revenue Department",
  "Urban Planning & Development Authority",
  "Public Grievance & Complaint Cell",
];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      minlength: [2, "user name must be at least 3 characters"],
      maxlength: [100, "user name must be at most 100 characters"],
    },
    userName: {
      type: String,
      required: [true, "username is required"],
      trim: true,
      minlength: [2, "user name must be at least 3 characters"],
      maxlength: [100, "user name must be at most 100 characters"],
    },
    email: {
      type: String,
      required: [true, "user email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "please fill a valid email address"],
    },
    password: {
      type: String,
      required: [true, "user password is required"],
      minlength: [6, "password must be at least 6 characters"],
      maxlength: [128, "password must be at most 128 characters"],
    },
    otp: {
      type: String,
    },
    otpExpiry: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["citizen", "staff", "admin"],
      default: "citizen",
    },
    contact: {
      type: Number,
      required: [true, "contact number is required"],
      unique: true,
      trim: true,
      match: [/^\d{10}$/, "please fill a valid 10 digit contact number"],
    },
    displaypic: {
      url: {
        type: String,
        default: DEFAULT_DP,
      },
    },
    address: {
      type: String,
      trim: true,
    },
    reportsForVerification: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Report",
      default: []
    },
    reportsAssigned: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Report",
      default: []
    },
    departments: {
      type: [String],
      enum: departmentList,
      default: [],
      validate: {
        validator: function (value) {
          if (this.role === "citizen" && value.length > 0) {
            return false;
          }
          return true;
        },
        message: "Citizens cannot have departments.",
      },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
export { departmentList };
