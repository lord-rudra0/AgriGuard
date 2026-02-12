export const ALERTS_AUTOMATION_DECLARATIONS = [
  {
    name: "resolve_alert",
    description: "Resolve an alert by ID and optionally record action taken.",
    parameters: {
      type: "OBJECT",
      properties: {
        alertId: { type: "STRING", description: "Alert ID to resolve" },
        actionTaken: { type: "STRING", description: "Optional action notes" }
      },
      required: ["alertId"]
    }
  },
  {
    name: "escalate_alert",
    description: "Escalate alert severity by ID.",
    parameters: {
      type: "OBJECT",
      properties: {
        alertId: { type: "STRING", description: "Alert ID to escalate" },
        severity: {
          type: "STRING",
          enum: ["medium", "high", "critical"],
          description: "Target severity level"
        }
      },
      required: ["alertId", "severity"]
    }
  },
  {
    name: "create_alert_followup_event",
    description: "Create a calendar follow-up task from an alert.",
    parameters: {
      type: "OBJECT",
      properties: {
        alertId: { type: "STRING", description: "Alert ID" },
        startAt: { type: "STRING", description: "Follow-up start datetime in ISO format (optional)" },
        minutesFromNow: { type: "NUMBER", description: "If startAt not provided, schedule N minutes from now" },
        title: { type: "STRING", description: "Optional custom title" },
        reminderMinutes: {
          type: "ARRAY",
          items: { type: "NUMBER" },
          description: "Optional reminders in minutes before event"
        }
      },
      required: ["alertId"]
    }
  },
  {
    name: "triage_alert",
    description: "Suggest and execute an alert triage playbook. Executes only when confirm=true.",
    parameters: {
      type: "OBJECT",
      properties: {
        alertId: { type: "STRING", description: "Alert ID to triage" },
        action: {
          type: "STRING",
          enum: ["resolve", "escalate", "followup", "ignore"],
          description: "Action to execute. If omitted, recommended action is used on confirm."
        },
        escalateSeverity: {
          type: "STRING",
          enum: ["medium", "high", "critical"],
          description: "Target severity when action='escalate'"
        },
        followupMinutes: {
          type: "NUMBER",
          description: "Minutes from now for follow-up event when action='followup'"
        },
        confirm: {
          type: "BOOLEAN",
          description: "Must be true only after explicit user confirmation."
        }
      },
      required: ["alertId"]
    }
  },
  {
    name: "list_automation_rules",
    description: "List automation rules (if-this-then-that), optionally filtered by metric/device.",
    parameters: {
      type: "OBJECT",
      properties: {
        metric: {
          type: "STRING",
          enum: ["temperature", "humidity", "co2", "light", "soilMoisture"],
          description: "Optional metric filter"
        },
        deviceId: { type: "STRING", description: "Optional device filter" }
      }
    }
  },
  {
    name: "create_automation_rule",
    description: "Create an automation rule. Executes only when confirm=true.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", description: "Rule name" },
        metric: {
          type: "STRING",
          enum: ["temperature", "humidity", "co2", "light", "soilMoisture"]
        },
        operator: {
          type: "STRING",
          enum: ["gt", "gte", "lt", "lte", "between", "outside"]
        },
        value: { type: "NUMBER", description: "Condition value for gt/gte/lt/lte" },
        min: { type: "NUMBER", description: "Lower bound for between/outside" },
        max: { type: "NUMBER", description: "Upper bound for between/outside" },
        durationMinutes: { type: "NUMBER", description: "How long condition should persist before firing" },
        cooldownMinutes: { type: "NUMBER", description: "Minimum gap between triggers" },
        deviceId: { type: "STRING", description: "Optional device scope; if omitted applies to any device" },
        actuator: {
          type: "STRING",
          enum: ["pump", "fan", "light", "irrigation"]
        },
        state: {
          type: "STRING",
          enum: ["on", "off"]
        },
        actionDurationMinutes: { type: "NUMBER", description: "Optional duration for ON action" },
        enabled: { type: "BOOLEAN" },
        notes: { type: "STRING" },
        confirm: { type: "BOOLEAN", description: "Must be true only after explicit user confirmation." }
      },
      required: ["name", "metric", "operator", "actuator", "state"]
    }
  },
  {
    name: "toggle_automation_rule",
    description: "Enable/disable automation rule by ID.",
    parameters: {
      type: "OBJECT",
      properties: {
        ruleId: { type: "STRING", description: "Automation rule ID" },
        enabled: { type: "BOOLEAN" }
      },
      required: ["ruleId", "enabled"]
    }
  },
  {
    name: "delete_automation_rule",
    description: "Delete automation rule by ID.",
    parameters: {
      type: "OBJECT",
      properties: {
        ruleId: { type: "STRING", description: "Automation rule ID" }
      },
      required: ["ruleId"]
    }
  }
];
