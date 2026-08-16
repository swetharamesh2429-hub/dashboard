export function predictMaintenance(metrics = {}) {
  const batteryVoltage = Number(metrics.batteryVoltage)
  const brakePadMm = Number(metrics.brakePadMm)
  const coolantTemperature = Number(metrics.coolantTemperature)
  if (Number.isFinite(batteryVoltage) && batteryVoltage < 11.8) return { risk: 'IMMEDIATE', fault: 'Battery Voltage Instability', rootCause: 'Charging system output below safe threshold', confidence: 0.93 }
  if (Number.isFinite(coolantTemperature) && coolantTemperature > 108) return { risk: 'IMMEDIATE', fault: 'Coolant Temperature Anomaly', rootCause: 'Cooling system threshold exceeded', confidence: 0.91 }
  if (Number.isFinite(brakePadMm) && brakePadMm < 4) return { risk: 'SHORT-TERM', fault: 'Brake Pad Wear', rootCause: 'Brake pad thickness below service threshold', confidence: 0.86 }
  return { risk: 'LONG-TERM', fault: 'Scheduled inspection', rootCause: 'No immediate anomaly; routine preventive maintenance due', confidence: 0.7 }
}
