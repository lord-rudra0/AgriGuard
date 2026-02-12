import { executeBaseTool } from './executors/baseHandlers.js';
import { executeThresholdTool } from './executors/thresholdHandlers.js';
import { executeAlertCalendarTool } from './executors/alertsCalendarHandlers.js';
import { executeDeviceAutomationTool } from './executors/deviceAutomationHandlers.js';
import { executeReportNotificationTool } from './executors/reportsNotificationHandlers.js';
import {
  checkToolPermission,
  writeTalkActionLog,
  executeListTalkActions,
  executeGetRolePermissions
} from './executors/governance.js';

const executeTool = async (name, args, userId, socket) => {
  if (!userId) {
    return { error: "User context missing for tool execution. Please reconnect and try again." };
  }

  const handlers = [
    executeBaseTool,
    executeDeviceAutomationTool,
    executeReportNotificationTool,
    executeThresholdTool,
    executeAlertCalendarTool
  ];

  for (const handler of handlers) {
    const result = await handler(name, args, userId, socket);
    if (result !== null) return result;
  }

  return { error: "Function not found" };
};

export const handleToolCall = async (geminiWs, toolCall, socket) => {
  const responses = [];
  const userId = socket.user?._id || socket.user?.id;
  const role = socket.user?.role || 'unknown';

  for (const call of toolCall.functionCalls) {
    const { name, args, id } = call;
    console.log(`[TalkAgent] Executing tool: ${name}`, args);
    const startedAt = Date.now();

    const permission = checkToolPermission(role, name);
    if (!permission.allowed) {
      const result = { error: permission.reason || 'Permission denied' };
      responses.push({ name, id, response: result });
      await writeTalkActionLog({
        userId,
        role,
        toolName: name,
        callId: id,
        args,
        status: 'denied',
        errorMessage: result.error,
        durationMs: Date.now() - startedAt,
        response: result
      });
      continue;
    }

    let result;
    try {
      if (name === "list_talk_actions") {
        result = await executeListTalkActions(args, userId);
      } else if (name === "get_role_permissions") {
        result = await executeGetRolePermissions(role);
      } else {
        result = await executeTool(name, args, userId, socket);
      }
    } catch (err) {
      console.error(`[TalkAgent] Tool error (${name}):`, err);
      result = { error: err.message };
    }

    await writeTalkActionLog({
      userId,
      role,
      toolName: name,
      callId: id,
      args,
      status: result?.error ? 'error' : 'success',
      errorMessage: result?.error || '',
      durationMs: Date.now() - startedAt,
      response: result
    });

    responses.push({ name, id, response: result });
  }

  if (geminiWs && geminiWs.readyState === 1) {
    geminiWs.send(JSON.stringify({
      toolResponse: { functionResponses: responses }
    }));
    console.log(`[TalkAgent] Sent tool responses for ${responses.length} calls`);
  }
};
