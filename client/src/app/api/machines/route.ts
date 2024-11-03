import { pool } from '@/lib/pool';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const machineName = formData.get('name') as string;

		if (!file || !machineName) {
			return NextResponse.json(
				{ error: 'File and machine name are required' },
				{ status: 400 }
			);
		}

		// Read the file content
		const fileContent = await file.text();
		const jsonData = JSON.parse(fileContent);

		// Process the data through your data science API
		const dsResponse = await fetch('http://localhost:8080/api/datascience', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ jsonData }),
		});

		if (!dsResponse.ok) {
			throw new Error('Data science processing failed');
		}

		const dsResult = await dsResponse.json();

		// Insert into database
		const result = await pool.query(
			`INSERT INTO machines (
        name,
        status,
        file_paths,
        metadata
      ) VALUES ($1, $2, $3, $4) RETURNING *`,
			[
				machineName,
				'active',
				JSON.stringify({
					rawData: {
						fileName: file.name,
						uploadedAt: new Date().toISOString(),
						size: file.size,
					},
					visualizations: [{
						path: dsResult.visualizationPath,
						type: 'timeSeries',
						generatedAt: new Date().toISOString()
					}],
					modelicaFiles: [],
					logs: []
				}),
				JSON.stringify({
					originalFileName: file.name,
					uploadTimestamp: new Date().toISOString(),
					dataPoints: jsonData.fields?.[0]?.nums?.length || 0,
					fields: jsonData.fields?.map((f: any) => f.name) || []
				})
			]
		);



		return NextResponse.json(result.rows[0]);
	} catch (error) {
		console.error('Error creating machine:', error);
		return NextResponse.json(
			{ error: 'Failed to create machine' },
			{ status: 500 }
		);
	}
}

export async function GET() {
	try {
		const result = await pool.query(`
      SELECT 
        id,
        name,
        status,
        accuracy,
        updated_at as "lastUpdated",
        file_paths,
        metadata
      FROM machines 
      ORDER BY created_at DESC
    `);

		return NextResponse.json(result.rows);
	} catch (error) {
		console.error('Error fetching machines:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch machines' },
			{ status: 500 }
		);
	}
}