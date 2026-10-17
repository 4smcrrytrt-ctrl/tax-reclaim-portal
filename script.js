const form = document.getElementById('regulatoryReportForm');
const statusText = document.getElementById('status');
const reportResult = document.getElementById('reportResult');
const reportSummary = document.getElementById('reportSummary');
const downloadButton = document.getElementById('downloadReport');
const domainNames = {
  financial: 'Reporting financier',
  environmental: 'Environnement et durabilité',
  'data-protection': 'Protection des données',
  workplace: 'Social et travail',
  sectoral: 'Réglementation sectorielle',
  other: 'Autre obligation',
};
const complianceStatuses = {
  compliant: 'Conforme',
  'in-progress': 'En cours d’évaluation',
  'action-required': 'Actions requises',
  'not-applicable': 'Non applicable',
};

let reportJson = '';

form.addEventListener('submit', (event) => {
  event.preventDefault();
  statusText.className = 'status';
  statusText.textContent = '';

  const formData = new FormData(form);
  const periodStart = formData.get('periodStart');
  const periodEnd = formData.get('periodEnd');
  const dueDate = formData.get('dueDate');

  if (periodEnd < periodStart) {
    statusText.classList.add('error');
    statusText.textContent = 'La fin de la période doit être égale ou postérieure à sa date de début.';
    form.elements.periodEnd.focus();
    return;
  }

  if (dueDate && dueDate < periodEnd) {
    statusText.classList.add('error');
    statusText.textContent = 'La date limite de transmission ne peut pas précéder la fin de la période.';
    form.elements.dueDate.focus();
    return;
  }

  const document = form.elements.document.files[0];
  const report = {
    schemaVersion: '1.0',
    reportType: 'regulatory-compliance',
    generatedAt: new Date().toISOString(),
    organization: {
      legalName: formData.get('organizationName').trim(),
      identifier: formData.get('organizationId').trim(),
      jurisdiction: formData.get('jurisdiction').trim(),
      responsibleContact: formData.get('contactEmail').trim(),
    },
    obligation: {
      regulatoryDomain: formData.get('regulatoryDomain'),
      regulatoryDomainLabel: domainNames[formData.get('regulatoryDomain')],
      reference: formData.get('regulationReference').trim(),
      reportingPeriod: { start: periodStart, end: periodEnd },
      submissionDueDate: dueDate || null,
      complianceStatus: formData.get('complianceStatus'),
      complianceStatusLabel: complianceStatuses[formData.get('complianceStatus')],
    },
    narrative: {
      summary: formData.get('summary').trim(),
      actionsAndExceptions: formData.get('actions').trim() || null,
    },
    supportingDocument: document
      ? { provided: true, filename: document.name }
      : { provided: false },
    disclaimer:
      'Draft prepared locally by the user. Not submitted to a regulator and not validated for accuracy or completeness.',
  };

  reportJson = JSON.stringify(report, null, 2);
  renderSummary(report);
  reportResult.hidden = false;
  reportResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
  statusText.classList.add('success');
  statusText.textContent = 'Rapport créé localement. Aucune information n’a été transmise.';
});

downloadButton.addEventListener('click', () => {
  if (!reportJson) return;

  const file = new Blob([reportJson], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rapport-reglementaire-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

function renderSummary(report) {
  const rows = [
    ['Organisation', report.organization.legalName],
    ['Référence', report.obligation.reference],
    ['Domaine', report.obligation.regulatoryDomainLabel],
    [
      'Période déclarée',
      `${formatDate(report.obligation.reportingPeriod.start)} — ${formatDate(report.obligation.reportingPeriod.end)}`,
    ],
    ['État de conformité', report.obligation.complianceStatusLabel],
  ];

  reportSummary.replaceChildren(
    ...rows.flatMap(([label, value]) => {
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = label;
      description.textContent = value;
      return [term, description];
    }),
  );
}

function formatDate(date) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  );
}
