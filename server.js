/* AGPL 3.0 or later */
import express from "express";
import multer from "multer";
import morgan from "morgan";
import ansis from "ansis";
import { join } from "node:path";
import { cwd, platform } from "node:process";
import { exec } from "node:child_process"
import { networkInterfaces } from 'node:os';

const port = 3000;

const uploadLocation = "uploads",
	storage = multer.diskStorage({
		destination: function (req, file, cb) {
			cb(null, uploadLocation+"/")
		},
		filename: function (req, file, cb) {
			const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9),
				filename = file.originalname.split("."),
				ext = [...filename].at(-1)
			let sansExt = [...filename]
			sansExt.pop()
			sansExt = sansExt.join(".")
			console.dir(file)
			cb(null, sansExt + '-' + uniqueSuffix + "." + ext )
		}
	}),
	upload = multer({ storage }),
	app = express(),
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

app.use(morgan(function(tokens,req,res){
	let status = tokens.status(req,res)
	
	switch (status[0]) {
		case "4":
		case "5":
			status = ansis.red.bold(status)
			break;
		case "2":
			status = ansis.green.bold(status)
	}
	return [
		ansis.yellow.bold(tokens.method(req,res)),
		ansis.blue.bold(tokens.url(req,res)),
		status
	].join(" ")
}))
app.get("/", (req, res) => {
	res.send(html+"unset\">"+html2)
})

app.post("/", upload.single("file"), (req, res) => {
	if (!req.file) {
		res.status(400)
			.send(html+`red">Please select a file first.`+html2)
	} else {
		res.send(html+`var(--green)">File uploaded!`+html2)
		const filePath = join(cwd(), uploadLocation, req.file.filename);
		switch (platform) {
			case "win32":
				exec(`explorer.exe /select,"${filePath}"`);
				break;
			case "darwin":
				exec(`open -R "${filePath}"`);
				break;
			case "linux":
				exec(`xdg-open "${join(cwd(), uploadLocation)}"`);
		}
	}
})

const getLocalIPs = () => {
	const nets = networkInterfaces();
	const addresses = [];
	
	for (const name of Object.keys(nets)) {
		for (const net of nets[name]) {
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
	return addresses;
};

app.listen(port, ()=>{
	const ips = getLocalIPs();
	console.info(`Server running at:`);
	console.info(`- Local:   ${ansis.blue.bold(`http://localhost:${port}`)}`);
	
	// Group and display all network interfaces
	ips.forEach(({name, address, internal}) => {
		const prefix = internal ? "- Internal" : "- Network";
		console.info(`${prefix} (${ansis.yellow(name)}): ${ansis.blue.bold(`http://${address}:${port}`)}`);
	});
	
	console.error(ansis.red.bold("DANGER:") + " Do not use expose this program to the internet, there is " + ansis.red.bold("ZERO") + " security.")
})