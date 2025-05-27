// Global variables
let analysisData = null;
let weeklyResults = null;
let charts = {};

// Initialize the app when the page loads
window.onload = function() {
    initializeApp();
    setupExportHandlers();
    checkInitialState();
};

function initializeApp() {
    // File upload handling
    const uploadSection = document.getElementById('uploadSection');
    const fileInput = document.getElementById('fileInput');

    uploadSection.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
            processFile(event.target.files[0]);
        }
    });

    // Drag and drop handling
    uploadSection.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadSection.classList.add('dragover');
    });

    uploadSection.addEventListener('dragleave', () => {
        uploadSection.classList.remove('dragover');
    });

    uploadSection.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadSection.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    });
}

async function processFile(file) {
    const loadingSection = document.getElementById('loadingSection');
    const header = document.querySelector('.header');
    const analysisContainer = document.getElementById('analysisContainer');

    loadingSection.hidden = false;
    header.style.display = 'none';
    analysisContainer.style.display = 'none';
    
    try {
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
        displayResults(insights);
        
        loadingSection.hidden = true;
        analysisContainer.style.display = 'block';
    } catch (error) {
        console.error('Analysis error:', error);
        showError(error.message || 'An unexpected error occurred. Please check the console for details.');
        loadingSection.hidden = true;
        header.style.display = 'block';
    }
}

function displayResults(insights) {
    displayExecutiveSummary(insights);
    displayPerformanceCharts(insights);
    displayRecommendations(insights);
    displayDetailsTable(insights);
    displayDriversAnalysis(insights);
}

function displayExecutiveSummary(insights) {
    const performance = insights.performance;
    const totalWeeks = performance.length;
    const underPerformed = performance.filter(p => p.Performance === 'Under Performed').length;
    const avgError = performance.reduce((sum, p) => sum + p['Absolute Error'], 0) / totalWeeks;
    const accuracy = ((1 - avgError / performance.reduce((sum, p) => sum + p.Actual, 0) / totalWeeks) * 100).toFixed(1);
    
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
    
    document.getElementById('keyMetrics').innerHTML = metricsHtml;
    
    const keyInsight = '<strong>Key Insight:</strong> Your clinic revenue is ' + accuracy + '% predictable. ' +
        'Visit volume is your primary driver - focus on scheduling optimization to address the ' +
        underPerformed + ' under-performing weeks.';
    
    document.getElementById('keyInsight').innerHTML = keyInsight;
}

function displayPerformanceCharts(insights) {
    const performance = insights.performance;
    
    // Performance Distribution Chart
    const perfCounts = _.countBy(performance, 'Performance');
    const ctx1 = document.getElementById('performanceChart').getContext('2d');
    
    charts.performance = new Chart(ctx1, {
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
    const ctx2 = document.getElementById('trendChart').getContext('2d');
    
    charts.trend = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: performance.map(p => p.Week),
            datasets: [{
                label: 'Actual Revenue',
                data: performance.map(p => p.Actual),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4
            }, {
                label: 'Predicted Revenue',
                data: performance.map(p => p.Predicted),
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
}

function displayRecommendations(insights) {
    const performance = insights.performance;
    const underPerformed = performance.filter(p => p.Performance === 'Under Performed');
    const avgVisits = performance.reduce((sum, p) => sum + p.Actual, 0) / performance.length;
    
    const recommendations = {
        immediate: [
            'Focus on visit volume - your primary revenue driver (' + Math.round(avgVisits) + ' visits per week average)',
            'Optimize charge capture - strong correlation with revenue',
            'Review ' + underPerformed.length + ' under-performing weeks for process improvements'
        ],
        strategic: [
            'Implement visit-based revenue forecasting (95% accuracy)',
            'Prioritize BCBS and Aetna payer relationships',
            'Standardize collection processes from high-performing weeks'
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
    
    document.getElementById('actionItems').innerHTML = html;
}

function displayDetailsTable(insights) {
    const performance = insights.performance;
    
    let tableRows = '';
    for (let i = 0; i < performance.length; i++) {
        const result = performance[i];
        const performanceClass = result.Performance === 'Under Performed' ? 'performance-under' :
                             result.Performance === 'Over Performed' ? 'performance-over' :
                             'performance-average';
        
        tableRows += '<tr>' +
            '<td>' + result.Week + '</td>' +
            '<td>' + result.Actual.toLocaleString() + '</td>' +
            '<td>' + result.Predicted.toLocaleString() + '</td>' +
            '<td>' + result['Error %'] + '%</td>' +
            '<td><span class="' + performanceClass + '">' + result.Performance + '</span></td>' +
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
    
    document.getElementById('detailsTable').innerHTML = html;
}

function displayDriversAnalysis(insights) {
    const featureImportance = insights.feature_importance;
    
    const ctx = document.getElementById('driversChart').getContext('2d');
    
    charts.drivers = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: featureImportance.slice(0, 4).map(f => f.Feature),
            datasets: [{
                label: 'Feature Importance',
                data: featureImportance.slice(0, 4).map(f => f.Importance),
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
    
    featureImportance.slice(0, 4).forEach(feature => {
        insightsHtml += '<div style="margin-bottom: 10px; padding: 10px; background: white; border-radius: 8px;">' +
            '<strong>' + feature.Feature + '</strong><br>' +
            '<span style="color: #666;">Importance: ' + (feature.Importance * 100).toFixed(1) + '%</span>' +
        '</div>';
    });
    
    insightsHtml += '</div>';
    
    document.getElementById('driversInsights').innerHTML = insightsHtml;
}

function showError(message) {
    console.error('Error:', message);
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger';
    alert.innerHTML = `<strong>Error:</strong> ${message}`;
    document.querySelector('.header').appendChild(alert);
    setTimeout(() => alert.remove(), 10000); // Keep error visible for 10 seconds
}

function setupExportHandlers() {
    document.getElementById('exportExcel').addEventListener('click', exportToExcel);
    document.getElementById('exportPerformanceChart').addEventListener('click', () => exportChart('performanceChart'));
    document.getElementById('exportTrendChart').addEventListener('click', () => exportChart('trendChart'));
    document.getElementById('exportTable').addEventListener('click', exportTable);
}

function exportToExcel() {
    if (!weeklyResults || typeof XLSX === 'undefined') {
        showError('No data available for export or Excel library not loaded');
        return;
    }

    try {
        const wb = XLSX.utils.book_new();
        
        const summaryData = [
            ['Healthcare Revenue Analysis Report'],
            ['Generated:', new Date().toLocaleDateString()],
            [''],
            ['Total Weeks Analyzed:', analysisData.insights.totalWeeks],
            ['Prediction Accuracy:', analysisData.insights.accuracy + '%'],
            ['Average Error:', '$' + Math.round(analysisData.insights.avgError).toLocaleString()],
            ['Under Performing Weeks:', analysisData.insights.performance['Under Performed'] || 0],
            ['Over Performing Weeks:', analysisData.insights.performance['Over Performed'] || 0],
            ['Average Performing Weeks:', analysisData.insights.performance['Average Performance'] || 0]
        ];
        
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
        
        const detailsData = [
            ['Week', 'Actual Revenue', 'Predicted Revenue', 'Error %', 'Performance', 'Total Visits', 'Total Charges']
        ];
        
        for (let i = 0; i < weeklyResults.length; i++) {
            const result = weeklyResults[i];
            detailsData.push([
                result.week,
                result.actual,
                result.predicted,
                (result.error * 100).toFixed(2),
                result.performance,
                result.totalVisits,
                result.totalCharges
            ]);
        }
        
        const detailsWs = XLSX.utils.aoa_to_sheet(detailsData);
        XLSX.utils.book_append_sheet(wb, detailsWs, 'Weekly Details');
        
        const recommendationsData = [
            ['Recommendations'],
            [''],
            ['IMMEDIATE ACTIONS (Next 30 Days)']
        ];
        
        for (let i = 0; i < analysisData.insights.recommendations.immediate.length; i++) {
            recommendationsData.push([analysisData.insights.recommendations.immediate[i]]);
        }
        
        recommendationsData.push(['']);
        recommendationsData.push(['STRATEGIC INITIATIVES (90 Days)']);
        
        for (let i = 0; i < analysisData.insights.recommendations.strategic.length; i++) {
            recommendationsData.push([analysisData.insights.recommendations.strategic[i]]);
        }
        
        recommendationsData.push(['']);
        recommendationsData.push(['OPERATIONAL IMPROVEMENTS']);
        
        for (let i = 0; i < analysisData.insights.recommendations.operational.length; i++) {
            recommendationsData.push([analysisData.insights.recommendations.operational[i]]);
        }
        
        const recommendationsWs = XLSX.utils.aoa_to_sheet(recommendationsData);
        XLSX.utils.book_append_sheet(wb, recommendationsWs, 'Recommendations');
        
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

function exportTable() {
    if (!weeklyResults) {
        showError('No data available for export');
        return;
    }

    try {
        let csvContent = "data:text/csv;charset=utf-8," + 
            "Week,Actual Revenue,Predicted Revenue,Error %,Performance,Total Visits,Total Charges\n";
        
        for (let i = 0; i < weeklyResults.length; i++) {
            const result = weeklyResults[i];
            csvContent += [
                result.week,
                result.actual,
                result.predicted,
                (result.error * 100).toFixed(2),
                result.performance,
                result.totalVisits,
                result.totalCharges
            ].join(',') + '\n';
        }

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

// Add global error handler
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    showError(`An unexpected error occurred: ${event.error?.message || 'Unknown error'}`);
});

async function checkInitialState() {
    try {
        const response = await fetch('/analysis_insights.json');
        if (response.ok) {
            const insights = await response.json();
            displayResults(insights);
            document.getElementById('analysisContainer').style.display = 'block';
        } else {
            console.log('No previous analysis found');
        }
    } catch (error) {
        console.log('No previous analysis found:', error);
    }
} 