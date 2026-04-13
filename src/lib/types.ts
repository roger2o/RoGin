export interface BotanicalData {
  id: number;
  name: string;
  nameHe: string;
  notes: string;
  sortOrder: number;
}

export interface RecipeItemData {
  botanicalId: number;
  botanicalName: string;
  botanicalNameHe: string;
  ratio: number; // relative to Juniper = 1.0
  amount: number; // calculated ml (rounded to nearest 5)
}

export interface RecipeData {
  id: number;
  name: string;
  items: RecipeItemData[];
  createdAt: string;
}

export interface BatchItemData {
  botanicalId: number;
  botanicalName: string;
  botanicalNameHe: string;
  amount: number; // actual ml used
}

export interface BatchData {
  id: number;
  name: string;
  date: string;
  totalVolume: number;
  notes: string;
  recipeId: number | null;
  recipeName: string | null;
  items: BatchItemData[];
}

export interface WizardMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GeneratedRecipe {
  items: {
    botanicalName: string;
    botanicalNameHe: string;
    ratio: number;
  }[];
  description: string;
}

/** Round a number to the nearest 5 */
export function roundTo5(n: number): number {
  return Math.round(n / 5) * 5;
}

/** Calculate ml amounts from ratios given a Juniper amount */
export function ratiosToAmounts(
  items: { ratio: number; [key: string]: unknown }[],
  juniperMl: number
): number[] {
  return items.map((item) => roundTo5(item.ratio * juniperMl));
}
