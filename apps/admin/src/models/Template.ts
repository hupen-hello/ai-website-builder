import mongoose, { Schema, models } from "mongoose";

const templateSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    selectedLayouts: { type: Schema.Types.Mixed, required: true },
    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);

const Template = models.Template || mongoose.model("Template", templateSchema);
export default Template;