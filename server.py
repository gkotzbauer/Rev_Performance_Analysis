from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from analyze_revenue import load_and_prepare_data, train_model, generate_insights, NumpyEncoder
import json
import logging
import traceback

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder=os.getenv('PUBLIC_FOLDER', 'public'))
CORS(app)  # Enable CORS for all routes
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB max file size

# Ensure required directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.static_folder, exist_ok=True)

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy'}), 200

@app.route('/run_analysis', methods=['POST'])
def run_analysis():
    filepath = None
    try:
        if 'file' not in request.files:
            logger.error("No file in request")
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            logger.error("Empty filename")
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith('.xlsx'):
            logger.error(f"Invalid file type: {file.filename}")
            return jsonify({'error': 'Only Excel files are supported'}), 400
        
        # Save the uploaded file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        logger.info(f"Saving file to: {filepath}")
        file.save(filepath)
        
        if not os.path.exists(filepath):
            logger.error(f"File not saved successfully: {filepath}")
            return jsonify({'error': 'Failed to save file'}), 500
        
        # Run the analysis
        logger.info("Starting data preparation")
        try:
            df_encoded, original_df = load_and_prepare_data(filepath)
        except Exception as e:
            logger.error(f"Error in data preparation: {str(e)}", exc_info=True)
            return jsonify({'error': f'Error preparing data: {str(e)}'}), 500
        
        logger.info("Training model")
        try:
            model, X_train_scaled, X_test_scaled, y_train, y_test, scaler, feature_names = train_model(df_encoded)
        except Exception as e:
            logger.error(f"Error in model training: {str(e)}", exc_info=True)
            return jsonify({'error': f'Error training model: {str(e)}'}), 500
        
        logger.info("Generating insights")
        try:
            insights = generate_insights(model, df_encoded, original_df, scaler, feature_names)
        except Exception as e:
            logger.error(f"Error generating insights: {str(e)}", exc_info=True)
            return jsonify({'error': f'Error generating insights: {str(e)}'}), 500
        
        # Save insights to JSON file
        insights_path = os.path.join(app.static_folder, 'analysis_insights.json')
        logger.info(f"Saving insights to: {insights_path}")
        try:
            with open(insights_path, 'w') as f:
                json.dump(insights, f, cls=NumpyEncoder)
        except Exception as e:
            logger.error(f"Error saving insights: {str(e)}", exc_info=True)
            return jsonify({'error': f'Error saving results: {str(e)}'}), 500
        
        return jsonify({'success': True})
    
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        return jsonify({'error': str(e)}), 500
    
    finally:
        # Clean up the uploaded file
        if filepath and os.path.exists(filepath):
            logger.info(f"Cleaning up file: {filepath}")
            try:
                os.remove(filepath)
            except Exception as e:
                logger.error(f"Error cleaning up file: {str(e)}")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Starting server on port {port}...")
    app.run(host='0.0.0.0', port=port) 