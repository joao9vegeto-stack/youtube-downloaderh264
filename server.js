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

app.set("trust proxy", 1);

// CACHE
app.use((req, res, next) => {

  if (
    req.path === "/" ||
    req.path.endsWith(".html")
  ) {
    res.setHeader(
      "Cache-Control",
      "no-store"
    );
  }

  next();

});

// PUBLIC
const publicPath =
  path.join(__dirname, "public");

app.use(express.static(publicPath));

// HOME
app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      publicPath,
      "index.html"
    )
  );

});

// yt-dlp
const ytdlpBin = path.join(
  __dirname,
  "node_modules",
  "yt-dlp-exec",
  "bin",
  "yt-dlp"
);

const TIERS = [1080, 720];

const jobs = {};

const COOKIES_FILE =
  path.join(
    os.tmpdir(),
    "yt_cookies.txt"
  );

// CLEAN TMP
try {

  fs.readdirSync(os.tmpdir())
    .filter(f => f.startsWith("ytdl_"))
    .forEach(f => {

      fs.unlinkSync(
        path.join(os.tmpdir(), f)
      );

    });

} catch (_) {}

// COOKIES
function hasCookies(){

  try {

    return (
      fs.existsSync(COOKIES_FILE) &&
      fs.statSync(COOKIES_FILE).size > 100
    );

  } catch (_) {

    return false;

  }

}

// CLEAN JOBS
setInterval(() => {

  const now = Date.now();

  Object.keys(jobs).forEach(id => {

    if (
      now - Number(id)
      > 20 * 60 * 1000
    ) {

      const job = jobs[id];

      try {

        if (
          job.file &&
          fs.existsSync(job.file)
        ) {

          fs.unlinkSync(job.file);

        }

      } catch (_) {}

      delete jobs[id];

    }

  });

}, 2 * 60 * 1000);

// SAVE COOKIES
app.post("/cookies", (req, res) => {

  const { content } = req.body;

  if (
    !content ||
    content.trim().length < 50
  ) {

    return res.status(400).json({
      error:
        "Conteúdo inválido"
    });

  }

  try {

    fs.writeFileSync(
      COOKIES_FILE,
      content.trim(),
      "utf8"
    );

    res.json({
      ok:true
    });

  } catch(e){

    res.status(500).json({
      error:
        "Erro ao salvar cookies"
    });

  }

});

// COOKIE STATUS
app.get("/cookies-status", (req, res) => {

  res.json({
    configured: hasCookies()
  });

});

// VIDEO INFO
app.post("/video", async (req, res) => {

  try {

    const { url } = req.body;

    if(!url){

      return res.status(400).json({
        error:"URL inválida"
      });

    }

    const nodeBin =
      process.execPath;

    const args = {

      dumpSingleJson:true,

      noCheckCertificates:true,

      noWarnings:true,

      preferFreeFormats:true,

      addHeader:[
        "referer:youtube.com",
        "user-agent:Mozilla/5.0"
      ],

      jsRuntimes:
        `node:${nodeBin}`

    };

    if(hasCookies()){

      args.cookies =
        COOKIES_FILE;

    }

    const info =
      await ytdlp(url, args);

    const videoFormats =
      info.formats.filter(f =>

        f.vcodec &&
        f.vcodec !== "none" &&
        f.height

      );

    const baseName =
      info.title.replace(
        /[^a-z0-9]/gi,
        "_"
      );

    const qualities = [];

    for(const tier of TIERS){

      if(
        videoFormats.some(
          f =>
            f.height >= tier * 0.94
        )
      ){

        qualities.push({

          height:tier,

          codec:"h264",

          filename:
            `${baseName}_${tier}p_H264.mp4`

        });

        qualities.push({

          height:tier,

          codec:"prores",

          filename:
            `${baseName}_${tier}p_ProRes.mov`

        });

      }

    }

    res.json({

      title:info.title,

      thumbnail:
        info.thumbnail,

      videoUrl:url,

      qualities

    });

  } catch(e){

    console.error(e);

    res.status(500).json({
      error:
        "Erro ao buscar vídeo: "
        + e.message
    });

  }

});

// PREPARE DOWNLOAD
app.post("/prepare", async (req, res) => {

  try {

    const {
      url,
      height,
      codec,
      filename
    } = req.body;

    if(!url){

      return res.status(400).json({
        error:"URL inválida"
      });

    }

    const id =
      String(Date.now());

    const ext =
      codec === "prores"
      ? "mov"
      : "mp4";

    const output =
      path.join(
        os.tmpdir(),
        `${id}.${ext}`
      );

    jobs[id] = {

      status:"processing",

      progress:10,

      message:"Baixando vídeo...",

      file:output,

      filename

    };

    res.json({
      jobId:id
    });

    const format =
      `bestvideo[height<=${height}]+bestaudio/best`;

    const args = [

      "-f",
      format,

      "--merge-output-format",
      "mp4",

      "-o",
      output,

      url

    ];

    if(hasCookies()){

      args.unshift(COOKIES_FILE);

      args.unshift("--cookies");

    }

    const dl = spawn(
      ytdlpBin,
      args
    );

    dl.stderr.on("data", data => {

      const str =
        data.toString();

      if(
        str.includes("[download]")
      ){

        jobs[id].message =
          "Baixando vídeo...";

      }

    });

    dl.on("close", code => {

      if(code !== 0){

        jobs[id].status =
          "error";

        jobs[id].message =
          "Erro no download";

        return;

      }

      jobs[id].status =
        "ready";

      jobs[id].progress =
        100;

      jobs[id].message =
        "Download pronto";

    });

  } catch(e){

    console.error(e);

    res.status(500).json({
      error:e.message
    });

  }

});

// STATUS
app.get("/status", (req, res) => {

  const job =
    jobs[req.query.id];

  if(!job){

    return res.status(404).json({
      error:
        "Job não encontrado"
    });

  }

  res.json({

    status:
      job.status,

    progress:
      job.progress || 0,

    message:
      job.message || ""

  });

});

// FILE
app.get("/file", (req, res) => {

  const { id } = req.query;

  const job = jobs[id];

  if(
    !job ||
    job.status !== "ready"
  ){

    return res.status(404).json({
      error:
        "Arquivo não encontrado"
    });

  }

  res.download(
    job.file,
    job.filename
  );

});

// HEALTH
app.get("/health", (req, res) => {

  res.json({
    online:true
  });

});

// 404
app.use((req, res) => {

  res.status(404).json({
    error:
      "Rota não encontrada"
  });

});

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {

  console.log(
    `Servidor online na porta ${PORT}`
  );

});
