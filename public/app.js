// Global variables
let analysisData = null;
let weeklyResults = null;
let charts = {};

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, checking libraries...');
    
    // Function to check if libraries are loaded
    function checkLibraries() {
        return typeof Chart !== 'undefined' && typeof _ !== 'undefined' && typeof XLSX !== 'undefined';
    }
    
    // Wait for all external libraries to load with retry mechanism
    function initializeWhenReady(retries = 0) {
        if (checkLibraries()) {
            console.log('All libraries loaded, initializing app...');
            try {
                initializeApp();
                setupExportHandlers();
                checkInitialState();
            } catch (error) {
                console.error('Error during initialization:', error);
                showError('Failed to initialize application: ' + error.message);
            }
        } else if (retries < 10) {
            console.log(`Libraries not ready, retrying... (${retries + 1}/10)`);
            setTimeout(() => initializeWhenReady(retries + 1), 500);
        } else {
            console.error('Libraries failed to load after 10 retries');
            showError('Failed to load required libraries. Please refresh the page.');
        }
    }
    
    initializeWhenReady();
});

function initializeApp() {
    console.log('Initializing app...');
    
    try {
        // Get DOM elements
        const uploadSection = document.getElementById('uploadSection');
        const fileInput = document.getElementById('fileInput');

        if (!uploadSection) {
            throw new Error('Upload section element not found');
        }
        
        if (!fileInput) {
            throw new Error('File input element not found');
        }

        // File upload click handler
        uploadSection.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Upload section clicked');
            fileInput.click();
        });

        // File selection handler
        fileInput.addEventListener('change', function(event) {
            console.log('File input changed');
            const files = event.target.files;
            if (files && files.length > 0) {
                console.log('File selected:', files[0].name);
                processFile(files[0]);
            }
        });

        // Drag and drop handlers
        uploadSection.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            uploadSection.classList.add('dragover');
        });

        uploadSection.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            uploadSection.classList.remove('dragover');
        });

        uploadSection.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            uploadSection.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                console.log('File dropped:', files[0].name);
                processFile(files[0]);
            }
        });

        console.log('App initialized successfully');
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to initialize application: ' + error.message);
    }
}

async function processFile(file) {
    const loadingSection = document.getElementById('loadingSection');
    const header = document.querySelector('.header');
    const analysisContainer = document.getElementById('analysisContainer');

    try {
        if (loadingSection) loadingSection.hidden = false;
        if (header) header.style.display = 'none';
        if (analysisContainer) analysisContainer.style.display = 'none';
        
        console.log('Processing file:', file.name);
        
        // Create FormData object
        const formData = new FormData();
        formData.append('file', file);
        
        // Run Python analysis
        console.log('Sending file to server...');
        const response = await fetch('/run_analysis', {
            method: 'POST',
            body: formData
        });
        
        const responseData = await response.json();
        console.log('Server response:', responseData);
        
        if (!response.ok) {
            console.error('Server error:', responseData);
            throw new Error(responseData.error || 'Analysis failed');
        }
        
        console.log('Analysis complete, loading insights...');
        // Load insights from JSON file
        const insightsResponse = await fetch('/analysis_insights.json');
        if (!insightsResponse.ok) {
            console.error('Failed to load insights:', insightsResponse.status);
            throw new Error(`Failed to load analysis results: ${insightsResponse.statusText}`);
        }
        
        const insights = await insightsResponse.json();
        console.log('Insights loaded:', insights);
        
        // Validate insights data
        if (!insights || !insights.performance || !Array.isArray(insights.performance)) {
            throw new Error('Invalid insights data structure');
        }
        
        displayResults(insights);
        
        if (loadingSection) loadingSection.hidden = true;
        if (analysisContainer) analysisContainer.style.display = 'block';
        
    } catch (error) {
        console.error('Analysis error:', error);
        showError(error.message || 'An unexpected error occurred. Please check the console for details.');
        if (loadingSection) loadingSection.hidden = true;
        if (header) header.style.display = 'block';
    }
}

function displayResults(insights) {
    try {
        analysisData = insights;
        weeklyResults = insights.performance; // Store for export functions
        
        displayExecutiveSummary(insights);
        displayPerformanceCharts(insights);
        displayRecommendations(insights);
        displayDetailsTable(insights);
        displayDriversAnalysis(insights);
        
        console.log('Results displayed successfully');
    } catch (error) {
        console.error('Error displaying results:', error);
        showError('Failed to display results: ' + error.message);
    }
}

function displayExecutiveSummary(insights) {
    try {
        const performance = insights.performance;
        const totalWeeks = performance.length;
        const underPerformed = performance.filter(p => p.Performance === 'Under Performed').length;
        const avgError = performance.reduce((sum, p) => sum + Math.abs(p['Absolute Error'] || 0), 0) / totalWeeks;
        const avgActual = performance.reduce((sum, p) => sum + (p.Actual || 0), 0) / totalWeeks;
        const accuracy = avgActual > 0 ? ((1 - avgError / avgActual) * 100).toFixed(1) : '0.0';
        
        const metricsHtml = 
            '<div class="metric-card">' +
                '<div class="metric-value">' + totalWeeks + '</div>' +
                '<div class="metric-label">Weeks Analyzed</div>' +
            '</div>' +
            '<div class="metric-card">' +
                '<div class="metric-value">' + accuracy + '%</div>' +
                '<div class="metric-label">Prediction Accuracy</div>' +
            '</div>' +
            '<div class="metric-card">' +
                '<div class="metric-value">$' + Math.round(avgError).toLocaleString() + '</div>' +
                '<div class="metric-label">Average Error</div>' +
            '</div>' +
            '<div class="metric-card">' +
                '<div class="metric-value">' + underPerformed + '</div>' +
                '<div class="metric-label">Weeks Need Attention</div>' +
            '</div>';
        
        const keyMetricsElement = document.getElementById('keyMetrics');
        if (keyMetricsElement) {
            keyMetricsElement.innerHTML = metricsHtml;
        }
        
        const keyInsight = '<strong>Key Insight:</strong> Your clinic revenue is ' + accuracy + '% predictable. ' +
            'Visit volume is your primary driver - focus on scheduling optimization to address the ' +
            underPerformed + ' under-performing weeks.';
        
        const keyInsightElement = document.getElementById('keyInsight');
        if (keyInsightElement) {
            keyInsightElement.innerHTML = keyInsight;
        }
    } catch (error) {
        console.error('Error displaying executive summary:', error);
    }
}

function displayPerformanceCharts(insights) {
    try {
        if (typeof Chart === 'undefined' || typeof _ === 'undefined') {
            console.error('Chart.js or Lodash not loaded');
            return;
        }

        const performance = insights.performance;
        
        // Performance Distribution Chart
        const perfCounts = _.countBy(performance, 'Performance');
        const ctx1 = document.getElementById('performanceChart');
        if (!ctx1) {
            console.error('Performance chart canvas not found');
            return;
        }
        
        // Destroy existing chart if it exists
        if (charts.performance) {
            charts.performance.destroy();
        }
        
        charts.performance = new Chart(ctx1.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(perfCounts),
                datasets: [{
                    data: Object.values(perfCounts),
                    backgroundColor: ['#dc3545', '#ffc107', '#28a745'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Weekly Performance Distribution'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
        
        // Trend Chart
        const ctx2 = document.getElementById('trendChart');
        if (!ctx2) {
            console.error('Trend chart canvas not found');
            return;
        }
        
        // Destroy existing chart if it exists
        if (charts.trend) {
            charts.trend.destroy();
        }
        
        charts.trend = new Chart(ctx2.getContext('2d'), {
            type: 'line',
            data: {
                labels: performance.map(p => p.Week || 'Unknown'),
                datasets: [{
                    label: 'Actual Revenue',
                    data: performance.map(p => p.Actual || 0),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Predicted Revenue',
                    data: performance.map(p => p.Predicted || 0),
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderDash: [5, 5],
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Revenue Trend: Actual vs Predicted'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
        
        console.log('Charts created successfully');
    } catch (error) {
        console.error('Error creating charts:', error);
        showError('Failed to create charts: ' + error.message);
    }
}

function displayRecommendations(insights) {
    try {
        const performance = insights.performance;
        const underPerformed = performance.filter(p => p.Performance === 'Under Performed');
        const avgRevenue = performance.reduce((sum, p) => sum + (p.Actual || 0), 0) / performance.length;
        
        const recommendations = {
            immediate: [
                'Focus on revenue optimization - average weekly revenue is $' + Math.round(avgRevenue).toLocaleString(),
                'Review charge capture processes to improve accuracy',
                'Address ' + underPerformed.length + ' under-performing weeks for process improvements'
            ],
            strategic: [
                'Implement revenue-based forecasting for better planning',
                'Optimize payer mix and relationships',
                'Standardize collection processes from high-performing periods'
            ],
            operational: [
                'Schedule optimization to increase patient volume',
                'Staff training on charge documentation accuracy',
                'Weekly performance monitoring dashboard implementation'
            ]
        };
        
        let html = '';
        
        html += '<div class="action-card">' +
            '<h3>🎯 Immediate Actions (Next 30 Days)</h3>' +
            '<ul class="action-list">';
        
        for (let i = 0; i < recommendations.immediate.length; i++) {
            html += '<li>' + recommendations.immediate[i] + '</li>';
        }
        
        html += '</ul></div>';
        
        html += '<div class="action-card">' +
            '<h3>🚀 Strategic Initiatives (90 Days)</h3>' +
            '<ul class="action-list">';
        
        for (let i = 0; i < recommendations.strategic.length; i++) {
            html += '<li>' + recommendations.strategic[i] + '</li>';
        }
        
        html += '</ul></div>';
        
        html += '<div class="action-card">' +
            '<h3>⚙️ Operational Improvements</h3>' +
            '<ul class="action-list">';
        
        for (let i = 0; i < recommendations.operational.length; i++) {
            html += '<li>' + recommendations.operational[i] + '</li>';
        }
        
        html += '</ul></div>';
        
        const actionItemsElement = document.getElementById('actionItems');
        if (actionItemsElement) {
            actionItemsElement.innerHTML = html;
        }
    } catch (error) {
        console.error('Error displaying recommendations:', error);
    }
}

function displayDetailsTable(insights) {
    try {
        const performance = insights.performance;
        
        let tableRows = '';
        for (let i = 0; i < performance.length; i++) {
            const result = performance[i];
            const performanceClass = result.Performance === 'Under Performed' ? 'performance-under' :
                                 result.Performance === 'Over Performed' ? 'performance-over' :
                                 'performance-average';
            
            tableRows += '<tr>' +
                '<td>' + (result.Week || 'N/A') + '</td>' +
                '<td>$' + (result.Actual || 0).toLocaleString() + '</td>' +
                '<td>$' + (result.Predicted || 0).toLocaleString() + '</td>' +
                '<td>' + (result['Error %'] || 0) + '%</td>' +
                '<td><span class="' + performanceClass + '">' + (result.Performance || 'Unknown') + '</span></td>' +
                '<td>' + getKeyIssues(result) + '</td>' +
                '<td>' + getActionsNeeded(result) + '</td>' +
            '</tr>';
        }

        const html = '<thead>' +
            '<tr>' +
                '<th>Week</th>' +
                '<th>Actual Revenue</th>' +
                '<th>Predicted Revenue</th>' +
                '<th>Error %</th>' +
                '<th>Performance</th>' +
                '<th>Key Issues</th>' +
                '<th>Actions Needed</th>' +
            '</tr>' +
        '</thead>' +
        '<tbody>' + tableRows + '</tbody>';
        
        const detailsTableElement = document.getElementById('detailsTable');
        if (detailsTableElement) {
            detailsTableElement.innerHTML = html;
        }
    } catch (error) {
        console.error('Error displaying details table:', error);
    }
}

function displayDriversAnalysis(insights) {
    try {
        if (typeof Chart === 'undefined') {
            console.error('Chart.js not loaded');
            return;
        }

        const featureImportance = insights.feature_importance || [];
        
        if (featureImportance.length === 0) {
            console.warn('No feature importance data available');
            return;
        }

        const ctx = document.getElementById('driversChart');
        if (!ctx) {
            console.error('Drivers chart canvas not found');
            return;
        }
        
        // Destroy existing chart if it exists
        if (charts.drivers) {
            charts.drivers.destroy();
        }
        
        const topFeatures = featureImportance.slice(0, 4);
        
        charts.drivers = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: topFeatures.map(f => f.Feature || 'Unknown'),
                datasets: [{
                    label: 'Feature Importance',
                    data: topFeatures.map(f => f.Importance || 0),
                    backgroundColor: ['#667eea', '#28a745', '#ffc107', '#dc3545'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Revenue Drivers Analysis'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1,
                        ticks: {
                            callback: function(value) {
                                return (value * 100).toFixed(0) + '%';
                            }
                        }
                    }
                }
            }
        });

        let insightsHtml = '<div style="padding: 20px; background: #f8f9fa; border-radius: 15px;">' +
            '<h3 style="color: #2c3e50; margin-bottom: 15px;">Key Revenue Drivers</h3>';
        
        topFeatures.forEach(feature => {
            insightsHtml += '<div style="margin-bottom: 10px; padding: 10px; background: white; border-radius: 8px;">' +
                '<strong>' + (feature.Feature || 'Unknown') + '</strong><br>' +
                '<span style="color: #666;">Importance: ' + ((feature.Importance || 0) * 100).toFixed(1) + '%</span>' +
            '</div>';
        });
        
        insightsHtml += '</div>';
        
        const driversInsightsElement = document.getElementById('driversInsights');
        if (driversInsightsElement) {
            driversInsightsElement.innerHTML = insightsHtml;
        }
    } catch (error) {
        console.error('Error displaying drivers analysis:', error);
    }
}

// Helper functions that were missing
function getKeyIssues(result) {
    if (!result) return 'No data';
    
    const errorPct = Math.abs(result['Error %'] || 0);
    
    if (errorPct > 20) {
        return 'High variance from prediction';
    } else if (errorPct > 10) {
        return 'Moderate variance';
    } else if (result.Performance === 'Under Performed') {
        return 'Below expected performance';
    } else if (result.Performance === 'Over Performed') {
        return 'Exceeded expectations';
    } else {
        return 'Performance as expected';
    }
}

function getActionsNeeded(result) {
    if (!result) return 'Review data';
    
    const errorPct = Math.abs(result['Error %'] || 0);
    
    if (errorPct > 20) {
        return 'Investigate cause, adjust processes';
    } else if (errorPct > 10) {
        return 'Monitor closely, minor adjustments';
    } else if (result.Performance === 'Under Performed') {
        return 'Review scheduling and processes';
    } else if (result.Performance === 'Over Performed') {
        return 'Document best practices';
    } else {
        return 'Continue current approach';
    }
}

function showError(message) {
    console.error('Error:', message);
    
    // Remove any existing alerts
    const existingAlerts = document.querySelectorAll('.alert-danger');
    existingAlerts.forEach(alert => alert.remove());
    
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger';
    alert.innerHTML = `<strong>Error:</strong> ${message}`;
    
    const header = document.querySelector('.header');
    if (header) {
        header.appendChild(alert);
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 10000);
    }
}

function setupExportHandlers() {
    console.log('Setting up export handlers...');
    
    try {
        const exportExcel = document.getElementById('exportExcel');
        const exportPerformanceChart = document.getElementById('exportPerformanceChart');
        const exportTrendChart = document.getElementById('exportTrendChart');
        const exportTable = document.getElementById('exportTable');

        if (exportExcel) {
            exportExcel.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Export Excel clicked');
                exportToExcel();
            });
        }
        
        if (exportPerformanceChart) {
            exportPerformanceChart.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Export Performance Chart clicked');
                exportChart('performanceChart');
            });
        }
        
        if (exportTrendChart) {
            exportTrendChart.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Export Trend Chart clicked');
                exportChart('trendChart');
            });
        }
        
        if (exportTable) {
            exportTable.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Export Table clicked');
                exportTableData();
            });
        }
        
        console.log('Export handlers set up successfully');
        
    } catch (error) {
        console.error('Error setting up export handlers:', error);
    }
}

function exportToExcel() {
    if (!analysisData || typeof XLSX === 'undefined') {
        showError('No data available for export or Excel library not loaded');
        return;
    }

    try {
        const wb = XLSX.utils.book_new();
        
        // Create summary sheet
        const performance = analysisData.performance;
        const totalWeeks = performance.length;
        const underPerformed = performance.filter(p => p.Performance === 'Under Performed').length;
        const avgError = performance.reduce((sum, p) => sum + Math.abs(p['Absolute Error'] || 0), 0) / totalWeeks;
        
        const summaryData = [
            ['Healthcare Revenue Analysis Report'],
            ['Generated:', new Date().toLocaleDateString()],
            [''],
            ['Total Weeks Analyzed:', totalWeeks],
            ['Under Performing Weeks:', underPerformed],
            ['Average Error:', '$' + Math.round(avgError).toLocaleString()]
        ];
        
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
        
        // Create details sheet
        const detailsData = [
            ['Week', 'Actual Revenue', 'Predicted Revenue', 'Error %', 'Performance']
        ];
        
        performance.forEach(result => {
            detailsData.push([
                result.Week || 'N/A',
                result.Actual || 0,
                result.Predicted || 0,
                result['Error %'] || 0,
                result.Performance || 'Unknown'
            ]);
        });
        
        const detailsWs = XLSX.utils.aoa_to_sheet(detailsData);
        XLSX.utils.book_append_sheet(wb, detailsWs, 'Weekly Details');
        
        XLSX.writeFile(wb, 'Healthcare_Revenue_Analysis_Report.xlsx');
        
    } catch (error) {
        console.error('Export error:', error);
        showError('Failed to export Excel file: ' + error.message);
    }
}

function exportChart(chartId) {
    const chartKey = chartId.replace('Chart', '');
    if (!charts[chartKey]) {
        showError('Chart not available for export');
        return;
    }

    try {
        const canvas = document.getElementById(chartId);
        const url = canvas.toDataURL('image/png');
        
        const link = document.createElement('a');
        link.download = chartId + '_chart.png';
        link.href = url;
        link.click();
        
    } catch (error) {
        console.error('Chart export error:', error);
        showError('Failed to export chart: ' + error.message);
    }
}

function exportTableData() {
    if (!weeklyResults) {
        showError('No data available for export');
        return;
    }

    try {
        let csvContent = "data:text/csv;charset=utf-8," + 
            "Week,Actual Revenue,Predicted Revenue,Error %,Performance\n";
        
        weeklyResults.forEach(result => {
            csvContent += [
                result.Week || 'N/A',
                result.Actual || 0,
                result.Predicted || 0,
                result['Error %'] || 0,
                result.Performance || 'Unknown'
            ].join(',') + '\n';
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'revenue_analysis_data.csv');
        link.click();
        
    } catch (error) {
        console.error('Table export error:', error);
        showError('Failed to export table: ' + error.message);
    }
}

// Global error handler
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    showError(`An unexpected error occurred: ${event.error?.message || 'Unknown error'}`);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showError(`Promise error: ${event.reason?.message || 'Unknown promise error'}`);
    event.preventDefault();
});

async function checkInitialState() {
    try {
        const response = await fetch('/analysis_insights.json');
        if (response.ok) {
            const insights = await response.json();
            console.log('Found existing analysis, displaying results');
            displayResults(insights);
            const analysisContainer = document.getElementById('analysisContainer');
            if (analysisContainer) {
                analysisContainer.style.display = 'block';
            }
            const header = document.querySelector('.header');
            if (header) {
                header.style.display = 'none';
            }
        } else {
            console.log('No previous analysis found');
        }
    } catch (error) {
        console.log('No previous analysis found:', error.message);
        // This is expected on first load, so don't show error to user
    }
}
