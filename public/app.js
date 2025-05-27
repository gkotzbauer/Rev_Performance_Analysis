// TEST VERSION - Healthcare Revenue Performance Analyzer
// This version will immediately show if the file is loading

console.log('🚀 TEST APP.JS LOADED - Version 20250127-002');
console.log('Timestamp:', new Date().toISOString());
console.log('Location:', window.location.href);

// Show immediate visual confirmation
alert('✅ app.js file loaded successfully! Check console for details.');

// Log what's available
console.log('Available globals:', {
    'Chart': typeof Chart,
    'Lodash (_)': typeof _,
    'XLSX': typeof XLSX,
    'jQuery': typeof $
});

// Global variables
let analysisData = null;
let weeklyResults = null;
let charts = {};

// Test function - this should NOT cause handleFileUpload error
function testFunction() {
    console.log('Test function called');
    return true;
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 DOM READY - Starting initialization');
    
    try {
        // Test that we can find basic elements
        const uploadSection = document.getElementById('uploadSection');
        const fileInput = document.getElementById('fileInput');
        
        console.log('DOM Elements found:', {
            uploadSection: !!uploadSection,
            fileInput: !!fileInput
        });
        
        if (uploadSection && fileInput) {
            console.log('✅ Basic elements found - setting up handlers');
            
            // Simple click handler
            uploadSection.addEventListener('click', function(e) {
                console.log('Upload section clicked');
                e.preventDefault();
                fileInput.click();
            });
            
            // File change handler
            fileInput.addEventListener('change', function(e) {
                console.log('File selected:', e.target.files[0]?.name);
                if (e.target.files[0]) {
                    alert('File selected: ' + e.target.files[0].name);
                    // For now, just log - don't process
                    console.log('File details:', {
                        name: e.target.files[0].name,
                        size: e.target.files[0].size,
                        type: e.target.files[0].type
                    });
                }
            });
            
            console.log('✅ Event handlers attached successfully');
        } else {
            console.error('❌ Required DOM elements not found');
        }
        
        console.log('🎉 INITIALIZATION COMPLETE');
        
    } catch (error) {
        console.error('❌ INITIALIZATION ERROR:', error);
        alert('Initialization error: ' + error.message);
    }
});

// Global error handler
window.addEventListener('error', function(event) {
    console.error('🔥 GLOBAL ERROR:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
    
    // Show user-friendly error
    if (event.message.includes('handleFileUpload')) {
        alert('❌ handleFileUpload error detected! This should NOT happen with the test version.');
    }
});

console.log('📝 Test app.js setup complete - waiting for DOM ready...');
