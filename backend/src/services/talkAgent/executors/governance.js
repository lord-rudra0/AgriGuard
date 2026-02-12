import TalkActionLog from '../../../models/TalkActionLog.js';

export const ROLE_POLICY = {
  admin: { allow: '*' },
  farmer: { allow: '*' },
  expert: {
    deny: new Set([
      'control_device',
      'create_automation_rule',
      'toggle_automation_rule',
      'delete_automation_rule',
      'delete_threshold',
      'delete_calendar_event',
      'delete_report_schedule',
      'run_report_now',
      'send_push_notification',
      'notify_alert'
    ])
  }
};

export const checkToolPermission = (role, name) => {
  const r = String(role || '').toLowerCase();
  const policy = ROLE_POLICY[r];
  if (!policy) return { allowed: false, reason: "Unknown role; action denied." };
  if (policy.allow === '*') return { allowed: true };
  if (policy.deny?.has(name)) {
    return { allowed: false, reason: `Your role does not allow '${name}' actions.` };
  }
  return { allowed: true };
};

export const getRolePermissionSummary = (role) => {
  const r = String(role || '').toLowerCase();
  const policy = ROLE_POLICY[r];
  if (!policy) return { role: r || 'unknown', allowAll: false, deniedTools: [], message: 'Unknown role' };
  if (policy.allow === '*') return { role: r, allowAll: true, deniedTools: [], message: 'All tools allowed' };
  return { role: r, allowAll: false, deniedTools: [...(policy.deny || [])], message: 'Restricted tool set applies' };
};

export const writeTalkActionLog = async ({
  userId,
  role,
  toolName,
  callId,
  args,
  status,
  errorMessage,
  durationMs,
  response
}) => {
  try {
    await TalkActionLog.create({
      userId: userId || undefined,
      role: role || 'unknown',
      toolName,
      callId,
      args,
      status,
      errorMessage: errorMessage || '',
      durationMs: Number(durationMs || 0),
      response: response ?? null
    });
  } catch (e) {
    console.warn('[TalkAgent] Failed to write action log:', e?.message || e);
  }
};

export const executeListTalkActions = async (args, userId) => {
  const limitRaw = Number(args?.limit);
  const limit = Math.min(Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 20, 100);
  const query = { userId };
  if (args?.toolName) query.toolName = String(args.toolName);
  if (args?.status) query.status = String(args.status);

  const actions = await TalkActionLog.find(query).sort({ createdAt: -1 }).limit(limit).lean();
  return {
    actions: actions.map((a) => ({
      id: String(a._id),
      toolName: a.toolName,
      status: a.status,
      role: a.role,
      durationMs: a.durationMs,
      errorMessage: a.errorMessage || '',
      createdAt: a.createdAt
    }))
  };
};

export const executeGetRolePermissions = async (role) => getRolePermissionSummary(role);
