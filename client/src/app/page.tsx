"use client";

import { Upload } from 'lucide-react';
import { useState } from 'react';

// TypeScript interfaces
interface MachineData {
	id: string;
	name: string;
	fields: {
		id: string;
		name: string;
		nums: {
			value: number;
			createdAt: string;
		}[];
	}[];
}

interface ProcessedData {
	machineData: string | null;
	isProcessing: boolean;
	error: string | null;
	visualizationPath: string | null; // Add this line
}

export default function Home() {
	// State management
	const [processedData, setProcessedData] = useState<ProcessedData>({
		machineData: null,
		isProcessing: false,
		error: null,
		visualizationPath: null
	});

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setProcessedData(prev => ({ ...prev, isProcessing: true, error: null }));

		try {
			// First validate that it's actually JSON
			const text = await file.text();
			const jsonData = JSON.parse(text);

			const response = await fetch('http://localhost:8080/api/datascience', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ jsonData }),
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.statusText}`);
			}

			const result = await response.json();

			setProcessedData({
				machineData: result.machineData,
				isProcessing: false,
				error: null,
				visualizationPath: result.visualizationPath // Assuming this is the path returned from the API
			});
		} catch (error) {
			setProcessedData({
				machineData: null,
				isProcessing: false,
				error: error instanceof Error ? error.message : 'Error processing file. Please ensure it is valid JSON.',
				visualizationPath: null
			});
		}
	};

	return (
		<main className="min-h-screen p-8 bg-gray-50">
			{/* Header */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900">Machine Learning Digital Twin Dashboard</h1>
				<p className="mt-2 text-gray-600">Upload machine data to generate Modelica simulations</p>
			</div>

			{/* Main content area */}
			<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
				{/* Left panel - Data Upload and Visualization */}
				<div className="space-y-6">
					{/* File upload section */}
					<div className="p-6 bg-white rounded-lg shadow">
						<h2 className="mb-4 text-xl font-semibold text-gray-900">Data Upload</h2>

						{/* Upload button */}
						<div className="flex items-center justify-center w-full">
							<label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
								<div className="flex flex-col items-center justify-center pt-5 pb-6">
									<Upload className="w-12 h-12 mb-4 text-gray-500" />
									<p className="mb-2 text-sm text-gray-500">
										<span className="font-semibold">Click to upload</span> or drag and drop
									</p>
									<p className="text-xs text-gray-500">JSON files only</p>
								</div>
								<input
									type="file"
									className="hidden"
									accept=".json"
									onChange={handleFileUpload}
								/>
							</label>
						</div>

						{/* Status messages */}
						{processedData.isProcessing && (
							<p className="mt-4 text-sm text-blue-600">Processing data...</p>
						)}
						{processedData.error && (
							<p className="mt-4 text-sm text-red-600">{processedData.error}</p>
						)}
					</div>

					{/* Data visualization section */}
					{processedData.machineData && (
						<div className="p-6 bg-white rounded-lg shadow">
							<h2 className="mb-4 text-xl font-semibold text-gray-900">Data Visualization</h2>
							{processedData.visualizationPath ? (
								<div className="w-full h-64 overflow-hidden rounded-lg">
									<img
										src={`http://localhost:8080/${processedData.visualizationPath}`}
										alt="Data Visualization"
										className="w-full h-full object-contain"
									/>
								</div>
							) : (
								<div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
									<p className="text-gray-600">Processing visualization...</p>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Right panel - Model Generation and Status */}
				<div className="space-y-6">
					{processedData.machineData && (
						<>
							{/* Model status section */}
							<div className="p-6 bg-white rounded-lg shadow">
								<h2 className="mb-4 text-xl font-semibold text-gray-900">Modelica Generation Status</h2>
								<div className="space-y-4">
									<p>{processedData.machineData}</p>
								</div>
							</div>

							{/* Model controls section */}
							<div className="p-6 bg-white rounded-lg shadow">
								<h2 className="mb-4 text-xl font-semibold text-gray-900">Model Controls</h2>
								<button
									className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
									onClick={() => {/* Will add generation logic */ }}
								>
									Generate Modelica Model
								</button>
							</div>
						</>
					)}
				</div>
			</div>
		</main>
	);
}



