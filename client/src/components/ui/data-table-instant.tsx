"use client";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	ChevronLeftIcon,
	ChevronRightIcon
} from "@radix-ui/react-icons";
import {
	Column,
	ColumnDef,
	ColumnFiltersState,
	ColumnResizeDirection,
	RowData,
	SortingState,
	Table as TableT,
	VisibilityState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable
} from "@tanstack/react-table";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { AdjustmentsVerticalIcon, FunnelIcon } from "@heroicons/react/24/outline";

export interface DataTableInstantSettings {
	status: string;
	startingPageIndex?: number;
	pageSize?: number;


}
interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	settings: DataTableInstantSettings;
	loadNextPage: () => void;
	loadPreviousPage: () => void;
	canLoadNext: boolean;
	canLoadPrevious: boolean;

}

declare module '@tanstack/react-table' {
	//allows us to define custom properties for our columns
	interface ColumnMeta<TData extends RowData, TValue> {
		filterVariant?: 'text' | 'range' | 'select';
		name: string;
	}
}

export function DataTableInstant<TData, TValue>({
	columns,
	data,
	settings,
	loadNextPage,
	loadPreviousPage,
	canLoadNext,
	canLoadPrevious
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[]
	);
	const [rowSelection, setRowSelection] = React.useState({});

	const [columnResizeDirection, setColumnResizeDirection] =
		React.useState<ColumnResizeDirection>('ltr');

	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({
			"id": false,
			"unique_id": false,
			"jurisdiction": true,
			"filerskeepers_id": false,
			"who": true,
			"what": true,
			"minimum_maximum": false,
			"retention": false,
			"period": false,
			"calculated_period": false,
			"from_date": false,
			"legal_reference": true,
			"legal_link": true,
			"status": false,
			"corrected_status": true,
			"first_pass": false
		});
	const [pagination, setPagination] = React.useState({
		pageIndex: settings.startingPageIndex || 0, //initial page index
		pageSize: settings.pageSize || 100, //default page size
	});

	const table = useReactTable({
		data,
		columns,
		columnResizeMode: 'onChange',
		columnResizeDirection,
		manualPagination: true,
		pageCount: -1,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onPaginationChange: setPagination,
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		defaultColumn: {
			minSize: 50,
			maxSize: 800
		},
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			pagination
		},
	});

	const columnSizeVars = React.useMemo(() => {
		const headers = table.getFlatHeaders();
		const colSizes: { [key: string]: number; } = {};
		for (let i = 0; i < headers.length; i++) {
			const header = headers[i]!;
			let headerSize = header.getSize();
			let headerColSize = header.column.getSize();
			// Max Size!
			if (headerSize < 50) {
				headerSize = 50;
			}
			if (headerColSize < 50) {
				headerColSize = 50;
			}
			// Min size!
			if (headerSize > 800) {
				headerSize = 800;
			}
			if (headerColSize > 800) {
				headerColSize = 800;
			}
			colSizes[`--header-${header.id}-size`] = headerSize;
			colSizes[`--col-${header.column.id}-size`] = headerColSize;
		}
		return colSizes;
	}, [table.getState().columnSizingInfo, table.getState().columnSizing]);


	const { title, description } = getTitleAndDescription(settings.status);

	return (
		<Card className="max-h-full">
			<CardHeader>
				<div className="flex justify-between items-center">
					<CardTitle>
						{title}
					</CardTitle>
					<div>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" className="mr-2">
									Toggle Columns
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{table.getAllColumns()
									.filter(column => column.getCanHide())
									.map((column) => (
										<DropdownMenuCheckboxItem
											key={column.id}
											className="capitalize"
											checked={column.getIsVisible()}
											onCheckedChange={(value) => column.toggleVisibility(!!value)}
										>
											{column.id}
										</DropdownMenuCheckboxItem>
									))}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
				<CardDescription>
					{description}
				</CardDescription>
			</CardHeader>
			<CardContent className="max-h-full" >
				<div className="max-h-full">
					<div className="rounded-md border overflow-y-auto max-h-[80vh]">

						<Table

							style={{
								...columnSizeVars, //Define column sizes on the <table> element
								width: table.getTotalSize(), // Cap the total size
							}} >

							<TableHeader>

								{table.getHeaderGroups().map((headerGroup) => (
									<TableRow key={headerGroup.id}>
										{headerGroup.headers.map((header) => {
											const isResizing = header.column.getIsResizing();
											return (
												<TableHead key={header.id}
													colSpan={header.colSpan}
													className="relative" // Ensures that positioning context is set for absolute children
													style={{
														width: `calc(var(--header-${header?.id}-size) * 1px)`,
													}}

												>



													{header.column.getCanFilter() ? (
														<Filter column={header.column} ></Filter>
													) : (null)}

													{/* Resizer div positioned absolutely on the right side */}
													{header.column.getCanResize() && (
														<div
															{...{
																onDoubleClick: () => header.column.resetSize(),
																onMouseDown: header.getResizeHandler(),
																onTouchStart: header.getResizeHandler(),
																className: `resizer ${isResizing ? 'isResizing bg-blue-500 opacity-100' : 'bg-black opacity-50'} absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none`,

															}}
														/>
													)}
												</TableHead>
											);
										})}
									</TableRow>


								))}
							</TableHeader>

							{table.getState().columnSizingInfo.isResizingColumn ? (
								<MemoizedTableBody table={table} />
							) : (
								<SeparateTableBody table={table} />
							)}


						</Table>

					</div>
				</div>
			</CardContent>
			<CardFooter className="flex justify-between px-4 lg:px-8 py-2">
				<div className="flex items-center justify-between  text-sm font-medium">
					<div className="ml-10">
						Showing {settings.pageSize || 100} Rows Per Page.
					</div>

				</div>
				<div className="flex items-center space-x-2">
					{/* Pagination Controls (hooking into cursor-based pagination) */}
					<Button
						variant="outline"
						className="h-8 w-8 p-0"
						onClick={loadPreviousPage}
						disabled={!canLoadPrevious}
					>
						<ChevronLeftIcon className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						className="h-8 w-8 p-0"
						onClick={loadNextPage}
						disabled={!canLoadNext}
					>
						<ChevronRightIcon className="h-4 w-4" />
					</Button>
				</div>
			</CardFooter>

		</Card>

	);
}




export const MemoizedTableBody = React.memo(SeparateTableBody, (prevProps, nextProps) => {
	return prevProps.table.options.data === nextProps.table.options.data;
}) as typeof SeparateTableBody;

interface TableBodyProps<TData> {
	table: TableT<TData>;


}

function SeparateTableBody<TData>({ table }: TableBodyProps<TData>) {
	//console.log(JSON.stringify(table.getRowModel().rows[0], null, 2))
	return (
		<TableBody>
			{table.getRowModel().rows?.length ? (
				table.getRowModel().rows.map((row) => (

					<TableRow
						key={row.id}
						data-state={row.getIsSelected() && "selected"}
					>
						{row.getVisibleCells().map((cell) => (

							<TableCell key={cell.id}
								style={{
									width: cell.column.getSize(),

								}}
							>
								{flexRender(cell.column.columnDef.cell, cell.getContext())}
							</TableCell>
						))}
					</TableRow>
				)
				)
			) : (
				<TableRow>
					<TableCell className="h-24 text-center">
						No results.
					</TableCell>
				</TableRow>
			)}
		</TableBody>
	);
}

{/* <DropdownMenuCheckboxItem
	checked={showPanel}
	onCheckedChange={setShowPanel}
>
	(Blank)
</DropdownMenuCheckboxItem>
<DropdownMenuCheckboxItem
	checked={showStatusBar}
	onCheckedChange={setShowStatusBar}
>
	relevant
</DropdownMenuCheckboxItem>
<DropdownMenuCheckboxItem
	checked={showActivityBar}
	onCheckedChange={setShowActivityBar}
	disabled
>
	not_relevant
</DropdownMenuCheckboxItem> */}

function Filter({ column }: { column: Column<any, unknown>; }) {

	const handleFiltering = (checked: boolean, value: string | 'undefined' | 'ALL') => {
		// Ensure the filter value is treated as an array, defaulting to an empty array if it's not set
		const currentFilterValues: (string | undefined)[] = Array.isArray(column.getFilterValue()) ? column.getFilterValue() as (string | undefined)[] : [];

		console.log(`Current Filter Values: ${JSON.stringify(currentFilterValues, null, 2)}`);

		let newFilterValues: (string | undefined)[] = [];

		if (value === "ALL") {
			// Handle "ALL" by deciding on clearing or setting a specific state
			if (checked) {
				newFilterValues = []; // This assumes "ALL" means no filters
				console.log("Setting ALL filter case!");
			} else {
				newFilterValues = allPossibleValues;
			}

		} else if (checked) {
			// Add the value if not already included
			newFilterValues = currentFilterValues.includes(value) ? currentFilterValues : [...currentFilterValues, value];
		} else {
			// Remove the value if currently included
			newFilterValues = currentFilterValues.filter(v => v !== value);
		}

		// Update the column's filter value
		column.setFilterValue(newFilterValues);

		console.log(`Updated Filter Values: ${JSON.stringify(newFilterValues, null, 2)}`);
	};


	const checkboxOptions: Record<string, string[]> = {
		"corrected_status": ["relevant", "not_relevant"],
		// Add other columns as necessary
	};
	const { filterVariant } = column.columnDef.meta ?? {};

	const sortedUniqueValues = React.useMemo(
		() =>
			filterVariant === 'range'
				? []
				: Array.from(column.getFacetedUniqueValues().keys())
					.sort()
					.slice(0, 5000),
		[column.getFacetedUniqueValues(), filterVariant]
	);


	const renderCheckboxItems = (values: string[], column: Column<any, any>) => {
		const columnFilterValue = column.getFilterValue();

		return values.map(value => (

			<DropdownMenuCheckboxItem
				key={value}
				checked={(columnFilterValue as string[] || []).includes(value)}
				onCheckedChange={(checked: boolean) => handleFiltering(checked, value)}
			>
				{value}
			</DropdownMenuCheckboxItem>
		));
	};



	let allPossibleValues = (checkboxOptions[column.id] || sortedUniqueValues).concat(["undefined"]);


	return filterVariant === 'select' ? (
		<div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button className="justify-between w-full" variant="outline">
						<div className="flex">
							{column.columnDef.meta!.name}
						</div>
						<FunnelIcon className="flex w-5 h-5"></FunnelIcon>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-56">
					<DropdownMenuLabel>Sorting</DropdownMenuLabel>
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					>
						Sort Ascending
					</Button>
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "desc")}
					>
						Sort Descending
					</Button>
					<DropdownMenuSeparator />
					<DropdownMenuLabel>Filtering</DropdownMenuLabel>
					<DropdownMenuCheckboxItem


						onCheckedChange={(checked: boolean) => handleFiltering(checked, "ALL")}
					>
						(All)
					</DropdownMenuCheckboxItem>
					<DropdownMenuCheckboxItem
						checked={(column.getFilterValue() as string[] || []).includes("")}
						onCheckedChange={(checked: boolean) => handleFiltering(checked, 'undefined')}
					>
						(Blank)
					</DropdownMenuCheckboxItem>
					{checkboxOptions[column.id]
						? renderCheckboxItems(checkboxOptions[column.id], column)
						: renderCheckboxItems(sortedUniqueValues, column)
					}


				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	) : (<DropdownMenu>
		<DropdownMenuTrigger asChild>
			<Button className="justify-between w-full" variant="outline">
				<div className="flex">
					{column.columnDef.meta!.name}
				</div>
				<AdjustmentsVerticalIcon className="w-5 h-5"></AdjustmentsVerticalIcon>
			</Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent className="w-56">
			<DropdownMenuLabel>Sorting</DropdownMenuLabel>
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				className="justify-between w-full"
			>
				<div className="flex">
					{column.columnDef.meta!.name}
				</div>
				<AdjustmentsVerticalIcon className="w-5 h-5"></AdjustmentsVerticalIcon>
			</Button>
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "desc")}
			>
				Sort Descending
			</Button>
			<DropdownMenuSeparator />
			<DropdownMenuLabel>Filtering Not Supported for This Column</DropdownMenuLabel>
		</DropdownMenuContent>
	</DropdownMenu>);
}


const getTitleAndDescription = (status: string) => {
	switch (status) {
		case 'relevant':
			return {
				title: 'Relevant Citations',
				description: 'View citations classified as relevant by the AI.'
			};
		case 'does_not_apply':
			return {
				title: 'Not Relevant Citations',
				description: 'View citations classified as not relevant by the AI.'
			};
		case 'further_research_needed':
			return {
				title: 'Citations Needing Further Research',
				description: 'View citations that require further research.'
			};
		default:
			return {
				title: 'Citations',
				description: 'View all citations.'
			};
	}
};