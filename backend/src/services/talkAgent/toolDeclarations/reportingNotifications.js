export const REPORTING_NOTIFICATIONS_DECLARATIONS = [
  {
    name: "list_report_schedules",
    description: "List report email schedules for the user.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },
  {
    name: "create_report_schedule",
    description: "Create a scheduled analytics email report. Executes only when confirm=true.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", description: "Schedule name" },
        email: { type: "STRING", description: "Destination email address" },
        timeframe: {
          type: "STRING",
          enum: ["1h", "24h", "7d", "30d"]
        },
        frequency: {
          type: "STRING",
          enum: ["daily", "weekly"]
        },
        hourLocal: { type: "NUMBER", description: "Hour of day in local time, 0-23" },
        enabled: { type: "BOOLEAN" },
        confirm: { type: "BOOLEAN", description: "Must be true only after explicit user confirmation." }
      },
      required: ["name", "email"]
    }
  },
  {
    name: "delete_report_schedule",
    description: "Delete report schedule by ID.",
    parameters: {
      type: "OBJECT",
      properties: {
        scheduleId: { type: "STRING", description: "Report schedule ID" }
      },
      required: ["scheduleId"]
    }
  },
  {
    name: "run_report_now",
    description: "Send analytics report immediately by email. Executes only when confirm=true.",
    parameters: {
      type: "OBJECT",
      properties: {
        scheduleId: { type: "STRING", description: "Optional existing schedule ID to run" },
        name: { type: "STRING", description: "Required if scheduleId not provided" },
        email: { type: "STRING", description: "Required if scheduleId not provided" },
        timeframe: {
          type: "STRING",
          enum: ["1h", "24h", "7d", "30d"]
        },
        frequency: {
          type: "STRING",
          enum: ["daily", "weekly"]
        },
        confirm: { type: "BOOLEAN", description: "Must be true only after explicit user confirmation." }
      }
    }
  },
  {
    name: "send_push_notification",
    description: "Send a push notification to the current user. Executes only when confirm=true.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING", description: "Notification title" },
        body: { type: "STRING", description: "Notification message body" },
        severity: {
          type: "STRING",
          enum: ["info", "warning", "critical", "low", "medium", "high"],
          description: "Optional severity used for notification preference filtering"
        },
        confirm: { type: "BOOLEAN", description: "Must be true only after explicit user confirmation." }
      },
      required: ["title", "body"]
    }
  },
  {
    name: "generate_proactive_alerts",
    description: "Generate proactive risk alerts (disease, weather stress, irrigation) from recent sensor trends.",
    parameters: {
      type: "OBJECT",
      properties: {
        deviceId: { type: "STRING", description: "Optional device ID. If omitted, all active devices are evaluated." },
        minConfidence: { type: "NUMBER", description: "Optional minimum confidence (0-100) to keep generated alerts. Default 55." },
        categories: {
          type: "ARRAY",
          items: { type: "STRING", enum: ["disease", "weather_stress", "irrigation"] },
          description: "Optional subset of predictive risk categories to include."
        }
      }
    }
  },
  {
    name: "notify_alert",
    description: "Send a push notification for an existing alert. Executes only when confirm=true.",
    parameters: {
      type: "OBJECT",
      properties: {
        alertId: { type: "STRING", description: "Alert ID to notify about" },
        confirm: { type: "BOOLEAN", description: "Must be true only after explicit user confirmation." }
      },
      required: ["alertId"]
    }
  },
  {
    name: "list_talk_actions",
    description: "List recent Talk AI action audit logs for the current user.",
    parameters: {
      type: "OBJECT",
      properties: {
        limit: { type: "NUMBER", description: "Max number of items to return (default 20, max 100)" },
        toolName: { type: "STRING", description: "Optional tool name filter" },
        status: {
          type: "STRING",
          enum: ["success", "error", "denied"],
          description: "Optional status filter"
        }
      }
    }
  },
  {
    name: "get_role_permissions",
    description: "Get what Talk AI actions are restricted for your current role.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  }
];
