// Store settings. Edit prices, sizes and links here.
window.STORE = {
  giveBackPercent: 30,
  fundraiserUrl: "https://ladybroncosfundraiser.netlify.app",
  // Where buyers pay after ordering (Square, Venmo, Cash App or a Stripe payment link). Leave blank to have coaches follow up.
  paymentUrl: "",
  shipping: 6,
  youth: ["YS", "YM", "YL"],
  adult: ["S", "M", "L", "XL", "2XL", "3XL"],
  products: [
    { key: "tee", garment: "tee", name: "Short Sleeve Tee", price: 25, design: "varsity", colorway: "white", blurb: "Soft cotton tee for game day and every day." },
    { key: "longsleeve", garment: "longsleeve", name: "Long Sleeve Tee", price: 30, design: "horsepower", colorway: "black", blurb: "Long sleeve comfort for chilly gyms." },
    { key: "crewneck", garment: "crewneck", name: "Crewneck Sweatshirt", price: 40, design: "badge", colorway: "gray", blurb: "Classic fleece crew with the Hoops Badge." },
    { key: "hoodie", garment: "hoodie", name: "Hoodie", price: 45, design: "stacked", colorway: "red", blurb: "Cozy fleece hoodie with a front pocket." },
    { key: "jacket", garment: "jacket", name: "Full Zip Jacket", price: 55, design: "chest", colorway: "black", blurb: "Clean left chest mark on a full zip." },
    { key: "hat", garment: "hat", name: "Dad Hat", price: 25, design: "chest", colorway: "white", sizes: ["One size"], blurb: "Adjustable cap with the horseshoe and ball." },
    { key: "warmupjacket", garment: "warmupjacket", name: "Warmup Jacket", price: 60, design: "chest", colorway: "black", blurb: "Team style warmup with Bronco red panels." },
    { key: "warmuppants", garment: "warmuppants", name: "Warmup Pants", price: 45, design: "chest", colorway: "black", blurb: "Matching pants with side stripes." },
    { key: "jersey", garment: "jersey", name: "Practice Jersey", price: 35, design: "varsity", colorway: "red", number: true, blurb: "Mesh practice jersey with your number." },
  ],
};
