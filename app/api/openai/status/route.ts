export async function GET() {
  return Response.json(
    { connected: Boolean(process.env.OPENAI_API_KEY) },
    { headers: { "Access-Control-Allow-Origin": "*" } },
  );
}
