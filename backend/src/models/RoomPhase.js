import mongoose from 'mongoose';

const ActivePhaseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    index: { type: Number, required: true }, // index in recipe.phases
    startedAt: { type: Date, default: Date.now },
    durationHours: { type: Number, required: true },
    setpoints: {
      temperature: { type: Number, required: true },
      humidity: { type: Number, required: true },
      co2: { type: Number, required: true },
      light: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const RoomPhaseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    roomId: { type: String, required: true, index: true },
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
    recipeName: { type: String, required: true },
    strain: { type: String, required: true },
    active: { type: ActivePhaseSchema, required: true },
  },
  { timestamps: true }
);

RoomPhaseSchema.index({ userId: 1, roomId: 1 }, { unique: true });

export default mongoose.model('RoomPhase', RoomPhaseSchema);
