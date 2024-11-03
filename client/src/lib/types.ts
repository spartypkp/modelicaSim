export interface MachineData {
	id: string;
	name: string;
	timestamp: Date;
	measurements: {
		[key: string]: number;
	}[];
}

export interface ModelStatus {
	status: 'generating' | 'completed' | 'failed';
	currentIteration: number;
	accuracy: number;
	modelVersions: ModelVersion[];
}

export interface ModelVersion {
	version: number;
	accuracy: number;
	generatedAt: Date;
	modelicaCode: string;
}