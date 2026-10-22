# Lady Broncos Team Store

A made to order store for Lady Bronco Basketball gear. Coaches print each piece, and 30% of every order is gifted back to the Lady Broncos.

## What is here

| Path | What it is |
| --- | --- |
| `public/` | The store website (deploy this folder) |
| `public/js/config.js` | Product list, prices, sizes, shipping cost, give back percent and the payment link |
| `public/js/collection.js` | The Bronco Built 26/27 artwork, garments (front and back) and where each print goes |
| `public/js/art.js` | The horseshoe traced from the official logo, plus the earlier classic designs |
| `designs/print/` | Print ready PNG files with see through backgrounds, about 300 dpi at print size |
| `designs/design_board.png` | Every print on its garment color |
| `designs/mockup_board.png` | Every product, front and back |
| `designs/collection.html` | Open in a browser to preview every print and product |

## Bronco Built 26/27 collection

| Product | Color | Prints (file in `designs/print/`) |
| --- | --- | --- |
| Signature Tee | Black | Front: `signature.png` |
| Battle Tested Tee | White | Front: `battletested.png` |
| Team Tee | Bronco red | Front: `nomercy.png` |
| Season Tee | White | Left chest: `chest.png`; back: `season.png` |
| United as One Hoodie | Heather gray | Front: `united.png` |
| Fear the Herd Hoodie | Black | Left chest: `chest.png`; left sleeve: `sleeveWhite.png`; back: `fearherd.png` |
| Long Sleeve Warmup | Black with red and white sleeve stripes | Front: `champions.png` |
| Warmup Jacket | Black with red panels | Left chest: `chest.png` |
| Basketball Shorts | Black with red and white side stripes | Left leg: `chest.png`; right leg: `seasonMark.png` |
| Sweatpants | Heather gray | Left leg: `sleeveBlack.png` |
| Hat | Black | Front: `chest.png` (embroidery); side: `seasonMark.png` |

`banner.png` is the Bronco Built wordmark for stickers, banners or the gym.

Suggested print widths: chest and back prints about 12 inches (Fear the Herd back about 13), left chest and leg marks about 4 inches, sleeve and leg strips about 3 inches wide by 13 inches tall.

Buyers can add an optional player name printed down the right sleeve on tees, the United as One hoodie, the long sleeve warmup and the warmup jacket.

The concept had a Nike swoosh on the warmup jacket. It is left off on purpose: put it on only with written approval from your Nike rep.

## Orders

Orders are sent with Netlify Forms. Each order lists the buyer, items, sizes, delivery choice, total and the amount going to the team. You see orders in Netlify under **Forms**, and you can turn on email notifications there so every new order lands in your inbox.

To collect payment online, paste a Square, Stripe, Venmo or Cash App payment link into `paymentUrl` in `public/js/config.js`. Without a link, buyers are told a coach will follow up.

## Putting it online

1. In Netlify, add a new site from this GitHub repository.
2. Set **Base directory** to `store`.
3. Name the site `ladybroncosstore` so the fundraiser's Team Store link works, or update the link in `fundraiser/public/index.html`.
4. Deploy, then under **Forms** turn on form detection and email notifications.
