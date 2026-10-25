import { fail, json, route } from '@/lib/api';
import { findOwned, verifyInvestigation } from '@/lib/investigations';

export const GET = route<{ id: string }>({}, async (_r, user, { id }) => {
  if (!(await findOwned(user.id, id))) return fail(404, 'Investigation not found.');
  return json({ result: await verifyInvestigation(id), verifiedAt: new Date().toISOString() });
});
