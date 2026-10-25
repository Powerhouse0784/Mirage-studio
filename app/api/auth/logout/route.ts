import { json, route } from '@/lib/api';
import { destroySession } from '@/lib/session';
export const POST = route({ auth: false }, async () => { await destroySession(); return json({ ok: true }); });
