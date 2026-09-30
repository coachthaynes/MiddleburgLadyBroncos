# Illumination Template

A player site with a cinematic opening: a point of light opens into a circle that reveals the highlight video, the player's name, number, position and school arrive over it, and on scroll the video closes back into a circle and fades to black.

## Files

| File | Edit per player? |
| --- | --- |
| `site.js` | **Yes.** All player content: name, colors, bio, stats, measurables, film links, schedule, writeups, NIL copy, contact approver. |
| `index.html` | No. Page structure and the Netlify forms. |
| `illumination.js` | No. Renders `site.js`, runs the opening sequence, loads media from the Madi Visuals dashboard. |
| `illumination.css` | No. Styles. School colors come from `theme` in `site.js`. |
| `media/` | Optional fallback files (`highlight.mp4`, `highlight.webm`, `poster.jpg`, `photos/`). Used only until the dashboard has live media. |

## Sections

Opening video · Profile · Season stats and shooting splits · Measurables, testing and academics · Film links · Season schedule with next game countdown · Writeups · NIL partnerships and inquiry form · Photo vault (NIL Ready and Editorial) · Private contact request form.

Contact details are never published. Requests go to the email in `contact.email` for approval.

## Writing rules

Keep visible text free of hyphens and dashes. Leave a stat blank (`""`) to show Upcoming, or leave out `v` on a measurable to show Pending.

## Updating every site

Change `index.html`, `illumination.js` or `illumination.css` here, then run `elevate-her/sync-template.sh` and redeploy each site.
