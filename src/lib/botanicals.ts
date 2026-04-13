/** Default botanicals with Hebrew names and sort order */
export const DEFAULT_BOTANICALS = [
  { name: 'Juniper + Lemon', nameHe: 'ערער + לימון פרסי', notes: 'Always infused together. This is the base that drives the recipe.', sortOrder: 1 },
  { name: 'Anise', nameHe: 'אניס', notes: 'Star anise pods', sortOrder: 2 },
  { name: 'Ceylon Cinnamon', nameHe: 'קינמון צילוני', notes: 'Preferred over regular cinnamon', sortOrder: 3 },
  { name: 'Coriander Seeds', nameHe: 'כוסברה', notes: '', sortOrder: 4 },
  { name: 'Cardamom', nameHe: 'הל', notes: 'Pods', sortOrder: 5 },
  { name: 'All Spice', nameHe: 'פלפל אנגלי', notes: 'English pepper', sortOrder: 6 },
  { name: 'Black Pepper', nameHe: 'פלפל שחור', notes: '', sortOrder: 7 },
  { name: 'Vanilla', nameHe: 'וניל', notes: 'Slice lengthwise before infusing. Adds sweetness.', sortOrder: 8 },
  { name: 'Coffee Beans', nameHe: 'פולי קפה', notes: 'Costa Rica origin', sortOrder: 9 },
  { name: 'Cacao Beans', nameHe: 'פולי קקאו', notes: '', sortOrder: 10 },
  { name: 'Mashiya (Nutmeg Bark)', nameHe: 'משיה (קליפת מוסקט)', notes: '', sortOrder: 11 },
] as const;

/** Historical batch data from the spreadsheet */
export const SEED_BATCHES = [
  {
    name: 'Batch 1',
    date: '2022-07-22',
    notes: 'Fantastic!!',
    items: { 'Juniper + Lemon': 370, 'Anise': 75, 'Ceylon Cinnamon': 150, 'Coriander Seeds': 75, 'Cardamom': 75, 'All Spice': 75, 'Vanilla': 150, 'Cacao Beans': 40 },
  },
  {
    name: 'Batch 2',
    date: '2023-03-31',
    notes: 'Essence had been resting for 9 months!',
    items: { 'Juniper + Lemon': 370, 'Anise': 75, 'Ceylon Cinnamon': 130, 'Coriander Seeds': 75, 'Cardamom': 75, 'All Spice': 75, 'Vanilla': 90, 'Cacao Beans': 40 },
  },
  {
    name: 'Batch 3',
    date: '2023-07-14',
    notes: 'Too much cinnamon',
    items: { 'Juniper + Lemon': 1000, 'Anise': 225, 'Ceylon Cinnamon': 250, 'Coriander Seeds': 225, 'Cardamom': 225, 'All Spice': 225, 'Vanilla': 270, 'Cacao Beans': 100 },
  },
  {
    name: 'Batch 4',
    date: '2024-06-28',
    notes: '',
    items: { 'Juniper + Lemon': 500, 'Anise': 100, 'Ceylon Cinnamon': 150, 'Coriander Seeds': 100, 'Cardamom': 100, 'All Spice': 100, 'Vanilla': 300, 'Cacao Beans': 50 },
  },
  {
    name: 'Batch 5',
    date: '2024-08-06',
    notes: '',
    items: { 'Juniper + Lemon': 600, 'Anise': 100, 'Ceylon Cinnamon': 100, 'Coriander Seeds': 100, 'Cardamom': 100, 'All Spice': 100, 'Coffee Beans': 100, 'Vanilla': 150, 'Cacao Beans': 100 },
  },
  {
    name: 'Batch 6',
    date: '2025-04-30',
    notes: '',
    items: { 'Juniper + Lemon': 900, 'Anise': 150, 'Ceylon Cinnamon': 130, 'Coriander Seeds': 150, 'Cardamom': 110, 'All Spice': 150, 'Cacao Beans': 100 },
  },
  {
    name: 'Batch 7',
    date: '2025-06-24',
    notes: 'Too many flavours?',
    items: { 'Juniper + Lemon': 1650, 'Anise': 250, 'Ceylon Cinnamon': 130, 'Coriander Seeds': 150, 'Cardamom': 110, 'All Spice': 150, 'Black Pepper': 100, 'Vanilla': 250, 'Coffee Beans': 50, 'Mashiya (Nutmeg Bark)': 170 },
  },
  {
    name: 'Batch 8',
    date: '2025-09-26',
    notes: 'Ginnier',
    items: { 'Juniper + Lemon': 2200, 'Anise': 150, 'Coriander Seeds': 150, 'All Spice': 150, 'Vanilla': 200, 'Mashiya (Nutmeg Bark)': 300 },
  },
  {
    name: 'My Mix',
    date: '2022-07-22',
    notes: 'Saved recipe ratio - My Mix',
    items: { 'Juniper + Lemon': 370, 'Anise': 75, 'Ceylon Cinnamon': 150, 'Coriander Seeds': 70, 'Cardamom': 75, 'All Spice': 70, 'Vanilla': 150, 'Cacao Beans': 40 },
  },
  {
    name: 'My Other Mix',
    date: '2022-07-22',
    notes: 'Saved recipe ratio - My Other Mix',
    items: { 'Juniper + Lemon': 550, 'Anise': 85, 'Ceylon Cinnamon': 45, 'Coriander Seeds': 50, 'Cardamom': 50, 'All Spice': 50, 'Black Pepper': 35, 'Vanilla': 85, 'Coffee Beans': 20, 'Mashiya (Nutmeg Bark)': 30 },
  },
];
