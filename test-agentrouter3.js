const apiKey = process.env.AGENTROUTER_API_KEY;
fetch("https://agentrouter.org/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  },
  body: JSON.stringify({
    model: "openai/gpt-4o",
    messages: [{role: "user", content: "Hi"}]
  })
}).then(async r => {
  console.log("Status:", r.status);
  console.log(await r.text());
}).catch(console.error);
