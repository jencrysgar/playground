export type Message = {
  id: string;
  name: string;
  text: string;
  createdAt: string;
};

// In-memory store. This resets on server restart and is intended as a simple
// starting point. Swap this out for a real database (e.g. Postgres, SQLite)
// as the project grows.
const messages: Message[] = [
  {
    id: "seed-1",
    name: "The Team",
    text: "Welcome to your new app! Leave a message below to try it out.",
    createdAt: new Date().toISOString(),
  },
];

export function getMessages(): Message[] {
  return messages;
}

export function addMessage(name: string, text: string): Message {
  const message: Message = {
    id: crypto.randomUUID(),
    name: name.slice(0, 80),
    text: text.slice(0, 500),
    createdAt: new Date().toISOString(),
  };
  messages.unshift(message);
  return message;
}
