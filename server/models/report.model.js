import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Report title is required"],
    },
    description: {
      type: String,
      trim: true,
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High"],
      required: true,
    },
    departments: {
      type: [String],
      enum: [
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
      ],
      required: [
        true,
        "Please select at least one department to file your complaint.",
      ],
      validate: {
        validator: function (arr) {
          return Array.isArray(arr) && arr.length > 0;
        },
        message: "At least one department must be selected.",
      },
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "Resolved"],
      default: "OPEN",
    },
    image: {
      url: {
        type: String,
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isNotifiedTOResolved: {
      type: Boolean,
      default: false,
    },
    isAssigned: {
      type: Boolean,
      default: false,
    },
    isOverdue: {
      type: Boolean,
      default: false,
    },
    isEscalated: {
      type: Boolean,
      default: false,
    },
 
    assignedTo: {
      name: {
        type: String,
        trim: true,
      },
      userName: {
        type: String,
        trim: true,
      },
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          "Please fill a valid email address",
        ],
      },
    },
    assignedBy: {
      name: {
        type: String,
        trim: true,
      },
      userName: {
        type: String,
        trim: true,
      },
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          "Please fill a valid email address",
        ],
      },
    },
    resolutionComments: {
      type: String,
      trim: true,
      default: null,
    },
    deadline: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ location: "2dsphere" });

const Report = mongoose.model("Report", reportSchema);

export default Report;
