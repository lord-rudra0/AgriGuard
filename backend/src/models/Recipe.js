import mongoose from 'mongoose';

const PhaseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    durationHours: { type: Number, required: true }, // planned duration
    setpoints: {
      temperature: { type: Number, required: true },
      humidity: { type: Number, required: true },
      co2: { type: Number, required: true },
      light: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const RecipeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    strain: { type: String, required: true },
    phases: { type: [PhaseSchema], default: [] },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('Recipe', RecipeSchema);
