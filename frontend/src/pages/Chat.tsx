import { useState, useEffect, useRef } from 'react';
import {
  Button,
  Box,
  TextField,
  Typography,
  InputAdornment,
  styled,
  useTheme as useMuiTheme,
} from '@mui/material';
import TerraSvg from '../../images/TerraSvg';
import SendActive from '../../images/SendActive';
import MessageList from '../components/MessageList';
import { Message } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import SendSvg from '../../images/Send';
import { useSendChatMessageMutation } from '../services/api'; // Import the new mutation hook

const CssTextField = styled(TextField)(
  ({
    theme: {
      palette: {
        mode: themeMode,
        common: { white: whiteColor },
      },
    },
  }) => ({
    '& .MuiOutlinedInput-root': {
      borderRadius: '100px',
      maxWidth: '600px',
      alignSelf: 'center',
      width: '100%',
      background: themeMode === 'dark' ? '#292823' : whiteColor,
      '& fieldset': {
        border: `1px solid ${themeMode === 'dark' ? '#413F38' : '#D4D2CA'}`,
      },
      '&.Mui-focused': {
        '& fieldset': {
          border: `2px solid ${themeMode === 'dark' ? '#413F38' : '#D4D2CA'}`,
        },
      },
    },
  })
);

const DisclaimerText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'visible',
})<{ visible: boolean }>(({ theme, visible }) => ({
  textAlign: 'center',
  color: theme.palette.text.primary,
  fontSize: '14px',
  opacity: visible ? 1 : 0,
  transform: `translateY(${visible ? 0 : '20px'})`,
  transition: 'opacity 0.3s, transform 0.3s',
}));

export const Chat = () => {
  const { isDarkMode } = useTheme();
  const theme = useMuiTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  // const [isLoading, setIsLoading] = useState(false); // Removed: will use isPending from useMutation
  const [isAtBottom, setIsAtBottom] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: sendMessage, isPending } = useSendChatMessageMutation(); // Use the mutation hook

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isBottom = Math.abs(scrollHeight - clientHeight - scrollTop) <= 1;
      setIsAtBottom(isBottom);
    }
  };

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }

    return () => {
      if (chatContainer) {
        chatContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current && messages.length > 0) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      setIsAtBottom(true);
    }
  }, [messages.length]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isPending) return; // Use isPending

    const userMessage: Message = {
      id: Date.now(),
      content: input,
      role: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input; // Store input before clearing
    setInput('');
    const requestStartTime = Date.now();

    try {
      const data = await sendMessage(currentInput); // Call mutateAsync
      const assistantMessage: Message = {
        id: Date.now() + 1,
        content: data.response,
        role: 'assistant',
        source: data.source,
        responseTime: Date.now() - requestStartTime,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessageContent = error instanceof Error ? error.message : 'Sorry, there was an error processing your message.';
      const errorMessage: Message = {
        id: Date.now() + 1,
        content: errorMessageContent,
        role: 'assistant',
        isError: true, // Optional: add an isError flag for styling
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
    // No finally block needed for setIsLoading(false) as isPending handles this
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: messages.length > 0 ? '100%' : 'auto',
      }}
    >
      {messages.length < 1 ? (
        <Box sx={{ my: 4 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <TerraSvg />
            <Typography
              variant='h4'
              sx={{
                textAlign: 'center',
                color: 'text.primary',
                fontSize: '36px',
                fontWeight: '600',
                lineHeight: '48px',
                letterSpacing: '0.72px',
              }}
            >
              Woof, how can I help you?
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            pt: 3,
            px: 3,
          }}
        >
          <Box
            ref={chatContainerRef}
            sx={{
              flex: 1,
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'action.hover',
                borderRadius: '4px',
              },
            }}
          >
            <MessageList messages={messages} isLoading={isPending} /> {/* Use isPending */}
          </Box>
        </Box>
      )}

      <Box
        sx={{
          ...(messages.length > 0 && {
            position: 'sticky',
            bottom: 0,
            background: theme.palette.background.default,
            pb: 3,
          }),
          zIndex: 1100,
        }}
      >
        <Box
          sx={{
            maxWidth: '800px',
            mx: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <CssTextField
            fullWidth
            multiline
            maxRows={4}
            variant='outlined'
            placeholder='Chat with Terra'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            inputRef={inputRef}
            InputProps={{
              endAdornment: (
                <InputAdornment position='start'>
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isPending} // Use isPending
                    sx={{
                      minWidth: 'auto',
                      borderRadius: '50%',
                      ...((input.trim() || !isPending) && { // Use isPending
                        '&:hover': {
                          backgroundColor: 'rgba(240, 203, 12, 0.16)',
                        },
                      }),
                    }}
                  >
                    {!input.trim() || isPending ? ( // Use isPending
                      <SendSvg color={isDarkMode ? '#656359' : '#E3E0D5'} />
                    ) : (
                      <SendActive />
                    )}
                  </Button>
                </InputAdornment>
              ),
            }}
          />
          {messages.length > 0 && (
            <DisclaimerText visible={isAtBottom}>
              TerraChat can make mistakes. Please verify the important information.
            </DisclaimerText>
          )}
        </Box>
      </Box>
    </Box>
  );
};
