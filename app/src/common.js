export var million = 1000000;
export var thousand = 1000;

export var colorRange = [
  "#18c61a", "#2706de", "#8d070c", "#24b7f1", "#fb7fdd", "#224d22", "#d6a401", "#0c3e9a", "#cea194", "#17c28a",
  "#6c304f", "#0f4a61", "#94b743", "#fe8d5a", "#603d04", "#aaa1f9", "#790288", "#79b6af", "#fb88a3", "#202ebc",
  "#c1aa5f", "#4e4236", "#aaa8c6", "#8cb77c", "#fd8f11", "#752e25", "#53c153", "#443f6e", "#da95ce", "#85025c",
  "#890b38", "#672b74", "#78be07", "#224c42", "#e39c48", "#05bfb6", "#f2917f", "#b0ad84", "#b5af14", "#87adea",
  "#6802a8", "#45470b", "#d291f9", "#502c9b", "#20bbd3", "#aaaca9", "#503f4f", "#d7a06f", "#d19db1", "#fb78fa",
  "#7abb65", "#68bb99", "#7bb2d4", "#f985c0", "#5402c3", "#0b4387", "#b5a2dc", "#cca73d", "#772d07", "#623b24",
  "#a5b25e", "#99b70e", "#135008", "#62393d", "#e5969c", "#0337ae", "#014874", "#4cb2ff", "#94b392", "#404829",
  "#4a3881", "#64bd7b", "#871520", "#eb9769", "#5c3568", "#b1b045", "#54421c", "#2bc0a0", "#f59341", "#394748",
  "#7a166e", "#81194a", "#e990b8", "#2fc36b", "#50c237", "#78bd4c", "#96afbe", "#e69c1d", "#ea8bd5", "#c899e3",
  "#752a3e", "#ea85f2", "#bda5b0", "#c89ec6", "#612987", "#6f2962", "#364461", "#314c09", "#58c202", "#04c553",
  "#1422d0", "#e09b7e", "#c7a67e", "#65b7c5", "#d5a258", "#563b5b", "#5224a8", "#8da9f8", "#a7b175", "#fb8b8e",
  "#144e35", "#6d3517", "#baa993", "#87bb2e", "#a6b430", "#4a1bbc", "#8eb85d", "#2dbdc5", "#fb8d71", "#99abd4",
  "#174b54", "#66189b", "#4d328e", "#7c2532", "#dd8fe3", "#73be38", "#792256", "#384655", "#e09d60", "#7f2419",
  "#4ec073", "#7dba74", "#3c491b", "#6a3531", "#9ab46d", "#d9a234", "#c1ab32", "#53be92", "#d09fa2", "#9db0a1",
  "#bba7a2", "#46b8db", "#514402", "#bcaa76", "#4bbda8", "#ee9751", "#68be5c", "#7cb98b", "#b6a4cd", "#4f4143",
  "#bdac4e", "#5abab6", "#79b8a1", "#711a81", "#633649", "#233f8d", "#2439a1", "#fa82ce", "#ea8dc7", "#cca567",
  "#aaaab7", "#a1b44d", "#344a36", "#1e447a", "#e793aa", "#e3988d", "#b2ae66", "#5a3e30", "#a0a7e3", "#78b1e2",
  "#88b3b7", "#403d7a", "#d997bf", "#c89cd5", "#fb7beb", "#c797f2", "#c9a918", "#eb9936", "#11c37b", "#09501a",
  "#5f3d16", "#bda3bf", "#6a3805", "#5db5e2", "#691d8e", "#eb88e4", "#62345b", "#d7a247", "#23c540", "#464061",
  "#7a1c62", "#7f1f3e", "#f29620", "#77264a", "#3f473c", "#49461c", "#86162c", "#4c4429", "#332fae", "#caa74f",
  "#3c0dd0", "#fd84b2", "#77adf8", "#a2b184", "#fe8a80", "#fc902e", "#b4a0ea", "#841d0a", "#d4a07e", "#8cb4a1",
  "#6c3524", "#7db3c5", "#314b29", "#a4af93", "#56b4f1", "#ef928d", "#32436e", "#762d18", "#732e31", "#3c398e",
  "#6c333d", "#543674", "#583181", "#f18f9c", "#7e2426", "#a8b311", "#8abb0b", "#97b72f", "#b3b031", "#89b86d",
  "#521eaf", "#3332a8", "#1d4f12", "#76ba83", "#61bf6c", "#88b955", "#6d2d5c", "#e19f05", "#5b3c43", "#4f3b68",
  "#a8ad9a", "#43425b", "#b7ac6e", "#b5ae56", "#d99c9b", "#354842", "#18c199", "#dd99a2", "#8bafcc", "#154967",
  "#6ab6cc", "#cea728", "#96b0b0", "#5e3b37", "#c4a86e", "#5c3a4f", "#7a0e7b", "#6f217b", "#68baa8", "#474348",
  "#aaa7d4", "#58c064", "#f3945a", "#53bcaf", "#55420c", "#de9f3f", "#e79a59", "#29485b", "#66c042", "#6bbf2c",
  "#da92dc", "#710995", "#89aedb", "#f69169", "#94b665", "#98b655", "#3024c3", "#5b0bb5", "#8eb939", "#68381e",
  "#074f2f", "#acaf7d", "#9ea6f1", "#dc9f50", "#bea885", "#d89e85", "#e89777", "#dc9d77", "#0c1cd7", "#3e16ca",
  "#48c41c", "#722468", "#672e68", "#c7a2a9", "#ee81fa", "#e08af9", "#ed990a", "#9aadc5", "#83bb43", "#1ac463",
  "#f18cb1", "#841050", "#870d44", "#810668", "#434542", "#4f4415", "#584023", "#b9ae3c", "#593861", "#52396e",
  "#e39a70", "#8b0927", "#8c071a", "#52bf83", "#3a3b87", "#87b69a", "#723110", "#c5a946", "#2e4081", "#c8a0b8",
  "#4cb9cc", "#4f2f94", "#5128a1", "#5d2594"
];

var hints = {};
export function setHints(h) {
  console.log(h);
  hints = h;
}

export function calcKindColours(kinds) {
  const colours = [];
  let i = 20;
  for (const kind of kinds.values()) {
    const hint = hints[kind];
    colours.push(hint ? hint : colorRange[i++]);
  }
  return colours;
}

export function calcCategoryColours(categories) {
  const colours = [];
  let i = 0;
  for (const category of categories.values()) {
    const hint = hints[category];
    colours.push(hint ? hint : colorRange[i++]);
  }
  return colours;
}

export function displayYear(year) {
  if (Math.abs(year) > million) {
    return (year / million) + "Ma";
  } else if (Math.abs(year) > thousand) {
    return (year / thousand) + "ka";
  } else {
    return year;
  }
}

export function present(year) {
  return (year === 2030) ? new Date().getFullYear() : displayYear(year);
}

export function identifier(text) {
  return text.replace(/\s/g, '-').toLowerCase();
}

export function idToTitle(id) {
  // Replace hypens with spaces
  const name = id.replace(/-/g, " ");

  // Capitalize all words
  const s = name.toLowerCase().split(' ');
  for (var i = 0; i < s.length; i++) {
    // Assign it back to the array
    s[i] = s[i].charAt(0).toUpperCase() + s[i].substring(1);
  }

  return s.join(' ');
}
