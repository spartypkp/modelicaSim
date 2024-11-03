from flask import Flask, render_template, request, redirect, url_for
import datetime
from datetime import date
from werkzeug.utils import secure_filename
from flask import jsonify
import os
from pydantic import ValidationError 
from typing import List, Optional
from flask_cors import CORS   
from dataScience import do_datascience as process_data  # renamed to avoid naming conflict
import json
import uuid
from flask import send_from_directory
from runner import run_modelica_pipeline

# If localhost won't connect: chrome://net-internals/#sockets
app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'generated_graphs')

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route("/api/home", methods=['GET'])
def return_home():
    return jsonify({
        'message': "Shit! Fuck! Bitch!",
         
    })

@app.route('/generated_graphs/<path:filename>')
def serve_image(filename):
    print(f"Serving image: {filename}")
    print(f"Looking in directory: {UPLOAD_FOLDER}")  # Add this debug line
    try:
        return send_from_directory(UPLOAD_FOLDER, filename)
    except Exception as e:
        print(f"Error serving file: {str(e)}")  # Add this debug line
        return str(e), 404

@app.route("/api/datascience", methods=['POST'])
def do_datascience():
    data = request.get_json()
    
    if not data or 'jsonData' not in data:
        return jsonify({
            'error': 'No JSON data provided in request'
        }), 400
    
    try:
        # Generate unique filename
        temp_filename = f"{uuid.uuid4()}.json"
        file_path = os.path.join(UPLOAD_FOLDER, temp_filename)
        
        # Save JSON data to temporary file
        with open(file_path, 'w') as f:
            json.dump(data['jsonData'], f)
        
        # Process the data using existing function
        df_describe, image_file_path = process_data(file_path)
        run_modelica_pipeline(file_path)
        
        # Clean up - remove temporary file
        
        
        return jsonify({
            'success': True,
            'machineData': df_describe,
            'visualizationPath': f"/generated_graphs/{os.path.basename(image_file_path)}"  # Modified this line

        })
        
    except Exception as e:
        # Clean up in case of error
        print(f"Error: {e}")
        if 'file_path' in locals():
            try:
                os.remove(file_path)
            except:
                pass
        return jsonify({
            'error': str(e)
        }), 500
    


if __name__ == '__main__':
    app.run(debug=True, port=8080)
