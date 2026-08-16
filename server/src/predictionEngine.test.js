import assert from 'node:assert/strict'
import { predictMaintenance } from './services/predictionEngine.js'

assert.equal(predictMaintenance({ batteryVoltage: 11.4 }).risk, 'IMMEDIATE')
assert.equal(predictMaintenance({ coolantTemperature: 112 }).fault, 'Coolant Temperature Anomaly')
assert.equal(predictMaintenance({ brakePadMm: 3.5 }).risk, 'SHORT-TERM')
assert.equal(predictMaintenance({ batteryVoltage: 14.1 }).risk, 'LONG-TERM')
console.log('UTAP prediction-engine tests passed')
