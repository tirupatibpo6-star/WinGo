// server.ts
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = Number(process.env.PORT) || 3e3;
app.use(express.json());
app.get(["/api/health", "/health", "/_ah/health"], (_req, res) => {
  res.status(200).json({ status: "healthy", timestamp: Date.now() });
});
var distPath = path.join(__dirname, "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}
app.get("*", (_req, res) => {
  const indexPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send("<!DOCTYPE html><html><head><title>WinGo</title></head><body>Loading WinGo...</body></html>");
  }
});
var server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on 0.0.0.0:${PORT}`);
});
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, closing server gracefully");
  server.close(() => {
    process.exit(0);
  });
});
process.on("SIGINT", () => {
  console.log("Received SIGINT, closing server gracefully");
  server.close(() => {
    process.exit(0);
  });
});
