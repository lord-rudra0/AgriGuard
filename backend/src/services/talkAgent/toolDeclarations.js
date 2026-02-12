export const TALK_FUNCTION_DECLARATIONS = [
  {
    name: "navigate_to",
    description: "Navigate the user to a specific page on the AgriGuard platform.",
    parameters: {
      type: "OBJECT",
      properties: {
        page: {
          type: "STRING",
          enum: ["dashboard", "scan", "history", "alerts", "devices", "analytics", "calendar", "settings"],
          description: "The name of the page to navigate to."
        }
      },
      required: ["page"]
    }
  },
  {
    name: "get_latest_sensor_data",
    description: "Fetch the most recent reading for a specific sensor type.",
    parameters: {
      type: "OBJECT",
      properties: {
        sensorType: {
          type: "STRING",
          enum: ["temperature", "humidity", "co2", "light", "soilMoisture"],
          description: "The type of sensor to query."
        }
      },
      required: ["sensorType"]
    }
  },
  {
    name: "list_devices",
    description: "List user's registered IoT devices and their online status.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },
  {
    name: "control_device",
    description: "Send an actuator command to a device (pump/fan/light/irrigation). Requires confirm=true.",
    parameters: {
      type: "OBJECT",
      properties: {
        deviceId: { type: "STRING", description: "Target device ID (recommended)" },
        deviceName: { type: "STRING", description: "Target device name (alternative to deviceId)" },
        actuator: {
          type: "STRING",
          enum: ["pump", "fan", "light", "irrigation"],
          description: "Actuator to control"
        },
        state: {
          type: "STRING",
          enum: ["on", "off"],
          description: "Desired state"
        },
        durationMinutes: {
          type: "NUMBER",
          description: "Optional auto-off duration in minutes (mainly for ON commands)"
        },
        confirm: {
          type: "BOOLEAN",
          description: "Must be true only after explicit user confirmation."
        },
        safetyConfirm: {
          type: "BOOLEAN",
          description: "Second explicit confirmation for high-risk commands."
        }
      },
      required: ["actuator", "state"]
    }
  },
  {
    name: "get_recent_scans",
    description: "Get the last 5 mushroom/crop analysis results from history.",
    parameters: { type: "OBJECT", properties: {} }
  },
  {
    name: "get_active_alerts",
    description: "List unresolved alerts, filtered by severity.",
    parameters: {
      type: "OBJECT",
      properties: {
        minSeverity: {
          type: "STRING",
          enum: ["low", "medium", "high", "critical"],
          description: "Minimum severity level to include."
        }
      }
    }
  },
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
  },
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
    name: "list_thresholds",
    description: "List user thresholds, optionally filtered by metric and room.",
    parameters: {
      type: "OBJECT",
      properties: {
        metric: {
          type: "STRING",
          enum: ["temperature", "humidity", "co2", "light", "soilMoisture"],
          description: "Optional metric filter"
        },
        roomId: {
          type: "STRING",
          description: "Optional room filter"
        }
      }
    }
  },
  {
    name: "create_threshold",
    description: "Create a new threshold rule.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", description: "Threshold name" },
        metric: {
          type: "STRING",
          enum: ["temperature", "humidity", "co2", "light", "soilMoisture"],
          description: "Metric type"
        },
        min: { type: "NUMBER", description: "Optional minimum limit" },
        max: { type: "NUMBER", description: "Optional maximum limit" },
        roomId: { type: "STRING", description: "Optional room identifier" },
        severity: {
          type: "STRING",
          enum: ["info", "warning", "critical"],
          description: "Alert severity"
        },
        enabled: { type: "BOOLEAN", description: "Threshold enabled status" },
        notes: { type: "STRING", description: "Optional notes" }
      },
      required: ["name", "metric"]
    }
  },
  {
    name: "update_threshold",
    description: "Update an existing threshold by ID.",
    parameters: {
      type: "OBJECT",
      properties: {
        thresholdId: { type: "STRING", description: "Threshold ID" },
        name: { type: "STRING" },
        min: { type: "NUMBER" },
        max: { type: "NUMBER" },
        roomId: { type: "STRING" },
        severity: {
          type: "STRING",
          enum: ["info", "warning", "critical"]
        },
        enabled: { type: "BOOLEAN" },
        notes: { type: "STRING" }
      },
      required: ["thresholdId"]
    }
  },
  {
    name: "toggle_threshold_enabled",
    description: "Enable or disable a threshold by ID or by unique name.",
    parameters: {
      type: "OBJECT",
      properties: {
        thresholdId: { type: "STRING", description: "Threshold ID" },
        name: { type: "STRING", description: "Threshold name (alternative to thresholdId)" },
        metric: {
          type: "STRING",
          enum: ["temperature", "humidity", "co2", "light", "soilMoisture"],
          description: "Optional metric when resolving by name"
        },
        roomId: { type: "STRING", description: "Optional room when resolving by name" },
        enabled: { type: "BOOLEAN", description: "Target enabled state: true to enable, false to disable" }
      },
      required: ["enabled"]
    }
  },
  {
    name: "delete_threshold",
    description: "Delete a threshold by ID, or by unique name (optionally narrowed by metric/room).",
    parameters: {
      type: "OBJECT",
      properties: {
        thresholdId: { type: "STRING", description: "Threshold ID" },
        name: { type: "STRING", description: "Threshold name (alternative to thresholdId)" },
        metric: {
          type: "STRING",
          enum: ["temperature", "humidity", "co2", "light", "soilMoisture"],
          description: "Optional metric when deleting by name"
        },
        roomId: { type: "STRING", description: "Optional room when deleting by name" }
      },
      required: []
    }
  },
  {
    name: "create_calendar_event",
    description: "Create a calendar event for the user.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING", description: "Event title" },
        startAt: { type: "STRING", description: "Start datetime in ISO format" },
        endAt: { type: "STRING", description: "Optional end datetime in ISO format" },
        description: { type: "STRING", description: "Optional event description" },
        roomId: { type: "STRING", description: "Optional room identifier" },
        reminderMinutes: {
          type: "ARRAY",
          items: { type: "NUMBER" },
          description: "Optional reminders in minutes before event, e.g. [15, 60]"
        },
        confirm: {
          type: "BOOLEAN",
          description: "Must be true only after user explicitly confirms all event details."
        }
      }
    }
  },
  {
    name: "list_calendar_events",
    description: "List calendar events in a date range.",
    parameters: {
      type: "OBJECT",
      properties: {
        start: { type: "STRING", description: "Range start datetime in ISO format" },
        end: { type: "STRING", description: "Range end datetime in ISO format" },
        limit: { type: "NUMBER", description: "Maximum number of events to return" }
      }
    }
  },
  {
    name: "update_calendar_event",
    description: "Update an existing calendar event by ID.",
    parameters: {
      type: "OBJECT",
      properties: {
        eventId: { type: "STRING", description: "Calendar event ID" },
        title: { type: "STRING" },
        startAt: { type: "STRING" },
        endAt: { type: "STRING" },
        description: { type: "STRING" },
        roomId: { type: "STRING" },
        reminderMinutes: {
          type: "ARRAY",
          items: { type: "NUMBER" }
        }
      },
      required: ["eventId"]
    }
  },
  {
    name: "delete_calendar_event",
    description: "Delete a calendar event by ID.",
    parameters: {
      type: "OBJECT",
      properties: {
        eventId: { type: "STRING", description: "Calendar event ID" }
      },
      required: ["eventId"]
    }
  }
];
