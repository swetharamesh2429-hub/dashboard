import mongoose from 'mongoose'
import { scoped } from './core.models.js'
const { Schema, model, models } = mongoose
export const Owner = models.Owner || model('Owner', new Schema({ ...scoped, userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, organizationName: String, organizationType: String, fleetSize: Number, location: String }, { timestamps: true }))
export const Driver = models.Driver || model('Driver', new Schema({ ...scoped, userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, employeeId: String, licenseNumber: String, licenseExpiry: Date, vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' }, registrationNumber: String }, { timestamps: true }))
export const Worker = models.Worker || model('Worker', new Schema({ ...scoped, userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, employeeId: String, specialization: String, experience: Number, workshop: String, status: { type: String, enum: ['AVAILABLE', 'BUSY', 'OFFLINE'], default: 'OFFLINE' } }, { timestamps: true }))
