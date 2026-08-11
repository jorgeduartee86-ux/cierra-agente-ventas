import { getSetting } from "../../../../db/client";
import {
  canManageOpenAI,
  OPENAI_ADMIN_HASH_KEY,
  OPENAI_CONNECTION_KEY,
} from "../../../../lib/openai-admin";

export async function GET(request: Request) {
  try {
    const [connection, adminHash] = await Promise.all([
      getSetting(OPENAI_CONNECTION_KEY),
      getSetting(OPENAI_ADMIN_HASH_KEY),
    ]);
    return Response.json({ connected: Boolean(connection), canManage: await canManageOpenAI(request, adminHash) });
  } catch {
    return Response.json({ connected: Boolean(process.env.OPENAI_API_KEY), canManage: true });
  }
}
