const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Environment variables
const UPLOAD_FOLDER = process.env.UPLOAD_FOLDER || path.join(__dirname, 'uploads');
const PUBLIC_FOLDER = process.env.PUBLIC_FOLDER || path.join(__dirname, 'public');
const MAX_CONTENT_LENGTH = parseInt(process.env.MAX_CONTENT_LENGTH) || 5 * 1024 * 1024; // 5MB default

// Ensure required directories exist
[UPLOAD_FOLDER, PUBLIC_FOLDER].forEach(dir => {
    if (!fs.existsSync(dir)) {
        console.log(`Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
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

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Routes
app.get('/', (req, res) => {
    const indexPath = path.join(PUBLIC_FOLDER, 'index.html');
    if (!fs.existsSync(indexPath)) {
        console.error(`Index file not found at: ${indexPath}`);
        return res.status(500).send('Server configuration error');
    }
    res.sendFile(indexPath);
});

// File upload endpoint
app.post('/run_analysis', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    try {
        // TODO: Implement actual analysis logic here
        // For now, return a mock response
        res.json({
            success: true,
            message: 'Analysis completed successfully',
            file: {
                originalname: req.file.originalname,
                size: req.file.size,
                path: req.file.path
            }
        });
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Analysis failed' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    console.log(`Upload folder: ${UPLOAD_FOLDER}`);
    console.log(`Public folder: ${PUBLIC_FOLDER}`);
    console.log(`Max file size: ${MAX_CONTENT_LENGTH} bytes`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 