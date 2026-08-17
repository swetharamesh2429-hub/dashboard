export function createAnalyticsController(context) {
  const {
    jwt,
    bcrypt,
    crypto,
    mongoose,
    Organization,
    User,
    Vehicle,
    RepairTicket,
    MaintenanceRecord,
    Notification,
    AuditLog,
    ARProcedure,
    SensorReading,
    Prediction,
    answerRepairQuestion,
    predictMaintenance,
    saveRepairProof,
    sendPasswordResetEmail,
    scoped,
    org,
    users,
    vehicles,
    tickets,
    notifications,
    records,
    audits,
    resetTokens,
    audit,
    notify,
    paged,
    serializeTicket,
    serializeVehicle,
    io,
    jwtSecret,
  } = context;
  return {
    getAnalytics: async (req, res) => {
      if (context.mongoEnabled) {
        const [fleet, ticketRows] = await Promise.all([
          Vehicle.find({ organizationId: req.user.organizationId }).lean(),
          RepairTicket.find({ organizationId: req.user.organizationId }).lean(),
        ]);
        const distribution = { immediate: 0, shortTerm: 0, longTerm: 0 };
        ticketRows.forEach((ticket) => {
          if (ticket.risk === "IMMEDIATE") distribution.immediate += 1;
          if (ticket.risk === "SHORT-TERM") distribution.shortTerm += 1;
          if (ticket.risk === "LONG-TERM") distribution.longTerm += 1;
        });
        const completed = ticketRows.filter(
          (ticket) => ticket.status === "COMPLETED",
        ).length;
        return res.json({
          fleetHealth: fleet.length
            ? Math.round(
                fleet.reduce((sum, vehicle) => sum + (vehicle.health || 0), 0) /
                  fleet.length,
              )
            : 0,
          activeRepairs: ticketRows.filter(
            (ticket) => ticket.status !== "COMPLETED",
          ).length,
          firstTimeFixRate: ticketRows.length
            ? Math.round((completed / ticketRows.length) * 100)
            : 0,
          downtimeHours:
            ticketRows.filter((ticket) => ticket.status !== "COMPLETED")
              .length * 4,
          riskDistribution: distribution,
        });
      }
      res.json({
        fleetHealth: 78,
        activeRepairs: tickets.filter((t) => t.status !== "COMPLETED").length,
        firstTimeFixRate: 92,
        downtimeHours: 18,
        riskDistribution: { immediate: 2, shortTerm: 3, longTerm: 2 },
      });
    },
    getAnalyticsReport: async (req, res, next) => {
      if (!["fleet", "repairs", "downtime"].includes(req.params.report))
        return next();
      const fleet = context.mongoEnabled
        ? await Vehicle.find({ organizationId: req.user.organizationId }).lean()
        : scoped(vehicles, req.user);
      const ticketRows = context.mongoEnabled
        ? await RepairTicket.find({
            organizationId: req.user.organizationId,
          }).lean()
        : scoped(tickets, req.user);
      const completed = ticketRows.filter(
        (ticket) => ticket.status === "COMPLETED",
      ).length;
      const data = {
        fleet: {
          fleetHealth: fleet.length
            ? Math.round(
                fleet.reduce((sum, vehicle) => sum + (vehicle.health || 0), 0) /
                  fleet.length,
              )
            : 0,
          totalVehicles: fleet.length,
        },
        repairs: {
          activeRepairs: ticketRows.filter(
            (ticket) => ticket.status !== "COMPLETED",
          ).length,
          completedRepairs: completed,
          firstTimeFixRate: ticketRows.length
            ? Math.round((completed / ticketRows.length) * 100)
            : 0,
        },
        downtime: {
          downtimeHours:
            ticketRows.filter((ticket) => ticket.status !== "COMPLETED")
              .length * 4,
          estimatedSavingsHours: completed * 2,
        },
      };
      res.json(data[req.params.report]);
    },
  };
}
