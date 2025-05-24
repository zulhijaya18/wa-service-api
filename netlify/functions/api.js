// netlify/functions/api.js
const express = require("express")
const serverless = require("serverless-http")
const app = express()

// Import your main app
const mainApp = require("../../index.js")

// Use your main app as middleware
app.use("/.netlify/functions/api", mainApp)

// Export the serverless function
exports.handler = serverless(app)
