/* AGPL 3.0 or later */
import express from "express";
import multer from "multer";
import morgan from "morgan";
import ansis from "ansis";
import { join, normalize } from "node:path";
import process, { cwd, platform, exit } from "node:process";
import { exec } from "node:child_process"
import { networkInterfaces } from 'node:os';
import { setImmediate as setImmediatePromise } from 'node:timers/promises';
import { existsSync, mkdirSync } from 'node:fs';

const port = 3000;

const uploadLocation = "uploads";

if (!existsSync(join(cwd(), uploadLocation))) {
	mkdirSync(join(cwd(), uploadLocation));
}


const storage = multer.diskStorage({
		destination: function (request, file, callback) {
			callback(null, uploadLocation+"/") // eslint-disable-line unicorn/no-null
		},
		filename: function (request, file, callback) {
			const originalName = file.originalname
			const lastDotIndex = originalName.lastIndexOf('.')
			
			// Helper function to generate a filename with a unique suffix
			const generateFilename = () => {
				const rand = Math.round(Math.random() * 1e9) // eslint-disable-line sonarjs/pseudo-random -- This is safe. It's being used to generate a file name.
				const uniqueSuffix = Date.now() + '-' + rand
				
				if (lastDotIndex === -1 || lastDotIndex === 0) {
					// No extension or starts with a dot (hidden file)
					return originalName + '-' + uniqueSuffix
				}
				
				const extension = originalName.slice(lastDotIndex)
				const sansExtension = originalName.slice(0, lastDotIndex)
				return sansExtension + '-' + uniqueSuffix + extension
			}
			
			// Generate filenames until we find a unique one
			let finalFilename = generateFilename()
			while (existsSync(join(uploadLocation, finalFilename))) {
				finalFilename = generateFilename()
			}
			
			callback(null, finalFilename) // eslint-disable-line unicorn/no-null
			console.dir(file)
		}
	}),
	upload = multer({ storage }), // eslint-disable-line sonarjs/content-length -- We want unlimited file sizes.
	app = express(), // eslint-disable-line sonarjs/x-powered-by -- Not a security issue.
	html = `<!doctype html>
	<html lang="en">
	<head>
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Quick Upload</title>
		<style>
			:root{
				--green:green;
				color-scheme:light dark
			}
			body{
				height:100%;
				margin:0
			}
			@media(prefers-color-scheme:dark){
				:root{
					--green:lightgreen
				}
			}
			*{
				box-sizing:border-box
			}
			form{
				height:100dvb;
				margin:0;
				display:grid;
				grid-template-rows:repeat(3, auto);
				gap:.5rem;
				padding:9px;
				place-content:center center
			}
			h1 {
				display: grid;
				place-content: center;
			}
			p {
				width: fit-content;
				margin-inline: auto;
			}
		</style>
	</head>
	<body>
		<form action="/" method="post" enctype="multipart/form-data">
			<h1>Quick Upload</h1>
			<p><span style="color:red">DANGER:</span> This program is not secure, use it for uploading files across your local network. Do not expose it to the internet.</p>
			<p style="color:`,
	html2=`</p>
			<label>Select file for upload: <br><input type="file" name="file"></label>
			<button type="submit">Upload</button>
		</form>
	</body>
</html>`

app.use(morgan(function(tokens, request, response){
	const statusToken = tokens.status(request, response);
	let status = statusToken ?? '???'; // Provide default if undefined
	
	switch (status[0]) {
		case "4":
		case "5": {
			status = ansis.red.bold(status)
			break;
		}
		case "2": {
			status = ansis.green.bold(status)
			break;
		}
	}
	return [
		ansis.yellow.bold(tokens.method(request, response)),
		ansis.blue.bold(tokens.url(request, response)),
		status
	].join(" ")
}))
app.get("/", (request, response) => {
	response.send(html+"unset\">"+html2)
})

app.post("/", upload.single("file"), (request, response) => {
	if (request.file) {
		response.send(html+`var(--green)">File uploaded!`+html2)
		const filePath = join(cwd(), uploadLocation, request.file.filename);
		
		// Validate that the file path is within our upload directory
		const normalizedPath = normalize(filePath);
		const normalizedUploadDirectory = normalize(join(cwd(), uploadLocation));
		
		// Check if the path is within our upload directory
		if (!normalizedPath.startsWith(normalizedUploadDirectory)) {
			console.error("Security warning: Attempted to access file outside upload directory");
			return;
		}
		
		// On Windows, ensure the path uses backslashes and quotes are escaped
		let escapedPath = normalizedPath;
		if (platform === "win32") {
			escapedPath = escapedPath.replaceAll("/", "\\");
		}

		escapedPath = escapedPath.replaceAll('"', String.raw`\"`);
		
		switch (platform) {
			case "win32": {
				exec(`explorer.exe /select,"${escapedPath}"`); // eslint-disable-line sonarjs/os-command -- Path is validated and escaped
				break;
			}
			case "darwin": {
				exec(`open -R "${escapedPath}"`); // eslint-disable-line sonarjs/os-command -- Path is validated and escaped
				break;
			}
			case "linux": {
				exec(`xdg-open "${normalizedUploadDirectory}"`); // eslint-disable-line sonarjs/os-command -- Path is validated and escaped
				break;
			}
		}
	} else {
		response.status(400)
			.send(html+`red">Please select a file first.`+html2)
	}
})

const getLocalIPs = () => {
	const nets = networkInterfaces();
	const addresses = [];
	
	if (nets) {
		for (const name of Object.keys(nets)) {
			const interfaces = nets[name];
			if (interfaces) {
				for (const net of interfaces) {
					// Only get IPv4 addresses, but include internal ones
					if (net.family === 'IPv4') {
						addresses.push({
							name,  // interface name (e.g., "Wi-Fi", "Ethernet", "VPN")
							address: net.address,
							internal: net.internal
						});
					}
				}
			}
		}
	}
	return addresses;
};

// Store the server instance so we can close it gracefully
let server;

server = app.listen(port, ()=>{
	const ips = getLocalIPs();
	console.info("Server running at:");
	
	// Transform IPs into a table-friendly format
	const interfaces = ips.map(({name, address, internal}) => ({
		Type: internal ? "Internal" : "Network",
		Interface: name,
		URL: `http://${address}:${port}`
	}));
	
	// Add localhost to the interfaces
	interfaces.unshift({
		Type: "Local",
		Interface: "localhost",
		URL: `http://localhost:${port}`
	});
	
	console.table(interfaces);
	
	console.error(ansis.red.bold("DANGER:") + " Do not use expose this program to the internet, there is " + ansis.red.bold("ZERO") + " security.")
	console.info(ansis.blue("Press CTRL+C to exit"))
});

// Handle CTRL+C gracefully
process.on('SIGINT', async () => {
	console.log('\nGracefully shutting down server...');
	server.close(async () => {
		console.log('Server closed. Waiting for remaining tasks...');
		await setImmediatePromise();
		console.log('Exiting process.');
		exit(0);
	});
});