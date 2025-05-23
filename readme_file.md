# Healthcare Revenue Performance Analyzer

Professional-grade analytics tool for healthcare clinic revenue optimization.

## Features

✅ **Drag & Drop File Upload** - Easy Excel file processing  
✅ **Statistical Analysis** - Proper train/test methodology  
✅ **Performance Classification** - Realistic weekly performance assessment  
✅ **Visual Dashboards** - Interactive charts and graphs  
✅ **Export Capabilities** - Excel, CSV, and image exports  
✅ **Mobile Responsive** - Works on all devices  
✅ **Professional UI** - Clean, clinic-owner focused interface  

## Quick Deploy to Render

### Option 1: One-Click Deploy
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Option 2: Manual Deploy

1. **Fork this repository** to your GitHub account

2. **Connect to Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure deployment:**
   ```
   Name: healthcare-revenue-analyzer
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Set environment variables:**
   ```
   NODE_ENV=production
   PORT=3000
   ```

5. **Deploy** - Render will automatically build and deploy

## Deploy to Other Platforms

### Heroku
```bash
# Install Heroku CLI, then:
heroku create your-app-name
heroku config:set NODE_ENV=production
git push heroku main
```

### Vercel
```bash
# Install Vercel CLI, then:
vercel --prod
```

### Netlify
```bash
# Install Netlify CLI, then:
netlify deploy --prod --dir=public
```

### DigitalOcean App Platform
1. Create new app from GitHub repository
2. Set build command: `npm install`
3. Set run command: `npm start`
4. Deploy

## Local Development

```bash
# Clone repository
git clone <your-repo-url>
cd healthcare-revenue-analyzer

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

## File Structure

```
healthcare-revenue-analyzer/
├── package.json          # Dependencies and scripts
├── server.js             # Express server
├── Dockerfile            # Container configuration
├── .env.example          # Environment variables template
├── public/
│   └── index.html        # Main application
├── docs/
│   └── user-guide.md     # User documentation
└── README.md             # This file
```

## Usage Instructions

1. **Upload Data**: Drag and drop your Weekly Performance Analysis Excel file
2. **View Results**: Automatic analysis with charts and insights
3. **Get Recommendations**: Clear action items for revenue optimization
4. **Export Reports**: Download complete Excel reports or individual charts

## Expected File Format

Your Excel file should contain:
- **Year of Visit Service Date**
- **ISO Week of Visit Service Date**  
- **Primary Financial Class** (Payer)
- **Group E/M codes**
- **Charge Amount**
- **Collection %**
- **Payments + Expected** (Total Payments)
- **Visit Count**
- **Visits With Lab Count**

## Technical Specifications

- **Frontend**: Pure HTML5, CSS3, JavaScript
- **Charts**: Chart.js for visualizations
- **Excel Processing**: SheetJS for file parsing
- **Statistics**: Custom correlation and regression analysis
- **Backend**: Node.js with Express (minimal API)
- **Deployment**: Static-friendly with optional server features

## Security Features

✅ **Content Security Policy** - XSS protection  
✅ **File Type Validation** - Only Excel files accepted  
✅ **Client-side Processing** - Data never leaves the browser  
✅ **HTTPS Enforcement** - Secure data transmission  
✅ **Input Sanitization** - Protection against malicious uploads  

## Performance Optimization

- **Lazy Loading** - Charts load on demand
- **File Compression** - Gzip compression enabled
- **Caching** - Static assets cached for performance
- **Mobile Optimization** - Responsive design for all devices

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Support

For technical support or feature requests, please contact your development team.

## License

MIT License - See LICENSE file for details.

---

**Built for clinic owners who need clear, actionable revenue insights.**