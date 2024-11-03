"use client";

import { UploadModal } from '@/components/uploadModal';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Machine {
	id: string;
	name: string;
	lastUpdated: string;
	status: 'active' | 'inactive' | 'error';
	accuracy: number | null;
	file_paths: Record<string, any>;
	metadata: Record<string, any>;
}

export default function Home() {
	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	const [machines, setMachines] = useState<Machine[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

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

	const handleUploadSuccess = () => {
		fetchMachines();
	};

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
							className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
					</div>
				</div>

				{/* Loading state */}
				{isLoading && (
					<div className="text-center py-12">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					</div>
				)}

				{/* Error state */}
				{error && (
					<div className="text-center py-12">
						<p className="text-red-600">{error}</p>
					</div>
				)}

				{/* Machines grid */}
				{!isLoading && !error && (
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{machines.map((machine) => (
							<Link
								key={machine.id}
								href={`/machine/${machine.id}`}
								className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow"
							>
								<div className="p-6">
									<div className="flex justify-between items-start">
										<div>
											<h3 className="text-lg font-semibold text-gray-900">{machine.name}</h3>
											<p className="mt-1 text-sm text-gray-500">
												Last updated: {new Date(machine.lastUpdated).toLocaleDateString()}
											</p>
										</div>
										<span className={`px-2 py-1 text-xs rounded-full ${machine.status === 'active' ? 'bg-green-100 text-green-800' :
												machine.status === 'error' ? 'bg-red-100 text-red-800' :
													'bg-gray-100 text-gray-800'
											}`}>
											{machine.status}
										</span>
									</div>
									<div className="mt-4 grid grid-cols-2 gap-4">
										<div>
											<p className="text-sm text-gray-500">Model Accuracy</p>
											<p className="text-lg font-semibold text-gray-900">
												{machine.accuracy ? `${machine.accuracy}%` : 'N/A'}
											</p>
										</div>
										<div>
											<p className="text-sm text-gray-500">Fields</p>
											<p className="text-lg font-semibold text-gray-900">
												{machine.metadata?.fields?.length || 0}
											</p>
										</div>
									</div>
								</div>
							</Link>
						))}
					</div>
				)}
			</div>

			<UploadModal
				isOpen={isUploadModalOpen}
				onClose={() => setIsUploadModalOpen(false)}
				onSuccess={handleUploadSuccess}
			/>
		</main>
	);
}