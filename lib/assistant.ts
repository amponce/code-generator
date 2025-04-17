export interface MessageContent {
  type: string;
  text?: string;
  [key: string]: any;
}

export interface Item {
  type: string;
  role: 'user' | 'assistant' | 'system';
  content: MessageContent[];
  id?: string;
  name?: string;
  [key: string]: any;
} 