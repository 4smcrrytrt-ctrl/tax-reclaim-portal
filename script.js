const form = document.getElementById('taxReclaimForm');
const statusText = document.getElementById('status');
const reportResult = document.getElementById('reportResult');
const reportSummary = document.getElementById('reportSummary');
const downloadButton = document.getElementById('downloadReport');
const taxYearInput = form.elements.taxYear;
const incomeTypes = {
  dividends: 'Dividendes',
  interest: 'Intérêts',
  royalties: 'Redevances',
  other: 'Autre revenu',
};

let reportJson = '';
taxYearInput.max = new Date().getFullYear();

form.addEventListener('submit', (event) => {
  event.preventDefault();
  statusText.className = 'status';
  statusText.textContent = '';

  const formData = new FormData(form);
  const withheldAmount = Number(formData.get('withheldAmount'));
  const claimAmount = Number(formData.get('claimAmount'));

  if (claimAmount > withheldAmount) {
    statusText.classList.add('error');
    statusText.textContent = 'Le montant demandé ne peut pas dépasser l’impôt retenu à la source.';
    form.elements.claimAmount.focus();
    return;
  }

  const document = form.elements.document.files[0];
  if (document && !['application/pdf', 'image/jpeg', 'image/png'].includes(document.type)) {
    statusText.classList.add('error');
    statusText.textContent = 'Veuillez sélectionner un fichier PDF, JPG ou PNG.';
    form.elements.document.focus();
    return;
  }

  const report = {
    schemaVersion: '1.0',
    reportType: 'withholding-tax-reclaim',
    generatedAt: new Date().toISOString(),
    applicant: {
      firstName: formData.get('firstName').trim(),
      lastName: formData.get('lastName').trim(),
      email: formData.get('email').trim(),
      taxResidenceCountry: formData.get('country').trim(),
      taxIdentificationNumber: formData.get('taxNumber').trim(),
    },
    claim: {
      taxYear: Number(formData.get('taxYear')),
      incomeType: formData.get('incomeType'),
      sourceCountry: formData.get('sourceCountry').trim(),
      currency: 'EUR',
      grossIncomeAmount: Number(formData.get('grossAmount')),
      withholdingTaxAmount: withheldAmount,
      requestedRefundAmount: claimAmount,
      reason: formData.get('reason').trim(),
    },
    supportingDocument: document
      ? { provided: true, filename: document.name }
      : { provided: false },
  };

  reportJson = JSON.stringify(report, null, 2);
  renderSummary(report);
  reportResult.hidden = false;
  reportResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
  statusText.classList.add('success');
  statusText.textContent = 'Rapport généré. Aucune information n’a été transmise.';
});

downloadButton.addEventListener('click', () => {
  if (!reportJson) return;

  const file = new Blob([reportJson], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rapport-reclaim-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

function renderSummary(report) {
  const rows = [
    ['Demandeur', `${report.applicant.firstName} ${report.applicant.lastName}`],
    ['Année fiscale', String(report.claim.taxYear)],
    ['Revenu', incomeTypes[report.claim.incomeType]],
    ['Pays source', report.claim.sourceCountry],
    [
      'Montant demandé',
      new Intl.NumberFormat('fr-FR', { style: 'currency', currency: report.claim.currency }).format(
        report.claim.requestedRefundAmount,
      ),
    ],
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
