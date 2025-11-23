// Backend Pinger Pro - AUTO-START VERSION (Fixed Scope Error)
window.addEventListener('load', function() {
  initializeApp();
});

// GLOBAL: Auto-start function (moved outside for scope access)
function autoStartPinger(initializeState) {
  // Use passed state to avoid re-init
  const { urlInput, intervalInput, startBtn, stopBtn, statusBanner, statusText, addLog, updateNextPing, pingBackend } = initializeState;
  const url = urlInput.value.trim();
  const minutes = 1; // 1-min for Render
  intervalInput.value = minutes; // Sync UI

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.error('Invalid URL—fix in HTML');
    return;
  }

  // Initial ping
  pingBackend();

  // Set interval (global intervalId from state)
  if (window.pingerIntervalId) clearInterval(window.pingerIntervalId); // Prevent dupes
  window.pingerIntervalId = setInterval(pingBackend, minutes * 60000);

  // UI updates
  startBtn.disabled = true;
  stopBtn.disabled = false;
  urlInput.disabled = true;
  intervalInput.disabled = true;
  statusBanner.classList.add('active');
  statusText.textContent = `Auto-Monitoring Active (${minutes}min intervals)`;
  addLog(`🚀 Auto-ping started - Keeping ${url} awake every ${minutes} min`, 'success');
  console.log(`🚀 Auto-ping started: ${url} every ${minutes} min`);
  updateNextPing();
}

// Main init function
function initializeApp() {
  // State management
  let intervalId = null;
  let logs = [];
  let stats = { total: 0, success: 0, failed: 0, responseTimes: [] };
  window.pingerIntervalId = null; // Global for auto-stop

  // DOM elements (unchanged)
  const urlInput = document.getElementById('url');
  const intervalInput = document.getElementById('interval');
  const emailInput = document.getElementById('email');
  const emailServiceSelect = document.getElementById('emailService');
  const resendApiKeyInput = document.getElementById('resendApiKey');
  const fromEmailInput = document.getElementById('fromEmail');
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

  // Pass state to auto-starter
  const initState = {
    urlInput, intervalInput, startBtn, stopBtn, statusBanner, statusText,
    addLog, updateNextPing, pingBackend // Functions from below
  };

  // Auto-start after 2s (now with state)
  setTimeout(() => autoStartPinger(initState), 2000);

  // Load saved data (unchanged)
  function loadData() {
    const savedLogs = localStorage.getItem('pingerLogs');
    const savedStats = localStorage.getItem('pingerStats');
    if (savedLogs) { logs = JSON.parse(savedLogs); renderLogs(); }
    if (savedStats) { stats = JSON.parse(savedStats); updateUI(); }
  }

  // Save data (unchanged)
  function saveData() {
    localStorage.setItem('pingerLogs', JSON.stringify(logs));
    localStorage.setItem('pingerStats', JSON.stringify(stats));
  }

  // Add log entry (unchanged, with console)
  function addLog(message, type = 'info', responseTime = null) {
    const timestamp = new Date();
    const log = { timestamp, message, type, responseTime };
    logs.unshift(log);
    if (logs.length > 1000) { logs = logs.slice(0, 1000); }
    console.log(`[${timestamp.toLocaleTimeString()}] ${type.toUpperCase()}: ${message}`);
    saveData();
    renderLogs();
  }

  // Render logs (unchanged)
  function renderLogs() {
    logContainer.innerHTML = logs.map(log => {
      const time = log.timestamp.toLocaleTimeString();
      const responseInfo = log.responseTime ? ` (${log.responseTime}ms)` : '';
      return `<div class="log-entry log-${log.type}"><span class="timestamp">[${time}]</span><span>${log.message}${responseInfo}</span></div>`;
    }).join('');
  }

  // Update UI (unchanged)
  function updateUI() {
    totalPings.textContent = stats.total;
    successPings.textContent = stats.success;
    failedPings.textContent = stats.failed;
    const successRateVal = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : 100;
    const failedRateVal = stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(1) : 0;
    successRate.textContent = `${successRateVal}% success rate`;
    failedRate.textContent = `${failedRateVal}% failure rate`;
    uptimePercent.textContent = `${successRateVal}%`;
    const avgResp = stats.responseTimes.length > 0 ? Math.round(stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length) : 0;
    avgResponse.textContent = `${avgResp}ms`;
    if (stats.total > 0) {
      const successWidth = (stats.success / stats.total) * 100;
      uptimeBar.innerHTML = `<div class="uptime-segment uptime-success" style="width: ${successWidth}%"></div><div class="uptime-segment uptime-error" style="width: ${100 - successWidth}%"></div>`;
    }
    uptimeSuccess.textContent = stats.success;
    uptimeFailed.textContent = stats.failed;
  }

  // Update next ping time (unchanged)
  function updateNextPing() {
    const minutes = parseInt(intervalInput.value);
    const nextTime = new Date(Date.now() + minutes * 60000);
    nextPing.textContent = nextTime.toLocaleTimeString();
  }

  // Send email notification (unchanged—omitted for brevity, copy from previous if needed)

  // Ping backend (unchanged, with console)
  async function pingBackend() {
    const url = urlInput.value.trim();
    if (!url) { addLog('No URL provided', 'error'); return; }
    stats.total++;
    try {
      addLog(`Pinging ${url}...`, 'info');
      const startTime = Date.now();
      const response = await fetch(url, { method: 'GET', mode: 'no-cors' });
      const responseTime = Date.now() - startTime;
      stats.responseTimes.push(responseTime);
      if (stats.responseTimes.length > 100) { stats.responseTimes = stats.responseTimes.slice(-100); }
      stats.success++;
      addLog(`Ping successful`, 'success', responseTime);
      console.log(`✅ Ping OK: ${url} in ${responseTime}ms`);
    } catch (error) {
      stats.failed++;
      const errorMsg = error.message || 'Unknown error';
      addLog(`Ping failed: ${errorMsg}`, 'error');
      console.error(`❌ Ping FAIL: ${url} - ${errorMsg}`);
      // await sendEmailNotification(errorMsg); // Uncomment if email setup
    }
    lastPing.textContent = new Date().toLocaleTimeString();
    updateUI();
    updateNextPing();
    saveData();
  }

  // Manual start (updated to use global interval, warn if auto-running)
  startBtn.addEventListener('click', () => {
    if (window.pingerIntervalId) {
      addLog('Already auto-running—ignore or stop first', 'warning');
      console.warn('Pinger already active');
      return;
    }
    const url = urlInput.value.trim();
    const minutes = parseInt(intervalInput.value);
    if (!url || minutes < 1 || minutes > 60) { alert('Invalid URL or interval'); return; }
    pingBackend();
    intervalId = setInterval(pingBackend, minutes * 60000);
    window.pingerIntervalId = intervalId; // Sync global
    startBtn.disabled = true;
    stopBtn.disabled = false;
    urlInput.disabled = true;
    intervalInput.disabled = true;
    statusBanner.classList.add('active');
    statusText.textContent = `Manual Monitoring Active (${minutes}min)`;
    addLog(`Manual start - Pinging every ${minutes} min`, 'success');
    updateNextPing();
  });

  // Manual stop (updated for global)
  stopBtn.addEventListener('click', () => {
    if (intervalId) clearInterval(intervalId);
    if (window.pingerIntervalId) clearInterval(window.pingerIntervalId);
    intervalId = null;
    window.pingerIntervalId = null;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    urlInput.disabled = false;
    intervalInput.disabled = false;
    statusBanner.classList.remove('active');
    statusText.textContent = 'System Idle';
    nextPing.textContent = '-';
    addLog('Monitoring stopped', 'warning');
    console.log('⏸ Stopped');
  });

  // Other listeners (reset, clear, export—unchanged, omitted for brevity; copy from your original)

  // Initialize
  loadData();
  setInterval(saveData, 30000);
}
