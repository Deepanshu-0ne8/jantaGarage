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
            enum: ['Low', 'Medium', 'High'],
            required: true
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                required: true
            },
            coordinates: {
                type: [Number],
                required: true
            }
        },
        status: {
            type: String,
            enum: ['Pending', 'Verified', 'Resolved'],
            default: 'Pending'
        },
        image: {
            url: {
                type: String,
            }
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true,
    }
);

reportSchema.index({ location: '2dsphere' });

const Report = mongoose.model('Report', reportSchema);

export default Report;