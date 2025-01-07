# Quick Upload ![License AGPL 3.0 or later](https://img.shields.io/github/license/NicholasDJM/Quick-Upload)

Quickly upload files from one computer to another.

<picture>
	<img src="./screenshotMobile.png" alt="Screen shot of the program on a phone." height="650"/>
</picture>


> [!CAUTION]
> This program has ZERO security. Do not use over the internet, don't expose the port 3000 while program is in use.

You must have Node.js installed. Head to [nodejs.org](https://nodejs.org/en/download/) to download it.

1. In your terminal, run `npm start`. Now this computer will receive files from other computers.
2. On your other computer or phone: open a web browser, and navigate to the IP address displayed in the terminal (Typically the WiFi IP address).
3. Finally, upload your files! If the host computer is on Windows, it will automatically open Explorer to the uploaded file. Files are saved in `./upload`.
