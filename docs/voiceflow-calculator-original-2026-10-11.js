function clean(value, fallback) {
  if (value === undefined || value === null) {
    return fallback;
  }

  const text = String(value).trim();

  if (
    !text ||
    text === '0' ||
    text.includes('{') ||
    text.includes('}') ||
    text.includes('$$VAR') ||
    text.toLowerCase() === 'unknown' ||
    text.toLowerCase() === 'none' ||
    text.toLowerCase() === 'n/a'
  ) {
    return fallback;
  }

  return text;
}

function toNumber(value, fallback) {
  const cleaned = clean(value, '');
  const num = Number(cleaned);

  if (Number.isFinite(num) && num > 0) {
    return num;
  }

  return fallback;
}

function roundToNearest5000(value) {
  return Math.round(value / 5000) * 5000;
}

function formatUSD(value) {
  const num = Number(value);

  if (!Number.isFinite(num) || num <= 0) {
    return '$0';
  }

  return '$' + num.toLocaleString('en-US');
}

const cityZipMap = {
  'doylestown': { city: 'Doylestown', zip: '18901' },
  'newtown': { city: 'Newtown', zip: '18940' },
  'southampton': { city: 'Southampton', zip: '18966' },
  'langhorne': { city: 'Langhorne', zip: '19047' },
  'chalfont': { city: 'Chalfont', zip: '18914' },
  'new hope': { city: 'New Hope', zip: '18938' },
  'warminster': { city: 'Warminster', zip: '18974' },
  'warrington': { city: 'Warrington', zip: '18976' },
  'quakertown': { city: 'Quakertown', zip: '18951' },
  'yardley': { city: 'Yardley', zip: '19067' },
  'allentown': { city: 'Allentown', zip: '18102' },
  'bethlehem': { city: 'Bethlehem', zip: '18017' },
  'easton': { city: 'Easton', zip: '18042' },
  'center valley': { city: 'Center Valley', zip: '18034' },
  'emmaus': { city: 'Emmaus', zip: '18049' },
  'hellertown': { city: 'Hellertown', zip: '18055' },
  'forks': { city: 'Forks', zip: '18040' },
  'nazareth': { city: 'Nazareth', zip: '18064' },
  'bangor': { city: 'Bangor', zip: '18013' },
  'saucon valley': { city: 'Saucon Valley', zip: '18034' }
};

const zipAreaMap = {
  '18901': 'Doylestown',
  '18940': 'Newtown',
  '18966': 'Southampton',
  '19047': 'Langhorne',
  '18914': 'Chalfont',
  '18938': 'New Hope',
  '18974': 'Warminster',
  '18976': 'Warrington',
  '18951': 'Quakertown',
  '19067': 'Yardley',
  '18102': 'Allentown',
  '18017': 'Bethlehem',
  '18042': 'Easton',
  '18034': 'Center Valley',
  '18049': 'Emmaus',
  '18055': 'Hellertown',
  '18040': 'Forks',
  '18064': 'Nazareth',
  '18013': 'Bangor'
};

const priceBands = {
  '18938': { low: 550000, high: 850000 },
  '18940': { low: 520000, high: 800000 },
  '18901': { low: 475000, high: 725000 },
  '19067': { low: 430000, high: 650000 },
  '18976': { low: 425000, high: 625000 },
  '18914': { low: 410000, high: 600000 },
  '18966': { low: 390000, high: 575000 },
  '19047': { low: 370000, high: 550000 },
  '18974': { low: 360000, high: 525000 },
  '18951': { low: 325000, high: 500000 },
  '18034': { low: 420000, high: 650000 },
  '18040': { low: 335000, high: 520000 },
  '18049': { low: 320000, high: 500000 },
  '18064': { low: 310000, high: 490000 },
  '18017': { low: 300000, high: 475000 },
  '18055': { low: 300000, high: 470000 },
  '18013': { low: 270000, high: 430000 },
  '18042': { low: 240000, high: 390000 },
  '18102': { low: 220000, high: 365000 }
};

let zip = clean(typeof property_zip !== 'undefined' ? property_zip : '', 'unknown');
let cityValue = clean(typeof city !== 'undefined' ? city : '', 'unknown');
const addressValue = clean(typeof property_address !== 'undefined' ? property_address : '', '');
const lowerAddress = addressValue.toLowerCase();

// If the full address included city/ZIP but earlier parsing missed it, recover here.
const zipMatch = addressValue.match(/\b\d{5}\b/);
if (zip === 'unknown' && zipMatch) {
  zip = zipMatch[0];
  property_zip = zip;
}

if ((cityValue === 'unknown' || cityValue === 'your area') && zipAreaMap[zip]) {
  cityValue = zipAreaMap[zip];
  city = cityValue;
}

for (const key in cityZipMap) {
  if (lowerAddress.includes(key)) {
    cityValue = cityZipMap[key].city;
    city = cityValue;
    if (zip === 'unknown') {
      zip = cityZipMap[key].zip;
      property_zip = zip;
    }
    break;
  }
}

let low = 320000;
let high = 520000;
let area = cityValue !== 'unknown' ? cityValue : 'your area';

if (priceBands[zip]) {
  low = priceBands[zip].low;
  high = priceBands[zip].high;
  area = zipAreaMap[zip] || area;
}

const beds = toNumber(typeof bedrooms !== 'undefined' ? bedrooms : '', 3);
const baths = toNumber(typeof bathrooms !== 'undefined' ? bathrooms : '', 2);
const condition = clean(typeof property_condition !== 'undefined' ? property_condition : '', 'good_condition');
const sqft = clean(typeof square_feet_range !== 'undefined' ? square_feet_range : '', 'not_sure');

// Property type is intentionally not used in V6 to reduce user friction.
property_type = clean(typeof property_type !== 'undefined' ? property_type : '', 'not_sure');

let bedroomMultiplier = 1.00;
if (beds <= 1) bedroomMultiplier = 0.90;
else if (beds === 2) bedroomMultiplier = 0.92;
else if (beds === 3) bedroomMultiplier = 1.00;
else if (beds === 4) bedroomMultiplier = 1.08;
else if (beds >= 5) bedroomMultiplier = 1.14;

let bathroomMultiplier = 1.00;
if (baths <= 1) bathroomMultiplier = 0.94;
else if (baths === 1.5) bathroomMultiplier = 0.97;
else if (baths === 2) bathroomMultiplier = 1.00;
else if (baths === 2.5) bathroomMultiplier = 1.03;
else if (baths >= 3) bathroomMultiplier = 1.06;

let sqftMultiplier = 1.00;
if (sqft === 'under_1500') sqftMultiplier = 0.93;
else if (sqft === '1500_2000') sqftMultiplier = 0.98;
else if (sqft === '2000_2500') sqftMultiplier = 1.00;
else if (sqft === '2500_3500') sqftMultiplier = 1.05;
else if (sqft === 'over_3500') sqftMultiplier = 1.12;

let conditionMultiplier = 1.00;
if (condition === 'move_in_ready') conditionMultiplier = 1.04;
else if (condition === 'good_condition') conditionMultiplier = 1.00;
else if (condition === 'needs_work') conditionMultiplier = 0.92;
else if (condition === 'fixer_upper') conditionMultiplier = 0.86;

let confidence = 'general';
if (zip !== 'unknown' && sqft !== 'not_sure') {
  confidence = 'stronger';
} else if (zip !== 'unknown' || cityValue !== 'unknown') {
  confidence = 'moderate';
}

let estimateMid = ((low + high) / 2) * bedroomMultiplier * bathroomMultiplier * sqftMultiplier * conditionMultiplier;

let rangeLowFactor = 0.84;
let rangeHighFactor = 1.16;

if (confidence === 'stronger') {
  rangeLowFactor = 0.92;
  rangeHighFactor = 1.08;
} else if (confidence === 'moderate') {
  rangeLowFactor = 0.88;
  rangeHighFactor = 1.12;
}

let calculatedLow = estimateMid * rangeLowFactor;
let calculatedHigh = estimateMid * rangeHighFactor;

const minAllowed = low * 0.75;
const maxAllowed = high * 1.25;

if (calculatedLow < minAllowed) calculatedLow = minAllowed;
if (calculatedHigh > maxAllowed) calculatedHigh = maxAllowed;
if (calculatedHigh < calculatedLow) calculatedHigh = calculatedLow * 1.10;

estimate_low = roundToNearest5000(calculatedLow);
estimate_high = roundToNearest5000(calculatedHigh);
estimate_area = area;
confidence_label = confidence;

estimate_low_display = formatUSD(estimate_low);
estimate_high_display = formatUSD(estimate_high);