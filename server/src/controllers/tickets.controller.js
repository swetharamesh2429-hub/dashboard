export function createTicketsController(context) {
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
    getTickets: async (req, res) => {
      let rows;
      if (context.mongoEnabled) {
        const docs = await RepairTicket.find({
          organizationId: req.user.organizationId,
        })
          .populate("vehicleId")
          .lean();
        rows = docs
          .map(serializeTicket)
          .filter(
            (ticket) =>
              req.user.role !== "WORKER" || ticket.workerId === req.user.id,
          );
      } else
        rows = scoped(tickets, req.user).filter(
          (t) => req.user.role !== "WORKER" || t.workerId === req.user.id,
        );
      if (req.query.status)
        rows = rows.filter((ticket) => ticket.status === req.query.status);
      if (req.query.risk)
        rows = rows.filter((ticket) => ticket.risk === req.query.risk);
      if (req.query.search) {
        const query = req.query.search.toLowerCase();
        rows = rows.filter((ticket) =>
          `${ticket.vehicle} ${ticket.fault}`.toLowerCase().includes(query),
        );
      }
      rows.sort((a, b) =>
        String(a.deadline || "").localeCompare(String(b.deadline || "")),
      );
      res.json(paged(rows, req.query));
    },
    getTicketsId: async (req, res) => {
      let ticket;
      if (context.mongoEnabled) {
        if (!mongoose.isValidObjectId(req.params.id))
          return res
            .status(400)
            .json({ message: "Invalid ticket identifier." });
        ticket = await RepairTicket.findOne({
          _id: req.params.id,
          organizationId: req.user.organizationId,
        })
          .populate("vehicleId")
          .lean();
        if (
          ticket &&
          req.user.role === "WORKER" &&
          String(ticket.workerId) !== req.user.id
        )
          ticket = null;
        ticket = ticket && serializeTicket(ticket);
      } else {
        ticket = scoped(tickets, req.user).find(
          (item) => item.id === req.params.id,
        );
        if (
          ticket &&
          req.user.role === "WORKER" &&
          ticket.workerId !== req.user.id
        )
          ticket = null;
      }
      if (!ticket)
        return res.status(404).json({ message: "Ticket not found." });
      res.json(ticket);
    },
    getTasksMy: async (req, res) => {
      let rows;
      if (context.mongoEnabled) {
        rows = (
          await RepairTicket.find({
            organizationId: req.user.organizationId,
            workerId: req.user.id,
          })
            .populate("vehicleId")
            .lean()
        ).map(serializeTicket);
      } else
        rows = scoped(tickets, req.user).filter(
          (ticket) => ticket.workerId === req.user.id,
        );
      res.json(paged(rows, req.query));
    },
    postTicketsIdAssign: async (req, res) => {
      const deadline = req.body.deadline ? new Date(req.body.deadline) : null;
      if (req.body.deadline && Number.isNaN(deadline.getTime()))
        return res
          .status(400)
          .json({ message: "Provide a valid repair deadline." });
      if (context.mongoEnabled) {
        if (
          !mongoose.isValidObjectId(req.params.id) ||
          !mongoose.isValidObjectId(req.body.workerId)
        )
          return res
            .status(400)
            .json({ message: "Invalid ticket or worker identifier." });
        const [ticket, worker] = await Promise.all([
          RepairTicket.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId,
          }).populate("vehicleId"),
          User.findOne({
            _id: req.body.workerId,
            organizationId: req.user.organizationId,
            role: "WORKER",
            active: true,
          }),
        ]);
        if (!ticket || !worker)
          return res
            .status(404)
            .json({ message: "Ticket or active worker not found." });
        ticket.workerId = worker._id;
        ticket.status = "ASSIGNED";
        if (deadline) ticket.deadline = deadline;
        await ticket.save();
        await Promise.all([
          Notification.create({
            organizationId: req.user.organizationId,
            userId: worker._id,
            message: `New repair task assigned: ${ticket.vehicleId.vehicleId}.`,
          }),
          AuditLog.create({
            organizationId: req.user.organizationId,
            userId: req.user.id,
            action: "TICKET_ASSIGNED",
            entity: "RepairTicket",
            entityId: String(ticket._id),
          }),
        ]);
        const payload = serializeTicket(ticket);
        io.to(String(worker._id)).emit("ticket:assigned", payload);
        io.to(req.user.organizationId).emit("ticket:updated", payload);
        return res.json(payload);
      }
      const t = scoped(tickets, req.user).find((x) => x.id === req.params.id);
      const worker = users.find(
        (x) =>
          x.id === req.body.workerId &&
          x.organizationId === req.user.organizationId &&
          x.role === "WORKER" &&
          x.active,
      );
      if (!t || !worker)
        return res
          .status(404)
          .json({ message: "Ticket or active worker not found." });
      t.workerId = worker.id;
      t.status = "ASSIGNED";
      if (deadline) t.deadline = deadline.toISOString();
      audit(req.user, "TICKET_ASSIGNED", "RepairTicket", t.id);
      notify(org, worker.id, `New repair task assigned: ${t.vehicle}.`);
      io.to(org).emit("ticket:updated", t);
      res.json(t);
    },
    postTicketsIdStatus: async (req, res) => {
      const allowed = { ASSIGNED: "IN_PROGRESS", IN_PROGRESS: "COMPLETED" };
      if (context.mongoEnabled) {
        if (!mongoose.isValidObjectId(req.params.id))
          return res
            .status(400)
            .json({ message: "Invalid ticket identifier." });
        const ticket = await RepairTicket.findOne({
          _id: req.params.id,
          organizationId: req.user.organizationId,
          workerId: req.user.id,
        }).populate("vehicleId");
        if (!ticket)
          return res
            .status(404)
            .json({ message: "Assigned ticket not found." });
        if (allowed[ticket.status] !== req.body.status)
          return res
            .status(400)
            .json({ message: "Invalid ticket transition." });
        ticket.status = req.body.status;
        await ticket.save();
        const action =
          ticket.status === "COMPLETED" ? "TASK_COMPLETED" : "TASK_STARTED";
        await AuditLog.create({
          organizationId: req.user.organizationId,
          userId: req.user.id,
          action,
          entity: "RepairTicket",
          entityId: String(ticket._id),
        });
        if (ticket.status === "COMPLETED") {
          ticket.vehicleId.health = 96;
          ticket.vehicleId.status = "ON_ROAD";
          await ticket.vehicleId.save();
          await MaintenanceRecord.create({
            organizationId: req.user.organizationId,
            vehicleId: ticket.vehicleId._id,
            ticketId: ticket._id,
            workerId: req.user.id,
            notes: req.body.notes || "",
          });
          await Notification.create({
            organizationId: req.user.organizationId,
            message: `${ticket.vehicleId.vehicleId} repair completed.`,
          });
        }
        const payload = serializeTicket(ticket);
        io.to(req.user.organizationId).emit("ticket:updated", payload);
        return res.json(payload);
      }
      const t = scoped(tickets, req.user).find(
        (x) => x.id === req.params.id && x.workerId === req.user.id,
      );
      if (!t)
        return res.status(404).json({ message: "Assigned ticket not found." });
      if (allowed[t.status] !== req.body.status)
        return res.status(400).json({ message: "Invalid ticket transition." });
      t.status = req.body.status;
      audit(
        req.user,
        t.status === "COMPLETED" ? "TASK_COMPLETED" : "TASK_STARTED",
        "RepairTicket",
        t.id,
      );
      if (t.status === "COMPLETED") {
        records.unshift({
          id: `maint-${Date.now()}`,
          organizationId: org,
          ticketId: t.id,
          vehicle: t.vehicle,
          workerId: req.user.id,
          notes: req.body.notes || "",
          createdAt: new Date().toISOString(),
        });
        const vehicle = vehicles.find((v) => v.id === t.vehicleId);
        if (vehicle) {
          vehicle.health = 96;
          vehicle.status = "ON_ROAD";
        }
        notify(org, "owner-1", `${t.vehicle} repair completed.`);
      }
      io.to(org).emit("ticket:updated", t);
      res.json(t);
    },
    postTicketsIdProof: async (req, res) => {
      const { imageUrl, notes = "" } = req.body;
      if (context.mongoEnabled) {
        if (!mongoose.isValidObjectId(req.params.id))
          return res
            .status(400)
            .json({ message: "Invalid ticket identifier." });
        const ticket = await RepairTicket.findOne({
          _id: req.params.id,
          organizationId: req.user.organizationId,
          workerId: req.user.id,
        });
        if (!ticket)
          return res
            .status(404)
            .json({ message: "Assigned ticket not found." });
        const proofUrl = await saveRepairProof(imageUrl, String(ticket._id));
        await MaintenanceRecord.findOneAndUpdate(
          { organizationId: req.user.organizationId, ticketId: ticket._id },
          {
            organizationId: req.user.organizationId,
            vehicleId: ticket.vehicleId,
            ticketId: ticket._id,
            workerId: req.user.id,
            notes,
            proofUrl,
          },
          { upsert: true, new: true },
        );
        await AuditLog.create({
          organizationId: req.user.organizationId,
          userId: req.user.id,
          action: "REPAIR_PROOF_ADDED",
          entity: "RepairTicket",
          entityId: String(ticket._id),
        });
        return res.json({
          message: "Repair proof saved.",
          proof: { proofUrl, notes },
        });
      }
      const ticket = scoped(tickets, req.user).find(
        (t) => t.id === req.params.id && t.workerId === req.user.id,
      );
      if (!ticket)
        return res.status(404).json({ message: "Assigned ticket not found." });
      const proofUrl = await saveRepairProof(imageUrl, ticket.id);
      ticket.proof = { proofUrl, notes, updatedAt: new Date().toISOString() };
      audit(req.user, "REPAIR_PROOF_ADDED", "RepairTicket", ticket.id);
      res.json({ message: "Repair proof saved.", proof: ticket.proof });
    },
  };
}
