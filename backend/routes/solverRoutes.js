const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { execFile } = require("child_process");

// Configure disk storage for uploaded astronomical images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|fits/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) return cb(null, true);
    cb(new Error("Only .jpg, .png, and .fits celestial image formats are allowed!"));
  }
});

// Upload & Solve Image Endpoint
router.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file uploaded." });
  }

  const scriptPath = path.join(__dirname, "../../plate-solver-service/solver.py");
  const imagePath = req.file.path;

  // Execute Python plate solver script
  execFile("python", [scriptPath, imagePath], (error, stdout, stderr) => {
    if (error) {
      console.error("Plate solver error:", stderr || error.message);
      return res.status(500).json({ error: "Plate solving failed to process image." });
    }

    try {
      const solverResult = JSON.parse(stdout);
      res.json(solverResult);
    } catch (parseErr) {
      console.error("Failed to parse solver output:", stdout);
      res.status(500).json({ error: "Invalid response format from solver service." });
    }
  });
});

module.exports = router;
