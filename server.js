/* AGPL 3.0 or later */
import express from "express";
import multer from "multer";
import morgan from "morgan";
import ansis from "ansis";
import { join } from "node:path";
import { cwd, platform } from "node:process";
import { exec } from "node:child_process"

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
		</style>
	</head>
	<body>
		<form action="/" method="post" enctype="multipart/form-data">
			<p style="color:`,
	html2=`</p>
			<input type="file" name="file">
			<button>Upload</button>
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
			break;
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
		if (platform === "win32") exec(`explorer.exe /select,"${join(cwd(),uploadLocation,req.file.filename)}"`,(err,output,input)=>{})
		
	}
})

app.listen(3000, ()=>{
	console.info(`Listening on port ${ansis.yellow.bold(3000)}. Linux: Check ifconfig command for local address, Windows: Check ipconfig.`)
	console.error(ansis.red.bold("DANGER:") + " Do not use expose this program to the internet, there is ZERO security.")
})