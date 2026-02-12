export const NAVIGATION_AND_DEVICE_DECLARATIONS = [
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
  }
];
