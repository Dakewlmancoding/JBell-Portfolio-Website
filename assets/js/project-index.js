// ============================================
// PROJECT INDEX
// A static site can't ask the server "what files are in this folder" —
// there's no server-side code to ask. So this is the one place that
// lists which project pages exist per category. games.html/tools.html/
// misc.html read this to know what to show; everything else about each
// card (title, roles, tagline, tags, thumbnail) comes automatically from
// that project's own <script type="application/json" id="card-data">
// block — see project-template.html.
//
// Adding a new project page = add its path here, once.
// ============================================
const PROJECT_INDEX = {
  games: [
    '/projects/games/sounds-of-adventure.html',
    '/projects/games/sushi-ben.html',
    '/projects/games/water-wings.html',
  ],
  tools: [],
  misc: [
    '/projects/misc/arcane-melodies.html'
  ]
};
