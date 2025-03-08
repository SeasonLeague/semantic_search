// This file is needed for Vercel deployment
// It ensures that the Python dependencies are installed before the server starts
const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

// Create the python directory if it doesn't exist
const pythonDir = path.join(__dirname, "python")
if (!fs.existsSync(pythonDir)) {
  fs.mkdirSync(pythonDir, { recursive: true })
}

// Create the temp directory if it doesn't exist
const tempDir = path.join(__dirname, "temp")
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true })
}

// Install Python dependencies
try {
  console.log("Installing Python dependencies...")
  execSync("pip install -r requirements.txt")

  // Download NLTK data
  console.log("Downloading NLTK data...")
  execSync("python -c \"import nltk; nltk.download('stopwords'); nltk.download('punkt'); nltk.download('wordnet')\"")

  console.log("Setup completed successfully")
} catch (error) {
  console.error("Error during setup:", error.message)
}

