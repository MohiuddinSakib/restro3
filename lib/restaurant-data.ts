export interface DishItem {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  courseNumber: string;
  description: string;
  ingredients: string[];
  pairing: {
    wine: string;
    vintage: string;
    producer: string;
    region: string;
    tastingNotes: string;
  };
  image: string;
  origin: string;
  dietary: string[];
  price?: string;
}

export interface HeroSlide {
  id: string;
  tagline: string;
  titlePrimary: string;
  titleSecondary: string;
  description: string;
  image: string;
  ctaText: string;
}

export interface ReviewItem {
  id: string;
  author: string;
  source: string;
  rating: number;
  date: string;
  title: string;
  quote: string;
  badge?: string;
}

export interface CellarWine {
  id: string;
  name: string;
  type: 'Champagne' | 'White Burgundy' | 'Red Bordeaux' | 'Jura & Natural' | 'Rare Reserve';
  vintage: string;
  producer: string;
  region: string;
  notes: string;
  pricePerBottle: string;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'hero-1',
    tagline: 'ART OF MODERN CUISINE',
    titlePrimary: 'Experience',
    titleSecondary: 'Fine Dining',
    description: 'Immerse yourself in sensory mastery, locally sourced heritage ingredients, and culinary architecture.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCb7iWZrShgq4RYGB7MfH7SDx6aCzMO9jnpSo3wICHb3RcbT-s0s2SoNUZPcydmyg3G1ua929cHLaKn1ygTBkdUqukd1b9dCCO4TeaKQQaTwrI6krH_QEfpAMNjeGjAkEMQs9s3ExPm7zX9Zk67lqoJZvC69_GO9K39l_FOK1T3CnLrMvuq5n4WA36HrejpLT4eYNn_FEdzwsXfF7iqhJPfqRAijedI8PZfIl3R7axu6DOwo-a_uOjY',
    ctaText: 'Explore Menu',
  },
  {
    id: 'hero-2',
    tagline: 'ANCESTRAL FIRE & HEARTH',
    titlePrimary: 'The Tasting',
    titleSecondary: 'Table',
    description: 'Twelve intimate seats around raw basalt stone, where ancient fire roasting and open hearth craft an unforgettable narrative.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAm_F8GT_y-pZMb-m_IoE2MNAfZo0pShbzfkbmV53BeV2MKvH2U7CsVYRH0cLf3pol3e1GQCGPmMiUluGgtYKZqdmL-5EWQdGL2sqzENso_yd2ZEN_cqjx9BwnZ5PbFIcdaQQxFDrUN9a34XHZz9kvMmZKAlhV1zuw5JWvQsoor5CutH8yp97EYn77MspEGE6LVDXp6rgBKEkAQNyXYTAOPWMtsSF6RbVM6GbJA3YRIGUcKckyYYGJc',
    ctaText: 'Reserve The Counter',
  },
  {
    id: 'hero-3',
    tagline: 'SCULPTURAL PATISSERIE',
    titlePrimary: 'Ethereal',
    titleSecondary: 'Harmonies',
    description: 'Grand Cru Valrhona cacao, smoked sea salt caramel, and delicate spun gold crafted by Pastry Chef Éléonore.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUoZf5L5MXkPDF9okCvRuaL3URwRKdjmeT5t-frlFJNlM7JhKDjAV7Z-LrJb7E5aFrRYUIhEDhY2siwvw69UC6LFvgkHwuyd2E5oKvKOSFA532GFB85kFTk2dzQejYuDJbKUMVMXvwt1fk8Ev5Du93P2zNEFlK0stDH0dvucXQJmf_VPER3AL47fL0owr7ugRUnij_WWV_jvuSJfnvp2kP8nNDtfTDtel0nHy5QS7Fs-gDZFD9IlOC',
    ctaText: 'View Desserts',
  },
];

export const PEDESTAL_DISHES: DishItem[] = [
  {
    id: 'scallop-crudo',
    name: 'Hokkaido Scallop Crudo',
    subtitle: 'Finger Lime • Oscietra Caviar • Shiso',
    category: 'Sea & Coast',
    courseNumber: '01 / 06',
    description: 'Hand-dived raw Hokkaido scallops sliced to translucency, paired with tart Australian finger lime pearls, house-cured Oscietra royal caviar from Aquitaine, and cold-extracted purple shiso dashi.',
    ingredients: [
      'Raw Hand-Dived Hokkaido Scallops',
      'Oscietra Royal Caviar (Aquitaine)',
      'Green Finger Lime Pearls',
      'Wild Red Shiso Leaf & Oil',
      'Sea Broth with Yuzu Kosho',
    ],
    pairing: {
      wine: 'Meursault Premier Cru "Les Charmes"',
      vintage: '2018',
      producer: 'Domaine des Comtes Lafon',
      region: 'Côte de Beaune, Burgundy',
      tastingNotes: 'Crisp hazelnut, wet flint limestone, and subtle brioche minerality cutting through the sweet ocean scallops.',
    },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsTJjLxThyr6_VeQyd5emNrBSN9KQ51DKbmuWaMix2g0lVGi92Z0d3A8_CaDyStGhCY9H5XA9EFzVGnCpTwh2Bfy3HnJJqB5rm0hxBq7_0Qii83CFiMr-sI2xeg9B9503kTldDy_wGIIA8QkRLQJ02i17Giiv8b_LFVY27FD48kiG0u5o7YvztLM7Hjv3shpu8-ULelhzyiAJtJC4TOswtqtDxmY4HgCoWKipjyQPGjK3NvIg0ZeAx',
    origin: 'Hokkaido, Japan & Aquitaine, France',
    dietary: ['Pescatarian', 'Gluten-Free', 'Nut-Free'],
    price: '€68 / A La Carte',
  },
  {
    id: 'morels-asparagus',
    name: 'Charred Morels & Asparagus',
    subtitle: 'Truffle Emulsion • Wild Leek Ash',
    category: 'Forest & Earth',
    courseNumber: '02 / 06',
    description: 'Spring morels gently roasted over binchotan embers, paired with tender green Luberon asparagus spears, infused Périgord black winter truffle emulsion, and dusted in slow-charred wild leek ash.',
    ingredients: [
      'Wild Auvergne Forest Morels',
      'Green Luberon Valley Asparagus',
      'Périgord Black Winter Truffle Butter Emulsion',
      'Charred Leek & Pine Needles Ash',
      'Sorrel Petals & Roasted Pine Nuts',
    ],
    pairing: {
      wine: 'Puligny-Montrachet 1er Cru "Les Folatières"',
      vintage: '2019',
      producer: 'Domaine Leflaive',
      region: 'Burgundy, France',
      tastingNotes: 'White peach, crushed stone, toasted almond, with a profound earthy spine echoing the forest floor morels.',
    },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJWAHfUnsjaNfrL2-Ao7y36_eGE9h0bNEn9heJJ82Gg8hMBZQEbeitJeElNCo6sSkiQgpMasoW8Z1HTZuazJlcY4-xf9yQmGXLRnXda7-_TJUDDVmRPWkZBeitdyojmxZzQ06OL-0hfKdAnfmAIe1dkUACIW8daw4s6_f8886ya8M3z-mU0sEmAq8SWuqjvi7D8ou31GBtbFOHlGALE_abiJ2jOPJsAPcj8G-n9ODs0HXbSb2HR9Zh',
    origin: 'Auvergne & Provence, France',
    dietary: ['Vegetarian', 'Gluten-Free'],
    price: '€62 / A La Carte',
  },
  {
    id: 'wagyu-truffle-burger',
    name: 'Dry-Aged Wagyu Truffle Burger',
    subtitle: 'Aged Comté • Caramelized Shallot • Truffle Aioli',
    category: 'Artisanal Burger',
    courseNumber: '03 / 06',
    description: 'Double smash patty of dry-aged A5 Wagyu and prime black angus, molten aged Comté cheese, sweet caramelized shallots, crisp butter lettuce, and house-whipped black Périgord truffle aioli on a toasted buttered brioche bun.',
    ingredients: [
      'Dry-Aged A5 Miyazaki Wagyu & Angus Blend',
      '24-Month Aged French Comté Cheese',
      'Caramelized Balsamic Shallots & Living Lettuce',
      'House Black Périgord Truffle Emulsion',
      'Slow-Fermented Hokkaido Milk Brioche Bun',
    ],
    pairing: {
      wine: 'Saint-Émilion Grand Cru',
      vintage: '2016',
      producer: 'Château Angélus',
      region: 'Bordeaux, France',
      tastingNotes: 'Rich ripe blackberry, cedarwood, graphite, and polished tannins slicing through the decadent marble fats.',
    },
    image: '/images/wagyu_burger.jpg',
    origin: 'Miyazaki, Japan & Normandy, France',
    dietary: ['Halal Beef Option', 'Nut-Free'],
    price: '€34 / A La Carte',
  },
  {
    id: 'crispy-hot-honey-chicken',
    name: 'Crispy Hot Honey Chicken Brioche',
    subtitle: 'Buttermilk Crust • Habanero Blossom Honey • Apple Slaw',
    category: 'Gourmet Fast Food',
    courseNumber: '04 / 06',
    description: 'Twenty-four-hour herb-buttermilk marinated free-range chicken thigh fried to golden crunch, glazed with smoked habanero blossom hot honey, paired with barrel pickles and crisp granny smith apple slaw on toasted golden brioche.',
    ingredients: [
      '24hr Herb-Buttermilk Marinated Free-Range Chicken',
      'Smoked Habanero Blossom Wild Honey Glaze',
      'Pickled Dill Cucumber & Jalapeño Crunch',
      'Crisp Apple & Purple Cabbage Slaw',
      'Warm Butter-Glazed Brioche Bun',
    ],
    pairing: {
      wine: 'Champagne Extra Brut',
      vintage: 'NV',
      producer: 'Billecart-Salmon',
      region: 'Champagne, France',
      tastingNotes: 'Crisp green apple acid, chalky limestone, and lively effervescence slicing through the spicy crunch of the fried chicken.',
    },
    image: '/images/crispy_chicken.jpg',
    origin: 'Bresse, France',
    dietary: ['Dairy-Free Available', 'Nut-Free'],
    price: '€28 / A La Carte',
  },
  {
    id: 'truffle-parmesan-fries',
    name: 'Hand-Cut Truffle Parmesan Frites',
    subtitle: 'Black Summer Truffle • 36-Mo Parmigiano • Confit Aioli',
    category: 'Gourmet Fast Food',
    courseNumber: '05 / 06',
    description: 'Triple-cooked hand-cut Bintje potatoes crisped to amber gold, tossed in white truffle oil, shaved Norcia black summer truffles, garden chives, and generous 36-month aged Parmigiano-Reggiano, accompanied by roasted confit garlic aioli and artisanal tomato reduction.',
    ingredients: [
      'Triple-Cooked Hand-Cut Bintje Potatoes',
      'Fresh Shaved Norcia Black Summer Truffles',
      '36-Month Aged Parmigiano-Reggiano',
      'Roasted Confit Garlic Dip & Artisanal Tomato Ketchup',
      'Maldon Smoked Flake Salt & Garden Micro-Herbs',
    ],
    pairing: {
      wine: 'Chablis 1er Cru "Montmains"',
      vintage: '2020',
      producer: 'Domaine William Fèvre',
      region: 'Chablis, Burgundy',
      tastingNotes: 'Zesty lemon zest, crushed oyster shells, and searing clean salinity pairing harmoniously with the truffle crunch.',
    },
    image: '/images/truffle_fries.jpg',
    origin: 'Piedmont & Emilia-Romagna, Italy',
    dietary: ['Vegetarian', 'Gluten-Free'],
    price: '€22 / A La Carte',
  },
  {
    id: 'valrhona-ganache',
    name: 'Valrhona Ganache',
    subtitle: 'Gold Flake • Smoked Caramel',
    category: 'The Finale',
    courseNumber: '06 / 06',
    description: 'A glossy orb of 70% Single-Estate Valrhona Guanaja dark chocolate ganache, cascading warm smoked Guérande sea salt caramel, hazelnut praline tuile, and delicate sheets of 24-karat French gold leaf.',
    ingredients: [
      'Valrhona Guanaja 70% Dark Chocolate',
      'Smoked Guérande Salt Caramel Glaze',
      'Piedmont Hazelnut Praline Feuilletine',
      'Smoked Tahitian Vanilla Cream',
      '24-Karat Edible Gold Leaf',
    ],
    pairing: {
      wine: 'Quinta do Noval Vintage Port',
      vintage: '2003',
      producer: 'Quinta do Noval',
      region: 'Douro Valley, Portugal',
      tastingNotes: 'Dark dried figs, bitter dark cacao, toasted cedar, and velvety tannins enveloping the rich ganache.',
    },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUoZf5L5MXkPDF9okCvRuaL3URwRKdjmeT5t-frlFJNlM7JhKDjAV7Z-LrJb7E5aFrRYUIhEDhY2siwvw69UC6LFvgkHwuyd2E5oKvKOSFA532GFB85kFTk2dzQejYuDJbKUMVMXvwt1fk8Ev5Du93P2zNEFlK0stDH0dvucXQJmf_VPER3AL47fL0owr7ugRUnij_WWV_jvuSJfnvp2kP8nNDtfTDtel0nHy5QS7Fs-gDZFD9IlOC',
    origin: 'Tain-l’Hermitage, France & Piedmont, Italy',
    dietary: ['Vegetarian'],
    price: '€38 / A La Carte',
  },
];

export const FULL_TASTING_MENU = [
  {
    step: 'I',
    course: 'Amuse-Bouche',
    title: 'Smoked Eel & Coastal Seaweed Tartlet',
    notes: 'Kombu crisp, smoked eel mousse, pickled shallot, finger sea spray.',
    wine: 'Champagne Jacques Selosse "Initial" Grand Cru Brut Blanc de Blancs',
  },
  {
    step: 'II',
    course: 'Sea & Coast',
    title: 'Hokkaido Scallop Crudo',
    notes: 'Finger lime pearls, Oscietra royal caviar, purple shiso extract.',
    wine: '2018 Meursault 1er Cru "Les Charmes", Domaine des Comtes Lafon',
  },
  {
    step: 'III',
    course: 'Garden & Botanicals',
    title: 'Heritage Roots & Fermented Plum',
    notes: 'Braised heirloom rainbow carrots, lacto-fermented mirabelle puree, elderflower oil.',
    wine: '2020 Domaine Huet Vouvray "Le Haut-Lieu" Sec',
  },
  {
    step: 'IV',
    course: 'Forest & Earth',
    title: 'Charred Morels & Green Luberon Asparagus',
    notes: 'Binchotan roasted, Périgord black truffle emulsion, leek ash essence.',
    wine: '2019 Puligny-Montrachet 1er Cru, Domaine Leflaive',
  },
  {
    step: 'V',
    course: 'Ocean Depths',
    title: 'Wild Turbot in Salt Crust & Champagne Samphire',
    notes: 'Brittany coast line-caught turbot, caramelized whey reduction, sea fennel.',
    wine: '2017 Corton-Charlemagne Grand Cru, Domaine Bonneau du Martray',
  },
  {
    step: 'VI',
    course: 'The Hearth',
    title: 'A5 Miyazaki Wagyu & Ancient Ferments',
    notes: 'Smoked over wild cherrywood, black garlic puree, bone marrow glace.',
    wine: '2015 Château Pichon Baron, Pauillac Grand Cru Classé',
  },
  {
    step: 'VII',
    course: 'Intermezzo',
    title: 'Bergamot, Shiso & Champagne Granité',
    notes: 'Calabrian bergamot essence, frozen botanical mist, crystallized mint.',
    wine: 'Zero-Proof Botanical Infusion: Wild Verbena & Lime Blossom',
  },
  {
    step: 'VIII',
    course: 'The Finale',
    title: 'Valrhona Ganache & Smoked Caramel',
    notes: '70% Guanaja cacao orb, warm smoked Guérande caramel, 24k gold leaf.',
    wine: '2003 Quinta do Noval Vintage Port',
  },
];

export const REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    author: 'The Michelin Guide Inspectors',
    source: 'The Michelin Guide 2024',
    rating: 5,
    date: 'February 2024',
    title: 'Sensory Architecture at the Pinnacle of French Gastronomy',
    quote: 'An unforgettable symphonic dinner. The scallop crudo and wine pairing remain unequaled in all our travels. Alexandre Moreau constructs a poetic tribute to nature, where technique dissolves into pure emotion.',
    badge: 'Three Stars',
  },
  {
    id: 'rev-2',
    author: 'François-Régis Gaudry',
    source: 'Le Figaro Gastronomie',
    rating: 5,
    date: 'April 2024',
    title: 'A Triumph of Fire, Minerals, and Coastal Grace',
    quote: 'L’Étoile represents the rare pinnacle where avant-garde modernism honors ancestral soil. The charred morels in wild leek ash lingered on our palate long after the night dissolved.',
    badge: 'Top Selection',
  },
  {
    id: 'rev-3',
    author: 'Elena Rostova',
    source: 'World’s 50 Best Restaurants Panelist',
    rating: 5,
    date: 'June 2024',
    title: 'The Most Cohesive Wine & Food Dialogue in Europe',
    quote: 'Every sip and bite resonates in harmony. The cellar curation alone warrants a pilgrimage to Paris. Remarkable, restrained, and deeply moving hospitality.',
    badge: 'Verified Critic',
  },
  {
    id: 'rev-4',
    author: 'Jonathan & Vivienne Sterling',
    source: 'Patron from London',
    rating: 5,
    date: 'September 2024',
    title: 'Celebrated our 20th Anniversary at The Tasting Table',
    quote: 'Sitting at the basalt counter facing Chef Moreau and the team was theatrical yet intimate. The Valrhona ganache finale with warm smoked caramel was transcendent.',
    badge: 'Private Diner',
  },
];

export const CELLAR_WINES: CellarWine[] = [
  {
    id: 'wine-1',
    name: 'Jacques Selosse "Initial" Grand Cru Blanc de Blancs',
    type: 'Champagne',
    vintage: 'NV (Disgorged 2022)',
    producer: 'Anselme Selosse',
    region: 'Avize, Champagne, France',
    notes: 'Oxidative grandeur, candied citrus peel, toasted brioche, saline chalk tension.',
    pricePerBottle: '€420',
  },
  {
    id: 'wine-2',
    name: 'Domaine des Comtes Lafon Meursault 1er Cru "Les Charmes"',
    type: 'White Burgundy',
    vintage: '2018',
    producer: 'Dominique Lafon',
    region: 'Côte de Beaune, Burgundy, France',
    notes: 'Flinty reduction, roasted hazelnuts, lime blossom, layered architectural finish.',
    pricePerBottle: '€380',
  },
  {
    id: 'wine-3',
    name: 'Domaine Leflaive Puligny-Montrachet 1er Cru "Les Folatières"',
    type: 'White Burgundy',
    vintage: '2019',
    producer: 'Brice de La Morandière',
    region: 'Côte de Beaune, Burgundy, France',
    notes: 'White peach, lemon verbena, crushed wet limestone, sublime biodynamic poise.',
    pricePerBottle: '€490',
  },
  {
    id: 'wine-4',
    name: 'Château Pichon Baron 2ème Grand Cru Classé',
    type: 'Red Bordeaux',
    vintage: '2015',
    producer: 'Christian Seely',
    region: 'Pauillac, Bordeaux, France',
    notes: 'Cassis, graphite pencil shavings, cedar box, sculpted and velvet tannins.',
    pricePerBottle: '€410',
  },
  {
    id: 'wine-5',
    name: 'Domaine Overnoy-Houillon Arbois-Pupillin Savagnin',
    type: 'Jura & Natural',
    vintage: '2016',
    producer: 'Pierre Overnoy & Emmanuel Houillon',
    region: 'Arbois-Pupillin, Jura, France',
    notes: 'Zero added sulfur, candied green walnut, dried apricots, electric mineral vibration.',
    pricePerBottle: '€340',
  },
  {
    id: 'wine-6',
    name: 'Domaine de la Romanée-Conti "La Tâche" Grand Cru Monopole',
    type: 'Rare Reserve',
    vintage: '2014',
    producer: 'Aubert de Villaine',
    region: 'Vosne-Romanée, Burgundy, France',
    notes: 'Dried rose petals, oriental spices, wild forest strawberries, endless aristocratic depth.',
    pricePerBottle: '€4,800',
  },
];
