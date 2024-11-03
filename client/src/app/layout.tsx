

import { TooltipProvider } from "@/components/ui/toolTip";
import "./globals.css";


export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {

	return (
		<html lang="en">
			<body>
				<TooltipProvider>
					{children}

				</TooltipProvider>
			</body>
		</html>
	);
}
