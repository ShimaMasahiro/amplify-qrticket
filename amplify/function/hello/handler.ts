import { Handler } from 'aws-lambda';

export const handler: Handler = async (event, context) => {
    return { message: 'Hello! 2024-06-12' }
}