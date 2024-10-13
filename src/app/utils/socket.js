const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";

let ws;

if (typeof window !== "undefined") {
    ws = new WebSocket(url);

    ws.onopen = () => {
        console.log("Connected to OpenAI Realtime API.");
    };

    ws.onmessage = (message) => {
        console.log("Received message:", JSON.parse(message.data));
    };

    ws.onerror = (error) => {
        console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
        console.log("WebSocket connection closed.");
    };
}

export default ws;
