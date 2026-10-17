const form = document.getElementById('taxReclaimForm');
const statusText = document.getElementById('status');

form.addEventListener('submit', (event) => {
  event.preventDefault();

  statusText.className = 'status';
  statusText.textContent = '';

  if (!form.checkValidity()) {
    statusText.classList.add('error');
    statusText.textContent = 'Veuillez compléter tous les champs obligatoires.';
    form.reportValidity();
    return;
  }

  const formData = new FormData(form);
  const payload = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    country: formData.get('country'),
    taxNumber: formData.get('taxNumber'),
    amount: formData.get('amount'),
    reason: formData.get('reason'),
    documentName: formData.get('document')?.name || null,
    submittedAt: new Date().toISOString(),
  };

  // Démo front-only: ici vous brancherez un endpoint API.
  console.log('Tax reclaim payload:', payload);

  statusText.classList.add('success');
  statusText.textContent = 'Votre demande a été soumise avec succès (mode démo).';

  form.reset();
});
