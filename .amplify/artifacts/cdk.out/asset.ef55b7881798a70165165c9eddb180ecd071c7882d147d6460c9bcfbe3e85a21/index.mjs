/** * Reads SSM environment context from a known Amplify environment variable, * fetches values from SSM and places those values in the corresponding environment variables */export const internalAmplifyFunctionResolveSsmParams = async (client) => {    const envPathObject = JSON.parse(process.env.AMPLIFY_SSM_ENV_CONFIG ?? '{}');    const paths = Object.keys(envPathObject);    if (paths.length === 0) {        return;    }    let actualSsmClient;    if (client) {        actualSsmClient = client;    }    else {        const ssmSdk = await import('@aws-sdk/client-ssm');        actualSsmClient = new ssmSdk.SSM();    }    const resolveSecrets = async (paths) => {        const response = await actualSsmClient.getParameters({            Names: paths,            WithDecryption: true,        });        if (response.Parameters && response.Parameters.length > 0) {            for (const parameter of response.Parameters) {                if (parameter.Name) {                    const envKey = Object.keys(envPathObject).find((key) => envPathObject[key].sharedPath === parameter.Name);                    const envName = envKey                        ? envPathObject[envKey].name                        : envPathObject[parameter.Name]?.name;                    process.env[envName] = parameter.Value;                }            }        }        return response;    };    const response = await resolveSecrets(paths);    const sharedPaths = (response?.InvalidParameters || [])        .map((invalidParam) => envPathObject[invalidParam].sharedPath)        .filter((sharedParam) => !!sharedParam);     if (sharedPaths.length > 0) {        await resolveSecrets(sharedPaths);    }};await internalAmplifyFunctionResolveSsmParams();const SSM_PARAMETER_REFRESH_MS = 1000 * 60;setInterval(() => {    void internalAmplifyFunctionResolveSsmParams();}, SSM_PARAMETER_REFRESH_MS);export {};

// node_modules/@aws-amplify/backend-function/lib/lambda-shims/cjs_shim.js
import { createRequire } from "node:module";
import path from "node:path";
import url from "node:url";
global.require = createRequire(import.meta.url);
global.__filename = url.fileURLToPath(import.meta.url);
global.__dirname = path.dirname(__filename);

// amplify/function/hello/handler.ts
var handler = async (event, context) => {
  return { message: "Hello, World shima " };
};
export {
  handler
};
