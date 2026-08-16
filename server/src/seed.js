import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { Organization, User, Vehicle, SensorReading, Prediction, RepairTicket, Notification, ARProcedure, AuditLog } from './models.js'

const uri = process.env.MONGO_URI
if (!uri) throw new Error('MONGO_URI is required to seed MongoDB.')
await mongoose.connect(uri)
await Promise.all([Organization.deleteMany({}), User.deleteMany({}), Vehicle.deleteMany({}), SensorReading.deleteMany({}), Prediction.deleteMany({}), RepairTicket.deleteMany({}), Notification.deleteMany({}), ARProcedure.deleteMany({}), AuditLog.deleteMany({})])
const org = await Organization.create({ name: 'ABC Logistics', type: 'Logistics', location: 'Chennai', fleetSize: 12 })
const passwordHash = await bcrypt.hash('Demo@123', 10)
const [owner, ...team] = await User.create([
  { organizationId: org._id, name: 'Ananya Kapoor', email: 'owner@utap.demo', passwordHash, role: 'OWNER' },
  { organizationId: org._id, name: 'Arjun Mehta', email: 'driver@utap.demo', passwordHash, role: 'DRIVER' },
  { organizationId: org._id, name: 'Nina Rao', email: 'nina@utap.demo', passwordHash, role: 'DRIVER' },
  { organizationId: org._id, name: 'Rohit Shah', email: 'rohit@utap.demo', passwordHash, role: 'DRIVER' },
  { organizationId: org._id, name: 'Sam Patel', email: 'sam@utap.demo', passwordHash, role: 'DRIVER' },
  { organizationId: org._id, name: 'Isha Roy', email: 'isha@utap.demo', passwordHash, role: 'DRIVER' },
  { organizationId: org._id, name: 'Asha Nair', email: 'worker@utap.demo', passwordHash, role: 'WORKER' },
  { organizationId: org._id, name: 'Maria Silva', email: 'maria@utap.demo', passwordHash, role: 'WORKER' },
  { organizationId: org._id, name: 'Dev Kumar', email: 'dev@utap.demo', passwordHash, role: 'WORKER' },
  { organizationId: org._id, name: 'Leon Chen', email: 'leon@utap.demo', passwordHash, role: 'WORKER' },
  { organizationId: org._id, name: 'Priya Das', email: 'priya@utap.demo', passwordHash, role: 'WORKER' },
])
const vehicles = await Vehicle.create(['245','118','302','091','411','633','277','510','709','830','904','125'].map((id,index)=>({organizationId:org._id,vehicleId:`TRUCK #${id}`,driverId:team[index%5]._id,status:index===0?'IN_GARAGE':index===2?'REPAIRING':'ON_ROAD',health:index===0?42:index===2?38:Math.min(98,64+index*3),location:{lat:13.08+index*.012,lng:80.22+index*.01}})))
const risks=['IMMEDIATE','SHORT-TERM','IMMEDIATE','LONG-TERM','SHORT-TERM','LONG-TERM','IMMEDIATE','SHORT-TERM','LONG-TERM','SHORT-TERM']
await RepairTicket.create(risks.map((risk,index)=>({organizationId:org._id,vehicleId:vehicles[index]._id,fault:['Battery Voltage Instability','Brake Pad Wear','Wiring Fault','Coolant Hose Wear','Oil Pressure Warning'][index%5],risk,status:index===2?'IN_PROGRESS':index>6?'COMPLETED':'ASSIGNED',workerId:team[5+(index%5)]?._id,deadline:new Date(Date.now()+(index+1)*3600000)})))
await SensorReading.create(vehicles.map(v=>({organizationId:org._id,vehicleId:v._id,metrics:{batteryVoltage:v.vehicleId==='TRUCK #245'?11.4:14.1,temperature:91,rpm:2100,fuel:68,tirePressure:34}})))
await Prediction.create([{organizationId:org._id,vehicleId:vehicles[0]._id,fault:'Battery Voltage Instability',risk:'IMMEDIATE',rootCause:'Alternator regulator fluctuation',confidence:.93},{organizationId:org._id,vehicleId:vehicles[1]._id,fault:'Brake Pad Wear',risk:'SHORT-TERM',rootCause:'Brake pad thickness below threshold',confidence:.84}])
await ARProcedure.create({fault:'Battery Voltage Instability',steps:['Secure vehicle and isolate battery','Inspect terminals and ground cable','Measure alternator output','Replace regulator if out of range']})
await AuditLog.create({organizationId:org._id,userId:owner._id,action:'SEED_CREATED',entity:'Organization',entityId:String(org._id)})
console.log('UTAP demo data seeded: 1 organization, 12 vehicles, 5 drivers, 5 workers, and 10 tickets.')
await mongoose.disconnect()
