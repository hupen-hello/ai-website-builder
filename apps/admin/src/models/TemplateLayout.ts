import mongoose, { Schema, models } from "mongoose";

const templateLayoutSchema = new Schema(
  {
    order: { type: Number, default: 1 }, 
    name: { type: String, required: true }, 
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    sectionType: { type: String, required: true }, 
    sectionNumber: { type: Number, default: 1 }, 
    jsonCode: { type: String }, 
    thumbnailUrl: { type: String }, 
    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);

const TemplateLayout = models.TemplateLayout || mongoose.model("TemplateLayout", templateLayoutSchema);
export default TemplateLayout;