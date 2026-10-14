const API = '/api/opportunities';
const FIELDS = ['title', 'description', 'research_area', 'faculty_name', 'department',
                'required_skills', 'available_positions', 'application_deadline', 'status'];
const LABELS = {
  title: 'Research Title', description: 'Description', research_area: 'Research Area',
  faculty_name: 'Faculty Member', department: 'Department', required_skills: 'Required Skills',
  available_positions: 'Available Positions', application_deadline: 'Application Deadline', status: 'Status'
};

const $ = (id) => document.getElementById(id);
const form = $('oppForm');
let editingId = null;
let msgTimer = null;

/* ---------- helpers ---------- */
function el(tag, props = {}, ...children) {
  const e = document.createElement(tag);
  Object.assign(e, props);
  children.forEach((c) => e.append(c));
  return e;
}

function showMsg(text, type) {
  const box = $('msg');
  box.textContent = text;
  box.className = 'msg ' + type;
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => box.classList.add('hidden'), 6000);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function errText(e) {
  return e.details && e.details.length ? `${e.message}: ${e.details.join('; ')}` : e.message;
}

async function api(url, options = {}) {
  let res;
  try {
    res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?');
  }
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    err.details = data && data.details;
    throw err;
  }
  return data;
}

/* ---------- list ---------- */
async function loadList() {
  const list = $('list');
  try {
    const items = await api(API);
    list.replaceChildren();
    if (!items.length) {
      list.append(el('div', { className: 'empty', textContent: 'No research opportunities yet. Click "+ New Opportunity" to add one.' }));
      return;
    }
    items.forEach((o) => list.append(renderItem(o)));
  } catch (e) {
    showMsg(errText(e), 'error');
  }
}

function renderItem(o) {
  const actions = el('div', { className: 'actions' },
    button('View', 'btn small', () => viewItem(o.id)),
    button('Edit', 'btn small', () => editItem(o.id)));
  if (o.status === 'Open') actions.append(button('Close', 'btn small', () => closeItem(o.id)));
  actions.append(button('Delete', 'btn small danger', () => deleteItem(o.id, o.title)));

  return el('div', { className: 'item' },
    el('div', { className: 'row-between' },
      el('h3', { textContent: o.title }),
      el('span', { className: 'badge ' + o.status, textContent: o.status })),
    el('div', { className: 'meta', textContent: `${o.faculty_name} • ${o.department} • ${o.research_area}` }),
    el('div', { className: 'meta', textContent: `Positions: ${o.available_positions} • Deadline: ${o.application_deadline}` }),
    actions);
}

function button(text, className, onClick) {
  return el('button', { type: 'button', className, textContent: text, onclick: onClick });
}

/* ---------- details ---------- */
async function viewItem(id) {
  try {
    const o = await api(`${API}/${id}`);
    const body = $('detailBody');
    body.replaceChildren(el('div', { className: 'detail-row' }, el('b', { textContent: 'ID' }), String(o.id)));
    FIELDS.forEach((f) => body.append(
      el('div', { className: 'detail-row' }, el('b', { textContent: LABELS[f] }), String(o[f]))));
    $('detailSection').classList.remove('hidden');
    $('detailSection').scrollIntoView({ behavior: 'smooth' });
  } catch (e) {
    showMsg(errText(e), 'error');
    if (e.status === 404) loadList();
  }
}

/* ---------- form (create / update) ---------- */
function clearErrors() {
  form.querySelectorAll('.err').forEach((s) => (s.textContent = ''));
  form.querySelectorAll('.invalid').forEach((i) => i.classList.remove('invalid'));
}

function openForm(o) {
  clearErrors();
  form.reset();
  editingId = o ? o.id : null;
  $('formTitle').textContent = o ? `Edit Opportunity #${o.id}` : 'New Research Opportunity';
  if (o) FIELDS.forEach((f) => (form.elements[f].value = o[f]));
  $('formSection').classList.remove('hidden');
  $('formSection').scrollIntoView({ behavior: 'smooth' });
}

function closeForm() {
  $('formSection').classList.add('hidden');
  editingId = null;
}

async function editItem(id) {
  try { openForm(await api(`${API}/${id}`)); }
  catch (e) { showMsg(errText(e), 'error'); if (e.status === 404) loadList(); }
}

function clientValidate(payload) {
  const errors = {};
  ['title', 'research_area', 'faculty_name', 'department', 'required_skills', 'description'].forEach((f) => {
    if (!payload[f]) errors[f] = `${LABELS[f]} is required`;
  });
  const n = Number(payload.available_positions);
  if (!payload.available_positions || !Number.isInteger(n) || n < 1) {
    errors.available_positions = 'Enter a whole number of 1 or more';
  }
  if (!payload.application_deadline) errors.application_deadline = 'Application deadline is required';
  return errors;
}

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  clearErrors();
  const payload = {};
  FIELDS.forEach((f) => (payload[f] = form.elements[f].value.trim()));

  const errors = clientValidate(payload);
  if (Object.keys(errors).length) {
    Object.entries(errors).forEach(([f, m]) => {
      form.querySelector(`[data-for="${f}"]`).textContent = m;
      form.elements[f].classList.add('invalid');
    });
    showMsg('Please fix the highlighted fields.', 'error');
    return;
  }
  payload.available_positions = Number(payload.available_positions);

  const saveBtn = $('saveBtn');
  saveBtn.disabled = true;
  try {
    if (editingId) {
      await api(`${API}/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      showMsg('Opportunity updated successfully.', 'success');
    } else {
      await api(API, { method: 'POST', body: JSON.stringify(payload) });
      showMsg('Opportunity created successfully.', 'success');
    }
    closeForm();
    loadList();
  } catch (e) {
    showMsg(errText(e), 'error');
  } finally {
    saveBtn.disabled = false;
  }
});

/* ---------- close / delete ---------- */
async function closeItem(id) {
  try {
    await api(`${API}/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'Closed' }) });
    showMsg('Opportunity closed.', 'success');
    loadList();
  } catch (e) { showMsg(errText(e), 'error'); if (e.status === 404) loadList(); }
}

async function deleteItem(id, title) {
  if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
  try {
    await api(`${API}/${id}`, { method: 'DELETE' });
    showMsg('Opportunity deleted.', 'success');
    $('detailSection').classList.add('hidden');
    loadList();
  } catch (e) { showMsg(errText(e), 'error'); if (e.status === 404) loadList(); }
}

/* ---------- wiring ---------- */
$('newBtn').onclick = () => openForm(null);
$('cancelBtn').onclick = closeForm;
$('closeDetail').onclick = () => $('detailSection').classList.add('hidden');
loadList();
