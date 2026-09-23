import mongoose, { Schema, models } from "mongoose";

const categorySchema = new Schema(
  {
    order: { type: Number, default: 1 },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    type: { type: String, required: false },
    icon: { type: String, required: false },
    description: { type: String },
    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);

const Category = models.Category || mongoose.model("Category", categorySchema);
export default Category;