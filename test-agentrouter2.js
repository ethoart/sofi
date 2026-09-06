const apiKey = process.env.AGENTROUTER_API_KEY;
console.log("Using key:", apiKey);
fetch("https://agentrouter.org/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    model: "openai/gpt-4o",
    messages: [{role: "user", content: "Hi"}]
  })
}).then(async r => {
  console.log(r.status);
  console.log(await r.text());
}).catch(console.error);
