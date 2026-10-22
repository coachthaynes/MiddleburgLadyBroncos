// Store settings. Edit prices, sizes and links here.
window.STORE = {
  giveBackPercent: 30,
  season: "26/27",
  sayings: ["No Mercy. All Heart.", "United as One.", "Battle Tested."],
  fundraiserUrl: "https://ladybroncosfundraiser.netlify.app",
  // Where buyers pay after ordering (Square, Venmo, Cash App or a Stripe payment link). Leave blank to have coaches follow up.
  paymentUrl: "",
  shipping: 6,
  youth: ["YS", "YM", "YL"],
  adult: ["S", "M", "L", "XL", "2XL", "3XL"],
  // Photos live in img/products. Prices are placeholders, change them any time.
  products: [
    { key: "signature", img: "signature.jpg", prints: "Front print", sleeveName: true, cat: "tees", name: "Signature Tee", price: 25, blurb: "Black tee with the Bronco Built signature print. Fearless by nature." },
    { key: "battletested", img: "battletested.jpg", prints: "Front print", sleeveName: true, cat: "tees", name: "Battle Tested Tee", price: 25, blurb: "White tee with the bronco head and Bronco Built. Battle Tested." },
    { key: "teamtee", img: "teamtee.jpg", prints: "Front print", sleeveName: true, cat: "tees", name: "Team Tee", price: 25, blurb: "Bronco red tee. No Mercy. All Heart." },
    { key: "seasontee", img: "seasontee.jpg", prints: "Chest and back prints", sleeveName: true, cat: "tees", name: "Season Tee", price: 25, blurb: "White tee with a chest horseshoe and a big 26/27 back print. Same team. Same goal. Bigger dreams." },
    { key: "united", img: "united.jpg", prints: "Front print", sleeveName: true, cat: "hoodies", name: "United as One Hoodie", price: 45, blurb: "Heather gray fleece hoodie. Bronco Built. United as One." },
    { key: "fearherd", img: "fearherd.jpg", back: "fearherd_back.jpg", extra: ["fearherd_sleeve.jpg"], prints: "Chest, sleeve and back prints", cat: "hoodies", name: "Fear the Herd Hoodie", price: 50, blurb: "Black hoodie with a chest horseshoe, Bronco Built down the sleeve and Fear the Herd across the back." },
    { key: "warmupls", img: "warmupls.jpg", prints: "Front print", sleeveName: true, cat: "warmups", name: "Long Sleeve Warmup", price: 32, blurb: "Black shooting shirt with red and white sleeve stripes. Champions in the making." },
    { key: "warmupjacket", img: "warmupjacket.jpg", prints: "Left chest mark", sleeveName: true, cat: "warmups", name: "Warmup Jacket", price: 60, blurb: "Black full zip with Bronco red panels and the horseshoe on the chest." },
    { key: "shorts", img: "shorts.jpg", prints: "Horseshoe and 26/27 leg prints", cat: "bottoms", name: "Basketball Shorts", price: 30, blurb: "Black mesh shorts with red and white side stripes, the horseshoe and 26/27." },
    { key: "sweatpants", img: "sweatpants.jpg", prints: "Leg print", cat: "bottoms", name: "Sweatpants", price: 40, blurb: "Heather gray joggers with Bronco Built down the leg." },
    { key: "hat", img: "hat.jpg", prints: "Front and side embroidery", cat: "hats", name: "Hat", price: 25, sizes: ["One size"], blurb: "Black cap with the red horseshoe up front and 26/27 on the side." },
  ],
};
