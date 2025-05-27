# Healthcare Revenue Performance Analysis

This project analyzes healthcare revenue performance data using a Random Forest regression model to identify key performance factors and generate insights.

## Setup

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Place your input Excel file in the `public` folder:
- Source file: `Weekly Performance Analsysis Export '24 & '24 W019.xlsx`

## Running the Analysis

Run the analysis script:
```bash
python analyze_revenue.py
```

The script will:
1. Load and preprocess the data
2. Train a Random Forest regression model
3. Generate performance insights
4. Create an output Excel file with the results

## Output

The analysis will generate `Revenue_Performance_Analysis_Results.xlsx` with two sheets:
1. Performance Analysis: Contains weekly performance metrics and insights
2. Feature Importance: Shows the relative importance of each factor in predicting revenue

## Features

- Weekly performance analysis by payer and E/M code group
- Performance diagnostics (Under Performed, Average Performance, Over Performed)
- Detailed analysis for Aetna and BCBS performance
- Identification of what went well and what could be improved
- Feature importance analysis

## Notes

- The model uses a 2.5% threshold for performance classification
- BCBS and Aetna are given special attention in the analysis
- Lab visits are downweighted in the analysis as they contribute less to revenue

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
