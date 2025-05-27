// Healthcare Revenue Performance Analyzer - Debug Version
// Version: 2.0 - No undefined functions

console.log('=== APP.JS LOADING ===');
console.log('Timestamp:', new Date().toISOString());

// Global variables
let analysisData = null;
let weeklyResults = null;
let charts = {};

// Debug: List all functions that will be defined
console.log('Functions that will be defined:', [
    'initializeApp',
    'processFile', 
    'displayResults',
    'displayExecutiveSummary',
    'displayPerformanceCharts',
    'displayRecommendations',
    'displayDetailsTable',
    'displayDriversAnalysis',
    'getKeyIssues',
    'getActionsNeeded',
    'showError',
    'setupExportHandlers',
    'exportToExcel',
    'exportChart',
    'exportTableData',
    'checkInitialState'
]);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOM CONTENT LOADED ===');
    
    // Check what functions exist globally
    console.log('Global functions check:');
    console.log('- handleFileUpload exists?', typeof window.handleFileUpload !== 'undefined');
    console.log('- initializeApp exists?', typeof initializeApp !== 'undefined');
    
    // Function to check if libraries are loaded
    function checkLibraries() {
        const hasChart = typeof Chart !== 'undefined';
        const hasLodash = typeof _ !== 'undefined';
        const hasXLSX = typeof XLSX !== 'undefined';
        
        console.log('Library check:', {
            'Chart.js': hasChart,
            'Lodash': hasLodash,
            'XLSX': hasXLSX
        });
        
        return hasChart && hasLodash && hasXLSX;
    }
    
    // Wait for libraries with retry
    function initializeWhenReady(retries = 0) {
        console.log(`Initialization attempt ${retries + 1}/10`);
        
        if (checkLibraries()) {
            console.log('=== ALL LIBRARIES LOADED ===');
            try {
                initializeApp();
                setupExportHandlers();
                checkInitialState();
                console.log('=== INITIALIZATION COMPLETE ===');
            } catch (error) {
                console.error('=== INITIALIZATION ERROR ===', error);
                showError('Failed to initialize: ' + error.message);
            }
        } else if (retries < 10) {
            setTimeout(() => initializeWhenReady(retries + 1), 500);
        } else {
            console.error('=== LIBRARIES FAILED TO LOAD ===');
            showError('Required libraries failed to load. Please refresh the page.');
        }
    }
    
    initializeWhenReady();
});

function initializeApp() {
    console.log('=== INITIALIZING APP ===');
    
    try {
        // Get DOM elements with validation
        const uploadSection = document.getElementById('uploadSection');
        const fileInput = document.getElementById('fileInput');

        console.log('DOM elements found:', {
            uploadSection: !!uploadSection,
            fileInput: !!fileInput
        });

        if (!uploadSection) {
            throw new Error('Upload section not found');
        }
        
        if (!fileInput) {
            throw new Error('File input not found');
        }

        // Upload section click handler
        uploadSection.addEventListener('click', function(e) {
            console.log('Upload section clicked');
            e.preventDefault();
            fileInput.click();
        });

        // File selection handler
        fileInput.addEventListener('change', function(event) {
            console.log('File input changed');
            const files = event.target.files;
            if (files && files.length > 0) {
                console.log('File selected:', files[0].name, 'Size:', files[0].size);
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
            console.log('File dropped');
            e.preventDefault();
            e.stopPropagation();
            uploadSection.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                console.log('Dropped file:', files[0].name);
                processFile(files[0]);
            }
        });

        console.log('=== APP INITIALIZED SUCCESSFULLY ===');
        
    } catch (error) {
        console.error('=== APP INITIALIZATION ERROR ===', error);
        showError('Failed to initialize: ' + error.message);
    }
}

async function processFile(file) {
    console.log('=== PROCESSING FILE ===', file.name);
    
    const loadingSection = document.getElementById('loadingSection');
    const header = document.querySelector('.header');
    const analysisContainer = document.getElementById('analysisContainer');

    try {
        // Show loading state
        if (loadingSection) {
            loadingSection.style.display = 'block';
        }
        if (header) {
            header.style.display = 'none';
        }
        if (analysisContainer) {
            analysisContainer.style.display = 'none';
        }
        
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        
        console.log('Sending file to server...');
        
        // Upload file
        const response = await fetch('/run_analysis', {
            method: 'POST',
            body: formData
        });
        
        const responseData = await response.json();
        console.log('Server response:', responseData);
        
        if (!response.ok) {
            throw new Error(responseData.error || 'Server error');
        }
        
        // Load analysis results
        console.log('Loading analysis results...');
        const insightsResponse = await fetch('/analysis_insights.json?v=' + Date.now());
        
        if (!insightsResponse.ok) {
            throw new Error('Failed to load analysis results');
        }
        
        const insights = await insightsResponse.json();
        console.log('Analysis insights loaded:', insights);
        
        if (!insights || !insights.performance || !Array.isArray(insights.performance)) {
            throw new Error('Invalid analysis data structure');
        }
        
        // Display results
        displayResults(insights);
        
        // Show results
        if (loadingSection) {
            loadingSection.style.display = 'none';
        }
        if (analysisContainer) {
            analysisContainer.style.display = 'block';
        }
        
        console.log('=== FILE PROCESSING COMPLETE ===');
        
    } catch (error) {
        console.error('=== FILE PROCESSING ERROR ===', error);
        showError(error.message);
        
        // Hide loading, show header
        if (loadingSection) {
            loadingSection.style.display = 'none';
        }
        if (header) {
            header.style.display = 'block';
        }
    }
}

function displayResults(insights) {
    console.log('=== DISPLAYING RESULTS ===');
    
    try {
        analysisData = insights;
        weeklyResults = insights.performance;
        
        displayExecutiveSummary(insights);
        displayPerformanceCharts(insights);
        displayRecommendations(insights);
        displayDetailsTable(insights);
        displayDriversAnalysis(insights);
        
        console.log('=== RESULTS DISPLAYED SUCCESSFULLY ===');
    } catch (error) {
        console.error('=== DISPLAY RESULTS ERROR ===', error);
        showError('Failed to display results: ' + error.message);
    }
}

function displayExecutiveSummary(insights) {
    console.log('Displaying executive summary...');
    
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
            'Focus on optimization to address the ' + underPerformed + ' under-performing weeks.';
        
        const keyInsightElement = document.getElementById('keyInsight');
        if (keyInsightElement) {
            keyInsightElement.innerHTML = keyInsight;
        }
    } catch (error) {
        console.error('Executive summary error:', error);
    }
}

function displayPerformanceCharts(insights) {
    console.log('Creating performance charts...');
    
    try {
        if (typeof Chart === 'undefined') {
            throw new Error('Chart.js not loaded');
        }
        
        if (typeof _ === 'undefined') {
            throw new Error('Lodash not loaded');
        }

        const performance = insights.performance;
        
        // Performance Distribution Chart
        const perfCounts = _.countBy(performance, 'Performance');
        console.log('Performance counts:', perfCounts);
        
        const ctx1 = document.getElementById('performanceChart');
        if (!ctx1) {
            throw new Error('Performance chart canvas not found');
        }
        
        // Destroy existing chart
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
            throw new Error('Trend chart canvas not found');
        }
        
        // Destroy existing chart
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
        console.error('Chart creation error:', error);
        showError('Failed to create charts: ' + error.message);
    }
}

function displayRecommendations(insights) {
    console.log('Displaying recommendations...');
    
    try {
        const performance = insights.performance;
        const underPerformed = performance.filter(p => p.Performance === 'Under Performed');
        const avgRevenue = performance.reduce((sum, p) => sum + (p.Actual || 0), 0) / performance.length;
        
        const recommendations = {
            immediate: [
                'Focus on revenue optimization - average weekly revenue is $' + Math.round(avgRevenue).toLocaleString(),
                'Review charge capture processes to improve accuracy',
                'Address ' + underPerformed.length + ' under-performing weeks'
            ],
            strategic: [
                'Implement revenue-based forecasting',
                'Optimize payer mix and relationships',
                'Standardize collection processes'
            ],
            operational: [
                'Schedule optimization for patient volume',
                'Staff training on documentation',
                'Weekly performance monitoring'
            ]
        };
        
        let html = '';
        
        html += '<div class="action-card">' +
            '<h3>🎯 Immediate Actions (Next 30 Days)</h3>' +
            '<ul class="action-list">';
        recommendations.immediate.forEach(item => {
            html += '<li>' + item + '</li>';
        });
        html += '</ul></div>';
        
        html += '<div class="action-card">' +
            '<h3>🚀 Strategic Initiatives (90 Days)</h3>' +
            '<ul class="action-list">';
        recommendations.strategic.forEach(item => {
            html += '<li>' + item + '</li>';
        });
        html += '</ul></div>';
        
        html += '<div class="action-card">' +
            '<h3>⚙️ Operational Improvements</h3>' +
            '<ul class="action-list">';
        recommendations.operational.forEach(item => {
            html += '<li>' + item + '</li>';
        });
        html += '</ul></div>';
        
        const actionItemsElement = document.getElementById('actionItems');
        if (actionItemsElement) {
            actionItemsElement.innerHTML = html;
        }
    } catch (error) {
        console.error('Recommendations error:', error);
    }
}

function displayDetailsTable(insights) {
    console.log('Displaying details table...');
    
    try {
        const performance = insights.performance;
        
        let tableRows = '';
        performance.forEach(result => {
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
        });

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
        console.error('Details table error:', error);
    }
}

function displayDriversAnalysis(insights) {
    console.log('Displaying drivers analysis...');
    
    try {
        if (typeof Chart === 'undefined') {
            throw new Error('Chart.js not loaded');
        }

        const featureImportance = insights.feature_importance || [];
        
        if (featureImportance.length === 0) {
            console.warn('No feature importance data');
            return;
        }

        const ctx = document.getElementById('driversChart');
        if (!ctx) {
            throw new Error('Drivers chart canvas not found');
        }
        
        // Destroy existing chart
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
        console.error('Drivers analysis error:', error);
    }
}

// Helper functions
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
    console.error('=== ERROR ===', message);
    
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert-danger');
    existingAlerts.forEach(alert => alert.remove());
    
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger';
    alert.innerHTML = '<strong>Error:</strong> ' + message;
    
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
    console.log('=== SETTING UP EXPORT HANDLERS ===');
    
    try {
        const buttons = {
            exportExcel: document.getElementById('exportExcel'),
            exportPerformanceChart: document.getElementById('exportPerformanceChart'),
            exportTrendChart: document.getElementById('exportTrendChart'),
            exportTable: document.getElementById('exportTable')
        };

        console.log('Export buttons found:', Object.keys(buttons).map(key => ({ [key]: !!buttons[key] })));

        if (buttons.exportExcel) {
            buttons.exportExcel.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Export Excel clicked');
                exportToExcel();
            });
        }
        
        if (buttons.exportPerformanceChart) {
            buttons.exportPerformanceChart.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Export Performance Chart clicked');
                exportChart('performanceChart');
            });
        }
        
        if (buttons.exportTrendChart) {
            buttons.exportTrendChart.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Export Trend Chart clicked');
                exportChart('trendChart');
            });
        }
        
        if (buttons.exportTable) {
            buttons.exportTable.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Export Table clicked');
                exportTableData();
            });
        }
        
        console.log('=== EXPORT HANDLERS SET UP ===');
        
    } catch (error) {
        console.error('=== EXPORT HANDLERS ERROR ===', error);
    }
}

function exportToExcel() {
    console.log('Exporting to Excel...');
    
    if (!analysisData || typeof XLSX === 'undefined') {
        showError('No data available or Excel library not loaded');
        return;
    }

    try {
        const wb = XLSX.utils.book_new();
        
        const performance = analysisData.performance;
        const totalWeeks = performance.length;
        const underPerformed = performance.filter(p => p.Performance === 'Under Performed').length;
        
        const summaryData = [
            ['Healthcare Revenue Analysis Report'],
            ['Generated:', new Date().toLocaleDateString()],
            [''],
            ['Total Weeks Analyzed:', totalWeeks],
            ['Under Performing Weeks:', underPerformed]
        ];
        
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
        
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
        
        console.log('Excel export complete');
        
    } catch (error) {
        console.error('Excel export error:', error);
        showError('Failed to export Excel: ' + error.message);
    }
}

function exportChart(chartId) {
    console.log('Exporting chart:', chartId);
    
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
        
        console.log('Chart export complete');
        
    } catch (error) {
        console.error('Chart export error:', error);
        showError('Failed to export chart: ' + error.message);
    }
}

function exportTableData() {
    console.log('Exporting table data...');
    
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
        
        console.log('Table export complete');
        
    } catch (error) {
        console.error('Table export error:', error);
        showError('Failed to export table: ' + error.message);
    }
}

async function checkInitialState() {
    console.log('=== CHECKING INITIAL STATE ===');
    
    try {
        const response = await fetch('/analysis_insights.json?v=' + Date.now());
        if (response.ok) {
            const insights = await response.json();
            console.log('Found existing analysis, displaying...');
            displayResults(insights);
            
            const analysisContainer = document.getElementById('analysisContainer');
            const header = document.querySelector('.header');
            
            if (analysisContainer) {
                analysisContainer.style.display = 'block';
            }
            if (header) {
                header.style.display = 'none';
            }
        } else {
            console.log('No previous analysis found');
        }
    } catch (error) {
        console.log('No previous analysis:', error.message);
    }
}

// Global error handlers
window.addEventListener('error', function(event) {
    console.error('=== GLOBAL ERROR ===', event.error);
    showError('Unexpected error: ' + (event.error?.message || 'Unknown error'));
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('=== UNHANDLED PROMISE REJECTION ===', event.reason);
    showError('Promise error: ' + (event.reason?.message || 'Unknown promise error'));
    event.preventDefault();
});

console.log('=== APP.JS LOADED SUCCESSFULLY ===');
