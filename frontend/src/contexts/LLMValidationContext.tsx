import { createContext, useContext, ReactNode } from 'react';
import { LLMValidationResponse, useValidateLLMKeysQuery } from '../services/api';

interface LLMValidationContextType {
  llmValidation: LLMValidationResponse | null | undefined; // Updated to include undefined
  isLoading: boolean;
  hasValidKey: boolean;
}

const LLMValidationContext = createContext<LLMValidationContextType | undefined>(undefined);

export const LLMValidationProvider = ({ children }: { children: ReactNode }) => {
  const { data: llmValidation, isLoading, error } = useValidateLLMKeysQuery();

  // Log error to console if the query fails
  if (error) {
    console.error('Failed to validate LLM keys:', error);
  }

  const hasValidKey = Boolean(
    llmValidation &&
      (llmValidation.LANGCHAIN_API_KEY || // Check if at least one key is true
        llmValidation.HF_TOKEN ||
        llmValidation.COHERE_API_KEY ||
        llmValidation.GOOGLE_API_KEY ||
        llmValidation.MISTRAL_API_KEY ||
        llmValidation.X_API_KEY)
  );

  return (
    <LLMValidationContext.Provider value={{ llmValidation, isLoading, hasValidKey }}>
      {children}
    </LLMValidationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLLMValidation = () => {
  const context = useContext(LLMValidationContext);
  if (context === undefined) {
    throw new Error('useLLMValidation must be used within a LLMValidationProvider');
  }
  return context;
};
