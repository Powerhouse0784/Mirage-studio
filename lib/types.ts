export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type InvestigationDTO = { id: string; title: string; status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED'; priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; analystNotes: string; scenario: string; speed: string; decoys: Record<string, boolean>; riskScore: number; runs: number; caught: number; missed: number; eventCount: number; createdAt: string; updatedAt: string };
export type ServerEventDTO = { seq: number; title: string; detail: string; severity: Severity; node: string | null; occurredAt: string };
export type UserDTO = { name: string; email: string; workspaceName: string; theme: 'dark' | 'light' };
export type VerifyDTO = { ok: boolean; count: number; reason?: string; brokenAtSeq?: number | null; verifiedAt: string };
