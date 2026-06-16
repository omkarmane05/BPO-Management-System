import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Security Headers (Helmet)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "https:", "http:"],
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Needed for Vite/React dev
      },
    },
  }));

  // 2. Rate Limiting to prevent DoS/Brute Force
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
  });
  app.use("/api/", limiter);

  // 3. HTTP Parameter Pollution protection
  app.use(hpp());

  app.use(express.json({ limit: '10kb' })); // Payload size limiting

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

    // Sanitize ID and reason if necessary (basic checks already done)
    
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
    app.use(express.static(distPath, {
      maxAge: '1d',
      setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler (No stack leaks)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ 
      error: "Internal Server Error",
      message: process.env.NODE_ENV === "production" ? "Something went wrong." : err.message 
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
