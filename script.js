/* ==============================================
   HEALTHCARE DASHBOARD - script.js
   Coalition Technologies Skills Test
   ============================================== */

const API_URL = 'https://fedskillstest.coalitiontechnologies.workers.dev';
const AUTH_TOKEN = btoa('coalition:skills-test');

// Patient avatar mapping (Layer files from zip, mapping by list order)
const PATIENT_AVATARS = [
  'assets/Layer 2.png',
  'assets/Layer 2-1.png',
  'assets/Layer 3.png',
  'assets/Layer 1.png',    // Jessica Taylor
  'assets/Layer 6.png',
  'assets/Layer 4.png',
  'assets/Layer 5.png',
  'assets/Layer 8.png',
  'assets/Layer 9.png',
  'assets/Layer 10.png',
  'assets/Layer 12.png',
  'assets/Layer 7.png',
];

let bpChart = null;

// ── FETCH ──────────────────────────────────────
async function fetchPatients() {
  const res = await fetch(API_URL, {
    headers: {
      Authorization: `Basic ${AUTH_TOKEN}`,
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ── INIT ───────────────────────────────────────
async function init() {
  try {
    const patients = await fetchPatients();

    renderPatientList(patients);

    const jessica = patients.find(p => p.name === 'Jessica Taylor');
    if (!jessica) {
      console.error('Jessica Taylor not found in API response');
      return;
    }

    renderProfile(jessica);
    renderVitals(jessica);
    renderDiagnosticList(jessica);
    renderLabResults(jessica);
    renderBPChart(jessica);
  } catch (err) {
    console.error('Failed to load data:', err);
  }
}

// ── PATIENT LIST ───────────────────────────────
function renderPatientList(patients) {
  const list = document.getElementById('patientList');
  list.innerHTML = '';

  patients.forEach((patient, idx) => {
    const li = document.createElement('li');
    li.className = 'patient-item' + (patient.name === 'Jessica Taylor' ? ' active' : '');

    const avatar = patient.profile_picture || PATIENT_AVATARS[idx % PATIENT_AVATARS.length];

    li.innerHTML = `
      <img class="patient-avatar" src="${avatar}" alt="${patient.name}"
           onerror="this.src='assets/Layer 1.png'" />
      <div class="patient-info">
        <div class="name">${patient.name}</div>
        <div class="meta">${patient.gender}, ${patient.age}</div>
      </div>
      <div class="patient-more">
        <img src="assets/more_horiz_FILL0_wght300_GRAD0_opsz24.svg" alt="more" />
      </div>
    `;

    list.appendChild(li);
  });
}

// ── PROFILE ────────────────────────────────────
function renderProfile(patient) {
  const photo = document.getElementById('patientPhoto');
  photo.src = patient.profile_picture || 'assets/Layer 1.png';
  photo.onerror = () => { photo.src = 'assets/Layer 1.png'; };

  document.getElementById('patientName').textContent = patient.name;
  document.getElementById('patientDOB').textContent = formatDate(patient.date_of_birth);
  document.getElementById('patientGender').textContent = patient.gender;

  // Update gender icon
  const genderIcon = document.getElementById('genderIcon');
  genderIcon.src = patient.gender === 'Male' ? 'assets/MaleIcon.svg' : 'assets/FemaleIcon.svg';

  document.getElementById('patientPhone').textContent = patient.phone_number || '--';
  document.getElementById('patientEmergency').textContent = patient.emergency_contact || '--';
  document.getElementById('patientInsurance').textContent = patient.insurance_type || '--';
}

// ── VITALS ─────────────────────────────────────
function renderVitals(patient) {
  // Get most recent diagnosis history entry
  const history = patient.diagnosis_history || [];
  const latest = history[0] || {};

  // Respiratory
  const resp = latest.respiratory_rate || {};
  document.getElementById('respiratoryRate').textContent =
    resp.value != null ? `${resp.value} bpm` : '-- bpm';
  document.getElementById('respiratoryStatus').textContent = resp.levels || 'Normal';

  // Temperature
  const temp = latest.temperature || {};
  document.getElementById('temperature').textContent =
    temp.value != null ? `${temp.value}°F` : '--°F';
  document.getElementById('temperatureStatus').textContent = temp.levels || 'Normal';

  // Heart Rate
  const heart = latest.heart_rate || {};
  document.getElementById('heartRate').textContent =
    heart.value != null ? `${heart.value} bpm` : '-- bpm';

  const heartStatus = document.getElementById('heartRateStatus');
  if (heart.levels) {
    const arrowSrc = heart.levels.toLowerCase().includes('lower')
      ? 'assets/ArrowDown.svg'
      : heart.levels.toLowerCase().includes('higher')
      ? 'assets/ArrowUp.svg'
      : '';
    heartStatus.innerHTML = arrowSrc
      ? `<img src="${arrowSrc}" alt="" /> ${heart.levels}`
      : heart.levels;
  }
}

// ── DIAGNOSTIC LIST ────────────────────────────
function renderDiagnosticList(patient) {
  const tbody = document.getElementById('diagnosticTable');
  tbody.innerHTML = '';

  const diagnoses = patient.diagnostic_list || [];

  diagnoses.forEach(d => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${d.name || '--'}</td>
      <td>${d.description || '--'}</td>
      <td><span class="status-badge">${d.status || '--'}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// ── LAB RESULTS ───────────────────────────────
function renderLabResults(patient) {
  const list = document.getElementById('labList');
  list.innerHTML = '';

  const labs = patient.lab_results || [];

  labs.forEach(lab => {
    const li = document.createElement('li');
    li.className = 'lab-item';
    li.innerHTML = `
      <span>${lab}</span>
      <button title="Download">
        <img src="assets/download_FILL0_wght300_GRAD0_opsz24 (1).svg" alt="Download" />
      </button>
    `;
    list.appendChild(li);
  });
}

// ── BLOOD PRESSURE CHART ───────────────────────
function renderBPChart(patient) {
  const history = patient.diagnosis_history || [];

  // Reverse to get chronological order, take last 6
  const last6 = [...history].reverse().slice(-6);

  const labels = last6.map(entry =>
    `${entry.month}, ${entry.year}`
  );

  const systolicData = last6.map(e => e.blood_pressure?.systolic?.value ?? null);
  const diastolicData = last6.map(e => e.blood_pressure?.diastolic?.value ?? null);

  // Latest values for the legend panel
  const latestBP = history[0]?.blood_pressure || {};
  const sysVal = latestBP.systolic?.value ?? '--';
  const sysLevel = latestBP.systolic?.levels || '';
  const diaVal = latestBP.diastolic?.value ?? '--';
  const diaLevel = latestBP.diastolic?.levels || '';

  document.getElementById('systolicValue').textContent = sysVal;
  document.getElementById('diastolicValue').textContent = diaVal;

  const sysTrend = document.getElementById('systolicTrend');
  const diaTrend = document.getElementById('diastolicTrend');

  sysTrend.innerHTML = renderTrend(sysLevel);
  diaTrend.innerHTML = renderTrend(diaLevel);

  // Destroy previous chart instance
  if (bpChart) {
    bpChart.destroy();
    bpChart = null;
  }

  const ctx = document.getElementById('bpChart').getContext('2d');

  bpChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Systolic',
          data: systolicData,
          borderColor: '#e66fd2',
          backgroundColor: 'rgba(230,111,210,0.12)',
          pointBackgroundColor: '#e66fd2',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          borderWidth: 2,
          tension: 0.4,
          fill: false,
        },
        {
          label: 'Diastolic',
          data: diastolicData,
          borderColor: '#8c6fe6',
          backgroundColor: 'rgba(140,111,230,0.08)',
          pointBackgroundColor: '#8c6fe6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          borderWidth: 2,
          tension: 0.4,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#072635',
          titleColor: '#fff',
          bodyColor: '#ccc',
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} mmHg`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: 'Manrope', size: 11 },
            color: '#707070',
          },
          border: { display: false },
        },
        y: {
          min: 60,
          max: 180,
          grid: {
            color: 'rgba(0,0,0,0.05)',
            drawBorder: false,
          },
          ticks: {
            stepSize: 20,
            font: { family: 'Manrope', size: 11 },
            color: '#707070',
          },
          border: { display: false },
        },
      },
    },
  });
}

// ── HELPERS ────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function renderTrend(level) {
  if (!level) return '';
  const lower = level.toLowerCase();
  if (lower.includes('higher')) {
    return `<img src="assets/ArrowUp.svg" alt="up" /> ${level}`;
  }
  if (lower.includes('lower')) {
    return `<img src="assets/ArrowDown.svg" alt="down" /> ${level}`;
  }
  return level;
}

// ── START ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
