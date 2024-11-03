"use client";

import { UploadModal } from '@/components/uploadModal';
import { AlertCircle, CheckCircle, Clock, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Machine {
	id: string;
	name: string;
	description: string | null;
	status: 'active' | 'inactive' | 'error';
	accuracy: number | null;
	created_at: string;
	updated_at: string;
	last_data_update: string | null;
	last_model_generation: string | null;
	file_paths: {
		rawData: {
			fileName: string;
			uploadedAt: string;
			size: number;
		};
		visualizations: Array<{
			path: string;
			type: string;
			generatedAt: string;
		}>;
		modelicaFiles: Array<{
			path: string;
			version: string;
			generatedAt: string;
			accuracy: number;
		}>;
	};
	metadata: {
		originalFileName: string;
		uploadTimestamp: string;
		dataPoints: number;
		fields: string[];
	};
}

export default function Home() {
	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	const [machines, setMachines] = useState<Machine[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState('');

	const fetchMachines = async () => {
		try {
			const response = await fetch('/api/machines');
			if (!response.ok) throw new Error('Failed to fetch machines');
			const data = await response.json();
			setMachines(data);
		} catch (err) {
			setError('Failed to load machines');
		} finally {
			setIsLoading(false);

		}
	};

	useEffect(() => {
		fetchMachines();
	}, []);

	const getStatusIcon = (status: Machine['status']) => {
		switch (status) {
			case 'active':
				return <CheckCircle className="h-5 w-5 text-green-600" />;
			case 'error':
				return <AlertCircle className="h-5 w-5 text-red-600" />;
			default:
				return <Clock className="h-5 w-5 text-gray-600" />;
		}
	};

	const getLatestModelInfo = (machine: Machine) => {
		if (!machine.file_paths.modelicaFiles.length) return null;
		return machine.file_paths.modelicaFiles[machine.file_paths.modelicaFiles.length - 1];
	};

	const getTimeSince = (date: string) => {
		const diff = new Date().getTime() - new Date(date).getTime();
		const hours = Math.floor(diff / (1000 * 60 * 60));
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	};

	const filteredMachines = machines.filter(machine =>
		machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		machine.description?.toLowerCase().includes(searchTerm.toLowerCase())
	);

	return (
		<main className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white shadow">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between h-16 items-center">
						<h1 className="text-2xl font-bold text-gray-900">Digital Twin Dashboard</h1>
						<button
							onClick={() => setIsUploadModalOpen(true)}
							className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
						>
							<Plus className="h-5 w-5 mr-2" />
							New Machine
						</button>
					</div>
				</div>
			</div>

			{/* Main content */}
			<div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
				{/* Search and filter */}
				<div className="mb-6">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
						<input
							type="text"
							placeholder="Search machines..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
					</div>
				</div>

				{/* Loading and Error states remain the same */}
				{isLoading && (
					<div className="text-center py-12">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					</div>
				)}

				{error && (
					<div className="text-center py-12">
						<p className="text-red-600">{error}</p>
					</div>
				)}

				{/* Machines grid */}
				{!isLoading && !error && (
					<div className="flex flex-col gap-6">
						{filteredMachines.map((machine) => {
							const latestModel = getLatestModelInfo(machine);
							return (
								<Link
									key={machine.id}
									href={`/machine/${machine.id}`}
									className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow"
								>
									<div className="p-6">
										<div className="flex justify-between items-start">
											<div className="flex items-start gap-4">
												<div className="mt-1">
													{getStatusIcon(machine.status)}
												</div>
												<div>
													<h3 className="text-lg font-semibold text-gray-900">{machine.name}</h3>
													{machine.description && (
														<p className="text-sm text-gray-600 mt-1">{machine.description}</p>
													)}
													<p className="text-sm text-gray-500 mt-2">
														Created {getTimeSince(machine.created_at)}
													</p>
												</div>
											</div>
											<div className="text-right">
												<p className="text-sm text-gray-500">Last updated</p>
												<p className="text-sm font-medium text-gray-900">
													{getTimeSince(machine.updated_at)}
												</p>
											</div>
										</div>

										<div className="mt-6 grid grid-cols-4 gap-4">
											<div>
												<p className="text-sm text-gray-500">Latest Model</p>
												<p className="text-lg font-semibold text-gray-900">
													{latestModel ? `v${latestModel.version}` : 'None'}
												</p>
											</div>
											<div>
												<p className="text-sm text-gray-500">Accuracy</p>
												<p className="text-lg font-semibold text-gray-900">
													{latestModel ? `${latestModel.accuracy.toFixed(1)}%` : 'N/A'}
												</p>
											</div>
											<div>
												<p className="text-sm text-gray-500">Data Points</p>
												<p className="text-lg font-semibold text-gray-900">
													{machine.metadata.dataPoints.toLocaleString()}
												</p>
											</div>
											<div>
												<p className="text-sm text-gray-500">Fields</p>
												<p className="text-lg font-semibold text-gray-900">
													{machine.metadata.fields.length}
												</p>
											</div>
										</div>
									</div>
								</Link>
							);
						})}
					</div>
				)}
			</div>

			<UploadModal
				isOpen={isUploadModalOpen}
				onClose={() => setIsUploadModalOpen(false)}
				onSuccess={fetchMachines}
			/>
		</main>
	);
}