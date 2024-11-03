'use client';

import { ArrowLeft, ArrowRight, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useState } from 'react';

export interface ModelIteration {
	version: string;
	status: 'running' | 'completed' | 'failed';
	accuracy: number | null;
	visualizationPath: string | null;
	modelicaCode: string | null;
	error?: string;
	timestamp: string;
}

interface ModelIterationsProps {
	machineId: string;
	isGenerating: boolean;
	iterations: ModelIteration[];
	currentIteration: number;
	maxIterations: number;
	originalVisualizationPath: string | null;  // Added this prop
	onStartGeneration: () => void;
}

export function ModelIterations({
	machineId,
	isGenerating,
	iterations,
	currentIteration,
	maxIterations,
	originalVisualizationPath,  // Include in props
	onStartGeneration
}: ModelIterationsProps) {
	const [selectedIteration, setSelectedIteration] = useState<number>(0);

	const getStatusColor = (status: ModelIteration['status']) => {
		switch (status) {
			case 'completed':
				return 'text-green-600';
			case 'failed':
				return 'text-red-600';
			default:
				return 'text-blue-600';
		}
	};

	const getStatusIcon = (status: ModelIteration['status']) => {
		switch (status) {
			case 'completed':
				return <CheckCircle className="h-5 w-5 text-green-600" />;
			case 'failed':
				return <XCircle className="h-5 w-5 text-red-600" />;
			default:
				return <Clock className="h-5 w-5 text-blue-600 animate-spin" />;
		}
	};

	return (
		<div className="bg-white rounded-lg shadow">
			<div className="p-6">
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-xl font-semibold text-gray-900">Model Iterations</h2>
					<div className="flex items-center space-x-2">
						<span className="text-sm text-gray-500">
							Iteration {currentIteration} of {maxIterations}
						</span>
					</div>
				</div>

				{/* Iteration Navigation */}
				{iterations.length > 0 && (
					<div className="mb-6">
						<div className="flex items-center justify-between mb-4">
							<button
								onClick={() => setSelectedIteration(prev => Math.max(0, prev - 1))}
								disabled={selectedIteration === 0}
								className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
							>
								<ArrowLeft className="h-5 w-5" />
							</button>
							<div className="flex space-x-2">
								{iterations.map((iteration, index) => (
									<button
										key={index}
										onClick={() => setSelectedIteration(index)}
										className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedIteration === index
												? 'bg-blue-600 text-white'
												: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
											}`}
									>
										{index + 1}
									</button>
								))}
							</div>
							<button
								onClick={() => setSelectedIteration(prev => Math.min(iterations.length - 1, prev + 1))}
								disabled={selectedIteration === iterations.length - 1}
								className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
							>
								<ArrowRight className="h-5 w-5" />
							</button>
						</div>
					</div>
				)}

				{/* Selected Iteration Details */}
				{iterations.length > 0 && (
					<div className="space-y-6">
						<div className="border rounded-lg overflow-hidden">
							<div className="p-4 bg-gray-50 border-b">
								<div className="flex justify-between items-center">
									<div className="flex items-center space-x-2">
										{getStatusIcon(iterations[selectedIteration].status)}
										<span className={`font-medium ${getStatusColor(iterations[selectedIteration].status)}`}>
											Version {iterations[selectedIteration].version}
										</span>
									</div>
									<span className="text-sm text-gray-500">
										{new Date(iterations[selectedIteration].timestamp).toLocaleString()}
									</span>
								</div>
							</div>
							<div className="p-4">
								<div className="grid grid-cols-2 gap-4 mb-4">
									<div>
										<p className="text-sm text-gray-500">Status</p>
										<p className="font-medium">{iterations[selectedIteration].status}</p>
									</div>
									<div>
										<p className="text-sm text-gray-500">Accuracy</p>
										<p className="font-medium">
											{iterations[selectedIteration].accuracy ?
												`${iterations[selectedIteration].accuracy.toFixed(2)}%` :
												'N/A'}
										</p>
									</div>
								</div>

								{/* Visualization Comparison */}
								<div className="mt-4">
									<div className="grid grid-cols-2 gap-4">
										<div>
											<p className="text-sm text-gray-500 mb-2">Original Data</p>
											<div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden">
												{originalVisualizationPath ? (
													<img
														src={`http://localhost:8080/${originalVisualizationPath}`}
														alt="Original Data"
														className="object-contain"
													/>
												) : (
													<div className="flex items-center justify-center h-full">
														<p className="text-sm text-gray-500">No original data visualization</p>
													</div>
												)}
											</div>
										</div>
										<div>
											<p className="text-sm text-gray-500 mb-2">Model Output</p>
											<div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden">
												{iterations[selectedIteration].visualizationPath ? (
													<img
														src={`http://localhost:8080/${iterations[selectedIteration].visualizationPath}`}
														alt="Model Output"
														className="object-contain"
													/>
												) : (
													<div className="flex items-center justify-center h-full">
														<p className="text-sm text-gray-500">
															{iterations[selectedIteration].status === 'running' ?
																'Generating visualization...' :
																'No visualization available'}
														</p>
													</div>
												)}
											</div>
										</div>
									</div>
								</div>

								{/* Error Message */}
								{iterations[selectedIteration].error && (
									<div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
										{iterations[selectedIteration].error}
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{/* Generate Button */}
				<div className="mt-6">
					<button
						onClick={onStartGeneration}
						disabled={isGenerating}
						className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
					>
						{isGenerating ? (
							<span className="flex items-center justify-center">
								<Clock className="animate-spin h-5 w-5 mr-2" />
								Generating Model...
							</span>
						) : iterations.length === 0 ? (
							'Generate Initial Model'
						) : (
							'Generate New Iteration'
						)}
					</button>
				</div>
			</div>
		</div>
	);
}