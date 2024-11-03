#!/usr/bin/env python3
import json
from datetime import datetime
import matplotlib
matplotlib.use('Agg')  # Set the backend to non-interactive before importing pyplot
import matplotlib.pyplot as plt

import seaborn as sns
import os
from pathlib import Path
import pandas as pd
import numpy as np
from matplotlib.dates import DateFormatter
from matplotlib.ticker import AutoMinorLocator


def get_optimal_colors(num_colors):
    """
    Returns optimally distinguishable colors based on number of variables.
    Colors are colorblind-friendly and high-contrast.
    """
    if num_colors == 2:
        # For 2 variables: Strong Blue and Orange
        return ['#0077BB',   # Blue
                '#EE7733']   # Orange
    elif num_colors == 3:
        # For 3 variables: Blue, Orange, and Green
        return ['#0077BB',   # Blue
                '#EE7733',   # Orange
                '#009988']   # Cyan/Teal
    elif num_colors == 4:
        # For 4 variables: Blue, Orange, Green, Red
        return ['#0077BB',   # Blue
                '#EE7733',   # Orange
                '#009988',   # Cyan/Teal
                '#CC3311']   # Red
    else:  # 5 colors
        # For 5 variables: Blue, Orange, Green, Red, Purple
        return ['#0077BB',   # Blue
                '#EE7733',   # Orange
                '#009988',   # Cyan/Teal
                '#CC3311',   # Red
                '#AA4499']   # Purple
    

def set_plot_style():
    """Set the visual style for the plots"""
    sns.set_style("whitegrid", {
        'grid.linestyle': '--',
        'grid.alpha': 0.6,
        'axes.edgecolor': '.8',
        'grid.color': '.8',
    })
    # Remove the color palette setting as we'll handle colors manually
    sns.set_context("notebook", rc={
        "lines.linewidth": 2.5,
        "axes.linewidth": 2,
        "grid.linewidth": 1.5
    })


def create_time_series_plot(df: pd.DataFrame, title: str, unit: str, output_path: str):
    """Create a beautiful time series plot using seaborn and matplotlib"""
    fig, ax = plt.subplots(figsize=(15, 8), dpi=300)
    
    # Get number of variables (excluding timestamp column)
    data_columns = [col for col in df.columns if col != 'timestamp']
    num_vars = len(data_columns)
    
    # Get optimal colors for this number of variables
    colors = get_optimal_colors(num_vars)
    
    # Plot each column (except timestamp)
    for idx, column in enumerate(data_columns):
        # First pass: plot the line with lower intensity
        line = sns.lineplot(
            data=df,
            x='timestamp',
            y=column,
            label=column,
            marker=None,             # No markers for the line
            linewidth=1,             # Thin line
            alpha=0.3,               # More transparent line
            ax=ax,                   # Specify the axis
            color=colors[idx]        # Use our optimal colors
        )
        
        # Second pass: plot just the points with higher intensity
        ax.plot(df['timestamp'], 
               df[column], 
               '.',                  # Dot marker
               markersize=1,         # Small dots
               alpha=1.0,            # Full intensity for points
               color=colors[idx],    # Use same color as line
               label='_nolegend_'    # Underscore prefix prevents legend entry
        )
    
        # Add confidence intervals if enough data points
        if len(df) > 10:
            rolling_mean = df[column].rolling(window=5, center=True).mean()
            rolling_std = df[column].rolling(window=5, center=True).std()
            ax.fill_between(
                df['timestamp'],
                rolling_mean - rolling_std,
                rolling_mean + rolling_std,
                alpha=0.2,
                color=colors[idx]    # Use same color for confidence interval
            )
    
    
    
    # Customize the plot
    ax.set_title(title, pad=20, fontsize=16, fontweight='bold')
    ax.set_xlabel('Time (HH:MM:SS)', fontsize=12, labelpad=10)
    ax.set_ylabel(f'Value ({unit})', fontsize=12, labelpad=10)
    
    # Format x-axis to show only hours, minutes, and seconds
    date_formatter = DateFormatter('%H:%M:%S')
    ax.xaxis.set_major_formatter(date_formatter)
    
    # Adjust x-axis ticks for better spacing
    plt.setp(ax.get_xticklabels(), rotation=0)  # Remove rotation since timestamps are shorter
    
    # Add legend
    ax.legend(
        bbox_to_anchor=(1.05, 1),
        loc='upper left',
        borderaxespad=0.,
        frameon=True,
        fancybox=True,
        shadow=True,
        fontsize=10
    )
    
    # Add grid
    ax.grid(True, which='major', linestyle='--', linewidth=0.8, alpha=0.5)
    ax.grid(True, which='minor', linestyle=':', linewidth=0.5, alpha=0.2)
    
    # Customize spines
    for spine in ax.spines.values():
        spine.set_linewidth(1.5)
    
    # Set background colors
    ax.set_facecolor('#f8f9fa')
    fig.patch.set_facecolor('white')
    
    # Add minor ticks for seconds
    ax.xaxis.set_minor_locator(AutoMinorLocator())
    
    # Adjust layout and save
    plt.tight_layout()
    plt.savefig(output_path, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close()
    return output_path

def process_time_series(json_file_path, output_dir='generated_graphs'):
    """Process time series data from JSON and generate enhanced visualizations"""
    set_plot_style()
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # Read JSON file
    with open(json_file_path, 'r') as file:
        data = json.load(file)
    
    # First, collect all timestamps from all fields
    all_timestamps = set()
    for field in data['fields']:
        for num in field.get('nums', []):
            try:
                timestamp = datetime.fromisoformat(num['createdAt'].replace('Z', '+00:00'))
                all_timestamps.add(timestamp)
            except (ValueError, KeyError) as e:
                print(f"Warning: Invalid timestamp in field {field['name']}: {e}")
    
    if not all_timestamps:
        raise ValueError("No valid timestamps found in the data")
    
    # Sort timestamps
    all_timestamps = sorted(list(all_timestamps))
    
    # Print time range information
    time_range = max(all_timestamps) - min(all_timestamps)
    print(f"Data time range: {time_range}")
    
    # Create DataFrame with timestamps as index
    df = pd.DataFrame(index=all_timestamps)
    df.index.name = 'timestamp'
    
    # Process each field
    for field in data['fields']:
        field_name = field['name']
        field_data = {}
        
        # Create a dictionary of timestamp: value pairs for this field
        for num in field.get('nums', []):
            try:
                timestamp = datetime.fromisoformat(num['createdAt'].replace('Z', '+00:00'))
                value = float(num['value'])
                field_data[timestamp] = value
            except (ValueError, KeyError) as e:
                print(f"Warning: Invalid data point in field {field_name}: {e}")
        
        # Convert to series and add to DataFrame
        series = pd.Series(field_data)
        df[field_name] = series
    
    # Reset index to make timestamp a column
    df = df.reset_index()
    
    # Drop any columns that are all NaN
    df = df.dropna(axis=1, how='all')
    
    # Generate filename
    safe_name = data['name'].replace(' ', '_').replace('/', '_')
    filename = os.path.join(output_dir, f"{safe_name}_combined.png")
    
    # Create and save the plot
    output_path = create_time_series_plot(
        df,
        f"{data['name']} - Time Series Analysis",
        data.get('unit', 'N/A'),
        filename
    )

    print(f"Generated enhanced visualization saved as {filename}")
    print(f"Total data points: {len(df)}")
    print(f"Fields plotted: {', '.join(df.columns[1:])}")  # Skip timestamp column
    
    return df, output_path

def do_datascience(input_data_file_path:str):
    df, image_file_path = process_time_series(input_data_file_path)
    return str(df.describe()), image_file_path

def main():
    """Example usage of the enhanced time series processor"""
    #json_file_path = "02_ev_01-δp.json"  # Replace with your JSON file path
    json_file_path = "data/1/co2-pres.json"
    print(do_datascience(json_file_path))
if __name__ == "__main__":
    main()
