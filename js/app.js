// Backend Pinger Pro - AUTO-START VERSION (Fixed Scope Error)
window.addEventListener('load', function() {
  initializeApp();
});

// GLOBAL: Auto-start function
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

// Helper function to convert logs to CSV
function convertToCSV(logs) {
  const headers = ['Timestamp', 'Type', 'Message', 'Response Time (ms)'];
  const rows = logs.map(log => {
    const timestamp = log.timestamp instanceof Date ? log.timestamp.toLocaleString() : new Date(log.timestamp).toLocaleString();
    const type = log.type;
    const message = log.message;
    const responseTime = log.responseTime || '';

    // Escape commas and quotes for CSV
    const escapeCSV = (str) => {
      if (str === undefined || str === null) return '';
      const string = String(str);
      if (string.includes(',') || string.includes('"') || string.includes('\n')) {
        return `"${string.replace(/"/g, '""')}"`;
      }
      return string;
    };

    return [timestamp, type, message, responseTime].map(escapeCSV).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

// Helper function to convert logs to PDF
async function convertToPDF(logs, range) {
  // Create PDF using jsPDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('landscape');

  // Add title
  doc.setFontSize(20);
  doc.setTextColor(99, 102, 241);
  doc.text('Backend Pinger Pro - Export Report', 20, 20);

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Export Range: ${range}`, 20, 30);
  doc.text(`Export Date: ${new Date().toLocaleString()}`, 20, 36);
  doc.text(`Total Logs: ${logs.length}`, 20, 42);

  // Add summary statistics
  const successLogs = logs.filter(log => log.type === 'success').length;
  const errorLogs = logs.filter(log => log.type === 'error').length;
  const warningLogs = logs.filter(log => log.type === 'warning').length;
  const infoLogs = logs.filter(log => log.type === 'info').length;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`✅ Successful: ${successLogs}`, 20, 52);
  doc.text(`❌ Errors: ${errorLogs}`, 20, 58);
  doc.text(`⚠️ Warnings: ${warningLogs}`, 20, 64);
  doc.text(`ℹ️ Info: ${infoLogs}`, 20, 70);

  // Prepare table data
  const tableData = logs.map(log => {
    const timestamp = log.timestamp instanceof Date ? log.timestamp.toLocaleString() : new Date(log.timestamp).toLocaleString();
    const type = log.type.toUpperCase();
    const message = log.message.length > 60 ? log.message.substring(0, 57) + '...' : log.message;
    const responseTime = log.responseTime ? `${log.responseTime}ms` : '-';
    return [timestamp, type, message, responseTime];
  });

  // Add table
  doc.autoTable({
    head: [['Timestamp', 'Type', 'Message', 'Response Time']],
    body: tableData,
    startY: 80,
    theme: 'striped',
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30 },
      2: { cellWidth: 150 },
      3: { cellWidth: 40 }
    },
    margin: { left: 20, right: 20 }
  });

  // Add footer with page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
  }

  return doc;
}

// Main init function
function initializeApp() {
  // State management
  let intervalId = null;
  let logs = [];
  let stats = { total: 0, success: 0, failed: 0, responseTimes: [] };
  window.pingerIntervalId = null;

  // DOM elements
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

  // Load saved data
  function loadData() {
    const savedLogs = localStorage.getItem('pingerLogs');
    const savedStats = localStorage.getItem('pingerStats');
    if (savedLogs) {
      const parsedLogs = JSON.parse(savedLogs);
      logs = parsedLogs.map(log => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }));
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
    const log = { timestamp, message, type, responseTime };
    logs.unshift(log);
    if (logs.length > 1000) { logs = logs.slice(0, 1000); }
    console.log(`[${timestamp.toLocaleTimeString()}] ${type.toUpperCase()}: ${message}`);
    saveData();
    renderLogs();
  }

  // Render logs - FIXED version with defensive coding
  function renderLogs() {
    if (!logContainer) return;

    logContainer.innerHTML = logs.map(log => {
      let timeString;
      if (log.timestamp instanceof Date) {
        timeString = log.timestamp.toLocaleTimeString();
      } else if (log.timestamp) {
        const dateObj = new Date(log.timestamp);
        timeString = !isNaN(dateObj.getTime()) ? dateObj.toLocaleTimeString() : 'Invalid time';
      } else {
        timeString = 'No time';
      }

      const responseInfo = log.responseTime ? ` (${log.responseTime}ms)` : '';
      return `<div class="log-entry log-${log.type}">
        <span class="timestamp">[${timeString}]</span>
        <span>${log.message}${responseInfo}</span>
      </div>`;
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
    const avgResp = stats.responseTimes.length > 0 ? Math.round(stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length) : 0;
    avgResponse.textContent = `${avgResp}ms`;
    if (stats.total > 0) {
      const successWidth = (stats.success / stats.total) * 100;
      uptimeBar.innerHTML = `<div class="uptime-segment uptime-success" style="width: ${successWidth}%"></div><div class="uptime-segment uptime-error" style="width: ${100 - successWidth}%"></div>`;
    } else {
      uptimeBar.innerHTML = `<div class="uptime-segment uptime-success" style="width: 100%"></div>`;
    }
    uptimeSuccess.textContent = stats.success;
    uptimeFailed.textContent = stats.failed;
  }

  // Update next ping time
  function updateNextPing() {
    if (window.pingerIntervalId) {
      const minutes = parseInt(intervalInput.value);
      const nextTime = new Date(Date.now() + minutes * 60000);
      nextPing.textContent = nextTime.toLocaleTimeString();
    } else {
      nextPing.textContent = '-';
    }
  }

  // Send email notification
  async function sendEmailNotification(errorMessage) {
    const email = emailInput.value.trim();
    if (!email) return;

    const emailService = emailServiceSelect.value;

    if (emailService === 'mailto') {
      const subject = encodeURIComponent('Backend Down Alert');
      const body = encodeURIComponent(`Your backend at ${urlInput.value} is down!\n\nError: ${errorMessage}\nTime: ${new Date().toLocaleString()}`);
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
      addLog(`Opened email client to notify ${email}`, 'info');
    } else if (emailService === 'resend') {
      const apiKey = resendApiKeyInput.value.trim();
      const fromEmail = fromEmailInput.value.trim() || 'onboarding@resend.dev';

      if (!apiKey) {
        addLog('Resend API key missing for email notification', 'warning');
        return;
      }

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [email],
            subject: 'Backend Down Alert',
            html: `<h1>Backend Down Alert</h1>
                   <p>Your backend at ${urlInput.value} is down!</p>
                   <p><strong>Error:</strong> ${errorMessage}</p>
                   <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>`
          })
        });

        if (response.ok) {
          addLog(`Email alert sent to ${email}`, 'success');
        } else {
          addLog(`Failed to send email: ${response.statusText}`, 'error');
        }
      } catch (error) {
        addLog(`Email send failed: ${error.message}`, 'error');
      }
    }
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
      const response = await fetch(url, { method: 'GET', mode: 'no-cors' });
      const responseTime = Date.now() - startTime;
      stats.responseTimes.push(responseTime);
      if (stats.responseTimes.length > 100) {
        stats.responseTimes = stats.responseTimes.slice(-100);
      }
      stats.success++;
      addLog(`Ping successful`, 'success', responseTime);
      console.log(`✅ Ping OK: ${url} in ${responseTime}ms`);
    } catch (error) {
      stats.failed++;
      const errorMsg = error.message || 'Unknown error';
      addLog(`Ping failed: ${errorMsg}`, 'error');
      console.error(`❌ Ping FAIL: ${url} - ${errorMsg}`);
      await sendEmailNotification(errorMsg);
    }
    lastPing.textContent = new Date().toLocaleTimeString();
    updateUI();
    updateNextPing();
    saveData();
  }

  // Export logs function with multiple formats
  async function exportLogs(range) {
    // Get selected format
    const formatRadio = document.querySelector('input[name="exportFormat"]:checked');
    const format = formatRadio ? formatRadio.value : 'json';

    // Filter logs based on range
    let filteredLogs = [...logs];
    const now = new Date();

    switch(range) {
      case '24h':
        filteredLogs = logs.filter(log => (now - new Date(log.timestamp)) <= 24 * 60 * 60 * 1000);
        break;
      case '7d':
        filteredLogs = logs.filter(log => (now - new Date(log.timestamp)) <= 7 * 24 * 60 * 60 * 1000);
        break;
      case '14d':
        filteredLogs = logs.filter(log => (now - new Date(log.timestamp)) <= 14 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        filteredLogs = logs.filter(log => (now - new Date(log.timestamp)) <= 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        filteredLogs = logs.filter(log => (now - new Date(log.timestamp)) <= 90 * 24 * 60 * 60 * 1000);
        break;
      case '180d':
        filteredLogs = logs.filter(log => (now - new Date(log.timestamp)) <= 180 * 24 * 60 * 60 * 1000);
        break;
      case '365d':
        filteredLogs = logs.filter(log => (now - new Date(log.timestamp)) <= 365 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        filteredLogs = [...logs];
        break;
    }

    if (filteredLogs.length === 0) {
      addLog('No logs to export for the selected range', 'warning');
      exportModal.style.display = 'none';
      return;
    }

    // Export based on format
    const fileName = `pinger-logs-${range}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;

    try {
      if (format === 'json') {
        // JSON Export
        const exportData = filteredLogs.map(log => ({
          timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp,
          type: log.type,
          message: log.message,
          responseTime: log.responseTime
        }));

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', `${fileName}.json`);
        linkElement.click();

        addLog(`Exported ${filteredLogs.length} logs as JSON for ${range}`, 'success');

      } else if (format === 'csv') {
        // CSV Export
        const csvData = convertToCSV(filteredLogs);
        const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', `${fileName}.csv`);
        linkElement.click();

        addLog(`Exported ${filteredLogs.length} logs as CSV for ${range}`, 'success');

      } else if (format === 'pdf') {
        // PDF Export - Show loading message
        addLog(`Generating PDF for ${filteredLogs.length} logs...`, 'info');

        const doc = await convertToPDF(filteredLogs, range);
        doc.save(`${fileName}.pdf`);

        addLog(`Exported ${filteredLogs.length} logs as PDF for ${range}`, 'success');
      }

      exportModal.style.display = 'none';

    } catch (error) {
      console.error('Export error:', error);
      addLog(`Export failed: ${error.message}`, 'error');
    }
  }

  // Create initState object
  const initState = {
    urlInput, intervalInput, startBtn, stopBtn, statusBanner, statusText,
    addLog, updateNextPing, pingBackend
  };

  // Auto-start after 2s
  setTimeout(() => autoStartPinger(initState), 2000);

  // Manual start
  startBtn.addEventListener('click', () => {
    if (window.pingerIntervalId) {
      addLog('Already running - monitoring is active', 'warning');
      return;
    }
    const url = urlInput.value.trim();
    const minutes = parseInt(intervalInput.value);
    if (!url || minutes < 1 || minutes > 60) {
      addLog('Invalid URL or interval (must be 1-60 minutes)', 'error');
      return;
    }
    pingBackend();
    intervalId = setInterval(pingBackend, minutes * 60000);
    window.pingerIntervalId = intervalId;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    urlInput.disabled = true;
    intervalInput.disabled = true;
    statusBanner.classList.add('active');
    statusText.textContent = `Manual Monitoring Active (${minutes}min)`;
    addLog(`Manual start - Pinging every ${minutes} min`, 'success');
    updateNextPing();
  });

  // Manual stop
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
  });

  // Reset stats
  resetBtn.addEventListener('click', () => {
    if (window.pingerIntervalId) {
      addLog('Please stop monitoring before resetting stats', 'warning');
      return;
    }

    stats = { total: 0, success: 0, failed: 0, responseTimes: [] };
    logs = [];
    lastPing.textContent = 'Never';
    updateUI();
    renderLogs();
    saveData();
    addLog('All statistics and logs have been reset', 'info');
  });

  // Clear logs
  clearLogsBtn.addEventListener('click', () => {
    logs = [];
    renderLogs();
    saveData();
    addLog('All logs cleared', 'info');
  });

  // Export button
  exportBtn.addEventListener('click', () => {
    if (exportModal) {
      exportModal.style.display = 'flex';
    }
  });

  // Close modal
  closeModalBtn.addEventListener('click', () => {
    if (exportModal) {
      exportModal.style.display = 'none';
    }
  });

  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (exportModal && e.target === exportModal) {
      exportModal.style.display = 'none';
    }
  });

  // Export option clicks
  const exportOptions = document.querySelectorAll('.export-option');
  exportOptions.forEach(option => {
    option.addEventListener('click', () => {
      const range = option.getAttribute('data-range');
      exportLogs(range);
    });
  });

  // Initialize
  loadData();
  setInterval(saveData, 30000);
}
