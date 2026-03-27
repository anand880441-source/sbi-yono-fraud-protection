const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Simple User Schema
const UserSchema = new mongoose.Schema({
    email: String,
    password: String,
    name: String
});

UserSchema.pre("save", async function(next) {
    if (this.password) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

const User = mongoose.model("User", UserSchema);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected"));

// Register
app.post("/api/auth/register", async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const user = new User({ email, password, name });
        await user.save();
        res.json({ success: true, message: "User created" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Login
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: "Invalid" });
        
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: "Invalid" });
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret");
        res.json({ success: true, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/health", (req, res) => res.json({ status: "OK" }));

app.listen(process.env.PORT || 10000, () => console.log("Server running"));