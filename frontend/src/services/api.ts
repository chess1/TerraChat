import { useQuery, useMutation } from '@tanstack/react-query';
import { ModelSource } from '../types';

export interface LLMValidationResponse {
  LANGCHAIN_API_KEY: boolean;
  HF_TOKEN: boolean;
  COHERE_API_KEY?: boolean;
  GOOGLE_API_KEY?: boolean;
  MISTRAL_API_KEY: boolean;
  X_API_KEY?: boolean;
}

export interface ChatResponse { // Exporting ChatResponse as it's used in the mutation hook
  response: string;
  source?: ModelSource;
}

const BASE_URL = 'http://localhost:8000';

export const validateLLMKeys = async (): Promise<LLMValidationResponse> => {
  const response = await fetch(`${BASE_URL}/llms`);
  if (!response.ok) {
    throw new Error('Failed to validate LLM keys');
  }
  return response.json();
};

export const useValidateLLMKeysQuery = () => {
  return useQuery<LLMValidationResponse, Error>({
    queryKey: ['llmValidation'],
    queryFn: validateLLMKeys,
  });
};

export const sendChatMessage = async (question: string): Promise<ChatResponse> => {
  const response = await fetch(`${BASE_URL}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Failed to send message. Status:', response.status, 'Body:', errorBody);
    throw new Error(`Failed to send message: ${errorBody || response.statusText}`);
  }

  return response.json();
};

export const useSendChatMessageMutation = () => {
  return useMutation<ChatResponse, Error, string>({ // Type parameters: TData, TError, TVariables (question is string)
    mutationFn: sendChatMessage,
  });
};
