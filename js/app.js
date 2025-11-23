// Backend Pinger Pro - AUTO-START VERSION (Keeps Render Awake)
window.addEventListener('load', function() {
  initializeApp();
  // Auto-start on load (no manual click needed)
  setTimeout(() => autoStartPinger(), 2000); // 2s delay for UI settle
});

function initializeApp() {
  // State management
  let intervalId = null;
  let logs = [];
  let stats = { total: 0, success: 0, failed: 0, responseTimes: [] };

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

  // Add log entry (added console.log for verification)
  function addLog(message, type = 'info', responseTime = null) {
    const timestamp = new Date();
    const log = { timestamp, message, type, responseTime };
    logs.unshift(log);
    if (logs.length > 1000) { logs = logs.slice(0, 1000); }
    console.log(`[${timestamp.toLocaleTimeString()}] ${type.toUpperCase()}: ${message}`); // Console for debug
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

  // Send email notification (unchanged—full function here for completeness)
  async function sendEmailNotification(error) {
    const email = emailInput.value.trim();
    const emailService = emailServiceSelect.value;
    if (!email) return;
    const subject = `🚨 Backend Down Alert - ${urlInput.value}`;
    const body = `<!DOCTYPE html><html><head><style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; } .container { max-width: 600px; margin: 0 auto; padding: 20px; } .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; } .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; } .alert-box { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; } .stats { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; } .stat-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; } .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }</style></head><body><div class="container"><div class="header"><h1>🚨 Backend Down Alert</h1><p>Your backend is experiencing issues</p></div><div class="content"><div class="alert-box"><strong>⚠️ Alert Details:</strong><p><strong>Backend URL:</strong> ${urlInput.value}</p><p><strong>Error:</strong> ${error}</p><p><strong>Time:</strong> ${new Date().toLocaleString()}</p></div><div class="stats"><h3>Current Statistics</h3><div class="stat-row"><span>Total Pings:</span><strong>${stats.total}</strong></div><div class="stat-row"><span>Failed Pings:</span><strong style="color: #dc2626;">${stats.failed}</strong></div><div class="stat-row"><span>Success Rate:</span><strong>${stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : 0}%</strong></div></div><p style="margin-top: 20px;"><strong>Action Required:</strong> Please check your backend service immediately.</p></div><div class="footer"><p>This is an automated alert from Backend Pinger Pro</p><p>Generated at ${new Date().toLocaleString()}</p></div></div></body></html>`.trim();
    if (emailService === 'mailto') {
      const textBody = `Backend Monitoring Alert\nYour backend is experiencing issues!\n\nDetails:\n- Backend URL: ${urlInput.value}\n- Error: ${error}\n- Time: ${new Date().toLocaleString()}\n- Total Failed Pings: ${stats.failed}\n- Success Rate: ${stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : 0}%\n\nThis is an automated alert from Backend Pinger Pro.`.trim();
      const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(textBody)}`;
      window.open(mailtoLink, '_blank');
      addLog(`Email alert opened in your email client`, 'info');
    } else if (emailService === 'resend') {
      const apiKey = resendApiKeyInput.value.trim();
      const fromEmail = fromEmailInput.value.trim() || 'onboarding@resend.dev';
      if (!apiKey) { addLog(`Resend API key not provided. Please add your API key`, 'warning'); return; }
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: fromEmail, to: [email], subject: subject, html: body })
        });
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || `HTTP ${response.status}`); }
        const result = await response.json();
        addLog(`✉️ Email alert sent successfully to ${email}`, 'success');
        console.log('Resend response:', result);
      } catch (emailError) {
        addLog(`Failed to send email: ${emailError.message}`, 'error');
        console.error('Resend error:', emailError);
      }
    }
  }

  // Ping backend (unchanged, but added console for success/fail)
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
      console.log(`✅ Ping OK: ${url} in ${responseTime}ms`); // Verify in console
    } catch (error) {
      stats.failed++;
      const errorMsg = error.message || 'Unknown error';
      addLog(`Ping failed: ${errorMsg}`, 'error');
      console.error(`❌ Ping FAIL: ${url} - ${errorMsg}`); // Verify fails
      await sendEmailNotification(errorMsg); // Alert on fail
    }
    lastPing.textContent = new Date().toLocaleTimeString();
    updateUI();
    updateNextPing();
    saveData();
  }

  // NEW: Auto-start function
  function autoStartPinger() {
    const url = urlInput.value.trim(); // Pre-filled: https://wrytix.onrender.com/posts
    const minutes = 1; // 1-min for Render (set via input if changed)
    intervalInput.value = minutes; // Sync UI

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      console.error('Invalid URL—fix in HTML');
      return;
    }

    // Initial ping
    pingBackend();

    // Set interval
    intervalId = setInterval(pingBackend, minutes * 60000);

    // UI updates (simulate "active")
    startBtn.disabled = true;
    stopBtn.disabled = false;
    urlInput.disabled = true;
    intervalInput.disabled = true;
    statusBanner.classList.add('active');
    statusText.textContent = `Auto-Monitoring Active (${minutes}min intervals)`;
    addLog(`🚀 Auto-ping started - Keeping ${url} awake every ${minutes} min`, 'success');
    console.log(`🚀 Auto-ping started: ${url} every ${minutes} min`); // Confirm launch
    updateNextPing();
  }

  // Manual stop (unchanged, but logs to console)
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
    addLog('Manual monitoring stopped', 'warning');
    console.log('⏸ Manual stop');
  });

  // Other event listeners (reset, clear, export—unchanged)
  resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all statistics? This action cannot be undone.')) {
      stats = { total: 0, success: 0, failed: 0, responseTimes: [] };
      logs = [];
      saveData();
      updateUI();
      renderLogs();
      addLog('Statistics reset', 'info');
    }
  });

  clearLogsBtn.addEventListener('click', () => {
    if (confirm('Clear all logs? This action cannot be undone.')) {
      logs = [];
      saveData();
      renderLogs();
      addLog('Logs cleared', 'info');
    }
  });

  exportBtn.addEventListener('click', () => { exportModal.classList.add('active'); });
  closeModalBtn.addEventListener('click', () => { exportModal.classList.remove('active'); });
  exportModal.addEventListener('click', (e) => {
    if (e.target === exportModal) { exportModal.classList.remove('active'); }
  });

  document.querySelectorAll('.export-option').forEach(option => {
    option.addEventListener('click', () => {
      const range = option.dataset.range;
      exportLogs(range);
      exportModal.classList.remove('active');
    });
  });

  // Export logs function (unchanged—full for completeness)
  function exportLogs(range) {
    const now = Date.now();
    let filteredLogs = logs;
    let rangeLabel = 'All Time';
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
    if (filteredLogs.length === 0) { alert('No logs found for this time range.'); return; }
    const exportStats = {
      total: filteredLogs.length,
      success: filteredLogs.filter(l => l.type === 'success').length,
      failed: filteredLogs.filter(l => l.type === 'error').length,
      info: filteredLogs.filter(l => l.type === 'info').length,
      warning: filteredLogs.filter(l => l.type === 'warning').length
    };
    const responseTimes = filteredLogs.filter(l => l.responseTime).map(l => l.responseTime);
    const avgResponseTime = responseTimes.length > 0 ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0;
    const successRate = exportStats.total > 0 ? ((exportStats.success / exportStats.total) * 100).toFixed(2) : 0;

    // Create PDF (unchanged logic)
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let yPos = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;
    function checkPageBreak() { if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; } }

    // Title & Header (unchanged)
    doc.setFontSize(20); doc.setTextColor(30, 58, 138); doc.text('Backend Pinger Pro', margin, yPos); yPos += 10;
    doc.setFontSize(12); doc.setTextColor(100, 100, 100); doc.text('Uptime Monitoring Report', margin, yPos); yPos += 15;
    doc.setFontSize(10); doc.setTextColor(60, 60, 60);
    doc.text(`Export Date: ${new Date().toLocaleString()}`, margin, yPos); yPos += lineHeight;
    doc.text(`Time Range: ${rangeLabel}`, margin, yPos); yPos += lineHeight;
    doc.text(`Backend URL: ${urlInput.value}`, margin, yPos); yPos += 12;

    // Stats Section (unchanged)
    doc.setFontSize(14); doc.setTextColor(30, 58, 138); doc.text('Summary Statistics', margin, yPos); yPos += 10;
    doc.setFillColor(248, 250, 252); doc.rect(margin, yPos - 5, 170, 50, 'F');
    doc.setFontSize(10); doc.setTextColor(60, 60, 60);
    let statsY = yPos;
    doc.text(`Total Pings: ${exportStats.total}`, margin + 5, statsY); yPos += lineHeight;
    doc.text(`Successful: ${exportStats.success} (${successRate}%)`, margin + 5, yPos); yPos += lineHeight;
    doc.text(`Failed: ${exportStats.failed}`, margin + 5, yPos); yPos += lineHeight;
    doc.text(`Info Messages: ${exportStats.info}`, margin + 5, yPos); yPos += lineHeight;
    doc.text(`Warnings: ${exportStats.warning}`, margin + 5, yPos); yPos += lineHeight;
    doc.text(`Average Response Time: ${avgResponseTime}ms`, margin + 5, yPos); yPos += 15;

    checkPageBreak();
    // Logs Section (unchanged)
    doc.setFontSize(14); doc.setTextColor(30, 58, 138); doc.text('Detailed Logs', margin, yPos); yPos += 10;
    doc.setFontSize(8); doc.setTextColor(60, 60, 60);
    filteredLogs.forEach((log, index) => {
      checkPageBreak();
      const timestamp = new Date(log.timestamp).toLocaleString();
      const responseInfo = log.responseTime ? ` [${log.responseTime}ms]` : '';
      switch(log.type) {
        case 'success': doc.setTextColor(34, 197, 94); break;
        case 'error': doc.setTextColor(239, 68, 68); break;
        case 'warning': doc.setTextColor(245, 158, 11); break;
        default: doc.setTextColor(59, 130, 246);
      }
      if (index % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(margin, yPos - 4, 170, lineHeight, 'F'); }
      const logText = `${timestamp} | ${log.type.toUpperCase()} | ${log.message}${responseInfo}`;
      const splitText = doc.splitTextToSize(logText, 170);
      splitText.forEach(line => { checkPageBreak(); doc.text(line, margin + 2, yPos); yPos += lineHeight; });
    });

    // Footer (unchanged)
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8); doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${totalPages} | Generated by Backend Pinger Pro`, margin, pageHeight - 10);
    }
    doc.save(`pinger-report-${range}-${Date.now()}.pdf`);
    addLog(`PDF report exported: ${rangeLabel} (${filteredLogs.length} entries)`, 'info');
  }

  // Initialize
  loadData();
  // Auto-save periodically
  setInterval(saveData, 30000);
}
