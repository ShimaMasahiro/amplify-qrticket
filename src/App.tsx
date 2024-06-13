import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { Authenticator } from '@aws-amplify/ui-react'
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda'
import { fetchAuthSession } from 'aws-amplify/auth'

import outputs from "../amplify_outputs.json"

function App() {
  const [count, setCount] = useState(0)
  const [text, setText] = useState("")
  const [aiMessage, setAiMessage] = useState("")
  const [prompt, setPrompt] = useState("");

  async function hello() {
    const { credentials } = await fetchAuthSession()
    const awsRegion = outputs.auth.aws_region
    const functionName = outputs.custom.helloFunctionName
    let apiResponse;

    try {
      const lambda = new LambdaClient({ credentials: credentials, region: awsRegion })
      const command = new InvokeCommand({
        FunctionName: functionName,
      });
      apiResponse = await lambda.send(command);
    } catch (error) {
      console.error("Error invoking Hello function:", error);
      return;
    }
    if (apiResponse && apiResponse.Payload) {
      const payload = JSON.parse(new TextDecoder().decode(apiResponse.Payload))
      setText(payload.message)
    }
  }

  async function bedrock() {
    const { credentials } = await fetchAuthSession();
    const awsRegion = outputs.auth.aws_region;
    const functionName = outputs.custom.bedrockFunctionName;

    try {
      const lambda = new LambdaClient({ credentials, region: awsRegion });
      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: new TextEncoder().encode(JSON.stringify({ prompt }))
      });
      const apiResponse = await lambda.send(command);

      console.log("API Response:", apiResponse); // レスポンス内容を詳細にログ出力

      if (apiResponse.StatusCode === 200 && apiResponse.Payload) {
        const payloadStr = new TextDecoder().decode(apiResponse.Payload); // デコード処理
        console.log("Decoded Payload:", payloadStr); // デコード結果をログ出力
        const payload = JSON.parse(payloadStr);
        setAiMessage(payload.message);
      }
    } catch (error) {
      console.error("Error invoking Bedrock function:", error);
    }
  }

  return (
    <Authenticator>
      {({ signOut, user }) => (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h3>Vite + React</h3>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
      <p>
        <button onClick={hello}>hello</button>
        <div>{text}</div>
      </p>
      <p>
        <textarea
          onChange={(e) => setPrompt(e.target.value)}
          value={prompt}
          style={{ width: '50vw', textAlign: 'left' }}
        ></textarea>
        <br />
        <button onClick={bedrock}>bedrock</button>
        <div style={{ width: '50vw', textAlign: 'left' }}>{aiMessage}</div>
      </p>
    </>
        )}
    </Authenticator>
  )
}

export default App
