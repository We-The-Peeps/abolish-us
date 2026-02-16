import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "next-themes";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { useIsMobile } from "@/hooks/use-mobile";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

const description =
	"When the ship is held together by lies, contempt, and shadowy cabals, it's time to start building a new ship.";
const title = "Abolish Us | End the Systemic Failure";

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: title,
			},
			{
				name: "description",
				content: description,
			},
			{
				name: "theme-color",
				content: "#0f0f0f",
			},
			{
				property: "og:type",
				content: "website",
			},
			{
				property: "og:site_name",
				content: "Abolish Us",
			},
			{
				property: "og:title",
				content: title,
			},
			{
				property: "og:description",
				content: description,
			},
			{
				property: "og:image",
				content: "https://abolish.us/og-card.png?v=4",
			},
			{
				property: "og:image:type",
				content: "image/png",
			},
			{
				property: "og:image:width",
				content: "1200",
			},
			{
				property: "og:image:height",
				content: "630",
			},
			{
				property: "og:url",
				content: "https://abolish.us",
			},
			{
				name: "twitter:card",
				content: "summary_large_image",
			},
			{
				name: "twitter:title",
				content: title,
			},
			{
				name: "twitter:description",
				content: description,
			},
			{
				name: "twitter:image",
				content: "https://abolish.us/og-card.png?v=4",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				href: "/favicon.ico",
			},
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon-light.svg",
				media: "(prefers-color-scheme: light)",
			},
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon-dark.svg",
				media: "(prefers-color-scheme: dark)",
			},
		],
	}),

	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const isMobile = useIsMobile();
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					{isMobile ? (
						children
					) : (
						<OverlayScrollbarsComponent
							defer
							data-app-scroll-root
							className="h-dvh w-full"
							options={{
								overflow: { x: "hidden", y: "scroll" },
								scrollbars: { autoHide: "leave", autoHideDelay: 500 },
							}}
						>
							{children}
						</OverlayScrollbarsComponent>
					)}
					<TanStackDevtools
						config={{
							position: "bottom-right",
						}}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
							TanStackQueryDevtools,
						]}
					/>
					<Scripts />
				</ThemeProvider>
			</body>
		</html>
	);
}
