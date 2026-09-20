# CONSTRAINTS

Short, explicit rules for the AI. Read before touching code. Keep this list short.

## Never
- Never copy code, CSS, shaders or media from
  `github.com/gireeshkumarreddy/cinematic-portofilo`. It has no licence, so
  default copyright applies.
- Never invent a metric, GitHub URL, deployment link, achievement, date or
  certification. If it is not verified, it does not go on the page.
- Never populate a `links: {}` from a local git remote, a resume, or an
  assumption that a repository is public.
- Never claim a project's implementation was inspected when it was not.
  Projects flagged `source: 'provided'` were described from Krishna's brief;
  their disclaimers must survive every edit.
- Never add a profile photograph or any image of Krishna. He has declined to
  supply one and the design requires none.
- Never assume a project file, screenshot or repository exists on the machine.
- Never change `overflow-x: clip` to `hidden` in `app.css` — `hidden` promotes
  `<body>` to a scroll container and breaks every `position: sticky` pin.
- Never present the skin-lesion study as clinically validated, or UPI Sentinel
  as detecting real-world fraud.

## Always
- Always put personal and project facts in `src/data/content.js`, never in
  markup, CSS or a scene module.
- Always keep informational content in real, focusable DOM. WebGL is
  decoration; the page must be complete without it.
- Always give every animated scene a `lib/scene.js → gate()` lifecycle, so it
  runs only while on screen and the tab is visible.
- Always honour `prefers-reduced-motion` by landing a scene on its settled
  state rather than by playing a faster animation.
- Always make assets optional — a missing file produces a placeholder or hides
  its own control, never a broken image or a dead link.
- Always run `node tools/check_content.mjs` after editing content, and read the
  output before claiming it passes.

## Ask First
- Ask before adding any dependency, framework, bundler or animation library.
- Ask before publishing Krishna's phone number, or any contact detail beyond
  email, LinkedIn and GitHub.
- Ask before adding a project, an employment entry or a certification that is
  not already in `content.js`.
- Ask before initialising a git repository, committing, or pushing anywhere.
