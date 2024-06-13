/** * Reads SSM environment context from a known Amplify environment variable, * fetches values from SSM and places those values in the corresponding environment variables */export const internalAmplifyFunctionResolveSsmParams = async (client) => {    const envPathObject = JSON.parse(process.env.AMPLIFY_SSM_ENV_CONFIG ?? '{}');    const paths = Object.keys(envPathObject);    if (paths.length === 0) {        return;    }    let actualSsmClient;    if (client) {        actualSsmClient = client;    }    else {        const ssmSdk = await import('@aws-sdk/client-ssm');        actualSsmClient = new ssmSdk.SSM();    }    const resolveSecrets = async (paths) => {        const response = await actualSsmClient.getParameters({            Names: paths,            WithDecryption: true,        });        if (response.Parameters && response.Parameters.length > 0) {            for (const parameter of response.Parameters) {                if (parameter.Name) {                    const envKey = Object.keys(envPathObject).find((key) => envPathObject[key].sharedPath === parameter.Name);                    const envName = envKey                        ? envPathObject[envKey].name                        : envPathObject[parameter.Name]?.name;                    process.env[envName] = parameter.Value;                }            }        }        return response;    };    const response = await resolveSecrets(paths);    const sharedPaths = (response?.InvalidParameters || [])        .map((invalidParam) => envPathObject[invalidParam].sharedPath)        .filter((sharedParam) => !!sharedParam);     if (sharedPaths.length > 0) {        await resolveSecrets(sharedPaths);    }};await internalAmplifyFunctionResolveSsmParams();const SSM_PARAMETER_REFRESH_MS = 1000 * 60;setInterval(() => {    void internalAmplifyFunctionResolveSsmParams();}, SSM_PARAMETER_REFRESH_MS);export {};

// node_modules/@aws-amplify/backend-function/lib/lambda-shims/cjs_shim.js
import { createRequire } from "node:module";
import path from "node:path";
import url from "node:url";
global.require = createRequire(import.meta.url);
global.__filename = url.fileURLToPath(import.meta.url);
global.__dirname = path.dirname(__filename);

// amplify/function/bedrock/handler.ts
import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand
} from "@aws-sdk/client-bedrock-runtime";
var modelId = "anthropic.claude-3-haiku-20240307-v1:0";
var handler = async (event, responseStream, _context) => {
  console.log("Received event:", event);
  const client = new BedrockRuntimeClient({ region: "us-east-1" });
  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 1e3,
    messages: [{
      role: "user",
      content: [{ type: "text", text: event.prompt }]
    }]
  };
  const command = new InvokeModelWithResponseStreamCommand({
    contentType: "application/json",
    body: JSON.stringify(payload),
    modelId
  });
  try {
    const apiResponse = await client.send(command);
    console.log("API Response received");
    if (apiResponse.body) {
      for await (const item of apiResponse.body) {
        if (item.chunk) {
          const chunk = JSON.parse(new TextDecoder().decode(item.chunk.bytes));
          const chunk_type = chunk.type;
          console.log("Received chunk of type:", chunk_type);
          if (chunk_type === "content_block_delta") {
            const text = chunk.delta.text;
            responseStream.write(text);
            console.log("Wrote text to response stream");
          }
        } else {
          console.error("Received error item in stream", item);
        }
      }
    }
  } catch (error) {
    console.error("Error invoking model with response stream:", error);
    throw error;
  } finally {
    responseStream.end();
    console.log("Response stream ended");
  }
};
export {
  handler
};
