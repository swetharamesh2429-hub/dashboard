import mongoose from 'mongoose'
const { Schema, model, models } = mongoose
export const scoped = { organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true } }
export const Organization = models.Organization || model('Organization', new Schema({ name: { type: String, required: true }, type: String, location: String, fleetSize: Number }, { timestamps: true }))
export const User = models.User || model('User', new Schema({ ...scoped, name: { type: String, required: true }, email: { type: String, unique: true, required: true, index: true }, passwordHash: { type: String, required: true }, role: { type: String, enum: ['OWNER', 'DRIVER', 'WORKER'], required: true }, active: { type: Boolean, default: true }, profile: Schema.Types.Mixed }, { timestamps: true }))
