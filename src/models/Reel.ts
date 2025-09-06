import mongoose, { Schema, InferSchemaType, models, model } from "mongoose";

const ReelSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  categories: { type: [String], default: [] },
  thumbnail: { type: String, required: true },
  video: { type: String, required: true },
}, { timestamps: true });

export type Reel = InferSchemaType<typeof ReelSchema> & { _id: mongoose.Types.ObjectId };

export default models.Reel || model("Reel", ReelSchema);
