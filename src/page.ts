type DebugValue = unknown;

const escapeHtml = (value: DebugValue): string => String(value ?? "—")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

const serializeForScript = (value: unknown): string => JSON.stringify(value)
  .replaceAll("<", "\\u003c")
  .replaceAll("\u2028", "\\u2028")
  .replaceAll("\u2029", "\\u2029");

const row = (label: string, value: DebugValue, className = ""): string =>
  `<div class="data-row${className ? ` ${className}` : ""}"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`;

function coordinates(latitude: unknown, longitude: unknown): string | null {
  const latText = typeof latitude === "string" ? latitude.trim() : String(latitude ?? "");
  const lonText = typeof longitude === "string" ? longitude.trim() : String(longitude ?? "");
  if (!latText || !lonText) return null;
  if (!Number.isFinite(Number(latText)) || !Number.isFinite(Number(lonText))) return null;
  return `${latText}, ${lonText}`;
}

function localTime(timeZone: unknown): string {
  if (typeof timeZone !== "string" || !timeZone) return "local time";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());
  } catch {
    return "local time";
  }
}

export function renderPage(
  request: Request,
  generationToken: string,
  analyticsToken?: string,
): Response {
  const cf = request.cf;
  const headers = request.headers;
  const siteOrigin = new URL(request.url).origin;
  const ip = headers.get("cf-connecting-ip") ?? "Unknown";
  const country = cf?.country ?? headers.get("cf-ipcountry") ?? "Unknown country";
  const location = [cf?.city, cf?.region, country].filter(Boolean).join(", ");
  const ipClass = ip.includes(":") ? "ipv6" : "ipv4";
  const ipv4 = ipClass === "ipv4" ? ip : "Not detected";
  const ipv6 = ipClass === "ipv6" ? ip : "Not detected";
  const imageHeading = `${cf?.city ?? "Your city"} · ${localTime(cf?.timezone)}`;
  const visitContext = {
    city: typeof cf?.city === "string" ? cf.city : null,
    region: typeof cf?.region === "string" ? cf.region : null,
    country,
    coordinates: coordinates(cf?.latitude, cf?.longitude),
    timezone: typeof cf?.timezone === "string" ? cf.timezone : null,
    cfEdge: typeof cf?.colo === "string" ? cf.colo : null,
  };
  const analyticsScript = analyticsToken
    ? `<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${escapeHtml(analyticsToken)}"}'></script>`
    : "";

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#b9ddfb">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <title>Your IP, Location &amp; AI-Reimagined View | ip/fal</title>
  <meta name="description" content="See your public IP, approximate Cloudflare location, and an AI-reimagined view of your location generated with fal.ai.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeHtml(siteOrigin)}/">
  <meta property="og:site_name" content="ip/fal">
  <meta property="og:title" content="Your IP, Location &amp; AI-Reimagined View | ip/fal">
  <meta property="og:description" content="See your public IP, approximate Cloudflare location, and an AI-reimagined view of your location generated with fal.ai.">
  <meta property="og:image" content="${escapeHtml(siteOrigin)}/og-image.png?v=3">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="ip/fal — your IP and location, reimagined">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Your IP, Location &amp; AI-Reimagined View | ip/fal">
  <meta name="twitter:description" content="See your public IP, approximate Cloudflare location, and an AI-reimagined view of your location generated with fal.ai.">
  <meta name="twitter:image" content="${escapeHtml(siteOrigin)}/og-image.png?v=3">
  <meta name="twitter:image:alt" content="ip/fal — your IP and location, reimagined">
  <style>
    :root{font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;--ink:#070707;--muted:#303030;--subtle:#4f4f4f;--canvas:#b9ddfb;--lime:#c8ff00;--violet:#7c14ff;--yellow:#ffc400}
    *{box-sizing:border-box}html{height:100%}[hidden]{display:none!important}body{display:grid;grid-template-rows:64px minmax(0,1fr) auto;height:100dvh;margin:0;overflow:hidden;background:var(--canvas);color:var(--ink)}button{font:inherit}
    .site-header{border-bottom:2px solid var(--ink)}.header-inner,main,.footer-inner{width:min(1320px,calc(100% - 48px));margin:0 auto}.header-inner{height:100%;display:flex;align-items:center;justify-content:space-between}.header-lockup{display:flex;align-items:center;gap:16px;min-width:0}.brand{font-size:34px;font-weight:900;letter-spacing:-.065em;line-height:1}.tagline{padding-left:16px;border-left:2px solid var(--ink);font:650 12px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:nowrap}.live{display:flex;align-items:center;gap:6px}.social-link,.privacy-button{display:grid;place-items:center;width:34px;height:34px;padding:0;border:2px solid var(--ink);border-radius:0;background:transparent;color:var(--ink);cursor:pointer}.social-link svg,.privacy-button svg{width:17px;height:17px;fill:currentColor}.social-link:hover,.privacy-button:hover,.privacy-button[aria-pressed="true"]{background:var(--lime)}.privacy-button .eye-off{display:none}.privacy-button[aria-pressed="true"] .eye-on{display:none}.privacy-button[aria-pressed="true"] .eye-off{display:block}
    .history-button{position:relative;display:grid;place-items:center;width:34px;height:34px;padding:0;border:2px solid var(--ink);border-radius:0;background:transparent;color:var(--ink);cursor:pointer}.history-button svg{width:17px;height:17px}.history-button:hover{background:var(--lime)}.history-count{position:absolute;right:-7px;top:-7px;display:grid;place-items:center;min-width:17px;height:17px;padding:0 4px;border:1px solid var(--ink);background:var(--violet);color:#fff;font:800 9px/1 ui-monospace,SFMono-Regular,Menlo,monospace}
    main{display:grid;grid-template-rows:auto minmax(0,1fr);min-height:0;padding:16px 0 20px}.result{position:relative;margin-bottom:12px;padding:0 56px}.result::before,.result::after{content:"";position:absolute;width:22px;height:22px}.result::before{left:0;top:14px;background:var(--lime);box-shadow:22px 22px 0 var(--lime),22px 44px 0 var(--lime),44px 44px 0 var(--lime)}.result::after{right:0;bottom:2px;background:var(--violet);box-shadow:-22px 22px 0 var(--violet),-44px 22px 0 var(--violet)}
    .eyebrow{margin:0 0 -6px;font-size:clamp(32px,4vw,52px);font-weight:900;letter-spacing:-.055em;text-transform:lowercase}.ip-line{position:relative;display:flex;align-items:center;gap:14px;min-width:0}h1{margin:0;font-size:clamp(54px,7.6vw,112px);line-height:.88;letter-spacing:-.075em;font-weight:950;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}h1.ipv4{font-size:clamp(52px,6.7vw,100px)}h1.ipv6{font-size:clamp(30px,4.6vw,68px)}.copy-button{flex:0 0 auto;display:grid;place-items:center;width:48px;height:48px;border:2px solid var(--ink);border-radius:0;background:transparent;cursor:pointer;transition:transform .16s ease,background .16s ease}.copy-button:hover{background:var(--lime)}.copy-button:active{transform:scale(.9)}.copy-button:focus-visible{outline:4px solid var(--violet);outline-offset:3px}.copy-button svg{grid-area:1/1;width:21px;height:21px}.copy-button .check-icon{display:none}.copy-button.copied{background:var(--lime);animation:copy-pop .35s ease}.copy-button.copied .copy-icon{display:none}.copy-button.copied .check-icon{display:block}.copy-feedback{position:absolute;right:0;bottom:-28px;z-index:3;padding:5px 8px;border:2px solid var(--ink);background:var(--lime);font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;opacity:0;pointer-events:none;transform:translateY(-5px);transition:opacity .16s ease,transform .16s ease}.copy-feedback.visible{opacity:1;transform:translateY(0)}@keyframes copy-pop{50%{transform:scale(1.12)}}.location{margin:8px 0 0;font-size:clamp(20px,2vw,28px);font-weight:850;letter-spacing:-.035em}
    .primary-panel{display:grid;grid-template-columns:minmax(0,1.48fr) minmax(290px,.52fr);gap:22px;min-height:0;align-items:stretch}.panel-section{padding:0 20px 16px;min-width:0;border:2px solid var(--ink)}.image-panel{position:relative;display:grid;grid-template-rows:auto minmax(0,1fr) auto auto;min-height:0}.network-panel{align-self:start}h2{margin:0 -20px;padding:7px 20px 8px;border-bottom:2px solid var(--ink);background:#fff;font-size:clamp(24px,2.2vw,34px);font-weight:900;letter-spacing:-.055em;line-height:1}#image-heading{position:relative;padding-right:68px}#image-heading::after{content:"";position:absolute;right:20px;top:50%;width:14px;height:14px;transform:translateY(-50%);background:var(--yellow);box-shadow:-14px 14px 0 var(--yellow),-28px 14px 0 var(--yellow)}
    dl{margin:0}.data-row{display:grid;grid-template-columns:minmax(112px,.72fr) 1.28fr;gap:18px;margin:0 -20px;padding:8px 20px;border-bottom:1px solid var(--ink);font:560 13px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace}.data-row:last-child{border-bottom:0}dd{margin:0;font-weight:600;overflow-wrap:anywhere}
    .image-frame{position:relative;min-height:0;margin:0 -20px;overflow:hidden;border-bottom:2px solid var(--ink);background:#9dc9ed}#generated-image{display:none;width:100%;height:100%;object-fit:cover}.image-loading{position:absolute;inset:0;display:grid;place-items:center;font:600 12px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace}.spinner{width:20px;height:20px;margin:0 auto 10px;border:2px solid var(--ink);border-top-color:var(--lime);border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
    .generation-meta{display:grid;grid-template-columns:1fr 1fr;margin:0 -20px}.meta-item{display:grid;grid-template-columns:82px 1fr;gap:8px;padding:7px 10px;border-bottom:1px solid var(--ink);font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.meta-item+.meta-item{border-left:1px solid var(--ink)}.meta-item span{color:var(--subtle);font-size:10px;font-weight:650;text-transform:lowercase}.meta-item strong{font-size:11px;font-weight:650;overflow-wrap:anywhere}.prompt{display:block;margin:7px 0 0;color:var(--muted);font:550 9px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere}.prompt strong{color:var(--ink)}
    body.privacy-mode .result{display:grid;grid-template-columns:auto 1fr;align-items:baseline;column-gap:10px}body.privacy-mode .eyebrow{margin:0}body.privacy-mode .ip-line{display:block}body.privacy-mode .location{grid-column:1/-1}body.privacy-mode #ip-heading{font-size:0;white-space:nowrap}body.privacy-mode #ip-heading::after{content:"IP hidden";font-size:clamp(32px,4vw,52px);font-weight:900;letter-spacing:-.055em}body.privacy-mode .copy-button,body.privacy-mode .copy-feedback,body.privacy-mode .prompt{display:none!important}body.privacy-mode .sensitive dd{font-size:0}body.privacy-mode .sensitive dd::after{content:"Hidden";font-size:13px;font-weight:700}
    .history-dialog{width:min(680px,calc(100% - 32px));max-height:min(84dvh,760px);padding:0;border:2px solid var(--ink);border-radius:0;background:var(--canvas);color:var(--ink);box-shadow:10px 10px 0 var(--ink)}.history-dialog::backdrop{background:rgba(7,7,7,.58)}.history-header{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:2px solid var(--ink);background:#fff}.history-header h2{margin:0;padding:0;border:0;background:transparent}.history-close{display:grid;place-items:center;width:34px;height:34px;padding:0;border:2px solid var(--ink);background:transparent;cursor:pointer;font-size:22px;font-weight:800}.history-close:hover,.history-clear:hover{background:var(--lime)}.history-body{padding:14px 16px 16px;overflow:auto}.history-note{margin:0 0 12px;font:600 11px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace}.history-list{display:grid;gap:10px}.history-entry{display:grid;grid-template-columns:150px minmax(0,1fr);border:2px solid var(--ink);background:#fff}.history-thumb{display:block;width:100%;height:100%;min-height:112px;object-fit:cover;border-right:2px solid var(--ink);background:#9dc9ed}.history-info{min-width:0;padding:10px 12px}.history-title{margin:0 0 4px;font-size:18px;font-weight:900;letter-spacing:-.035em}.history-time,.history-details,.history-prompt{margin:0;font:600 10px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere}.history-time{color:var(--subtle)}.history-details{margin-top:6px}.history-prompt{display:-webkit-box;margin-top:6px;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2}.history-empty{padding:28px 12px;border:2px dashed var(--ink);text-align:center;font:700 12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace}.history-actions{display:flex;justify-content:flex-end;margin-top:12px}.history-clear{padding:8px 12px;border:2px solid var(--ink);background:#fff;cursor:pointer;font:750 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace}body.privacy-mode .history-coordinates{font-size:0}body.privacy-mode .history-coordinates::after{content:"coordinates hidden";font-size:10px}
    footer{border-top:2px solid var(--ink)}.footer-inner{min-height:58px;display:flex;align-items:center;font-size:21px;font-weight:900;letter-spacing:-.04em}.footer-inner a{color:var(--ink);text-decoration:none}.footer-inner a:hover{text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:3px}
    @media(max-width:800px){body{grid-template-rows:60px auto auto;height:auto;min-height:100dvh;overflow-y:auto}main{display:block;padding:12px 0}.primary-panel{grid-template-columns:1fr}.image-panel{grid-template-rows:auto auto auto auto}.image-frame{aspect-ratio:16/9}.network-panel{display:block;margin-top:12px}h1{letter-spacing:-.045em}}
    @media(max-width:520px){body{grid-template-rows:52px auto auto}.header-inner,main,.footer-inner{width:min(100% - 24px,1320px)}main{padding:8px 0 12px}.header-lockup{gap:10px}.brand{font-size:28px}.tagline{padding-left:10px;font-size:9px;white-space:normal}.live{gap:4px}.social-link,.privacy-button{width:28px;height:28px}.result{margin-bottom:8px;padding:0}.result::before,.result::after{display:none}.eyebrow{font-size:26px}.ip-line{gap:8px}h1{font-size:clamp(30px,8.5vw,40px);letter-spacing:-.055em}h1.ipv4{font-size:clamp(36px,9.2vw,42px)}h1.ipv6{font-size:clamp(24px,6.8vw,32px)}body.privacy-mode #ip-heading::after{font-size:26px}.copy-button{width:38px;height:38px}.copy-button svg{width:18px;height:18px}.copy-feedback{right:0;bottom:-25px;font-size:9px}.location{margin-top:4px;font-size:14px}.panel-section{padding:0 16px 8px}.panel-section h2{margin-left:-16px;margin-right:-16px}.data-row{grid-template-columns:1fr;gap:3px;margin-left:-16px;margin-right:-16px}.image-frame{margin-left:-16px;margin-right:-16px;aspect-ratio:9/16}.generation-meta{position:static;grid-template-columns:1fr 1fr;margin:0 -16px}.meta-item{grid-template-columns:1fr}.prompt{position:static;display:block;max-height:none;margin:8px 0 0;padding:0;overflow:visible;font-size:10px;line-height:1.4}.footer-inner{min-height:46px;gap:10px;font-size:17px}}
    @media(prefers-reduced-motion:reduce){.spinner{animation:none}}
    @media(max-width:520px){.history-button{width:28px;height:28px}.history-dialog{width:calc(100% - 20px);max-height:88dvh;box-shadow:5px 5px 0 var(--ink)}.history-entry{grid-template-columns:104px minmax(0,1fr)}.history-thumb{min-height:132px}.history-title{font-size:15px}}
  </style>
</head>
<body>
  <header class="site-header"><div class="header-inner"><div class="header-lockup"><div class="brand">ip/fal</div><div class="tagline">neyse halin çıksın ip'in</div></div><div class="live"><button class="history-button" type="button" aria-label="Open visit history" title="Visit history"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></svg><span class="history-count" hidden>0</span></button><button class="privacy-button" type="button" aria-label="Hide sensitive information" aria-pressed="false" title="Privacy mode"><svg class="eye-on" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5c5.5 0 9.5 5.3 9.5 7s-4 7-9.5 7S2.5 13.7 2.5 12 6.5 5 12 5Zm0 2C8.1 7 5 10.4 4.5 12c.5 1.6 3.6 5 7.5 5s7-3.4 7.5-5C19 10.4 15.9 7 12 7Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"/></svg><svg class="eye-off" viewBox="0 0 24 24" aria-hidden="true"><path d="m3.3 2 18.7 18.7-1.3 1.3-3.1-3.1A10.8 10.8 0 0 1 12 20C6.5 20 2.5 14.7 2.5 13c0-1.1 1.7-3.7 4.3-5.4L2 3.3 3.3 2Zm5 7C6.2 10.3 4.8 12.1 4.5 13c.5 1.6 3.6 5 7.5 5 1.5 0 2.9-.5 4.1-1.2l-1.7-1.7A4 4 0 0 1 9.9 10.6L8.3 9Zm3.2-4c.2 0 .3 0 .5 0 5.5 0 9.5 5.3 9.5 7 0 .9-1 2.6-2.6 4.1l-1.4-1.4c1.1-1 1.8-2.1 2-2.7-.5-1.6-3.6-5-7.5-5h-.3l-2-2h1.8Z"/></svg></button><a class="social-link" href="https://github.com/kiliczsh/ip-fal" target="_blank" rel="noopener noreferrer" aria-label="GitHub repository"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .7a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.3c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .7Z"/></svg></a><a class="social-link" href="https://x.com/kiliczsh" target="_blank" rel="noopener noreferrer" aria-label="X"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.2 2.3h3.3l-7.2 8.3 8.5 11.2h-6.7l-5.2-6.8-6 6.8H1.6l7.8-8.9L1.2 2.3H8l4.7 6.2 5.5-6.2Zm-1.2 17.5h1.8L7 4.1H5L17 19.8Z"/></svg></a></div></div></header>
  <main>
    <section class="result" aria-labelledby="ip-heading"><p class="eyebrow">your ip</p><div class="ip-line"><h1 class="${ipClass}" id="ip-heading">${escapeHtml(ip)}</h1><button class="copy-button" type="button" aria-label="Copy IP address" title="Copy IP address" data-ip="${escapeHtml(ip)}"><svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg><svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg></button><span class="copy-feedback" role="status" aria-live="polite">Copied</span></div><p class="location">${escapeHtml(location || "Location unavailable")}</p></section>
    <div class="primary-panel">
      <section class="panel-section image-panel" aria-labelledby="image-heading"><h2 id="image-heading">${escapeHtml(imageHeading)}</h2><div class="image-frame"><div class="image-loading" id="image-loading"><div><div class="spinner"></div>Generating at the edge</div></div><img id="generated-image" alt="Landscape generated for the visitor's approximate location"></div><div class="generation-meta" id="generation-meta" hidden><div class="meta-item"><span>Model</span><strong id="meta-model">—</strong></div><div class="meta-item"><span>Generation</span><strong id="meta-time">—</strong></div></div><p class="prompt" id="generation-prompt" hidden><strong>Prompt:</strong> <span></span></p></section>
      <section class="panel-section network-panel" aria-labelledby="network-heading"><h2 id="network-heading">location</h2><dl>${row("IPv4",ipv4,"sensitive")}${row("IPv6",ipv6,"sensitive")}${row("City",cf?.city)}${row("Region",cf?.region)}${row("Country",country)}${row("Continent",cf?.continent)}${row("Timezone",cf?.timezone)}${row("Coordinates",coordinates(cf?.latitude,cf?.longitude),"sensitive")}${row("CF Edge",cf?.colo)}</dl></section>
    </div>
  </main>
  <dialog class="history-dialog" id="history-dialog" aria-labelledby="history-title">
    <div class="history-header"><h2 id="history-title">visit history</h2><button class="history-close" type="button" aria-label="Close visit history">×</button></div>
    <div class="history-body"><p class="history-note">Saved only in this browser. IP addresses are never stored.</p><div class="history-list" id="history-list"></div><div class="history-actions"><button class="history-clear" type="button">clear history</button></div></div>
  </dialog>
  <footer><div class="footer-inner"><a href="https://x.com/kiliczsh" target="_blank" rel="noopener noreferrer">kiliczsh</a></div></footer>
  <script>
    const privacyButton=document.querySelector('.privacy-button');privacyButton.addEventListener('click',()=>{const enabled=document.body.classList.toggle('privacy-mode');privacyButton.setAttribute('aria-pressed',String(enabled));privacyButton.setAttribute('aria-label',enabled?'Show sensitive information':'Hide sensitive information');privacyButton.title=enabled?'Show sensitive information':'Privacy mode'});
    const copyButton=document.querySelector('.copy-button'),copyFeedback=document.querySelector('.copy-feedback');copyButton.addEventListener('click',async()=>{let copied=false;try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(copyButton.dataset.ip);copied=true}}catch(_){}if(!copied){const field=document.createElement('textarea');field.value=copyButton.dataset.ip;field.setAttribute('readonly','');field.style.position='fixed';field.style.opacity='0';document.body.appendChild(field);field.select();try{copied=document.execCommand('copy')}catch(_){}field.remove()}copyFeedback.textContent=copied?'Copied':'Copy unavailable';copyButton.classList.toggle('copied',copied);copyFeedback.classList.add('visible');copyButton.setAttribute('aria-label',copied?'IP address copied':'Copy unavailable');copyButton.title=copied?'Copied':'Copy unavailable';setTimeout(()=>{copyButton.classList.remove('copied');copyFeedback.classList.remove('visible');copyButton.setAttribute('aria-label','Copy IP address');copyButton.title='Copy IP address'},1600)});

    const HISTORY_KEY='ipfal:visit-history:v1',MAX_HISTORY=30,visitContext=${serializeForScript(visitContext)};
    const historyButton=document.querySelector('.history-button'),historyCount=document.querySelector('.history-count'),historyDialog=document.querySelector('#history-dialog'),historyList=document.querySelector('#history-list');
    const readHistory=()=>{try{const value=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');return Array.isArray(value)?value.slice(0,MAX_HISTORY):[]}catch(_){return[]}};
    const writeHistory=(items)=>{try{localStorage.setItem(HISTORY_KEY,JSON.stringify(items.slice(0,MAX_HISTORY)));return true}catch(_){return false}};
    const textElement=(tag,className,text)=>{const element=document.createElement(tag);if(className)element.className=className;element.textContent=text;return element};
    const updateHistoryCount=()=>{const count=readHistory().length;historyCount.textContent=String(count);historyCount.hidden=count===0};
    const renderHistory=()=>{const items=readHistory();historyList.replaceChildren();if(items.length===0){historyList.append(textElement('div','history-empty','No saved visits yet. Your next generated view will appear here.'));return}items.forEach(entry=>{const card=document.createElement('article');card.className='history-entry';const link=document.createElement('a');link.href=entry.imageUrl;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label','Open generated image');const thumb=document.createElement('img');thumb.className='history-thumb';thumb.src=entry.imageUrl;thumb.alt='Generated view from '+(entry.location?.city||'a previous visit');thumb.loading='lazy';link.append(thumb);const info=document.createElement('div');info.className='history-info';const place=[entry.location?.city,entry.location?.region,entry.location?.country].filter(Boolean).join(', ')||'Unknown location';info.append(textElement('h3','history-title',place));const visited=new Date(entry.visitedAt);info.append(textElement('p','history-time',Number.isNaN(visited.getTime())?entry.visitedAt:visited.toLocaleString()));const details=textElement('p','history-details',(entry.model||'Unknown model')+' · '+(entry.format||'unknown')+(entry.inferenceSeconds===null?'':' · '+Number(entry.inferenceSeconds).toFixed(2)+'s'));info.append(details);if(entry.location?.coordinates)info.append(textElement('p','history-details history-coordinates',entry.location.coordinates));if(entry.prompt)info.append(textElement('p','history-prompt',entry.prompt));card.append(link,info);historyList.append(card)})};
    const saveVisit=(data,imageFormat)=>{const generated=data.images&&data.images[0];if(!generated?.url)return;const entry={id:globalThis.crypto?.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(16).slice(2),visitedAt:new Date().toISOString(),imageUrl:generated.url,width:generated.width??null,height:generated.height??null,format:imageFormat,model:data.model??null,requestId:data.request_id??null,inferenceSeconds:data.timings?.inference??null,cache:data.cache??null,prompt:data.prompt??null,location:visitContext};if(writeHistory([entry,...readHistory()]))updateHistoryCount()};
    historyButton.addEventListener('click',()=>{renderHistory();historyDialog.showModal()});
    document.querySelector('.history-close').addEventListener('click',()=>historyDialog.close());
    document.querySelector('.history-clear').addEventListener('click',()=>{if(!confirm('Clear visit history saved in this browser?'))return;localStorage.removeItem(HISTORY_KEY);renderHistory();updateHistoryCount()});
    historyDialog.addEventListener('click',event=>{if(event.target===historyDialog)historyDialog.close()});
    updateHistoryCount();

    const image=document.querySelector('#generated-image'),loading=document.querySelector('#image-loading'),meta=document.querySelector('#generation-meta'),prompt=document.querySelector('#generation-prompt');
    const imageFormat=window.matchMedia('(max-width: 520px)').matches?'portrait':'landscape';
    fetch('/geo-image-data?format='+imageFormat,{headers:{'X-Generation-Token':${serializeForScript(generationToken)}}}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error||'Generation failed');image.addEventListener('load',()=>{loading.hidden=true;image.style.display='block'},{once:true});image.src=data.images[0].url;document.querySelector('#meta-model').textContent=data.model;document.querySelector('#meta-time').textContent=data.timings?.inference!==undefined?Number(data.timings.inference).toFixed(2)+' seconds':'Unavailable';meta.hidden=false;prompt.querySelector('span').textContent=data.prompt;prompt.hidden=false;saveVisit(data,imageFormat)}).catch(error=>{loading.innerHTML='<div>Image unavailable</div>';console.error(error instanceof Error?error.message:'Generation failed')});
  </script>
  ${analyticsScript}
</body>
</html>`;
  return new Response(html,{headers:{"cache-control":"no-store","content-type":"text/html; charset=utf-8","content-security-policy":"default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://cloudflareinsights.com; base-uri 'none'; frame-ancestors 'none'; form-action 'none'","strict-transport-security":"max-age=31536000","permissions-policy":"camera=(), microphone=(), geolocation=()","cross-origin-opener-policy":"same-origin","x-frame-options":"DENY","x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin"}});
}
