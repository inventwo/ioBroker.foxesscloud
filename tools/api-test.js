/**
 * FoxESS Cloud API Test Script
 *
 * Usage:
 *   1. Copy .env.example to .env and fill in your credentials
 *   2. Run: node tools/api-test.js
 */

// require('dotenv').config(); // Entfernt, da dotenv nicht mehr installiert ist
const https = require("https");
const crypto = require("crypto");

// Load credentials from environment variables
const token = process.env.FOXESS_TOKEN;
const sn = process.env.FOXESS_SN;

if (!token || !sn) {
	console.error("❌ Missing credentials!");
	console.error("   Please create a .env file with:");
	console.error("   FOXESS_TOKEN=your-api-token");
	console.error("   FOXESS_SN=your-serial-number");
	console.error("");
	console.error("   Or copy .env.example to .env and fill in your values.");
	process.exit(1);
}

const path = "/op/v0/device/real/query";
const milliseconds = Date.now();
// WICHTIG: Die Signatur verwendet buchstäbliche Zeichen "\\r\\n", NICHT echte Zeilenumbrüche!
const signatureString = `${path}\\r\\n${token}\\r\\n${milliseconds}`;
const signature = crypto.createHash("md5").update(signatureString).digest("hex");

const postData = JSON.stringify({ sn: sn });

const options = {
	hostname: "www.foxesscloud.com",
	port: 443,
	path: path,
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		token: token,
		signature: signature,
		timestamp: milliseconds,
		lang: "en",
		"Content-Length": Buffer.byteLength(postData),
	},
};

console.log("📡 Requesting FoxESS Cloud API...\n");

const req = https.request(options, res => {
	let data = "";
	res.on("data", chunk => (data += chunk));
	res.on("end", () => {
		try {
			const json = JSON.parse(data);
			console.log("✅ API Response:\n");
			console.log(JSON.stringify(json, null, 2));

			// Show available data points
			if (json.result && json.result[0] && json.result[0].datas) {
				console.log("\n📊 Available data points:\n");
				json.result[0].datas.forEach(d => {
					console.log(`   ${d.variable}: ${d.value} ${d.unit || ""} (${d.name})`);
				});
			}
		} catch {
			console.error("❌ Failed to parse response:", data);
		}
	});
});

req.on("error", e => console.error("❌ Request error:", e.message));
req.write(postData);
req.end();
