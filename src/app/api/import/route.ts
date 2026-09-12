import fixture from "@/fixtures/plan.carbonara.json";

export async function POST(_request: Request) {
  return Response.json(fixture);
}
