import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["student", "alumni", "admin"], default: "student" },
  graduationYear: Number,
  company: String,
  jobTitle: String,
  skills: [String],
  mentorshipAreas: [String],
  bio: String
}, { timestamps: true });

const requestSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  alumni: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true, maxlength: 1000 },
  status: { type: String, enum: ["Pending", "Accepted", "Rejected", "Completed"], default: "Pending" }
}, { timestamps: true });

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  description: { type: String, required: true },
  applicationUrl: String,
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const MentorshipRequest = mongoose.model("MentorshipRequest", requestSchema);
const Job = mongoose.model("Job", jobSchema);

function auth(requiredRoles = []) {
  return (req, res, next) => {
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Please log in first." });
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
      if (requiredRoles.length && !requiredRoles.includes(req.user.role)) {
        return res.status(403).json({ message: "You do not have permission for this action." });
      }
      next();
    } catch {
      return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
    }
  };
}

const publicUser = user => ({
  id: user._id, name: user.name, email: user.email, role: user.role,
  graduationYear: user.graduationYear, company: user.company, jobTitle: user.jobTitle,
  skills: user.skills || [], mentorshipAreas: user.mentorshipAreas || [], bio: user.bio || ""
});

app.get("/api/health", (_req, res) => res.json({ status: "ok", message: "Alumni Portal API is running" }));

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email, and password are required." });
    if (password.length < 8) return res.status(400).json({ message: "Password must contain at least 8 characters." });
    const safeRole = ["student", "alumni"].includes(role) ? role : "student";
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: "An account with this email already exists." });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, role: safeRole });
    const token = jwt.sign({ id: user._id.toString(), role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.status(201).json({ token, user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Could not register. Check the server configuration." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = (req.body.email || "").toLowerCase().trim();
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(req.body.password || "", user.passwordHash))) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }
    const token = jwt.sign({ id: user._id.toString(), role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user: publicUser(user) });
  } catch {
    res.status(500).json({ message: "Could not log in." });
  }
});

app.get("/api/me", auth(), async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json({ user: publicUser(user) });
});

app.put("/api/alumni/profile", auth(["alumni"]), async (req, res) => {
  const allowed = ["graduationYear", "company", "jobTitle", "skills", "mentorshipAreas", "bio"];
  const update = {};
  for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key];
  const user = await User.findByIdAndUpdate(req.user.id, update, { new: true, runValidators: true });
  res.json({ user: publicUser(user) });
});

app.get("/api/alumni", auth(), async (req, res) => {
  const filter = { role: "alumni" };
  if (req.query.search) {
    const search = String(req.query.search).slice(0, 100);
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
      { jobTitle: { $regex: search, $options: "i" } },
      { skills: { $regex: search, $options: "i" } }
    ];
  }
  const alumni = await User.find(filter).select("-passwordHash").sort({ name: 1 }).limit(100);
  res.json({ alumni: alumni.map(publicUser) });
});

app.post("/api/mentorship", auth(["student"]), async (req, res) => {
  const { alumniId, message } = req.body;
  if (!alumniId || !message?.trim()) return res.status(400).json({ message: "Choose an alumnus and enter a message." });
  const alumnus = await User.findOne({ _id: alumniId, role: "alumni" });
  if (!alumnus) return res.status(404).json({ message: "Alumni account not found." });
  const existing = await MentorshipRequest.findOne({ student: req.user.id, alumni: alumniId, status: { $in: ["Pending", "Accepted"] } });
  if (existing) return res.status(409).json({ message: "You already have a pending or accepted request with this alumnus." });
  const request = await MentorshipRequest.create({ student: req.user.id, alumni: alumniId, message: message.trim() });
  res.status(201).json({ request });
});

app.get("/api/mentorship/my-requests", auth(), async (req, res) => {
  const filter = req.user.role === "student" ? { student: req.user.id } :
    req.user.role === "alumni" ? { alumni: req.user.id } : {};
  const requests = await MentorshipRequest.find(filter)
    .populate("student", "name email graduationYear")
    .populate("alumni", "name email company jobTitle")
    .sort({ createdAt: -1 });
  res.json({ requests });
});

app.patch("/api/mentorship/:id/status", auth(["alumni", "admin"]), async (req, res) => {
  const status = req.body.status;
  if (!["Accepted", "Rejected", "Completed"].includes(status)) return res.status(400).json({ message: "Invalid status." });
  const request = await MentorshipRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: "Request not found." });
  if (req.user.role !== "admin" && request.alumni.toString() !== req.user.id) return res.status(403).json({ message: "You can only update requests sent to you." });
  request.status = status;
  await request.save();
  res.json({ request });
});

app.get("/api/jobs", auth(), async (_req, res) => {
  const jobs = await Job.find().populate("postedBy", "name company").sort({ createdAt: -1 }).limit(100);
  res.json({ jobs });
});

app.post("/api/jobs", auth(["alumni", "admin"]), async (req, res) => {
  const { title, company, description, applicationUrl } = req.body;
  if (!title?.trim() || !company?.trim() || !description?.trim()) {
    return res.status(400).json({ message: "Title, company, and description are required." });
  }
  const job = await Job.create({ title: title.trim(), company: company.trim(), description: description.trim(), applicationUrl, postedBy: req.user.id });
  res.status(201).json({ job });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Unexpected server error." });
});

const port = process.env.PORT || 5000;
try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");
  app.listen(port, () => console.log(`Backend running at http://localhost:${port}`));
} catch (error) {
  console.error("MongoDB connection failed. Is MongoDB running and MONGODB_URI correct?");
  console.error(error.message);
  process.exit(1);
}
