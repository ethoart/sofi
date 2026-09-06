const apiKey = process.env.AGENTROUTER_API_KEY;
const endpoints = [
  "https://co.agentrouter.org/v1/chat/completions",
  "https://api.agentrouter.org/v1/chat/completions",
  "https://agentrouter.to/v1/chat/completions"
];

for (const ep of endpoints) {
  fetch(ep, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "User-Agent": "curl/7.68.0"
    },
    body: JSON.stringify({
      model: "openai/gpt-4o",
      messages: [{role: "user", content: "Hi"}]
    })
  }).then(async r => {
    console.log(ep, r.status);
    console.log(await r.text());
  }).catch(console.error);
}
