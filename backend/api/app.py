from flask import Flask, jsonify, abort
from flask_cors import CORS
import os
import json

app = Flask(__name__)
CORS(app)

# Base path for simulation data
SIMULATION_DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'simulation')


def get_epochs_file_path(simulation_id):
    """Get the path to the epochs.jsonl file for a given simulation ID."""
    file_path = os.path.join(SIMULATION_DATA_PATH, simulation_id, 'epochs.jsonl')
    if not os.path.exists(file_path):
        abort(404, description=f"Simulation {simulation_id} not found")
    return file_path


def count_epochs(file_path):
    """Count the total number of lines in the JSONL file."""
    with open(file_path, 'r') as f:
        return sum(1 for _ in f)


def get_epoch_by_number(file_path, epoch_number):
    """Get a specific epoch by its line number (0-indexed)."""
    with open(file_path, 'r') as f:
        for i, line in enumerate(f):
            if i == epoch_number:
                return json.loads(line)
    return None


@app.route('/api/simulation/<simulation_id>/epoch', methods=['GET'])
def get_epoch_count(simulation_id):
    """
    Get the total number of epochs for a simulation.

    Returns:
        JSON object with the total count of epochs
    """
    file_path = get_epochs_file_path(simulation_id)
    total = count_epochs(file_path)

    return jsonify({
        'simulation_id': simulation_id,
        'total_epochs': total
    })


@app.route('/api/simulation/<simulation_id>/epoch/<int:epoch_number>', methods=['GET'])
def get_epoch(simulation_id, epoch_number):
    """
    Get a specific epoch by its number (0-indexed).

    Args:
        simulation_id: The simulation ID (timestamp folder name)
        epoch_number: The epoch number (0-indexed, corresponding to line number)

    Returns:
        JSON object containing the epoch data
    """
    file_path = get_epochs_file_path(simulation_id)

    # Get the epoch data
    epoch_data = get_epoch_by_number(file_path, epoch_number)

    if epoch_data is None:
        abort(404, description=f"Epoch {epoch_number} not found")

    return jsonify(epoch_data)


@app.route('/api/simulations', methods=['GET'])
def list_simulations():
    """
    List all available simulations.

    Returns:
        JSON object with list of simulation IDs
    """
    if not os.path.exists(SIMULATION_DATA_PATH):
        return jsonify({'simulations': []})

    simulations = []
    for item in os.listdir(SIMULATION_DATA_PATH):
        item_path = os.path.join(SIMULATION_DATA_PATH, item)
        epochs_file = os.path.join(item_path, 'epochs.jsonl')
        if os.path.isdir(item_path) and os.path.exists(epochs_file):
            epoch_count = count_epochs(epochs_file)
            simulations.append({
                'id': item,
                'epoch_count': epoch_count
            })

    # Sort by ID (timestamp) descending
    simulations.sort(key=lambda x: x['id'], reverse=True)

    return jsonify({'simulations': simulations})


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': str(error.description)}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000, use_reloader=False)
