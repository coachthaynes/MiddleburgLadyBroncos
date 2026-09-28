# Lady Broncos Team Store

A made to order store for Lady Bronco Basketball gear. Coaches print each piece, and 30% of every order is gifted back to the Lady Broncos.

## What is here

| Path | What it is |
| --- | --- |
| `public/` | The store website (deploy this folder) |
| `public/js/config.js` | Prices, sizes, shipping cost, give back percent and the payment link. Edit this file to change the store |
| `public/js/art.js` | Every design and garment mockup, drawn in code so colors change live |
| `designs/print/` | Print ready PNG files with see through backgrounds, one per design and color |
| `designs/design_board.png` | All six designs in all four colors |
| `designs/mockup_board.png` | All nine garments |
| `designs/lab.html` | Open in a browser to preview every design and garment |

## Designs

Varsity Arch, Horsepower, Stacked, Hoops Badge, Lady Broncos Script and Left Chest Mark, each in White, Bronco Red, Black and Heather Gray.

## Orders

Orders are sent with Netlify Forms. Each order lists the buyer, items, sizes, delivery choice, total and the amount going to the team. You see orders in Netlify under **Forms**, and you can turn on email notifications there so every new order lands in your inbox.

To collect payment online, paste a Square, Stripe, Venmo or Cash App payment link into `paymentUrl` in `public/js/config.js`. Without a link, buyers are told a coach will follow up.

## Putting it online

1. In Netlify, add a new site from this GitHub repository.
2. Set **Base directory** to `store`.
3. Name the site `ladybroncosstore` so the fundraiser's Team Store link works, or update the link in `fundraiser/public/index.html`.
4. Deploy, then under **Forms** turn on form detection and email notifications.
