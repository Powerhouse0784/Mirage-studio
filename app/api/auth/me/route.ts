import { json, route } from '@/lib/api';
export const GET = route({}, async (_r, user) => json({ user }));
