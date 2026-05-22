const express = require("express");
const cors = require("cors");
const ytdlp = require("yt-dlp-exec");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Railway / Proxy fix
app.set("trust proxy", 1);

// Cache control
app.use((req, res, next) => {
  if (req.path === "/" || req.path.endsWith(".html")) {
    res.setHeader("Cache-Control", "no-store");
  }
  next();
});

// Pasta public
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// ROTA PRINCIPAL (ESSENCIAL)
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

const ytdlpBin = path.join(
  __dirname,
  "node_modules",
  "yt-dlp-exec",
  "bin",
  "yt-dlp"
);

const TIERS = [1080, 720];
const jobs = {};
const COOKIES_FILE = path.join(os.tmpdir(), "yt_cookies.txt");

// Cleanup temp files
try {
  fs.readdirSync(os.tmpdir())
    .filter((f) => f.startsWith("ytdl_"))
    .forEach((f) => fs.unlinkSync(path.join(os.tmpdir(), f)));
} catch (_) {}

// Helpers
function hmsToSec(hms) {
  if (!hms) return 0;
  const parts = hms.split(":").map(parseFloat);

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  return 0;
}

function fmtEta(secs) {
  if (!secs || secs <= 0) return null;
  if (secs < 60) return `~${Math.round(secs)}s restantes`;
  return `~${Math.round(secs / 60)}min restantes`;
}

function cleanJob(id) {
  const job = jobs[id];
  if (!job) return;

  if (job.rawFile && fs.existsSync(job.rawFile)) {
    fs.unlink(job.rawFile, () => {});
  }

  if (job.outFile && fs.existsSync(job.outFile)) {
    fs.unlink(job.outFile, () => {});
  }

  delete jobs[id];
}

function hasCookies() {
  try {
    return (
      fs.existsSync(COOKIES_FILE) &&
      fs.statSync(COOKIES_FILE).size > 100
    );
  } catch (_) {
    return false;
  }
}

function ytdlpArgs(extra = []) {
  const base = [...extra];

  if (hasCookies()) {
    base.push("--cookies", COOKIES_FILE);
    console.log("[yt-dlp] usando cookies");
  }

  return base;
}

// Auto clean
setInterval(() => {
  const now = Date.now();

  Object.keys(jobs).forEach((id) => {
    if (now - Number(id) > 20 * 60 * 1000) {
      cleanJob(id);
    }
  });
}, 2 * 60 * 1000);

// Cookies
app.post("/cookies", (req, res) => {
  const { content } = req.body;

  if (!content || content.trim().length < 50) {
    return res
      .status(400)
      .json({ error: "Conteúdo de cookies inválido" });
  }

  try {
    fs.writeFileSync(COOKIES_FILE, content.trim(), "utf8");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Erro ao salvar cookies" });
  }
});

app.get("/cookies-status", (req, res) => {
  res.json({ configured: hasCookies() });
});

// VIDEO INFO
app.post("/video", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        error: "URL inválida",
      });
    }

    const args = {
      dumpSingleJson: true,
    };

    if (hasCookies()) {
      args.cookies = COOKIES_FILE;
    }

    const info = await ytdlp(url, args);

    const videoFormats = info.formats.filter(
      (f) => f.vcodec && f.vcodec !== "none" && f.height
    );

    const baseName = info.title.replace(/[^a-z0-9]/gi, "_");

    const qualities = [];

    for (const tier of TIERS) {
      if (videoFormats.some((f) => f.height >= tier * 0.94)) {
        qualities.push({
          height: tier,
          codec: "h264",
          filename: `${baseName}_${tier}p_H264.mp4`,
        });

        qualities.push({
          height: tier,
          codec: "prores",
          filename: `${baseName}_${tier}p_ProRes.mov`,
        });
      }
    }

    res.json({
      title: info.title,
      thumbnail: info.thumbnail,
      videoUrl: url,
      qualities,
    });
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: "Erro ao buscar vídeo",
    });
  }
});

// STATUS
app.get("/status", (req, res) => {
  const job = jobs[req.query.id];

  if (!job) {
    return res.status(404).json({
      error: "Job expirado ou não encontrado",
    });
  }

  res.json({
    status: job.status,
    message: job.message,
    progress: job.progress || 0,
    eta: job.eta,
  });
});

// HEALTHCHECK
app.get("/health", (req, res) => {
  res.json({
    online: true,
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    error: "Rota não encontrada",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor online na porta ${PORT}`);
});
