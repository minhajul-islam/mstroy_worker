import mongoose, { Schema, InferSchemaType, models, model } from "mongoose";

const StorySchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  categories: { type: [String], default: [] },
  thumbnail: { type: String },
  icon: { type: String },
  story: { type: Schema.Types.Mixed },
  video: { type: String },
}, { timestamps: true });

export type Story = InferSchemaType<typeof StorySchema> & { _id: mongoose.Types.ObjectId };

export default models.Story || model("Story", StorySchema);
