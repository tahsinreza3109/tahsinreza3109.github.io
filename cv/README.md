# CV drop folder

Put your latest CV here and the website picks it up automatically.

## How to update your CV

1. Open this `cv/` folder on GitHub
2. **Add file → Upload files**
3. Drag in your new CV PDF (any filename is fine, e.g. `Tahsin_Reza_CV_Nov2026.pdf`)
4. **Commit changes**

That's it. The deploy workflow copies the most recently uploaded PDF in this folder to
`assets/cv/Tahsin_Reza_CV.pdf`, which is what the "Download CV" buttons on the site point at.
The site is rebuilt and live within about a minute.

You can leave old CVs here as an archive; the workflow always uses the one committed most recently.
