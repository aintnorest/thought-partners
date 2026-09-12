export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export type RecipeStep = {
  id: string;
  instruction: string;
  doneWhen?: string;
  durationSeconds?: number;
};

export type Recipe = {
  id: string;
  title: string;
  servings: number;
  steps: RecipeStep[];
};

// A single in-memory store shared across every module that imports this file.
// Keyed on globalThis so Next's dev HMR and separate route/page module graphs
// resolve the same Map instead of re-seeding into divergent copies. This is a
// single-instance store by design (POC, no DB); it does not span serverless
// instances.
const STORE_KEY = Symbol.for("jacques.recipes.store");
const globalStore = globalThis as typeof globalThis & {
  [STORE_KEY]?: Map<string, Recipe>;
};
const store = globalStore[STORE_KEY] ?? new Map<string, Recipe>();
globalStore[STORE_KEY] = store;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueId(base: string): string {
  const root = base || "recipe";
  let id = root;
  while (store.has(id)) {
    id = `${root}-${Math.random().toString(16).slice(2, 6)}`;
  }
  return id;
}

/** Returns every recipe currently known to the sous chef. */
export function listRecipes(): Recipe[] {
  return [...store.values()];
}

/** Returns a single recipe by id, or `undefined` when it does not exist. */
export function getRecipe(id: string): Recipe | undefined {
  return store.get(id);
}

/** Validates untrusted input and persists a new recipe, returning the stored value. */
export function createRecipe(input: unknown): Recipe {
  if (typeof input !== "object" || input === null) {
    throw new ValidationError("body must be an object");
  }

  const { title, servings, steps } = input as Record<string, unknown>;

  if (typeof title !== "string" || title.trim() === "") {
    throw new ValidationError("title is required");
  }
  if (typeof servings !== "number" || !Number.isInteger(servings) || servings < 1) {
    throw new ValidationError("servings must be a positive integer");
  }
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new ValidationError("steps must be a non-empty array");
  }

  const normalizedSteps: RecipeStep[] = steps.map((raw, index) => {
    if (typeof raw !== "object" || raw === null) {
      throw new ValidationError(`step ${index + 1} must be an object`);
    }
    const { instruction, durationSeconds, doneWhen } = raw as Record<string, unknown>;
    if (typeof instruction !== "string" || instruction.trim() === "") {
      throw new ValidationError(`step ${index + 1} instruction is required`);
    }
    if (
      durationSeconds !== undefined &&
      (typeof durationSeconds !== "number" || durationSeconds < 0)
    ) {
      throw new ValidationError(`step ${index + 1} durationSeconds must be a non-negative number`);
    }
    if (doneWhen !== undefined && (typeof doneWhen !== "string" || doneWhen.trim() === "")) {
      throw new ValidationError(`step ${index + 1} doneWhen must be a non-empty string`);
    }
    return {
      id: "",
      instruction: instruction.trim(),
      ...(durationSeconds !== undefined ? { durationSeconds } : {}),
      ...(doneWhen !== undefined ? { doneWhen: doneWhen.trim() } : {}),
    };
  });

  const id = uniqueId(slugify(title));
  for (const [index, step] of normalizedSteps.entries()) {
    step.id = `${id}-${index + 1}`;
  }

  const recipe: Recipe = { id, title: title.trim(), servings, steps: normalizedSteps };
  store.set(id, recipe);
  return recipe;
}

/** Sums the known step durations, in seconds. Steps without a duration count as zero. */
export function estimateTotalSeconds(recipe: Recipe): number {
  return recipe.steps.reduce((sum, step) => sum + (step.durationSeconds ?? 0), 0);
}

// Seed a couple of recipes so the app and API have content out of the box.
// Guarded so a re-evaluated module (dev HMR) does not duplicate the seeds into
// the persistent global store.
if (store.size === 0) {
  createRecipe({
    title: "Classic French Omelette",
    servings: 1,
    steps: [
      {
        instruction: "Crack 3 eggs into a bowl, season with salt, and beat until uniform.",
        durationSeconds: 60,
        doneWhen: "Eggs are uniformly mixed with no visible streaks of white.",
      },
      {
        instruction: "Melt butter in a non-stick pan over medium-low heat.",
        durationSeconds: 90,
        doneWhen: "Butter is melted and foamy, not browned.",
      },
      {
        instruction: "Pour in the eggs and stir constantly with a spatula.",
        durationSeconds: 120,
        doneWhen: "Eggs form small soft curds but still look glossy.",
      },
      {
        instruction: "When just set but still glossy, fold and roll onto a plate.",
        durationSeconds: 45,
        doneWhen: "Omelette is just set, glossy on top, and rolled without browning.",
      },
    ],
  });

  createRecipe({
    title: "Simple Marinara",
    servings: 4,
    steps: [
      {
        instruction: "Warm olive oil and gently sweat minced garlic until fragrant.",
        durationSeconds: 120,
        doneWhen: "Garlic smells fragrant and stays pale, with no brown edges.",
      },
      {
        instruction: "Add crushed tomatoes, salt, and a pinch of sugar.",
        durationSeconds: 60,
        doneWhen: "Tomatoes are bubbling gently and seasoning is stirred through.",
      },
      {
        instruction: "Simmer, stirring occasionally, until thickened.",
        durationSeconds: 1200,
        doneWhen: "Sauce coats a spoon and leaves a brief trail when stirred.",
      },
      {
        instruction: "Finish with torn basil and a drizzle of olive oil.",
        durationSeconds: 30,
        doneWhen: "Basil is just wilted and oil is glossy on the surface.",
      },
    ],
  });
}
