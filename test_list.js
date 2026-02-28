import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

(async () => {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        if (data.models) {
            console.log("AVAILABLE MODELS: ", data.models.map(m => m.name).join(', '));
        } else {
            console.error("No models list returned", data);
        }
    } catch (e) { console.error(e) }
})();
