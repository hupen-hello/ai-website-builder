import mongoose, { Schema, models } from "mongoose";

const categoryTypeSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);

const CategoryType = models.CategoryType || mongoose.model("CategoryType", categoryTypeSchema);
export default CategoryType;