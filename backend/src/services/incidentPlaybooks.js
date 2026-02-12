const PLAYBOOKS = {
  temperature_spike: {
    id: 'temperature_spike',
    name: 'Temperature Spike',
    appliesTo: ['temperature'],
    summary: 'Rapid or sustained temperature increase that can stress crops/mycelium.',
    immediateActions: [
      'Increase ventilation and confirm fan operation.',
      'Reduce or pause heat-producing equipment where possible.',
      'Check room-level temperature sensor consistency.'
    ],
    diagnosisChecklist: [
      'Compare current value against last 3 hours trend.',
      'Inspect fan/power state and airflow obstructions.',
      'Validate threshold settings for this room/stage.'
    ],
    followupActions: [
      'Create a follow-up check in 30-60 minutes.',
      'Escalate if temperature remains above threshold.'
    ],
    escalation: { medium: 'high', high: 'critical', critical: 'critical', low: 'medium' }
  },
  humidity_drift: {
    id: 'humidity_drift',
    name: 'Humidity Drift',
    appliesTo: ['humidity'],
    summary: 'Humidity gradually drifting outside target range over time.',
    immediateActions: [
      'Check humidifier/dehumidifier actuator state.',
      'Inspect ventilation and recent watering/fogging actions.',
      'Confirm humidity sensor calibration status.'
    ],
    diagnosisChecklist: [
      'Review humidity trend over 6-24 hours.',
      'Correlate drift with temperature and airflow changes.',
      'Verify threshold bounds match active growth stage.'
    ],
    followupActions: [
      'Schedule follow-up validation task for next cycle.',
      'Tune thresholds/automation if drift repeats.'
    ],
    escalation: { medium: 'high', high: 'critical', critical: 'critical', low: 'medium' }
  },
  irrigation_fault: {
    id: 'irrigation_fault',
    name: 'Irrigation Fault',
    appliesTo: ['soilMoisture', 'maintenance', 'system'],
    summary: 'Irrigation command mismatch, blocked flow, or moisture not recovering after watering.',
    immediateActions: [
      'Verify pump/irrigation actuator response and recent commands.',
      'Inspect water source, line pressure, and valve status.',
      'Check soil moisture sensor signal quality.'
    ],
    diagnosisChecklist: [
      'Compare expected moisture increase vs observed readings.',
      'Check command logs for pending/failed irrigation commands.',
      'Inspect physical lines for blockage or leak.'
    ],
    followupActions: [
      'Create urgent follow-up task if moisture remains low.',
      'Escalate to critical when crop stress risk is high.'
    ],
    escalation: { medium: 'high', high: 'critical', critical: 'critical', low: 'medium' }
  }
};

const PLAYBOOK_LIST = Object.values(PLAYBOOKS);

const normalize = (value) => String(value || '').trim().toLowerCase();

const matchByAlertContent = (alert) => {
  const type = normalize(alert?.type);
  const title = normalize(alert?.title);
  const message = normalize(alert?.message);
  const body = `${title} ${message}`;

  if (type === 'temperature') return PLAYBOOKS.temperature_spike;
  if (type === 'humidity') return PLAYBOOKS.humidity_drift;
  if (type === 'soilmoisture') return PLAYBOOKS.irrigation_fault;
  if (body.includes('irrigation') || body.includes('pump') || body.includes('soil moisture')) return PLAYBOOKS.irrigation_fault;
  return null;
};

export const listIncidentPlaybooks = () =>
  PLAYBOOK_LIST.map((p) => ({
    id: p.id,
    name: p.name,
    appliesTo: p.appliesTo,
    summary: p.summary
  }));

export const getIncidentPlaybook = (playbookId) => {
  const key = normalize(playbookId);
  return PLAYBOOKS[key] || null;
};

export const getPlaybookForAlert = (alert, preferredPlaybookId = null) => {
  if (preferredPlaybookId) {
    const direct = getIncidentPlaybook(preferredPlaybookId);
    if (direct) return direct;
  }
  return matchByAlertContent(alert) || PLAYBOOKS.humidity_drift;
};

export const buildIncidentPlaybookRun = (alert, preferredPlaybookId = null) => {
  const playbook = getPlaybookForAlert(alert, preferredPlaybookId);
  const severity = normalize(alert?.severity) || 'medium';
  const escalationTarget = playbook.escalation?.[severity] || 'high';
  const recommendedAction = severity === 'critical' ? 'escalate' : severity === 'high' ? 'followup' : 'followup';

  return {
    playbook: {
      id: playbook.id,
      name: playbook.name,
      summary: playbook.summary,
      appliesTo: playbook.appliesTo,
      immediateActions: playbook.immediateActions,
      diagnosisChecklist: playbook.diagnosisChecklist,
      followupActions: playbook.followupActions
    },
    recommendation: {
      action: recommendedAction,
      escalateSeverity: escalationTarget,
      reason: `Based on severity '${severity}' and incident type '${alert?.type || 'unknown'}'.`
    }
  };
};
