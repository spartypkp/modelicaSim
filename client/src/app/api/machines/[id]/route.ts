import { pool } from '@/lib/pool';
import { NextResponse } from 'next/server';

export async function GET(
	request: Request,
	{ params }: { params: { id: string; }; }
) {
	try {
		const result = await pool.query(
			`
      SELECT 
        id,
        name,
        status,
        accuracy,
        created_at,
        updated_at,
        file_paths,
        metadata
      FROM machines 
      WHERE id = $1
      `,
			[params.id]
		);

		if (result.rows.length === 0) {
			return NextResponse.json(
				{ error: 'Machine not found' },
				{ status: 404 }
			);
		}

		return NextResponse.json(result.rows[0]);
	} catch (error) {
		console.error('Error fetching machine:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch machine' },
			{ status: 500 }
		);
	}
}

export async function PATCH(
	request: Request,
	{ params }: { params: { id: string; }; }
) {
	try {
		const body = await request.json();
		const { status, accuracy, file_paths, metadata } = body;

		const updates: string[] = [];
		const values: any[] = [];
		let valueCount = 1;

		if (status !== undefined) {
			updates.push(`status = $${valueCount}`);
			values.push(status);
			valueCount++;
		}

		if (accuracy !== undefined) {
			updates.push(`accuracy = $${valueCount}`);
			values.push(accuracy);
			valueCount++;
		}

		if (file_paths !== undefined) {
			updates.push(`file_paths = $${valueCount}`);
			values.push(file_paths);
			valueCount++;
		}

		if (metadata !== undefined) {
			updates.push(`metadata = $${valueCount}`);
			values.push(metadata);
			valueCount++;
		}

		if (updates.length === 0) {
			return NextResponse.json(
				{ error: 'No updates provided' },
				{ status: 400 }
			);
		}

		// Add the id as the last parameter
		values.push(params.id);

		const result = await pool.query(
			`
      UPDATE machines 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${valueCount}
      RETURNING *
      `,
			values
		);

		if (result.rows.length === 0) {
			return NextResponse.json(
				{ error: 'Machine not found' },
				{ status: 404 }
			);
		}

		return NextResponse.json(result.rows[0]);
	} catch (error) {
		console.error('Error updating machine:', error);
		return NextResponse.json(
			{ error: 'Failed to update machine' },
			{ status: 500 }
		);
	}
}