<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>YouTube → After Effects</title>

<style>
*{
  box-sizing:border-box;
  margin:0;
  padding:0;
}

body{
  background:#0f0f0f;
  color:white;
  font-family:Arial;
  padding:20px;
  max-width:620px;
  margin:0 auto;
}

h1{
  font-size:22px;
  margin-bottom:4px;
}

.sub{
  font-size:13px;
  color:#666;
  margin-bottom:18px;
}

input{
  width:100%;
  padding:14px 16px;
  border:none;
  border-radius:12px;
  margin-top:10px;
  font-size:15px;
  background:#1e1e1e;
  color:white;
}

input::placeholder{
  color:#555;
}

#btn{
  width:100%;
  padding:14px;
  border:none;
  border-radius:12px;
  background:#ff0033;
  color:white;
  font-size:17px;
  font-weight:bold;
  cursor:pointer;
  margin-top:12px;
}

#btn:disabled{
  background:#444;
  cursor:not-allowed;
}

/* cookies */

.cookies-panel{
  margin-top:14px;
  background:#1a1a1a;
  border-radius:12px;
  overflow:hidden;
  border:1px solid #2a2a2a;
}

.cookies-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:12px 16px;
  cursor:pointer;
  font-size:13px;
  color:#888;
}

.cookies-header .tag{
  font-size:11px;
  padding:2px 8px;
  border-radius:99px;
  font-weight:bold;
}

.tag.ok{
  background:#00aa5533;
  color:#00cc66;
}

.tag.missing{
  background:#ff330022;
  color:#ff4444;
}

.cookies-body{
  display:none;
  padding:0 16px 16px;
}

.cookies-body.open{
  display:block;
}

.cookies-body p{
  font-size:12px;
  color:#666;
  margin-bottom:8px;
  line-height:1.6;
}

.cookies-body a{
  color:#4a9eff;
}

textarea{
  width:100%;
  height:110px;
  background:#111;
  border:1px solid #333;
  border-radius:8px;
  color:#ccc;
  font-size:11px;
  font-family:monospace;
  padding:10px;
  resize:vertical;
}

.cookies-body button{
  margin-top:8px;
  padding:9px 18px;
  border:none;
  border-radius:8px;
  background:#4a9eff;
  color:white;
  font-size:13px;
  font-weight:bold;
  cursor:pointer;
}

.cookies-save-msg{
  font-size:12px;
  margin-top:6px;
}

/* card */

.card{
  background:#1a1a1a;
  border-radius:14px;
  margin-top:20px;
  overflow:hidden;
}

.thumb-wrap img{
  width:100%;
  display:block;
}

.card-body{
  padding:16px;
}

.title{
  font-size:14px;
  line-height:1.5;
  color:#bbb;
  margin-bottom:14px;
}

.codec-info{
  background:#111;
  border:1px solid #2a2a2a;
  border-radius:10px;
  padding:11px 14px;
  margin-bottom:14px;
  font-size:12px;
  color:#777;
  line-height:1.9;
}

.codec-info strong{
  color:#00cc66;
  display:block;
  margin-bottom:3px;
  font-size:13px;
}

.group-label{
  font-size:11px;
  color:#555;
  text-transform:uppercase;
  letter-spacing:0.6px;
  margin:14px 0 7px;
}

.btn-dl{
  display:flex;
  align-items:center;
  justify-content:space-between;
  width:100%;
  padding:13px 16px;
  margin-bottom:8px;
  border:none;
  border-radius:10px;
  color:white;
  font-size:15px;
  font-weight:bold;
  cursor:pointer;
}

.btn-dl.h264{
  background:#00aa55;
}

.btn-dl.prores{
  background:#7b3ff2;
}

.badge{
  font-size:11px;
  font-weight:normal;
  background:#ffffff22;
  padding:2px 8px;
  border-radius:5px;
}

/* modal */

#modal{
  display:none;
  position:fixed;
  inset:0;
  background:#000000cc;
  z-index:100;
  align-items:center;
  justify-content:center;
  padding:30px;
}

#modal.show{
  display:flex;
}

.modal-box{
  background:#1e1e1e;
  border-radius:16px;
  padding:28px 24px;
  width:100%;
  max-width:360px;
  text-align:center;
}

.progress-bar-bg{
  background:#333;
  border-radius:99px;
  height:8px;
  overflow:hidden;
  margin:18px 0;
}

.progress-bar{
  height:100%;
  width:0%;
  background:#00aa55;
}

.msg{
  margin-top:14px;
  color:#888;
}

.erro{
  margin-top:14px;
  color:#ff4444;
}
</style>
</head>

<body>

<h1>YouTube → After Effects</h1>

<p class="sub">
Converte para MP4 H264 ou ProRes otimizado para edição
</p>

<input id="url" placeholder="Cole o link do YouTube">

<button id="btn" onclick="buscar()">
Buscar Vídeo
</button>

<div class="cookies-panel">

  <div class="cookies-header" onclick="toggleCookies()">

    <span>Cookies do YouTube</span>

    <span id="cookies-tag" class="tag missing">
      Não configurado
    </span>

  </div>

  <div class="cookies-body" id="cookies-body">

    <p>
      Exporte seus cookies usando:
      <br><br>

      <a
        href="https://chromewebstore.google.com/detail/get-cookiestxt-locally/gihmafigllmhbppdfjnfecimiohcljba"
        target="_blank"
      >
        Get cookies.txt LOCALLY
      </a>

    </p>

    <textarea
      id="cookies-input"
      placeholder="Cole aqui o conteúdo completo do cookies.txt"
    ></textarea>

    <button onclick="saveCookies()">
      Salvar Cookies
    </button>

    <div
      class="cookies-save-msg"
      id="cookies-save-msg"
    ></div>

  </div>

</div>

<div id="resultado"></div>

<div id="modal">

  <div class="modal-box">

    <h3 id="modal-title">
      Preparando download...
    </h3>

    <div class="progress-bar-bg">
      <div class="progress-bar" id="modal-bar"></div>
    </div>

    <div id="modal-status">
      Processando...
    </div>

  </div>

</div>

<script>

let currentJobId = null;

window.addEventListener("load", async () => {

  try {

    const r = await fetch("/cookies-status");

    const d = await r.json();

    setCookiesTag(d.configured);

  } catch(_) {}

});

function setCookiesTag(configured){

  const tag =
    document.getElementById("cookies-tag");

  if(configured){

    tag.textContent = "✓ Configurado";

    tag.className = "tag ok";

  } else {

    tag.textContent = "Não configurado";

    tag.className = "tag missing";

  }

}

function toggleCookies(){

  document
    .getElementById("cookies-body")
    .classList
    .toggle("open");

}

async function saveCookies(){

  const content =
    document.getElementById("cookies-input")
    .value
    .trim();

  const msg =
    document.getElementById("cookies-save-msg");

  try {

    const r = await fetch("/cookies", {

      method:"POST",

      headers:{
        "Content-Type":"application/json"
      },

      body:JSON.stringify({
        content
      })

    });

    const d = await r.json();

    if(d.ok){

      msg.style.color = "#00cc66";

      msg.textContent =
        "✓ Cookies salvos";

      setCookiesTag(true);

    } else {

      msg.style.color = "#ff4444";

      msg.textContent =
        d.error;

    }

  } catch(e){

    msg.style.color = "#ff4444";

    msg.textContent =
      "Erro";

  }

}

async function buscar(){

  const url =
    document.getElementById("url")
    .value
    .trim();

  const resultado =
    document.getElementById("resultado");

  if(!url){

    resultado.innerHTML =
      '<p class="erro">Cole um link válido.</p>';

    return;

  }

  resultado.innerHTML =
    '<p class="msg">Buscando vídeo...</p>';

  try {

    const req = await fetch("/video", {

      method:"POST",

      headers:{
        "Content-Type":"application/json"
      },

      body:JSON.stringify({
        url
      })

    });

    const data = await req.json();

    if(data.error){

      resultado.innerHTML =
        `<p class="erro">${data.error}</p>`;

      return;

    }

    let buttons = "";

    data.qualities.forEach(q => {

      buttons += `
      <button
        class="btn-dl ${q.codec}"
        onclick="baixar(
          '${data.videoUrl}',
          ${q.height},
          '${q.codec}',
          '${q.filename}'
        )"
      >

        <span>
          ${q.height}p ${q.codec.toUpperCase()}
        </span>

        <span class="badge">
          ${q.codec === 'prores' ? 'MOV' : 'MP4'}
        </span>

      </button>
      `;

    });

    resultado.innerHTML = `
      <div class="card">

        <div class="thumb-wrap">
          <img src="${data.thumbnail}">
        </div>

        <div class="card-body">

          <p class="title">
            ${data.title}
          </p>

          <div class="codec-info">
            <strong>
              Otimizado para After Effects
            </strong>

            H264 / ProRes
          </div>

          ${buttons}

        </div>

      </div>
    `;

  } catch(e){

    resultado.innerHTML =
      '<p class="erro">Erro de conexão.</p>';

  }

}

async function baixar(
  url,
  height,
  codec,
  filename
){

  document
    .getElementById("modal")
    .classList
    .add("show");

  try {

    const r = await fetch("/prepare", {

      method:"POST",

      headers:{
        "Content-Type":"application/json"
      },

      body:JSON.stringify({
        url,
        height,
        codec,
        filename
      })

    });

    const d = await r.json();

    if(d.error){

      alert(d.error);

      return;

    }

    currentJobId = d.jobId;

    pollStatus();

  } catch(e){

    alert("Erro no download");

  }

}

async function pollStatus(){

  const status =
    document.getElementById("modal-status");

  const bar =
    document.getElementById("modal-bar");

  const interval = setInterval(async () => {

    const r =
      await fetch(
        `/status?id=${currentJobId}`
      );

    const d = await r.json();

    if(d.progress){

      bar.style.width =
        d.progress + "%";

    }

    status.textContent =
      d.message || "Processando...";

    if(d.status === "ready"){

      clearInterval(interval);

      window.location =
        `/file?id=${currentJobId}`;

      setTimeout(() => {

        document
          .getElementById("modal")
          .classList
          .remove("show");

      }, 2000);

    }

    if(d.status === "error"){

      clearInterval(interval);

      alert(
        d.message ||
        "Erro"
      );

    }

  }, 2000);

}

</script>

</body>
</html>
