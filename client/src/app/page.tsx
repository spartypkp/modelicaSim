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
	machineData: MachineData | null;
	isProcessing: boolean;
	error: string | null;
}

export default function Home() {
	// State management
	const [processedData, setProcessedData] = useState<ProcessedData>({
		machineData: null,
		isProcessing: false,
		error: null
	});

	// Handle file upload
	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setProcessedData(prev => ({ ...prev, isProcessing: true, error: null }));

		try {
			const text = await file.text();
			const json = JSON.parse(text);
			setProcessedData({
				machineData: json,
				isProcessing: false,
				error: null
			});
		} catch (error) {
			setProcessedData({
				machineData: null,
				isProcessing: false,
				error: 'Error processing file. Please ensure it is valid JSON.'
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

					{/* Data visualization section - will be added next */}
					{processedData.machineData && (
						<div className="p-6 bg-white rounded-lg shadow">
							<h2 className="mb-4 text-xl font-semibold text-gray-900">Data Visualization</h2>
							<p className="text-gray-600">Visualization components will be added here</p>
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
									<div className="p-4 bg-gray-50 rounded">
										<h3 className="text-sm font-medium text-gray-900">Machine Name</h3>
										<p className="mt-1 text-sm text-gray-600">{processedData.machineData.name}</p>
									</div>
									<div className="p-4 bg-gray-50 rounded">
										<h3 className="text-sm font-medium text-gray-900">Number of Fields</h3>
										<p className="mt-1 text-sm text-gray-600">
											{processedData.machineData.fields.length} fields detected
										</p>
									</div>
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



