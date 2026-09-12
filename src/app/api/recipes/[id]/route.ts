import { getRecipe } from "@/lib/recipes";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const recipe = getRecipe(id);
  if (!recipe) {
    return Response.json({ error: "recipe not found" }, { status: 404 });
  }
  return Response.json({ recipe });
}
