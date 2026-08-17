export function createAuthController(context) {
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
    postAuthRegister: async (req, res) => {
      const {
        name,
        email,
        password,
        role,
        organizationName,
        profile = {},
      } = req.body;
      const safeProfile = Object.fromEntries(
        Object.entries(profile).filter(
          ([key]) => !["password", "confirmPassword"].includes(key),
        ),
      );
      if (
        !name ||
        !email ||
        !password ||
        password.length < 8 ||
        !["OWNER", "DRIVER", "WORKER"].includes(role)
      )
        return res
          .status(400)
          .json({ message: "Please provide valid registration details." });
      if (context.mongoEnabled) {
        if (await User.findOne({ email }))
          return res
            .status(409)
            .json({ message: "An account with this email already exists." });
        let organizationId = safeProfile.organizationId;
        if (role === "OWNER") {
          const organization = await Organization.create({
            name: organizationName || `${name}'s organization`,
            type: safeProfile.organizationType,
            location: safeProfile.location,
            fleetSize: Number(safeProfile.fleetSize) || 0,
          });
          organizationId = organization._id;
        }
        if (!organizationId)
          return res
            .status(400)
            .json({
              message:
                "An organization is required for driver and worker registration.",
            });
        await User.create({
          organizationId,
          name,
          email,
          passwordHash: await bcrypt.hash(password, 10),
          role,
          profile: safeProfile,
          active: true,
        });
        return res
          .status(201)
          .json({ message: "Registration successful. Please sign in." });
      }
      if (users.some((u) => u.email === email))
        return res
          .status(409)
          .json({ message: "An account with this email already exists." });
      const organizationId =
        role === "OWNER" ? `org-${Date.now()}` : safeProfile.organizationId;
      if (!organizationId)
        return res
          .status(400)
          .json({
            message:
              "An organization is required for driver and worker registration.",
          });
      users.push({
        id: `user-${Date.now()}`,
        name,
        email,
        password: await bcrypt.hash(password, 10),
        role,
        organizationId,
        active: true,
        organizationName,
        profile: safeProfile,
      });
      res
        .status(201)
        .json({ message: "Registration successful. Please sign in." });
    },
    postAuthLogin: async (req, res) => {
      const { email, password, portal } = req.body;
      let u = users.find((x) => x.email === email);
      if (context.mongoEnabled) {
        const dbUser = await User.findOne({ email });
        if (dbUser)
          u = {
            id: String(dbUser._id),
            name: dbUser.name,
            email: dbUser.email,
            password: dbUser.passwordHash,
            role: dbUser.role,
            organizationId: String(dbUser.organizationId),
            active: dbUser.active,
          };
      }
      if (!u || !(await bcrypt.compare(password || "", u.password)))
        return res.status(401).json({ message: "Invalid email or password." });
      if (!u.active)
        return res.status(403).json({ message: "This account is inactive." });
      if (portal && u.role !== portal.toUpperCase())
        return res
          .status(403)
          .json({
            message:
              "This account is not registered for the selected portal. Please select the correct portal.",
          });
      audit(u, "LOGIN", "User", u.id);
      const token = jwt.sign(
        {
          id: u.id,
          name: u.name,
          role: u.role,
          organizationId: u.organizationId,
        },
        jwtSecret,
        { expiresIn: "8h" },
      );
      res.json({
        token,
        user: {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          organizationId: u.organizationId,
        },
      });
    },
    postAuthLogout: async (req, res) => {
      if (context.mongoEnabled)
        await AuditLog.create({
          organizationId: req.user.organizationId,
          userId: req.user.id,
          action: "LOGOUT",
          entity: "User",
          entityId: req.user.id,
        });
      else audit(req.user, "LOGOUT", "User", req.user.id);
      res.json({ message: "Logged out." });
    },
    getAuthMe: (req, res) => {
      return res.json({
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          organizationId: req.user.organizationId,
        },
      });
    },
    postAuthForgotPassword: async (req, res) => {
      let user = users.find((item) => item.email === req.body.email);
      if (context.mongoEnabled) {
        const dbUser = await User.findOne({ email: req.body.email });
        if (dbUser)
          user = {
            id: String(dbUser._id),
            email: dbUser.email,
            organizationId: String(dbUser.organizationId),
          };
      }
      if (!user)
        return res.json({
          message: "If the account exists, reset instructions have been sent.",
        });
      const token = crypto.randomBytes(24).toString("hex");
      resetTokens.set(token, {
        userId: user.id,
        organizationId: user.organizationId,
        expires: Date.now() + 15 * 60 * 1000,
      });
      const delivery = await sendPasswordResetEmail({
        email: user.email,
        token,
      });
      res.json({
        message: "If the account exists, reset instructions have been sent.",
        ...(process.env.NODE_ENV === "production"
          ? {}
          : {
              developmentResetToken: token,
              developmentResetUrl: delivery.resetUrl,
            }),
      });
    },
    postAuthResetPassword: async (req, res) => {
      const entry = resetTokens.get(req.body.token);
      if (!entry || entry.expires < Date.now())
        return res
          .status(400)
          .json({ message: "This reset link is invalid or expired." });
      if (!req.body.password || req.body.password.length < 8)
        return res
          .status(400)
          .json({ message: "Password must be at least 8 characters." });
      const hash = await bcrypt.hash(req.body.password, 10);
      if (context.mongoEnabled) {
        const user = await User.findByIdAndUpdate(
          entry.userId,
          { passwordHash: hash },
          { new: true },
        );
        if (!user)
          return res.status(404).json({ message: "Account not found." });
        await AuditLog.create({
          organizationId: user.organizationId,
          userId: user._id,
          action: "PASSWORD_RESET",
          entity: "User",
          entityId: String(user._id),
        });
      } else {
        const user = users.find((item) => item.id === entry.userId);
        if (!user)
          return res.status(404).json({ message: "Account not found." });
        user.password = hash;
        audit(user, "PASSWORD_RESET", "User", user.id);
      }
      resetTokens.delete(req.body.token);
      res.json({ message: "Password reset successful. Please sign in." });
    },
  };
}
