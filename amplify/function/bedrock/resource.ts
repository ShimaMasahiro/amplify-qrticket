import { defineFunction } from '@aws-amplify/backend';

export const bedrock = defineFunction({
    name: 'bedrock',
    entry: './handler.ts',
})