const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');

const app = express();
const port = process.env.PORT || 3000;

// Environment variables
const UPLOAD_FOLDER = process.env.UPLOAD_FOLDER || 'uploads';
const PUBLIC_FOLDER = process.env.PUBLIC_FOLDER || 'public';
const MAX_CONTENT_LENGTH = parseInt(process.env.MAX_CONTENT_LENGTH) || 5 * 1024 * 1024; // 5MB default

// Ensure upload directory exists
const fs = require('fs');
if (!fs.existsSync(UPLOAD_FOLDER)) {
    fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
}

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
    res.status(200).json({ status: 'ok' });
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, PUBLIC_FOLDER, 'index.html'));
});

// File upload endpoint
app.post('/run_analysis', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // TODO: Implement actual analysis logic here
    // For now, return a mock response
    res.json({
        success: true,
        message: 'Analysis completed successfully'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    console.log(`Upload folder: ${UPLOAD_FOLDER}`);
    console.log(`Public folder: ${PUBLIC_FOLDER}`);
    console.log(`Max file size: ${MAX_CONTENT_LENGTH} bytes`);
}); 