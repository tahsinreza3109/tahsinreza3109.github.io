# Tahsin Reza - Academic Portfolio

A static, dependency-free (no build step, no Node required) academic portfolio site.
Plain HTML + CSS + a small amount of vanilla JS for the day/night toggle, scroll reveals,
and the class-projects carousel.

**Live site:** https://tahsinreza3109.github.io

## Publishing to GitHub Pages

The repository root *is* the site, so Pages needs no build step. After pushing:

1. Go to the repository on GitHub → **Settings** → **Pages**
2. Under "Build and deployment", set **Source** to `Deploy from a branch`
3. Choose branch `main` and folder `/ (root)`, then **Save**

The site goes live at `https://<username>.github.io` (for a repo named `<username>.github.io`)
or `https://<username>.github.io/<repo-name>/` for any other repo name, usually within a minute.

`.nojekyll` is committed so GitHub serves the files as-is instead of running them through Jekyll.

To publish an update later: edit, commit, push. Pages redeploys automatically.

## Structure

```
site/
  index.html            All page content, organized into clearly labeled <section> blocks
  assets/
    css/style.css        All styling + the light/dark theme variables
    js/main.js            Theme toggle, mobile menu, footer year
    img/profile.jpg       Profile photo
    img/favicon-*.png     Browser tab icon
    cv/Tahsin_Reza_CV.pdf  The file the "Download CV" button links to
  robots.txt
  vercel.json            Cache headers for Vercel deploys
```

## Updating content

Everything lives directly in `index.html`, split into commented sections in this order:
About/Hero → About → Research Interests → Research Experience → Professional Experience →
Personal Projects → Class Projects → Publications → Skills → Education → Awards/Leadership →
Future Direction → Contact.

Each repeatable block (a research-interest card, a timeline entry, a project card, a publication,
a skill tag, an education row, an award row) is a self-contained chunk of HTML — copy an existing
one, edit the text inside it, and paste it back in the same section to add another. Delete a block
to remove an entry. No other file needs to change for routine content edits.

Common edits:
- **New personal project**: duplicate the `.project-card` block inside `#projects`.
- **New class project**: duplicate a `.class-project-card` block inside `#class-projects` (needs a
  `.cp-media` image — see the Drive/images note below).
- **New publication**: duplicate a `.pub` block inside `#publications`. Use the `status-badge` span
  for a label like "Submitted", "Under Review", "Published", "Thesis", etc.
- **New job/research role**: duplicate an `.entry` block inside `#experience` or
  `#professional-experience`.
- **Update the CV**: replace `assets/cv/Tahsin_Reza_CV.pdf` with a new file of the same name (or
  update the two `href="assets/cv/..."` links in `index.html` if you rename it).
- **Update the photo**: replace `assets/img/profile.jpg` with a new image of the same name
  (portrait orientation, roughly 3:4, works best).
- **Add Google Scholar or other links**: copy one of the `<li>` blocks in the Contact section's
  `.contact-list` and point it at the new URL.

## Class Projects: the carousel

The Class Projects section is a slide carousel (`#carousel` in `index.html`, logic in `assets/js/main.js`).
Each project is one `<article class="slide">` containing an image mosaic and a text block.

- **Add a project**: copy an existing `<article class="slide">` and edit it. The dots and arrows are generated
  from the number of slides, so nothing else needs changing.
- **Image mosaic**: put 2 images in a `<div class="slide-media m-2">` (side by side) or 3 in
  `<div class="slide-media m-3">` (one large left, two stacked right), using `figure.fig-a` / `.fig-b` / `.fig-c`.
  Images are `object-fit: contain` on a paper-coloured ground, so nothing gets cropped.
- **Project images** live in `assets/img/projects/` as `{project}-1.jpg`, `-2.jpg`, `-3.jpg`. Replace a file of
  the same name to swap a picture.
- Each slide's `.cp-link` points directly at that project's file on Google Drive.

## Older note: Google Drive links

The six Class Project thumbnails in `assets/img/projects/` were auto-extracted from the original
report/presentation files (cover maps, diagrams, GIS figures) — swap any of them for a better shot
any time by replacing the file of the same name.

Each class-project card, and the "Project Presentation" link on the DTCA entry, currently points to
a **placeholder** Drive URL (`https://drive.google.com/PLACEHOLDER-...`) — search `index.html` for
`PLACEHOLDER` to find all seven. I couldn't upload to Google Drive directly from this session (no
Drive connector, and Claude in Chrome wasn't connected), and a few of these files are too large
for that path anyway (up to ~330MB), so: create the folders below in your Drive
(tahsinreza3109@gmail.com), drag in the matching local files, then replace each placeholder with
that folder's "Get link" URL.

| Drive folder | Local file(s) to add |
|---|---|
| `01 Rural Road Networks & Land Use` | `Portfolio/Analyzing Core Rural Road Networks and Land Use Conversion.pdf` |
| `02 Earthquake Risk – Ward 53` | `Portfolio/Community-Based Assessment...Earthquake Risk Reduction.pdf`, `Portfolio/Plan 412 Final Presentation Group 3.pptx` |
| `03 Pedestrian Catchment – MRT` | `Portfolio/Factors Influencing Pedestrian Catchment.pdf` |
| `04 Flood Resilience – Floodplain` | `Portfolio/Plan - Regional studio.pdf` |
| `05 HydroSculpt – Landscape & Flood` | `Portfolio/Hydrosculpt - Landscape Enhancement and Urban Flood Solving Idea Book.pdf` |
| `06 Heritage Conservation – Old Dhaka` | `Portfolio/UPS/Group_6_Final_Report_PLAN_312.pdf`, `Portfolio/UPS/Group_6_Final ppt.pptx` |
| `07 DTCA Basabo TIA Presentation` | `Portfolio/Final Presentation.pptx` (this is the course/DTCA traffic-impact-assessment deck — linked from Professional Experience, not a Class Projects card) |

Set each folder's sharing to "Anyone with the link" so admissions reviewers can open it without
signing in.

## Theme

Colors are defined once as CSS variables at the top of `assets/css/style.css` — light theme on
`:root`, dark theme under `:root[data-theme="dark"]` (and mirrored for the OS-level
`prefers-color-scheme: dark` default). Change a color in one place and it updates everywhere.

## Running locally

No build step. Any static file server works, e.g.:

```bash
cd site
python -m http.server 5500
```

Then open `http://localhost:5500`.

## Deploying to Vercel

This is a zero-config static site.

```bash
npm i -g vercel   # if you don't already have the Vercel CLI
cd site
vercel
```

Or: push this repo to GitHub and import it in the Vercel dashboard — no framework preset needed
("Other" / static), no build command, output directory is the project root.
