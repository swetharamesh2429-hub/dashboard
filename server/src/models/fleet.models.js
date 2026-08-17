import mongoose from 'mongoose'
import { scoped } from './core.models.js'
const { Schema, model, models } = mongoose
export const Vehicle = models.Vehicle || model('Vehicle', new Schema({ ...scoped, vehicleId: { type: String, required: true }, driverId: { type: Schema.Types.ObjectId, ref: 'User' }, status: String, health: Number, location: Schema.Types.Mixed }, { timestamps: true }))
export const SensorReading = models.SensorReading || model('SensorReading', new Schema({ ...scoped, vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', index: true }, metrics: Schema.Types.Mixed }, { timestamps: true }))
export const Prediction = models.Prediction || model('Prediction', new Schema({ ...scoped, vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' }, fault: String, risk: { type: String, enum: ['IMMEDIATE', 'SHORT-TERM', 'LONG-TERM'] }, rootCause: String, confidence: Number }, { timestamps: true }))
