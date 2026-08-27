// ============================================
// SHARED COMPONENTS
// Small functions that return HTML strings from
// parameters, so a page just calls a function
// instead of hand-writing repeated markup.
// ============================================

// ---------- TAG ----------
// A small pill labeling a tool/platform (e.g. "Unreal Engine", "VR").
function tag(label) {
  return `<span class="tag">${label}</span>`;
}

function tagRow(labels = []) {
  return `<div class="project-card-tags">${labels.map(tag).join('')}</div>`;
}

// ---------- PROJECT CARD ----------
// image:       path to a splash image (optional — falls back to a gradient)
// title:       project name
// roles:       your role(s) on the project
// description: one or two sentence gist
// tags:        array of strings, e.g. ['Unreal Engine', 'VR']
// href:        page this card links to
function projectCard({ image = '', title, roles, description, tags = [], href }) {
  const imageStyle = image ? ` style="background-image:url('${image}')"` : '';
  return `
    <a class="project-card" href="${href}">
      <div class="project-card-image"${imageStyle}></div>
      ${tagRow(tags)}
      <h3 class="project-card-title">${title}</h3>
      <p class="project-card-roles">Roles: ${roles}</p>
      <p class="project-card-desc">${description}</p>
      <span class="project-card-cta">Click to learn more!</span>
    </a>
  `;
}

// ---------- AUTO-LOADED PROJECT CARDS ----------
// Reads a project page's <script type="application/json" id="card-data">
// block and turns it into a projectCard(). Uses fetch() + DOMParser, so
// none of that page's own <script> tags run and none of its images or
// videos start loading — only the thumbnail we actually build a card
// with ever gets requested.
async function fetchProjectCard(href) {
  const res = await fetch(href);
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const dataEl = doc.getElementById('card-data');
  if (!dataEl) return null;
  const card = JSON.parse(dataEl.textContent);
  return projectCard({
    image: card.thumbnail,
    title: card.title,
    roles: card.roles,
    description: card.tagline,
    tags: card.tags,
    href
  });
}

// Loads every project page listed for `category` in PROJECT_INDEX (see
// assets/js/project-index.js) into the element with id `containerId`.
// Shows `emptyMessage` instead if that category has no projects yet.
async function loadCategoryCards(category, containerId, emptyMessage = 'Nothing here yet — check back soon!') {
  const container = document.getElementById(containerId);
  if (!container) return;
  const hrefs = (typeof PROJECT_INDEX !== 'undefined' && PROJECT_INDEX[category]) || [];
  if (hrefs.length === 0) {
    container.innerHTML = `<p class="project-grid-empty">${emptyMessage}</p>`;
    return;
  }
  const cards = await Promise.all(hrefs.map(fetchProjectCard));
  container.innerHTML = cards.filter(Boolean).join('');
}

// ---------- EMBEDS (YouTube / Google Drive / blueprintue) ----------
// Paste whatever URL you'd naturally copy for each site — a normal
// watch/share link, not a special embed link. These convert it for you.
function extractYouTubeId(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  return match ? match[1] : url;
}

function extractGoogleDriveId(url) {
  const match = url.match(/\/d\/([\w-]+)/);
  return match ? match[1] : url;
}

function extractBlueprintUeSlug(url) {
  const match = url.match(/blueprintue\.com\/blueprint\/([\w-]+)/);
  return match ? match[1] : url;
}

function embedFrame(src, extraClass = '') {
  const cls = extraClass ? `embed-wrap ${extraClass}` : 'embed-wrap';
  return `<div class="${cls}"><iframe src="${src}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
}

// ---------- VIDEO MUTE TOGGLE ----------
// Icons for the hover-to-reveal speaker button (see videoTag below).
const MUTE_ICON_MUTED = `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M3 9v6h4l5 5V4L7 9H3z" fill="currentColor"/><line x1="16" y1="9" x2="22" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="22" y1="9" x2="16" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
const MUTE_ICON_UNMUTED = `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M3 9v6h4l5 5V4L7 9H3z" fill="currentColor"/><path d="M16 8a5 5 0 0 1 0 8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M18.5 5.5a9 9 0 0 1 0 13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;

// Wired to the button's onclick — finds its paired <video> and flips
// mute state, swapping the icon and label to match.
function toggleVideoMute(button) {
  const video = button.previousElementSibling;
  video.muted = !video.muted;
  button.innerHTML = video.muted ? MUTE_ICON_MUTED : MUTE_ICON_UNMUTED;
  button.setAttribute('aria-label', video.muted ? 'Unmute video' : 'Mute video');
}

// A local video file. Defaults behave like a background clip: autoplay,
// loop, muted, no controls. muteToggle (default false) adds a translucent
// speaker button that fades in on hover and toggles sound on click.
function videoTag(media, { muteToggle = false, hideControls = true, autoplay = true, loop = true, muted = true } = {}) {
  const attrs = [
    autoplay && 'autoplay',
    loop && 'loop',
    muted && 'muted',
    'playsinline',
    !hideControls && 'controls'
  ].filter(Boolean).join(' ');
  const videoEl = `<video src="${media}" ${attrs}></video>`;

  if (!muteToggle) return videoEl;
  return `
    <div class="video-wrap">
      ${videoEl}
      <button type="button" class="mute-toggle" aria-label="${muted ? 'Unmute video' : 'Mute video'}" onclick="toggleVideoMute(this)">${muted ? MUTE_ICON_MUTED : MUTE_ICON_UNMUTED}</button>
    </div>
  `;
}

// ---------- AUDIO PLAYER ----------
// Icons for the play/pause button (see audioTag below).
const AUDIO_ICON_PLAY = `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M7 4l13 8-13 8V4z" fill="currentColor"/></svg>`;
const AUDIO_ICON_PAUSE = `<svg viewBox="0 0 24 24" width="18" height="18"><rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/></svg>`;

// Wired to the button's onclick — finds its paired <audio> (via the
// shared .audio-wrap, not sibling order, so markup can't drift out of
// sync) and toggles play/pause, swapping the icon and label to match.
function toggleAudioPlay(button) {
  const audio = button.closest('.audio-wrap').querySelector('audio');
  if (audio.paused) {
    audio.play();
    button.innerHTML = AUDIO_ICON_PAUSE;
    button.setAttribute('aria-label', 'Pause audio');
  } else {
    audio.pause();
    button.innerHTML = AUDIO_ICON_PLAY;
    button.setAttribute('aria-label', 'Play audio');
  }
}

// Wired to the seek slider's oninput — jumps playback to wherever the
// viewer clicked/dragged to (a plain <input type="range"> handles the
// actual click-and-drag interaction natively).
function seekAudio(input) {
  const audio = input.closest('.audio-wrap').querySelector('audio');
  if (!isNaN(audio.duration)) {
    audio.currentTime = (input.value / 100) * audio.duration;
  }
}

// Wired to the <audio>'s ontimeupdate — keeps the slider in sync with
// playback as it progresses.
function updateAudioProgress(audio) {
  if (!audio.duration) return;
  audio.closest('.audio-wrap').querySelector('.audio-seek').value = (audio.currentTime / audio.duration) * 100;
}

// If the clip finishes on its own, reset the button and slider back to
// their starting state instead of leaving them stuck mid-track.
function resetAudioButton(audio) {
  const wrap = audio.closest('.audio-wrap');
  const button = wrap.querySelector('.audio-toggle');
  button.innerHTML = AUDIO_ICON_PLAY;
  button.setAttribute('aria-label', 'Play audio');
  wrap.querySelector('.audio-seek').value = 0;
}

// A local audio file. Never plays by default — a play/pause button plus
// a seek slider the viewer can click or drag to jump around the track.
function audioTag(media) {
  return `
    <div class="audio-wrap">
      <audio src="${media}" ontimeupdate="updateAudioProgress(this)" onended="resetAudioButton(this)"></audio>
      <button type="button" class="audio-toggle" aria-label="Play audio" onclick="toggleAudioPlay(this)">${AUDIO_ICON_PLAY}</button>
      <input type="range" class="audio-seek" min="0" max="100" value="0" step="0.1" oninput="seekAudio(this)" aria-label="Seek audio" />
    </div>
  `;
}

// ---------- MEDIA TAG (shared helper) ----------
// Renders the right thing for mediaType:
//   'image'       -> <img>  (also covers GIFs)
//   'video'       -> local .mp4/.webm file — see videoTag's options below
//   'audio'       -> local .mp3/.wav/etc. file — a speaker button (same
//                    look as the video mute-toggle), always visible since
//                    there's no video frame for it to overlay. Never plays
//                    by default; click to play, click again to pause.
//   'youtube'     -> a plain, normal YouTube embed (paste a normal watch/share
//                    URL) — YouTube's own player, controls and all. There's
//                    no reliable way to fully strip a YouTube embed's UI (see
//                    videoTag if you need real autoplay/loop/mute-toggle
//                    control — that only works for local video files).
//   'gdrive'      -> embedded Google Drive preview (paste a normal share URL)
//   'blueprintue' -> embedded blueprintue.com blueprint (paste the blueprint page URL)
// Options (2nd arg): { muteToggle, hideControls, autoplay, loop, muted } —
// all apply to 'video' only, ignored otherwise. See videoTag above for
// their individual defaults.
function mediaTag(media, mediaType = 'image', options = {}) {
  switch (mediaType) {
    case 'video':
      return videoTag(media, options);
    case 'audio':
      return audioTag(media);
    case 'youtube':
      return embedFrame(`https://www.youtube.com/embed/${extractYouTubeId(media)}`);
    case 'gdrive':
      return embedFrame(`https://drive.google.com/file/d/${extractGoogleDriveId(media)}/preview`);
    case 'blueprintue':
      // blueprintue graphs render at their own fixed pixel size (not a
      // responsive video), so they get a tall fixed-height box instead
      // of the 16:9 one — squeezing them into 16:9 just clips the graph
      // and forces a scrollbar. Its own "Fullscreen" button (built into
      // the embed) covers graphs too big even for that.
      return embedFrame(`https://blueprintue.com/render/${extractBlueprintUeSlug(media)}/`, 'embed-wrap-blueprintue');
    default:
      return `<img src="${media}" alt="" loading="lazy" />`;
  }
}

// ---------- LIGHTWEIGHT MARKDOWN ----------
// Just enough markdown for prose in block text — not a full parser,
// only these three patterns: **bold**, *italics*, [link text](url).
// Order matters: bold before italics, so **x** doesn't get read as two
// stray *italic* markers first.
function parseMarkdown(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

// ---------- TEXT + MEDIA BLOCK ----------
// text:      multiline string — each line becomes its own paragraph.
//            Supports *italics*, **bold**, and [link text](url).
//            Optional; omit it entirely for a plain, centered media block.
// media:     path/URL to the image, video, or embed (see mediaTag above) —
//            optional; omit it entirely for a plain, centered text block
// mediaType:    'image' (default) | 'video' | 'audio' | 'youtube' | 'gdrive' | 'blueprintue'
// muteToggle:   'video' only — false (default) is a plain clip; true adds
//               a hover-to-reveal speaker button letting the viewer
//               un-mute/re-mute it.
// hideControls, autoplay, loop, muted: 'video' only — all default to true,
//               matching a looping background clip. Set any to false to
//               get a normal, watch-it-yourself player. ('youtube' is
//               always just a plain embed — see mediaTag for why.)
// reverse:      false = text left / media right, true = media left / text right
//               (ignored when text or media is missing). You won't normally
//               set this by hand — renderBlocks() below assigns it automatically.
function textMediaBlock({ text, media, mediaType = 'image', muteToggle, hideControls, autoplay, loop, muted, reverse = false }) {
  if (!text) {
    if (!media) return '';
    return `<div class="media-block">${mediaTag(media, mediaType, { muteToggle, hideControls, autoplay, loop, muted })}</div>`;
  }

  const paragraphs = text.trim().split('\n').map((line) => `<p>${parseMarkdown(line)}</p>`).join('');

  if (!media) {
    return `<div class="text-block">${paragraphs}</div>`;
  }

  return `
    <div class="text-media${reverse ? ' reverse' : ''}">
      <div class="tm-text">${paragraphs}</div>
      <div class="tm-media">${mediaTag(media, mediaType, { muteToggle, hideControls, autoplay, loop, muted })}</div>
    </div>
  `;
}

// Renders a list of blocks (a section's, a subsection's, or the page
// intro's), automatically alternating which side the media lands on —
// first media block is text-left/media-right, the next is flipped, and
// so on. Text-only and media-only blocks (missing either `text` or
// `media`) are skipped for this count (they always render centered
// anyway) so they don't throw off the pattern. Each call starts its own
// fresh left/right count — a section and its subsections each alternate
// independently, not as one shared sequence.
function renderBlocks(blocks = []) {
  let mediaCount = 0;
  return blocks.map((block) => {
    if (!block.media || !block.text) return textMediaBlock(block);
    const reverse = mediaCount % 2 === 1;
    mediaCount++;
    return textMediaBlock({ ...block, reverse });
  }).join('');
}

// ---------- CREDITS TABLE ----------
// list: array of { role, name }
function creditsTable(list = []) {
  const rows = list.map(({ role, name }) => `
    <div class="credit-row">
      <span class="credit-role">${role}</span>
      <span class="credit-name">${name}</span>
    </div>
  `).join('');
  return `<div class="credits-table">${rows}</div>`;
}

// ---------- PROJECT PAGE SYSTEM ----------
// This is the reusable engine behind every project detail page.
// A page only needs to define one data object (see template-project.html)
// and call renderProjectPage(project) — no hand-written markup required.
//
// project shape:
// {
//   title, tagline, roles, tags: [],
//   credits: [{ role, name }],            // optional — omit to skip the credits table
//   heroMedia: { src, type, muteToggle, hideControls, autoplay, loop, muted }, // optional —
//     all but src/type only apply when type is 'video' ('youtube' is
//     always a plain embed, see mediaTag). Unlike a body block, a hero
//     video defaults to a normal player: hideControls, autoplay, loop,
//     and muted all default to FALSE here (controls shown, sound on,
//     plays once) — set any of them true for the autoplay/loop/muted
//     background-clip behavior instead.
//   intro: [                              // optional — blocks shown between the
//     { text, media, mediaType }          // credits and the section jump-nav
//   ],
//   sections: [
//     {
//       id: 'unique-anchor-id',
//       heading: 'Section Heading',        // general-info section — always visible
//       blocks: [                          // one or more text+media rows —
//         { text, media, mediaType }       // media side alternates automatically
//       ],
//       subsections: [                     // optional — technical breakdowns, collapsed by default
//         {
//           id: 'unique-anchor-id',
//           heading: 'Sub-section Heading',
//           blocks: [ { text, media, mediaType } ]
//         }
//       ]
//     }
//   ]
// }

function projectHero({ title, tagline, roles, tags = [], credits, heroMedia }) {
  const heroMediaHtml = heroMedia
    ? `<div class="project-hero-media">${mediaTag(heroMedia.src, heroMedia.type, {
        muteToggle: heroMedia.muteToggle ?? false,
        // Hero video is meant to be watched, not looped in the background —
        // opposite defaults from a body block unless the project overrides them.
        hideControls: heroMedia.hideControls ?? false,
        autoplay: heroMedia.autoplay ?? false,
        loop: heroMedia.loop ?? false,
        muted: heroMedia.muted ?? false
      })}</div>`
    : '';
  const creditsHtml = credits ? `<h3 class="credits-heading">Credits</h3>${creditsTable(credits)}` : '';

  return `
    <header id="top" class="project-hero">
      <h1>${title}</h1>
      <p class="project-hero-tagline">${tagline}</p>
      <p class="project-hero-roles">Roles: ${roles}</p>
      ${tagRow(tags)}
      ${heroMediaHtml}
      ${creditsHtml}
    </header>
  `;
}

function sectionJumpNav(sections = []) {
  if (sections.length < 2) return '';
  const links = sections.map((s) => `<a href="#${s.id}">${s.heading}</a>`).join('');
  return `<nav class="section-jumpnav">${links}</nav>`;
}

// A collapsible technical aside within a section. Collapsed by default
// (native <details>, so no JS is needed to make it expand/collapse).
function subsection({ id, heading, blocks = [] }) {
  const blocksHtml = renderBlocks(blocks);
  return `
    <details id="${id}" class="subsection">
      <summary><span class="subsection-tag">Sub-section</span>${heading}</summary>
      <div class="subsection-body">${blocksHtml}</div>
    </details>
  `;
}

function contentSection({ id, heading, blocks = [], subsections = [] }) {
  const blocksHtml = renderBlocks(blocks);
  const subsectionsHtml = subsections.map(subsection).join('');
  return `
    <section id="${id}" class="content-section">
      <h2>${heading}</h2>
      ${blocksHtml}
      ${subsectionsHtml}
      <a class="back-to-top" href="#top">&uarr; Back to top</a>
    </section>
  `;
}

function renderProjectPage(project) {
  const introHtml = renderBlocks(project.intro || []);
  const sections = (project.sections || []).map(contentSection).join('');
  return `
    ${projectHero(project)}
    ${introHtml ? `<div class="project-intro">${introHtml}</div>` : ''}
    ${sectionJumpNav(project.sections || [])}
    ${sections}
  `;
}
