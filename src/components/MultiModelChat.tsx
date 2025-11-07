import React, { useState, useEffect, useRef } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Flex } from './ui/Flex';
import { Box } from './ui/Box';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ChatModel {
  id: string;
  name: string;
  provider: string;
  isActive: boolean;
  position: number;
  config: Record<string, any>;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  modelResponses: ModelResponse[];
}

interface ModelResponse {
  id: string;
  modelName: string;
  responseText: string;
  responseTime: number;
  tokenUsage: {
    input: number;
    output: number;
  };
  costEstimate: number;
  qualityRating?: number;
}

interface ChatSession {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export const MultiModelChat: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedModels, setSelectedModels] = useState<ChatModel[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState<ChatModel[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 加载可用模型
  useEffect(() => {
    loadAvailableModels();
  }, []);

  // 加载用户的聊天会话
  useEffect(() => {
    if (user) {
      loadChatSessions();
    }
  }, [user]);

  // 自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAvailableModels = async () => {
    if (!supabase) return;
    
    try {
      const { data: models, error } = await supabase
        .from('llm_models')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      const chatModels: ChatModel[] = models.map((model, index) => ({
        id: model.id,
        name: model.name,
        provider: model.provider,
        isActive: false,
        position: index,
        config: {
          temperature: 0.7,
          maxTokens: 2048,
          topP: 1.0
        }
      }));

      setAvailableModels(chatModels);
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const loadChatSessions = async () => {
    if (!user || !supabase) return;

    try {
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setSessions(sessions || []);
      
      // 如果有会话，自动选择第一个
      if (sessions && sessions.length > 0 && !currentSession) {
        setCurrentSession(sessions[0]);
        loadChatMessages(sessions[0].id);
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  };

  const loadChatMessages = async (sessionId: string) => {
    if (!supabase) return;
    
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          model_responses (*)
        `)
        .eq('session_id', sessionId)
        .eq('is_deleted', false)
        .order('timestamp');

      if (error) throw error;

      const chatMessages: ChatMessage[] = messages.map(msg => ({
        id: msg.id,
        type: msg.message_type,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        modelResponses: msg.model_responses || []
      }));

      setMessages(chatMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const createNewSession = async () => {
    if (!user || !supabase) return;

    try {
      const { data: session, error } = await supabase
        .from('chat_sessions')
        .insert([
          {
            user_id: user.id,
            title: `Chat Session ${new Date().toLocaleString()}`,
            description: 'Multi-model chat session'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(session);
      setMessages([]);
      setSessions(prev => [session, ...prev]);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const toggleModel = (modelId: string) => {
    setSelectedModels(prev => {
      const isSelected = prev.some(m => m.id === modelId);
      if (isSelected) {
        return prev.filter(m => m.id !== modelId);
      } else {
        const model = availableModels.find(m => m.id === modelId);
        if (model && prev.length < 3) { // 最多选择3个模型
          return [...prev, { ...model, isActive: true }];
        }
      }
      return prev;
    });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || selectedModels.length === 0) return;

    setIsLoading(true);
    const userMessage = inputMessage.trim();
    setInputMessage('');

    try {
      // 添加用户消息到界面
      const newMessage: ChatMessage = {
        id: crypto.randomUUID(),
        type: 'user',
        content: userMessage,
        timestamp: new Date(),
        modelResponses: []
      };
      
      setMessages(prev => [...prev, newMessage]);

      // 调用 edge function 处理多模型响应
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/multi-model-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          sessionId: currentSession.id,
          message: userMessage,
          models: selectedModels.map(m => ({
            id: m.id,
            name: m.name,
            provider: m.provider,
            config: m.config
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // 重新加载消息以获取最新的模型响应
      await loadChatMessages(currentSession.id);

    } catch (error) {
      console.error('Error sending message:', error);
      // 可以添加错误处理UI
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Box className="h-screen flex bg-gray-50">
      {/* 侧边栏 - 会话和模型选择 */}
      <Box className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* 会话列表 */}
        <Box className="p-4 border-b border-gray-200">
          <Flex justify="between" align="center" className="mb-4">
            <h3 className="text-lg font-semibold">Chat Sessions</h3>
            <Button onClick={createNewSession} size="sm">
              New Chat
            </Button>
          </Flex>
          <Box className="space-y-2 max-h-40 overflow-y-auto">
            {sessions.map(session => (
              <Card
                key={session.id}
                className={`p-3 cursor-pointer transition-colors ${
                  currentSession?.id === session.id 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  setCurrentSession(session);
                  loadChatMessages(session.id);
                }}
              >
                <div className="text-sm font-medium truncate">{session.title}</div>
                <div className="text-xs text-gray-500">
                  {new Date(session.updatedAt).toLocaleDateString()}
                </div>
              </Card>
            ))}
          </Box>
        </Box>

        {/* 模型选择 */}
        <Box className="p-4 flex-1">
          <h3 className="text-lg font-semibold mb-4">
            Select Models ({selectedModels.length}/3)
          </h3>
          <Box className="space-y-2 max-h-96 overflow-y-auto">
            {availableModels.map(model => (
              <Card
                key={model.id}
                className={`p-3 cursor-pointer transition-colors ${
                  selectedModels.some(m => m.id === model.id)
                    ? 'bg-green-50 border-green-200'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => toggleModel(model.id)}
              >
                <div className="text-sm font-medium">{model.name}</div>
                <div className="text-xs text-gray-500">{model.provider}</div>
              </Card>
            ))}
          </Box>
        </Box>
      </Box>

      {/* 主聊天区域 */}
      <Box className="flex-1 flex flex-col">
        {/* 聊天消息 */}
        <Box className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <Box key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <Card className={`max-w-2xl p-4 ${
                message.type === 'user' 
                  ? 'bg-blue-500 text-white ml-12' 
                  : 'bg-gray-800 mr-12'
              }`}>
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.type === 'user' && (
                  <div className="text-xs mt-2 opacity-75">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                )}
                
                {/* 模型响应 */}
                {message.modelResponses && message.modelResponses.length > 0 && (
                  <Box className="mt-4 space-y-3">
                    {message.modelResponses.map((response, index) => (
                      <Card key={response.id} className="p-3 bg-gray-50">
                        <Flex justify="between" align="center" className="mb-2">
                          <span className="font-medium text-sm">{response.modelName}</span>
                          <span className="text-xs text-gray-500">
                            {response.responseTime}ms
                          </span>
                        </Flex>
                        <div className="text-sm whitespace-pre-wrap">{response.responseText}</div>
                        {response.tokenUsage && (
                          <Flex className="mt-2 text-xs text-gray-500 space-x-4">
                            <span>Input: {response.tokenUsage.input}</span>
                            <span>Output: {response.tokenUsage.output}</span>
                            {response.costEstimate && (
                              <span>Cost: ${response.costEstimate.toFixed(4)}</span>
                            )}
                          </Flex>
                        )}
                      </Card>
                    ))}
                  </Box>
                )}
              </Card>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        {/* 输入区域 */}
        <Box className="p-4 border-t border-gray-700 bg-gray-800">
          <Flex gap={2}>
            <Input
              value={inputMessage}
              onChange={(value) => setInputMessage(value)}
              onKeyPress={handleKeyPress}
              placeholder={
                selectedModels.length === 0 
                  ? "Please select at least one model..." 
                  : "Type your message..."
              }
              disabled={isLoading || selectedModels.length === 0}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!inputMessage.trim() || isLoading || selectedModels.length === 0}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </Flex>
          {selectedModels.length > 0 && (
            <Flex className="mt-2 text-sm text-gray-600">
              Active models: {selectedModels.map(m => m.name).join(', ')}
            </Flex>
          )}
        </Box>
      </Box>
    </Box>
  );
}; 