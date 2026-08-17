import mongoose from 'mongoose'
const { Schema, model, models } = mongoose
export const ARProcedure = models.ARProcedure || model('ARProcedure', new Schema({ fault: String, steps: [String], modelUrl: String }, { timestamps: true }))
export const TrainingModule = models.TrainingModule || model('TrainingModule', new Schema({ title: { type: String, required: true }, fault: String, description: String, steps: [String], durationMinutes: Number }, { timestamps: true }))
export const VRScenario = models.VRScenario || model('VRScenario', new Schema({ trainingModuleId: { type: Schema.Types.ObjectId, ref: 'TrainingModule' }, title: String, sceneUrl: String, requiredCapabilities: [String], fallbackInstructions: [String] }, { timestamps: true }))
