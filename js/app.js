

  // Wait for jsPDF to load
  window.addEventListener('load', function() {
  initializeApp();
});

  function initializeApp() {
  // State management
  let intervalId = null;
  let logs = [];
  let stats = {
  total: 0,
  success: 0,
  failed: 0,
  responseTimes: []
};

  // DOM elements
  const urlInput = document.getElementById('url');
  const intervalInput = document.getElementById('interval');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const resetBtn = document.getElementById('resetBtn');
  const statusBanner = document.getElementById('statusBanner');
  const statusText = document.getElementById('statusText');
  const lastPing = document.getElementById('lastPing');
  const nextPing = document.getElementById('nextPing');
  const totalPings = document.getElementById('totalPings');
  const successPings = document.getElementById('successPings');
  const failedPings = document.getElementById('failedPings');
  const avgResponse = document.getElementById('avgResponse');
  const successRate = document.getElementById('successRate');
  const failedRate = document.getElementById('failedRate');
  const uptimePercent = document.getElementById('uptimePercent');
  const logContainer = document.getElementById('logContainer');
  const clearLogsBtn = document.getElementById('clearLogsBtn');
  const exportBtn = document.getElementById('exportBtn');
  const exportModal = document.getElementById('exportModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const uptimeBar = document.getElementById('uptimeBar');
  const uptimeSuccess = document.getElementById('uptimeSuccess');
  const uptimeFailed = document.getElementById('uptimeFailed');

  // Load saved data
  function loadData() {
  const savedLogs = localStorage.getItem('pingerLogs');
  const savedStats = localStorage.getItem('pingerStats');

  if (savedLogs) {
  logs = JSON.parse(savedLogs);
  renderLogs();
}

  if (savedStats) {
  stats = JSON.parse(savedStats);
  updateUI();
}
}

  // Save data
  function saveData() {
  localStorage.setItem('pingerLogs', JSON.stringify(logs));
  localStorage.setItem('pingerStats', JSON.stringify(stats));
}

  // Add log entry
  function addLog(message, type = 'info', responseTime = null) {
  const timestamp = new Date();
  const log = {
  timestamp,
  message,
  type,
  responseTime
};

  logs.unshift(log);

  // Keep only last 1000 logs in memory
  if (logs.length > 1000) {
  logs = logs.slice(0, 1000);
}

  saveData();
  renderLogs();
}

  // Render logs
  function renderLogs() {
  logContainer.innerHTML = logs.map(log => {
  const time = log.timestamp.toLocaleTimeString();
  const responseInfo = log.responseTime ? ` (${log.responseTime}ms)` : '';
  return `
          <div class="log-entry log-${log.type}">
            <span class="timestamp">[${time}]</span>
            <span>${log.message}${responseInfo}</span>
          </div>
        `;
}).join('');
}

  // Update UI
  function updateUI() {
  totalPings.textContent = stats.total;
  successPings.textContent = stats.success;
  failedPings.textContent = stats.failed;

  const successRateVal = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : 100;
  const failedRateVal = stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(1) : 0;

  successRate.textContent = `${successRateVal}% success rate`;
  failedRate.textContent = `${failedRateVal}% failure rate`;
  uptimePercent.textContent = `${successRateVal}%`;

  const avgResp = stats.responseTimes.length > 0
  ? Math.round(stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length)
  : 0;
  avgResponse.textContent = `${avgResp}ms`;

  // Update uptime bar
  if (stats.total > 0) {
  const successWidth = (stats.success / stats.total) * 100;
  uptimeBar.innerHTML = `
          <div class="uptime-segment uptime-success" style="width: ${successWidth}%"></div>
          <div class="uptime-segment uptime-error" style="width: ${100 - successWidth}%"></div>
        `;
}

  uptimeSuccess.textContent = stats.success;
  uptimeFailed.textContent = stats.failed;
}

  // Update next ping time
  function updateNextPing() {
  const minutes = parseInt(intervalInput.value);
  const nextTime = new Date(Date.now() + minutes * 60000);
  nextPing.textContent = nextTime.toLocaleTimeString();
}

  // Ping backend
  async function pingBackend() {
  const url = urlInput.value.trim();

  if (!url) {
  addLog('No URL provided', 'error');
  return;
}

  stats.total++;

  try {
  addLog(`Pinging ${url}...`, 'info');
  const startTime = Date.now();

  const response = await fetch(url, {
  method: 'GET',
  mode: 'no-cors'
});

  const responseTime = Date.now() - startTime;
  stats.responseTimes.push(responseTime);

  // Keep only last 100 response times
  if (stats.responseTimes.length > 100) {
  stats.responseTimes = stats.responseTimes.slice(-100);
}

  stats.success++;
  addLog(`Ping successful`, 'success', responseTime);

} catch (error) {
  stats.failed++;
  addLog(`Ping failed: ${error.message}`, 'error');
}

  lastPing.textContent = new Date().toLocaleTimeString();
  updateUI();
  updateNextPing();
  saveData();
}

  // Start monitoring
  startBtn.addEventListener('click', () => {
  const url = urlInput.value.trim();

  if (!url) {
  alert('Please enter a valid URL');
  return;
}

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
  alert('URL must start with http:// or https://');
  return;
}

  const minutes = parseInt(intervalInput.value);

  if (minutes < 1 || minutes > 60) {
  alert('Interval must be between 1 and 60 minutes');
  return;
}

  // Ping immediately
  pingBackend();

  // Set up interval
  intervalId = setInterval(pingBackend, minutes * 60000);

  // Update UI
  startBtn.disabled = true;
  stopBtn.disabled = false;
  urlInput.disabled = true;
  intervalInput.disabled = true;
  statusBanner.classList.add('active');
  statusText.textContent = `Monitoring Active (${minutes}min intervals)`;

  addLog(`Monitoring started - Pinging every ${minutes} minute(s)`, 'success');
  updateNextPing();
});

  // Stop monitoring
  stopBtn.addEventListener('click', () => {
  if (intervalId) {
  clearInterval(intervalId);
  intervalId = null;
}

  startBtn.disabled = false;
  stopBtn.disabled = true;
  urlInput.disabled = false;
  intervalInput.disabled = false;
  statusBanner.classList.remove('active');
  statusText.textContent = 'System Idle';
  nextPing.textContent = '-';

  addLog('Monitoring stopped', 'warning');
});

  // Reset stats
  resetBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to reset all statistics? This action cannot be undone.')) {
  stats = {
  total: 0,
  success: 0,
  failed: 0,
  responseTimes: []
};
  logs = [];
  saveData();
  updateUI();
  renderLogs();
  addLog('Statistics reset', 'info');
}
});

  // Clear logs
  clearLogsBtn.addEventListener('click', () => {
  if (confirm('Clear all logs? This action cannot be undone.')) {
  logs = [];
  saveData();
  renderLogs();
  addLog('Logs cleared', 'info');
}
});

  // Export modal
  exportBtn.addEventListener('click', () => {
  exportModal.classList.add('active');
});

  closeModalBtn.addEventListener('click', () => {
  exportModal.classList.remove('active');
});

  exportModal.addEventListener('click', (e) => {
  if (e.target === exportModal) {
  exportModal.classList.remove('active');
}
});

  // Export functionality
  document.querySelectorAll('.export-option').forEach(option => {
  option.addEventListener('click', () => {
  const range = option.dataset.range;
  exportLogs(range);
  exportModal.classList.remove('active');
});
});

  function exportLogs(range) {
  const now = Date.now();
  let filteredLogs = logs;
  let rangeLabel = 'All Time';

  // Filter logs based on range
  const ranges = {
  '24h': { ms: 24 * 60 * 60 * 1000, label: 'Last 24 Hours' },
  '7d': { ms: 7 * 24 * 60 * 60 * 1000, label: 'Last 7 Days' },
  '14d': { ms: 14 * 24 * 60 * 60 * 1000, label: 'Last 2 Weeks' },
  '30d': { ms: 30 * 24 * 60 * 60 * 1000, label: 'Last Month' },
  '90d': { ms: 90 * 24 * 60 * 60 * 1000, label: 'Last 3 Months' },
  '180d': { ms: 180 * 24 * 60 * 60 * 1000, label: 'Last 6 Months' },
  '365d': { ms: 365 * 24 * 60 * 60 * 1000, label: 'Last Year' }
};

  if (range !== 'all' && ranges[range]) {
  const cutoff = now - ranges[range].ms;
  filteredLogs = logs.filter(log => new Date(log.timestamp).getTime() >= cutoff);
  rangeLabel = ranges[range].label;
}

  if (filteredLogs.length === 0) {
  alert('No logs found for this time range.');
  return;
}

  // Calculate statistics for filtered logs
  const exportStats = {
  total: filteredLogs.length,
  success: filteredLogs.filter(l => l.type === 'success').length,
  failed: filteredLogs.filter(l => l.type === 'error').length,
  info: filteredLogs.filter(l => l.type === 'info').length,
  warning: filteredLogs.filter(l => l.type === 'warning').length
};

  const responseTimes = filteredLogs
  .filter(l => l.responseTime)
  .map(l => l.responseTime);

  const avgResponseTime = responseTimes.length > 0
  ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
  : 0;

  const successRate = exportStats.total > 0
  ? ((exportStats.success / exportStats.total) * 100).toFixed(2)
  : 0;

  // Create PDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let yPos = 20;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const lineHeight = 7;

  // Helper function to check if we need a new page
  function checkPageBreak() {
  if (yPos > pageHeight - 30) {
  doc.addPage();
  yPos = 20;
}
}

  // Title
  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138);
  doc.text('Backend Pinger Pro', margin, yPos);
  yPos += 10;

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('Uptime Monitoring Report', margin, yPos);
  yPos += 15;

  // Header info
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Export Date: ${new Date().toLocaleString()}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`Time Range: ${rangeLabel}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`Backend URL: ${urlInput.value}`, margin, yPos);
  yPos += 12;

  // Statistics Section
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138);
  doc.text('Summary Statistics', margin, yPos);
  yPos += 10;

  // Draw statistics box
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, yPos - 5, 170, 50, 'F');

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);

  const statsY = yPos;
  doc.text(`Total Pings: ${exportStats.total}`, margin + 5, statsY);
  yPos += lineHeight;
  doc.text(`Successful: ${exportStats.success} (${successRate}%)`, margin + 5, yPos);
  yPos += lineHeight;
  doc.text(`Failed: ${exportStats.failed}`, margin + 5, yPos);
  yPos += lineHeight;
  doc.text(`Info Messages: ${exportStats.info}`, margin + 5, yPos);
  yPos += lineHeight;
  doc.text(`Warnings: ${exportStats.warning}`, margin + 5, yPos);
  yPos += lineHeight;
  doc.text(`Average Response Time: ${avgResponseTime}ms`, margin + 5, yPos);
  yPos += 15;

  checkPageBreak();

  // Detailed Logs Section
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138);
  doc.text('Detailed Logs', margin, yPos);
  yPos += 10;

  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);

  // Add logs with color coding
  filteredLogs.forEach((log, index) => {
  checkPageBreak();

  const timestamp = new Date(log.timestamp).toLocaleString();
  const responseInfo = log.responseTime ? ` [${log.responseTime}ms]` : '';

  // Set color based on log type
  switch(log.type) {
  case 'success':
  doc.setTextColor(34, 197, 94);
  break;
  case 'error':
  doc.setTextColor(239, 68, 68);
  break;
  case 'warning':
  doc.setTextColor(245, 158, 11);
  break;
  default:
  doc.setTextColor(59, 130, 246);
}

  // Draw log entry with background
  if (index % 2 === 0) {
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, yPos - 4, 170, lineHeight, 'F');
}

  const logText = `${timestamp} | ${log.type.toUpperCase()} | ${log.message}${responseInfo}`;
  const splitText = doc.splitTextToSize(logText, 170);

  splitText.forEach(line => {
  checkPageBreak();
  doc.text(line, margin + 2, yPos);
  yPos += lineHeight;
});
});

  // Footer on last page
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
  doc.setPage(i);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
  `Page ${i} of ${totalPages} | Generated by Backend Pinger Pro`,
  margin,
  pageHeight - 10
  );
}

  // Save PDF
  doc.save(`pinger-report-${range}-${Date.now()}.pdf`);

  addLog(`PDF report exported: ${rangeLabel} (${filteredLogs.length} entries)`, 'info');
}

  // Load saved data
  function loadData() {
  const savedLogs = localStorage.getItem('pingerLogs');
  const savedStats = localStorage.getItem('pingerStats');

  if (savedLogs) {
  logs = JSON.parse(savedLogs);
  renderLogs();
}

  if (savedStats) {
  stats = JSON.parse(savedStats);
  updateUI();
}
}

  // Save data
  function saveData() {
  localStorage.setItem('pingerLogs', JSON.stringify(logs));
  localStorage.setItem('pingerStats', JSON.stringify(stats));
}

  // Add log entry
  function addLog(message, type = 'info', responseTime = null) {
  const timestamp = new Date();
  const log = {
  timestamp,
  message,
  type,
  responseTime
};

  logs.unshift(log);

  // Keep only last 1000 logs in memory
  if (logs.length > 1000) {
  logs = logs.slice(0, 1000);
}

  saveData();
  renderLogs();
}

  // Render logs
  function renderLogs() {
  logContainer.innerHTML = logs.map(log => {
  const time = new Date(log.timestamp).toLocaleTimeString();
  const responseInfo = log.responseTime ? ` (${log.responseTime}ms)` : '';
  return `
            <div class="log-entry log-${log.type}">
              <span class="timestamp">[${time}]</span>
              <span>${log.message}${responseInfo}</span>
            </div>
          `;
}).join('');
}

  // Update UI
  function updateUI() {
  totalPings.textContent = stats.total;
  successPings.textContent = stats.success;
  failedPings.textContent = stats.failed;

  const successRateVal = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : 100;
  const failedRateVal = stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(1) : 0;

  successRate.textContent = `${successRateVal}% success rate`;
  failedRate.textContent = `${failedRateVal}% failure rate`;
  uptimePercent.textContent = `${successRateVal}%`;

  const avgResp = stats.responseTimes.length > 0
  ? Math.round(stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length)
  : 0;
  avgResponse.textContent = `${avgResp}ms`;

  // Update uptime bar
  if (stats.total > 0) {
  const successWidth = (stats.success / stats.total) * 100;
  uptimeBar.innerHTML = `
            <div class="uptime-segment uptime-success" style="width: ${successWidth}%"></div>
            <div class="uptime-segment uptime-error" style="width: ${100 - successWidth}%"></div>
          `;
}

  uptimeSuccess.textContent = stats.success;
  uptimeFailed.textContent = stats.failed;
}

  // Update next ping time
  function updateNextPing() {
  const minutes = parseInt(intervalInput.value);
  const nextTime = new Date(Date.now() + minutes * 60000);
  nextPing.textContent = nextTime.toLocaleTimeString();
}

  // Ping backend
  async function pingBackend() {
  const url = urlInput.value.trim();

  if (!url) {
  addLog('No URL provided', 'error');
  return;
}

  stats.total++;

  try {
  addLog(`Pinging ${url}...`, 'info');
  const startTime = Date.now();

  const response = await fetch(url, {
  method: 'GET',
  mode: 'no-cors'
});

  const responseTime = Date.now() - startTime;
  stats.responseTimes.push(responseTime);

  // Keep only last 100 response times
  if (stats.responseTimes.length > 100) {
  stats.responseTimes = stats.responseTimes.slice(-100);
}

  stats.success++;
  addLog(`Ping successful`, 'success', responseTime);

} catch (error) {
  stats.failed++;
  addLog(`Ping failed: ${error.message}`, 'error');
}

  lastPing.textContent = new Date().toLocaleTimeString();
  updateUI();
  updateNextPing();
  saveData();
}

  // Start monitoring
  startBtn.addEventListener('click', () => {
  const url = urlInput.value.trim();

  if (!url) {
  alert('Please enter a valid URL');
  return;
}

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
  alert('URL must start with http:// or https://');
  return;
}

  const minutes = parseInt(intervalInput.value);

  if (minutes < 1 || minutes > 60) {
  alert('Interval must be between 1 and 60 minutes');
  return;
}

  // Ping immediately
  pingBackend();

  // Set up interval
  intervalId = setInterval(pingBackend, minutes * 60000);

  // Update UI
  startBtn.disabled = true;
  stopBtn.disabled = false;
  urlInput.disabled = true;
  intervalInput.disabled = true;
  statusBanner.classList.add('active');
  statusText.textContent = `Monitoring Active (${minutes}min intervals)`;

  addLog(`Monitoring started - Pinging every ${minutes} minute(s)`, 'success');
  updateNextPing();
});

  // Stop monitoring
  stopBtn.addEventListener('click', () => {
  if (intervalId) {
  clearInterval(intervalId);
  intervalId = null;
}

  startBtn.disabled = false;
  stopBtn.disabled = true;
  urlInput.disabled = false;
  intervalInput.disabled = false;
  statusBanner.classList.remove('active');
  statusText.textContent = 'System Idle';
  nextPing.textContent = '-';

  addLog('Monitoring stopped', 'warning');
});

  // Reset stats
  resetBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to reset all statistics? This action cannot be undone.')) {
  stats = {
  total: 0,
  success: 0,
  failed: 0,
  responseTimes: []
};
  logs = [];
  saveData();
  updateUI();
  renderLogs();
  addLog('Statistics reset', 'info');
}
});

  // Clear logs
  clearLogsBtn.addEventListener('click', () => {
  if (confirm('Clear all logs? This action cannot be undone.')) {
  logs = [];
  saveData();
  renderLogs();
  addLog('Logs cleared', 'info');
}
});

  // Export modal
  exportBtn.addEventListener('click', () => {
  exportModal.classList.add('active');
});

  closeModalBtn.addEventListener('click', () => {
  exportModal.classList.remove('active');
});

  exportModal.addEventListener('click', (e) => {
  if (e.target === exportModal) {
  exportModal.classList.remove('active');
}
});

  // Export functionality
  document.querySelectorAll('.export-option').forEach(option => {
  option.addEventListener('click', () => {
  const range = option.dataset.range;
  exportLogs(range);
  exportModal.classList.remove('active');
});
});

  function exportLogs(range) {
  const now = Date.now();
  let filteredLogs = logs;
  let rangeLabel = 'All Time';

  // Filter logs based on range
  const ranges = {
  '24h': { ms: 24 * 60 * 60 * 1000, label: 'Last 24 Hours' },
  '7d': { ms: 7 * 24 * 60 * 60 * 1000, label: 'Last 7 Days' },
  '14d': { ms: 14 * 24 * 60 * 60 * 1000, label: 'Last 2 Weeks' },
  '30d': { ms: 30 * 24 * 60 * 60 * 1000, label: 'Last Month' },
  '90d': { ms: 90 * 24 * 60 * 60 * 1000, label: 'Last 3 Months' },
  '180d': { ms: 180 * 24 * 60 * 60 * 1000, label: 'Last 6 Months' },
  '365d': { ms: 365 * 24 * 60 * 60 * 1000, label: 'Last Year' }
};

  if (range !== 'all' && ranges[range]) {
  const cutoff = now - ranges[range].ms;
  filteredLogs = logs.filter(log => new Date(log.timestamp).getTime() >= cutoff);
  rangeLabel = ranges[range].label;
}

  if (filteredLogs.length === 0) {
  alert('No logs found for this time range.');
  return;
}


  // Calculate statistics for filtered logs
  const exportStats = {
  total: filteredLogs.length,
  success: filteredLogs.filter(l => l.type === 'success').length,
  failed: filteredLogs.filter(l => l.type === 'error').length,
  info: filteredLogs.filter(l => l.type === 'info').length,
  warning: filteredLogs.filter(l => l.type === 'warning').length
};

  const responseTimes = filteredLogs
  .filter(l => l.responseTime)
  .map(l => l.responseTime);

  const avgResponseTime = responseTimes.length > 0
  ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
  : 0;

  const successRate = exportStats.total > 0
  ? ((exportStats.success / exportStats.total) * 100).toFixed(2)
  : 0;

  // Create PDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let yPos = 20;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const lineHeight = 7;

  // Helper function to check if we need a new page
  function checkPageBreak() {
  if (yPos > pageHeight - 30) {
  doc.addPage();
  yPos = 20;
}
}

  // Title
  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138);
  doc.text('Backend Pinger Pro', margin, yPos);
  yPos += 10;

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('Uptime Monitoring Report', margin, yPos);
  yPos += 15;

  // Header info
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Export Date: ${new Date().toLocaleString()}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`Time Range: ${rangeLabel}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`Backend URL: ${urlInput.value}`, margin, yPos);
  yPos += 12;

  // Statistics Section
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138);
  doc.text('Summary Statistics', margin, yPos);
  yPos += 10;

  // Draw statistics box
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, yPos - 5, 170, 50, 'F');

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);

  const statsY = yPos;
  doc.text(`Total Pings: ${exportStats.total}`, margin + 5, statsY);
  yPos += lineHeight;
  doc.text(`Successful: ${exportStats.success} (${successRate}%)`, margin + 5, yPos);
  yPos += lineHeight;
  doc.text(`Failed: ${exportStats.failed}`, margin + 5, yPos);
  yPos += lineHeight;
  doc.text(`Info Messages: ${exportStats.info}`, margin + 5, yPos);
  yPos += lineHeight;
  doc.text(`Warnings: ${exportStats.warning}`, margin + 5, yPos);
  yPos += lineHeight;
  doc.text(`Average Response Time: ${avgResponseTime}ms`, margin + 5, yPos);
  yPos += 15;

  checkPageBreak();

  // Detailed Logs Section
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138);
  doc.text('Detailed Logs', margin, yPos);
  yPos += 10;

  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);

  // Add logs with color coding
  filteredLogs.forEach((log, index) => {
  checkPageBreak();

  const timestamp = new Date(log.timestamp).toLocaleString();
  const responseInfo = log.responseTime ? ` [${log.responseTime}ms]` : '';

  // Set color based on log type
  switch(log.type) {
  case 'success':
  doc.setTextColor(34, 197, 94);
  break;
  case 'error':
  doc.setTextColor(239, 68, 68);
  break;
  case 'warning':
  doc.setTextColor(245, 158, 11);
  break;
  default:
  doc.setTextColor(59, 130, 246);
}

  // Draw log entry with background
  if (index % 2 === 0) {
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, yPos - 4, 170, lineHeight, 'F');
}

  const logText = `${timestamp} | ${log.type.toUpperCase()} | ${log.message}${responseInfo}`;
  const splitText = doc.splitTextToSize(logText, 170);

  splitText.forEach(line => {
  checkPageBreak();
  doc.text(line, margin + 2, yPos);
  yPos += lineHeight;
});
});

  // Footer on last page
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
  doc.setPage(i);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
  `Page ${i} of ${totalPages} | Generated by Backend Pinger Pro`,
  margin,
  pageHeight - 10
  );
}

  // Save PDF
  doc.save(`pinger-report-${range}-${Date.now()}.pdf`);

  addLog(`PDF report exported: ${rangeLabel} (${filteredLogs.length} entries)`, 'info');
}

  // Initialize
  loadData();

  // Auto-save periodically
  setInterval(saveData, 30000); // Save every 30 seconds
}
