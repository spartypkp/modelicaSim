# ModelicaSim: Digital Twin Platform

## Overview
ModelicaSim is a digital twin platform created during the AGI House AI x Physics Hackathon, where it won 3rd place. This application allows users to upload machine data, visualize it, and automatically generate Modelica simulation models that create a digital twin of the physical system.

## Project Structure
The project is structured as a full-stack application with two main components:

- **Flask Backend** (`/server`): Handles data processing, model generation, and Modelica simulation
- **Next.js Frontend** (`/client`): Provides a user-friendly interface for uploading data and viewing digital twins

## Key Features

### 1. Data Upload and Visualization
- Upload JSON time-series data of physical systems
- Automatic data visualization with interactive graphs
- Statistical analysis of uploaded data

### 2. Automated Model Generation
- AI-powered Modelica code generation using Claude 3.5 Sonnet
- Iterative model refinement to improve accuracy
- Visual comparison between real data and simulated results

### 3. Digital Twin Dashboard
- Track multiple machines and their models
- Real-time data visualizations
- Performance metrics for model accuracy

## Technologies Used

### Backend
- Python Flask for API endpoints
- OMPython for Modelica simulation
- Anthropic Claude AI for model generation
- Pandas and Matplotlib for data analysis and visualization

### Frontend
- Next.js React framework
- TypeScript for type-safe code
- Tailwind CSS for styling

## Getting Started

### Prerequisites
- Python 3.12
- Node.js (latest LTS)
- OpenModelica (for simulations)

### Installation

1. **Create a virtual environment and install Python dependencies**:
   ```bash
   python3.12 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Install Node.js dependencies**:
   ```bash
   cd client
   npm install
   ```

### Running the Application

1. **Start the Flask backend**:
   ```bash
   cd server
   python -m flask run --port=8080 --debug
   ```

2. **Start the Next.js frontend**:
   ```bash
   cd client
   npm run dev
   ```

3. **Using the convenience scripts**:
   ```bash
   # From the client directory:
   npm run setup-env    # Set up Python environment
   npm run start-flask  # Start Flask server
   npm run start-next   # Start Next.js frontend
   npm run start        # Start both servers simultaneously
   ```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Click "New Machine" to upload machine data (in JSON format)
3. View the generated visualization
4. Trigger Modelica model generation to create a digital twin
5. Compare the digital twin simulation to the original data

## Project Structure Details

- **`/server`**: Flask backend
  - `app.py`: Main Flask application
  - `sim.py`: Modelica simulation interface
  - `generateModelica.py`: AI-powered model generation
  - `dataScience.py`: Data processing and visualization
  - `pydanticModels.py`: Data models
  - `utilityFunctions.py`: Helper functions

- **`/client`**: Next.js frontend
  - `/src/app`: Page components
  - `/src/components`: Reusable UI components
  - `/src/lib`: Utility functions

## Contributing
As this was a hackathon project, it is shared primarily for reference. Feel free to fork and extend the functionality!

## License
Created during the AGI House AI x Physics Hackathon. Please respect the original creators' work.
