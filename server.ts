import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Escalation Validation (Server-side check)
  app.post("/api/tickets/:id/escalate", (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    // Server-side validation as requested
    if (!reason || typeof reason !== 'string' || reason.trim() === "") {
      return res.status(400).json({ 
        success: false, 
        error: "SERVER VALIDATION FAILED: Escalation reason is mandatory and cannot be empty." 
      });
    }

    if (reason.length < 10) {
      return res.status(400).json({ 
        success: false, 
        error: "SERVER VALIDATION FAILED: Escalation reason must be at least 10 characters for management review." 
      });
    }

    // In a real app, we would update the database here.
    // For this simulation, we return success to let the client update its local state.
    res.json({ 
      success: true, 
      message: `Ticket ${id} escalation validated by server safety gates.` 
    });
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
