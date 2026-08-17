import mongoose from 'mongoose'
import { scoped } from './core.models.js'
const { Schema, model, models } = mongoose
export const RepairTicket = models.RepairTicket || model('RepairTicket', new Schema({ ...scoped, vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' }, fault: String, risk: String, rootCause: String, confidence: Number, status: { type: String, enum: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'], default: 'ASSIGNED' }, workerId: { type: Schema.Types.ObjectId, ref: 'User' }, deadline: Date, notes: String }, { timestamps: true }))
export const MaintenanceRecord = models.MaintenanceRecord || model('MaintenanceRecord', new Schema({ ...scoped, vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' }, ticketId: { type: Schema.Types.ObjectId, ref: 'RepairTicket' }, workerId: { type: Schema.Types.ObjectId, ref: 'User' }, notes: String, proofUrl: String }, { timestamps: true }))
export const Notification = models.Notification || model('Notification', new Schema({ ...scoped, userId: { type: Schema.Types.ObjectId, ref: 'User' }, message: String, read: { type: Boolean, default: false } }, { timestamps: true }))
export const AuditLog = models.AuditLog || model('AuditLog', new Schema({ ...scoped, userId: { type: Schema.Types.ObjectId, ref: 'User' }, action: String, entity: String, entityId: String }, { timestamps: { createdAt: true, updatedAt: false } }))
