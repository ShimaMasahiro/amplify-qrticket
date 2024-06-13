import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { hello } from './function/hello/resource'
import { bedrock } from './function/bedrock/resource'
import * as iam from 'aws-cdk-lib/aws-iam';

const backend = defineBackend({
  auth,
  hello,
  bedrock,
});

//認証されたユーザーのIAMロールの取得
const authenticatedUserIamRole = backend.auth.resources.authenticatedUserIamRole;

const bedrockStatement = new iam.PolicyStatement({
  actions: ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
  resources: ["arn:aws:bedrock:us-east-1::foundation-model/*"]
})

//Lambda関数への実行権限の付与
backend.hello.resources.lambda.grantInvoke(authenticatedUserIamRole);
backend.bedrock.resources.lambda.grantInvoke(authenticatedUserIamRole);

backend.bedrock.resources.lambda.addToRolePolicy(bedrockStatement)

//amplify_outputs.jsonにLambda関数名を出力する。
backend.addOutput({
  custom: {
    helloFunctionName: backend.hello.resources.lambda.functionName,
    bedrockFunctionName: backend.bedrock.resources.lambda.functionName,
  },
});



