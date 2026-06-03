import { getNedarimKupot } from "@/features/nedarim/actions";

export async function GET() {
  const result = await getNedarimKupot();
  return Response.json(result);
}
