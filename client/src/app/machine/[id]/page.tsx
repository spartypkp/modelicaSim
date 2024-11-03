"use client";

import { ArrowLeft, RefreshCw, Settings } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface MachineData {
	id: string;
	name: string;
	status: 'active' | 'inactive' | 'error';
	accuracy: number | null;
	updated_at: string;
	file_paths: {
		rawData: {
			fileName: string;
			uploadedAt: string;
			size: number;
		};
		visualizations: {
			path: string;
			type: string;
			generatedAt: string;
		}[];
		modelicaFiles: {
			path: string;
			version: string;
			generatedAt: string;
			accuracy: number;
		}[];
		logs: {
			path: string;
			type: string;
			createdAt: string;
		}[];
	};
	metadata: {
		originalFileName: string;
		uploadTimestamp: string;
		dataPoints: number;
		fields: string[];
	};
}

export default function MachineDashboard({ params }: { params: { id: string; }; }) {
	const [machineData, setMachineData] = useState<MachineData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchMachineData = async () => {
		setIsLoading(true);
		try {
			// Use the new API route
			const response = await fetch(`/api/machines/${params.id}`);

			if (!response.ok) {
				if (response.status === 404) {
					throw new Error('Machine not found');
				}
				throw new Error('Failed to fetch machine data');
			}

			const data = await response.json();
			setMachineData(data);
			setError(null);

			// If we need to fetch visualization from data science service
			if (data.file_paths?.visualizations?.[0]?.path) {
				const dsResponse = await fetch(`http://localhost:8080/${data.file_paths.visualizations[0].path}`);
				if (!dsResponse.ok) {
					console.error('Failed to fetch visualization');
				}
			}
		} catch (error) {
			setError(error instanceof Error ? error.message : 'Failed to load machine data');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchMachineData();
	}, [params.id]);

	const handleRefresh = () => {
		fetchMachineData();
	};

	const getLatestModelInfo = () => {
		if (!machineData?.file_paths.modelicaFiles.length) return null;
		return machineData.file_paths.modelicaFiles[machineData.file_paths.modelicaFiles.length - 1];
	};

	const getTimeSinceUpdate = () => {
		if (!machineData?.updated_at) return 'Never';
		const lastUpdate = new Date(machineData.updated_at);
		const now = new Date();
		const diffMinutes = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));

		if (diffMinutes < 1) return 'Just now';
		if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
		if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
		return `${Math.floor(diffMinutes / 1440)} days ago`;
	};

	return (
		<main className="min-h-screen bg-gray-50">
			{/* Header with navigation */}
			<div className="border-b bg-white shadow-sm">
				<div className="px-4 sm:px-6 lg:px-8">
					<div className="flex h-16 items-center justify-between">
						<div className="flex items-center">
							<Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
								<ArrowLeft className="h-5 w-5 mr-2" />
								Back to Machines
							</Link>
						</div>
						<div className="flex items-center space-x-4">
							<button
								onClick={handleRefresh}
								className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
							>
								<RefreshCw className="h-4 w-4 mr-2" />
								Refresh Data
							</button>
							<button className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900">
								<Settings className="h-4 w-4 mr-2" />
								Settings
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Main dashboard content */}
			<div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
				{isLoading ? (
					<div className="flex justify-center items-center h-64">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
					</div>
				) : error ? (
					<div className="text-center py-12">
						<p className="text-red-600">{error}</p>
					</div>
				) : machineData && (
					<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
						{/* Left panel - Visualization */}
						<div className="space-y-6">
							<div className="bg-white rounded-lg shadow">
								<div className="p-6">
									<div className="flex justify-between items-center mb-4">
										<h2 className="text-xl font-semibold text-gray-900">Real-Time Data</h2>
										<span className="text-sm text-gray-500">
											{machineData.metadata.dataPoints} data points
										</span>
									</div>
									{machineData.file_paths.visualizations[0]?.path ? (
										<div className="mt-4 w-full h-96 overflow-hidden rounded-lg">
											<img
												src={`http://localhost:8080/${machineData.file_paths.visualizations[0].path}`}
												alt="Data Visualization"
												className="w-full h-full object-contain"
											/>
										</div>
									) : (
										<div className="mt-4 flex items-center justify-center h-96 bg-gray-100 rounded-lg">
											<p className="text-gray-600">No visualization available</p>
										</div>
									)}
								</div>
							</div>

							{/* Fields Overview */}
							<div className="bg-white rounded-lg shadow">
								<div className="p-6">
									<h2 className="text-xl font-semibold text-gray-900 mb-4">Data Fields</h2>
									<div className="grid grid-cols-2 gap-4">
										{machineData.metadata.fields.map((field, index) => (
											<div key={index} className="p-3 bg-gray-50 rounded">
												<p className="text-sm text-gray-900">{field}</p>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>

						{/* Right panel - Model Status and Controls */}
						<div className="space-y-6">
							{/* Model status section */}
							<div className="bg-white rounded-lg shadow">
								<div className="p-6">
									<h2 className="text-xl font-semibold text-gray-900">Modelica Model Status</h2>
									<div className="mt-6 space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div className="p-4 bg-gray-50 rounded">
												<h3 className="text-sm font-medium text-gray-500">Status</h3>
												<p className="mt-1 text-sm text-gray-900">{machineData.status}</p>
											</div>
											<div className="p-4 bg-gray-50 rounded">
												<h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
												<p className="mt-1 text-sm text-gray-900">{getTimeSinceUpdate()}</p>
											</div>
											<div className="p-4 bg-gray-50 rounded">
												<h3 className="text-sm font-medium text-gray-500">Accuracy</h3>
												<p className="mt-1 text-sm text-gray-900">
													{getLatestModelInfo()?.accuracy.toFixed(1)}%
												</p>
											</div>
											<div className="p-4 bg-gray-50 rounded">
												<h3 className="text-sm font-medium text-gray-500">Model Version</h3>
												<p className="mt-1 text-sm text-gray-900">
													{getLatestModelInfo()?.version || 'No model yet'}
												</p>
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* Model controls */}
							<div className="bg-white rounded-lg shadow">
								<div className="p-6">
									<h2 className="text-xl font-semibold text-gray-900">Model Controls</h2>
									<div className="mt-6 space-y-4">
										<button
											className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
											disabled={machineData.status === 'error'}
										>
											Generate New Model
										</button>
										<button
											className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
											disabled={!machineData.file_paths.modelicaFiles.length}
										>
											View Model History ({machineData.file_paths.modelicaFiles.length})
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</main>
	);
}