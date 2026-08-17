export function createNotificationsController(context) {
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
    getNotifications: async (req, res) => {
      if (context.mongoEnabled) {
        const rows = await Notification.find({
          organizationId: req.user.organizationId,
          $or: [{ userId: req.user.id }, { userId: null }],
        })
          .sort({ createdAt: -1 })
          .lean();
        return res.json(
          rows.map((row) => ({
            id: String(row._id),
            message: row.message,
            read: row.read,
            timestamp: row.createdAt,
          })),
        );
      }
      res.json(
        scoped(notifications, req.user).filter(
          (n) => !n.userId || n.userId === req.user.id,
        ),
      );
    },
    patchNotificationsIdRead: async (req, res) => {
      if (context.mongoEnabled) {
        if (!mongoose.isValidObjectId(req.params.id))
          return res
            .status(400)
            .json({ message: "Invalid notification identifier." });
        const notice = await Notification.findOneAndUpdate(
          {
            _id: req.params.id,
            organizationId: req.user.organizationId,
            $or: [{ userId: req.user.id }, { userId: null }],
          },
          { read: true },
          { new: true },
        ).lean();
        if (!notice)
          return res.status(404).json({ message: "Notification not found." });
        return res.json({
          id: String(notice._id),
          message: notice.message,
          read: notice.read,
          timestamp: notice.createdAt,
        });
      }
      const notice = scoped(notifications, req.user).find(
        (item) =>
          item.id === req.params.id &&
          (!item.userId || item.userId === req.user.id),
      );
      if (!notice)
        return res.status(404).json({ message: "Notification not found." });
      notice.read = true;
      res.json(notice);
    },
  };
}
