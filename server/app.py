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


# If localhost won't connect: chrome://net-internals/#sockets
app = Flask(__name__)
CORS(app)


@app.route("/api/home", methods=['GET'])
def return_home():
    return jsonify({
        'message': "Shit! Fuck! Bitch!",
         
    })


@app.route("/api/datascience", methods=['POST'])
def do_datascience():
    data = request.get_json()
    
    if not data or 'filePath' not in data:
        return jsonify({
            'error': 'No filePath provided in request'
        }), 400
    
    try:
        # Call the data science function with the file path
        result = process_data(data['filePath'])
        
        return jsonify({
            'success': True,
            'result': result
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=8080)
