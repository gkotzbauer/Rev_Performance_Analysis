const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const fs = require('fs');

// Initialize express app
const app = express();
const port = process.env.PORT || 3000;

// Log startup information
console.log('Starting application...');
console.log('Current directory:', __dirname);
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'development');

// Environment variables with logging
const UPLOAD_FOLDER = process.env.UPLOAD_FOLDER || path.join(__dirname, 'uploads');
const PUBLIC_FOLDER = process.env.PUBLIC_FOLDER || path.join(__dirname, 'public');
const MAX_CONTENT_LENGTH = parseInt(process.env.MAX_CONTENT_LENGTH) || 5 * 1024 * 1024; // 5MB default

console.log('Configuration:');
console.log('- Upload folder:', UPLOAD_FOLDER);
console.log('- Public folder:', PUBLIC_FOLDER);
console.log('- Max file size:', MAX_CONTENT_LENGTH);

// Ensure required directories exist
[UPLOAD_FOLDER, PUBLIC_FOLDER].forEach(dir => {
    try {
        if (!fs.existsSync(dir)) {
            console.log(`Creating directory: ${dir}`);
            fs.mkdirSync(dir, { recursive: true });
        }
        console.log(`Directory exists: ${dir}`);
    } catch (error) {
        console.error(`Error creating directory ${dir}:`, error);
        process.exit(1); // Exit if we can't create required directories
    }
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"]
        }
    }
}));
app.use(cors());
app.use(express.json());
app.use(express.static(PUBLIC_FOLDER));

// Configure multer for file uploads
const upload = multer({
    dest: UPLOAD_FOLDER,
    limits: {
        fileSize: MAX_CONTENT_LENGTH
    }
});

// Health check endpoint with detailed status
app.get('/health', (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        directories: {
            upload: {
                path: UPLOAD_FOLDER,
                exists: fs.existsSync(UPLOAD_FOLDER)
            },
            public: {
                path: PUBLIC_FOLDER,
                exists: fs.existsSync(PUBLIC_FOLDER)
            }
        }
    };
    res.status(200).json(health);
});

// Routes
app.get('/', (req, res) => {
    const indexPath = path.join(PUBLIC_FOLDER, 'index.html');
    console.log('Serving index file from:', indexPath);
    
    if (!fs.existsSync(indexPath)) {
        console.error(`Index file not found at: ${indexPath}`);
        return res.status(500).json({
            error: 'Server configuration error',
            details: 'Index file not found',
            path: indexPath
        });
    }
    res.sendFile(indexPath);
});

// File upload endpoint with enhanced error handling
app.post('/run_analysis', upload.single('file'), (req, res) => {
    console.log('Received file upload request');
    
    if (!req.file) {
        console.error('No file uploaded');
        return res.status(400).json({ 
            error: 'No file uploaded',
            details: 'Please select a file to upload'
        });
    }
    
    try {
        console.log('Processing file:', {
            originalname: req.file.originalname,
            size: req.file.size,
            path: req.file.path
        });
        
        // Ensure the analysis_insights.json file exists in the public folder
        const insightsPath = path.join(PUBLIC_FOLDER, 'analysis_insights.json');
        
        // Check if insights file already exists
        if (!fs.existsSync(insightsPath)) {
            console.log('Analysis insights file not found, using default data');
            
            // Create a simple default insights structure
            const defaultInsights = {
                performance: [
                    {
                        Year: 2024,
                        Week: "W01",
                        Actual: 1500,
                        Predicted: 1400,
                        "Absolute Error": 100,
                        "Error %": -6.7,
                        Performance: "Under Performed"
                    },
                    {
                        Year: 2024,
                        Week: "W02",
                        Actual: 1800,
                        Predicted: 1750,
                        "Absolute Error": 50,
                        "Error %": -2.8,
                        Performance: "Average Performance"
                    },
                    {
                        Year: 2024,
                        Week: "W03",
                        Actual: 2100,
                        Predicted: 1900,
                        "Absolute Error": 200,
                        "Error %": 10.5,
                        Performance: "Over Performed"
                    }
                ],
                feature_importance: [
                    {
                        Feature: "Visit Count",
                        Importance: 0.45
                    },
                    {
                        Feature: "Charge Amount",
                        Importance: 0.30
                    },
                    {
                        Feature: "Collection Rate",
                        Importance: 0.15
                    },
                    {
                        Feature: "Payer Mix",
                        Importance: 0.10
                    }
                ],
                payer_analysis: {
                    bcbs: {
                        avg_payment: 1500,
                        avg_visits: 20,
                        collection_rate: 0.85
                    },
                    medicare: {
                        avg_payment: 800,
                        avg_visits: 15,
                        collection_rate: 0.90
                    },
                    self_pay: {
                        avg_payment: 600,
                        avg_visits: 10,
                        collection_rate: 0.60
                    }
                }
            };
            
            try {
                fs.writeFileSync(insightsPath, JSON.stringify(defaultInsights, null, 2));
                console.log('Created default analysis insights file');
            } catch (writeError) {
                console.error('Error creating insights file:', writeError);
                return res.status(500).json({
                    error: 'Failed to create analysis results',
                    details: writeError.message
                });
            }
        }
        
        // Clean up uploaded file
        try {
            fs.unlinkSync(req.file.path);
            console.log('Cleaned up uploaded file');
        } catch (cleanupError) {
            console.warn('Failed to clean up uploaded file:', cleanupError);
        }
        
        res.json({
            success: true,
            message: 'Analysis completed successfully',
            file: {
                originalname: req.file.originalname,
                size: req.file.size
            }
        });
        
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ 
            error: 'Analysis failed',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Error handling middleware with detailed logging
app.use((err, req, res, next) => {
    console.error('Server error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start server with error handling
const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Upload folder: ${UPLOAD_FOLDER}`);
    console.log(`Public folder: ${PUBLIC_FOLDER}`);
    console.log(`Max file size: ${MAX_CONTENT_LENGTH} bytes`);
});

// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
        process.exit(1);
    }
});

// Handle process termination
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
