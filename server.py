from flask import Flask, request, jsonify, send_from_directory
import os
from werkzeug.utils import secure_filename
from analyze_revenue import load_and_prepare_data, train_model, generate_insights
import json

app = Flask(__name__, static_folder='public')
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    return send_from_directory('public', 'index.html')

@app.route('/run_analysis', methods=['POST'])
def run_analysis():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not file.filename.endswith('.xlsx'):
        return jsonify({'error': 'Only Excel files are supported'}), 400
    
    # Save the uploaded file
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    try:
        # Run the analysis
        df_encoded, original_df = load_and_prepare_data(filepath)
        model, X_train_scaled, X_test_scaled, y_train, y_test, scaler, feature_names = train_model(df_encoded)
        insights = generate_insights(model, df_encoded, original_df, scaler, feature_names)
        
        # Save insights to JSON file
        with open('public/analysis_insights.json', 'w') as f:
            json.dump(insights, f)
        
        return jsonify({'success': True})
    
    except Exception as e:
        print(f"Error during analysis: {str(e)}")  # Add logging
        return jsonify({'error': str(e)}), 500
    
    finally:
        # Clean up the uploaded file
        if os.path.exists(filepath):
            os.remove(filepath)

if __name__ == '__main__':
    app.run(debug=True, port=5000) 