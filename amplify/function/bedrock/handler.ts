export const handler: Handler = awslambda.streamifyResponse(
    async (event: eventType, responseStream: Writable, _context: Context) => {
        const client = new BedrockRuntimeClient({ region: "us-east-1" });

        const payload = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 1000,
            messages: [
                {
                    role: "user",
                    content: [{ type: "text", text: event.prompt }],
                },
            ],
        };

        const command = new InvokeModelWithResponseStreamCommand({
            contentType: "application/json",
            body: JSON.stringify(payload),
            modelId,
        });

        try {
            const apiResponse = await client.send(command);
            const decoder = new TextDecoder();
            let completeMessage = '';

            if (apiResponse.body) {
                for await (const chunk of apiResponse.body) {
                    if (chunk instanceof Uint8Array) {  // Uint8Arrayのインスタンスであることを確認
                        completeMessage += decoder.decode(chunk, {stream: true});
                    }
                }
                
                // ストリームの最後をデコードし、最終的なメッセージを組み立てる
                completeMessage += decoder.decode(); // 最後のデコードを完了させる
                responseStream.write(completeMessage);
                responseStream.end();
            }
        } catch (error) {
            console.error("Error invoking model with response stream:", error);
            responseStream.end(JSON.stringify({ error: "Error processing your request" }));
        }
    }
);
