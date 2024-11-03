'use client';

import { Upload, X } from 'lucide-react';
import { useState } from 'react';

interface UploadModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [machineName, setMachineName] = useState('');
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

	if (!isOpen) return null;

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			setSelectedFile(file);
			setError(null);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedFile || !machineName) {
			setError('Both machine name and file are required');
			return;
		}

		setIsUploading(true);
		setError(null);

		try {
			const formData = new FormData();
			formData.append('file', selectedFile);
			formData.append('name', machineName);

			const response = await fetch('/api/machines', {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				throw new Error('Upload failed');
			}
			const data = await response.json();
			const machineId = data.id;


			onSuccess();
			onClose();
		} catch (err) {
			setError('Failed to upload file. Please try again.');
		} finally {
			setIsUploading(false);

		}
	};

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			<div className="flex min-h-screen items-center justify-center">
				<div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

				<div className="relative bg-white rounded-lg p-8 max-w-md w-full mx-4">
					<div className="absolute top-4 right-4">
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-gray-500"
						>
							<X className="h-6 w-6" />
						</button>
					</div>

					<h2 className="text-2xl font-bold mb-6">Create New Machine</h2>

					<form onSubmit={handleSubmit} className="space-y-6">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Machine Name
							</label>
							<input
								type="text"
								value={machineName}
								onChange={(e) => setMachineName(e.target.value)}
								className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
								placeholder="Enter machine name"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Machine Data
							</label>
							<div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
								<div className="space-y-1 text-center">
									<Upload className="mx-auto h-12 w-12 text-gray-400" />
									<div className="flex text-sm text-gray-600">
										<label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
											<span>Upload a file</span>
											<input
												type="file"
												className="sr-only"
												accept=".json"
												onChange={handleFileSelect}
											/>
										</label>
										<p className="pl-1">or drag and drop</p>
									</div>
									<p className="text-xs text-gray-500">JSON files only</p>
									{selectedFile && (
										<p className="text-sm text-green-600">{selectedFile.name}</p>
									)}
								</div>
							</div>
						</div>

						{error && (
							<p className="text-sm text-red-600">{error}</p>
						)}

						<div className="flex justify-end space-x-4">
							<button
								type="button"
								onClick={onClose}
								className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={isUploading}
								className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
							>
								{isUploading ? 'Creating...' : 'Create Machine'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}