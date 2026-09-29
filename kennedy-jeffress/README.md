# Kennedy Jeffress #2 · Player and NIL Site

Cinematic player site for Kennedy Jeffress, Middleburg Lady Broncos, Class of 2029.

## How the opening works

1. The page opens on black. A single point of light appears in the center.
2. The light opens into a circle that reveals the highlight video full screen.
3. Her name, number, position, school and class slide in across the video.
4. As the visitor scrolls, the name lifts away and the video closes back into a glowing circle, then fades to black before the rest of the site begins.

Until a video is added, an animated arena light scene plays inside the circle so the effect still works.

## Add the media

| File | What it is |
| --- | --- |
| `media/highlight.mp4` | Professional highlight video. Landscape, 1080p, 20 to 60 seconds, under about 25 MB so it loads fast. It plays muted in the hero and with sound in the Film section. |
| `media/poster.jpg` | A still frame from the video. Shows while the video loads and as the link preview image. |
| `media/photos/*.jpg` | Photo vault images. File names and labels are listed in the `PHOTOS` list near the bottom of `index.html`. |

Photo labels:

* `nil` shows as **NIL Ready**. Use only photos with no school name, logo, uniform or school facility in them.
* `editorial` shows as **Editorial**. Game and uniform photos for media and recruiting.

Missing photos show a "Photo coming soon" tile, so you can add them one at a time.

## Film links

In the Film section replace each `href="#"` with the real Hudl, Field Level, MaxPreps and YouTube links. Links left as `#` show as coming soon.

## NIL inquiry form

The form uses Netlify Forms (`nil-inquiry`). Once deployed on Netlify, submissions appear under the site's Forms tab; turn on email notifications there. If the form cannot post, it opens an email to Kennedy with Coach Haynes copied.

## Deploy

Drag the `kennedy-jeffress` folder into Netlify (or point a Netlify site at this folder).
