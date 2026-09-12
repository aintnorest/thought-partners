import { createRecipe, listRecipes, ValidationError } from "@/lib/recipes";

export function GET() {
  return Response.json({ recipes: listRecipes() });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  try {
    const recipe = createRecipe(body);
    return Response.json({ recipe }, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json({ error: error.message }, { status: 422 });
    }
    throw error;
  }
}
