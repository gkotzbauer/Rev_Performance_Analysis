import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
import seaborn as sns
import shap
import json

def load_and_prepare_data(file_path):
    # Load the Excel file
    df = pd.read_excel(file_path)
    
    # Forward fill NaN values for Year and Week
    df['Year'] = df['Year'].ffill()
    df['Week'] = df['Week'].ffill()
    
    # Fill NaN values in numeric columns with 0
    numeric_columns = ['% of Total Payments', 'Avg. Payment Per Visit', 'Avg. Chart E/M Weight',
                      'Charge Amount', 'Collection %', 'Total Payments', 'Visit Count', 'Visits With Lab Count']
    df[numeric_columns] = df[numeric_columns].fillna(0)
    
    # Group by Year, Week, Payer, and EM Group
    grouped = df.groupby(['Year', 'Week', 'Payer', 'EM Group']).agg({
        '% of Total Payments': 'sum',
        'Avg. Payment Per Visit': 'mean',
        'Avg. Chart E/M Weight': 'mean',
        'Charge Amount': 'sum',
        'Collection %': 'mean',
        'Total Payments': 'sum',
        'Visit Count': 'sum',
        'Visits With Lab Count': 'sum'
    }).reset_index()
    
    # Calculate percentage of visits with labs (avoid division by zero)
    grouped['Pct Visits With Labs'] = grouped.apply(
        lambda x: x['Visits With Lab Count'] / x['Visit Count'] if x['Visit Count'] > 0 else 0, 
        axis=1
    )
    
    # Create dummy variables for categorical features
    df_encoded = pd.get_dummies(grouped, columns=['Payer', 'EM Group'])
    
    return df_encoded, grouped

def train_model(df_encoded):
    # Prepare features and target
    X = df_encoded.drop(['Total Payments', 'Year', 'Week'], axis=1)
    y = df_encoded['Total Payments']
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scale the features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train Random Forest model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train_scaled, y_train)
    
    return model, X_train_scaled, X_test_scaled, y_train, y_test, scaler, X.columns

def generate_insights(model, df_encoded, original_df, scaler, feature_names):
    # Make predictions
    X = df_encoded.drop(['Total Payments', 'Year', 'Week'], axis=1)
    X_scaled = scaler.transform(X)
    predictions = model.predict(X_scaled)
    
    # Calculate absolute errors
    actual = df_encoded['Total Payments']
    absolute_errors = np.abs(predictions - actual)
    
    # Performance diagnostics
    performance = pd.DataFrame({
        'Year': df_encoded['Year'],
        'Week': df_encoded['Week'],
        'Actual': actual,
        'Predicted': predictions,
        'Absolute Error': absolute_errors,
        'Error %': ((predictions - actual) / actual * 100).round(1)
    })
    
    # Add performance classification
    performance['Performance'] = pd.cut(
        performance['Error %'],
        bins=[-float('inf'), -2.5, 2.5, float('inf')],
        labels=['Under Performed', 'Average Performance', 'Over Performed']
    )
    
    # Feature importance
    importance = pd.DataFrame({
        'Feature': feature_names,
        'Importance': model.feature_importances_
    }).sort_values('Importance', ascending=False)
    
    # Analyze specific payers
    bcbs_data = original_df[original_df['Payer'] == '2-BCBS']
    medicare_data = original_df[original_df['Payer'] == '3-MEDICARE']
    self_pay_data = original_df[original_df['Payer'] == '1-SELF PAY']
    
    # Generate insights
    insights = {
        'performance': performance.to_dict('records'),
        'feature_importance': importance.to_dict('records'),
        'payer_analysis': {
            'bcbs': {
                'avg_payment': bcbs_data['Total Payments'].mean(),
                'avg_visits': bcbs_data['Visit Count'].mean(),
                'collection_rate': bcbs_data['Collection %'].mean()
            },
            'medicare': {
                'avg_payment': medicare_data['Total Payments'].mean(),
                'avg_visits': medicare_data['Visit Count'].mean(),
                'collection_rate': medicare_data['Collection %'].mean()
            },
            'self_pay': {
                'avg_payment': self_pay_data['Total Payments'].mean(),
                'avg_visits': self_pay_data['Visit Count'].mean(),
                'collection_rate': self_pay_data['Collection %'].mean()
            }
        }
    }
    
    return insights

def main():
    # File paths
    input_file = "public/Weekly Performance Analsysis Export '24 & '24 W019.xlsx"
    output_file = "public/Revenue_Performance_Analysis_Results.xlsx"
    
    # Load and prepare data
    df_encoded, original_df = load_and_prepare_data(input_file)
    
    # Train model
    model, X_train_scaled, X_test_scaled, y_train, y_test, scaler, feature_names = train_model(df_encoded)
    
    # Generate insights
    insights = generate_insights(model, df_encoded, original_df, scaler, feature_names)
    
    # Save results to Excel
    with pd.ExcelWriter(output_file) as writer:
        pd.DataFrame(insights['performance']).to_excel(writer, sheet_name='Performance Analysis', index=False)
        pd.DataFrame(insights['feature_importance']).to_excel(writer, sheet_name='Feature Importance', index=False)
    
    # Save insights as JSON for HTML interface
    with open('public/analysis_insights.json', 'w') as f:
        json.dump(insights, f)

if __name__ == "__main__":
    main() 