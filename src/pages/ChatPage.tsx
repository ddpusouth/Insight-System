import React, { useState, useEffect, useRef, useMemo } from 'react';
import { API_BASE_URL } from '@/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search,
  Send,
  User,
  Clock,
  MoreVertical,
  RefreshCw
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';

// Utility function to render text with clickable links
const renderTextWithLinks = (text: string) => {
  // URL regex pattern to match http/https URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

// Sample chat data
const sampleChats = [
];

// Predefined group categories
const groupCategories = [
  'All Colleges',
  'Un-Aided',
  'Aided',
  'Bifurcated',
  'Government',
  'Corporation',
  'Kittur Rani Chennamma'
];


export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [colleges, setColleges] = useState<any[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<string>('');
  const [selectedChat, setSelectedChat] = useState(sampleChats[0]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [collegeTypeFilter, setCollegeTypeFilter] = useState('all');
  const [messages, setMessages] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [chatMode, setChatMode] = useState<'all' | 'groups'>('all');

  // Update filteredColleges logic for DDPO chat Conversations:
  const filteredColleges = useMemo(() => {
    let result = colleges;

    const term = searchTerm.trim().toLowerCase();
    const category = selectedCategory.toLowerCase();

    if (category !== 'all') {
      result = result.filter(
        c => (c.Category || '').trim().toLowerCase() === category
      );
    }

    if (term) {
      result = result.filter(c =>
        (c['College Name'] || '').toLowerCase().includes(term) ||
        (c['College Code'] || '').toLowerCase().includes(term) ||
        (c['Address'] || '').toLowerCase().includes(term) ||
        (c['Username'] || '').toLowerCase().includes(term)
      );
    }

    return result;
  }, [colleges, selectedCategory, searchTerm]);

  // Group colleges by category for Groups mode
  const groupedColleges = useMemo(() => {
    const groups: { [key: string]: any[] } = { 'All Colleges': colleges };
    filteredColleges.forEach(college => {
      const category = college.Category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(college);
    });
    return groups;
  }, [filteredColleges]);

  // Fetch all colleges for DDPO
  const fetchColleges = async () => {
    if (user?.role === 'ddpo') {
      try {
        const res = await fetch(`${API_BASE_URL}/api/colleges/all`);
        const data = await res.json();
        setColleges(data.colleges || []);
        const uniqueCategories = Array.from(new Set((data.colleges || []).map((c: any) => c.Category))).filter(Boolean) as string[];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching colleges:', error);
      }
    }
  };

  useEffect(() => {
    fetchColleges();
  }, [user?.role]);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Scroll to bottom on mount or when messages update
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  // Refresh functions
  const handleRefreshColleges = async () => {
    await fetchColleges(); // Refresh the list of colleges

    if (!selectedCollege || user?.role !== 'ddpo') return;

    try {
      const endpoint =
        chatMode === 'groups'
          ? `${API_BASE_URL}/api/chat/groups/${selectedCollege}`
          : `${API_BASE_URL}/api/chat/${selectedCollege}`;

      const res = await fetch(endpoint);
      const data = await res.json();
      setMessages(data); // Overwrite old messages
    } catch (error) {
      console.error('Error refreshing messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh messages.',
        variant: 'destructive'
      });
    }
  };


  const handleRefreshMessages = async () => {
    const targetUsername = user?.role === 'ddpo' ? selectedCollege : user?.username;
    if (targetUsername) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/chat/${targetUsername}`);
        const data = await res.json();
        setMessages(data);
      } catch (error) {
        console.error('Error refreshing messages:', error);
        toast({
          title: 'Error',
          description: 'Failed to refresh messages.',
          variant: 'destructive'
        });
      }
    }
  };


  // Determine which collegeUsername to use
  const collegeUsername = user?.role === 'ddpo' ? selectedCollege : user?.username;

  useEffect(() => {
    if (!collegeUsername) return;

    // Fetch messages based on mode
    if (chatMode === 'groups' && user?.role === 'ddpo') {
      // Fetch group messages for the selected category
      fetch(`${API_BASE_URL}/api/chat/groups/${selectedCollege}`)
        .then(res => res.json())
        .then(setMessages);
    } else {
      // Fetch individual messages
      fetch(`${API_BASE_URL}/api/chat/${collegeUsername}`)
        .then(res => res.json())
        .then(setMessages);
    }

    socketRef.current = io(API_BASE_URL);

    // Join the college-specific room
    socketRef.current.emit('join college room', collegeUsername);

    socketRef.current.on('chat message', (msg: any) => {
      // Check if the message belongs to the current conversation context
      const isRelevant =
        msg.collegeUsername === collegeUsername ||
        (user?.role !== 'ddpo' && (msg.receiver === user?.username || msg.sender === user?.username));

      if (isRelevant) {
        setMessages(prev => {
          // Avoid duplicates if necessary, though simple append is usually fine
          return [...prev, msg];
        });
      }
    });

    socketRef.current.on('group message', (msg: any) => {
      if (user?.role === 'ddpo') {
        if (msg.category === selectedCollege && chatMode === 'groups') {
          setMessages(prev => [...prev, msg]);
        }
      } else {
        // For college users, receive all group messages
        // Ideally, we should filter by category, but without user category context,
        // we allow it to ensure they receive the message.
        setMessages(prev => [...prev, msg]);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [collegeUsername, chatMode, selectedCollege, user?.role]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      if (chatMode === 'groups' && user?.role === 'ddpo') {
        // Group message - send to all colleges in the selected category
        const msg = {
          sender: 'ddpo',
          content: newMessage,
          isGroupMessage: true,
          groupCategory: selectedCollege, // selectedCollege is the category name in groups mode
        };

        const res = await fetch(`${API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msg),
        });

        if (!res.ok) {
          throw new Error('Failed to send group message');
        }

        const result = await res.json();
        console.log(`Group message sent to ${result.sentTo} colleges in ${result.category}`);

        // Emit socket event for group message
        socketRef.current?.emit('group message', {
          ...msg,
          timestamp: new Date().toISOString(),
          category: selectedCollege,
          sentTo: result.sentTo
        });

        setNewMessage('');

        // Refresh messages to show the single group message
        fetch(`${API_BASE_URL}/api/chat/groups/${selectedCollege}`)
          .then(res => res.json())
          .then(setMessages);

        // Show success message
        toast({
          title: 'Group Message Sent',
          description: `Message sent to ${result.sentTo} colleges in ${result.category}`,
          className: 'bg-green-500 text-white border border-green-100 rounded-xl'
        });


      } else {
        // Individual message
        if (!collegeUsername) return;

        const msg = {
          sender: user?.role === 'ddpo' ? 'ddpo' : user?.username,
          receiver: user?.role === 'ddpo' ? collegeUsername : 'ddpo',
          content: newMessage,
          collegeUsername,
          isGroupMessage: false
        };

        await fetch(`${API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msg),
        });

        setNewMessage('');

        // Fetch updated messages
        fetch(`${API_BASE_URL}/api/chat/${collegeUsername}`)
          .then(res => res.json())
          .then(setMessages);

        socketRef.current?.emit('chat message', {
          ...msg,
          timestamp: new Date().toISOString(),
          isOwn: true,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'teacher': return 'bg-secondary';
      case 'ddpo': return 'bg-accent';
      case 'group': return 'bg-primary';
      default: return 'bg-muted';
    }
  };

  if (user?.role === 'ddpo') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground text-leftr mb-2">Chat</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)] lg:h-[calc(100vh-10rem)]">
          {/* Enhanced Conversations List with Category Dropdown */}
          <Card className="lg:col-span-1 shadow-xl rounded-2xl">
            <CardHeader className="sticky top-0 z-10 bg-background rounded-t-2xl">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Conversations</CardTitle>
                <Button onClick={handleRefreshColleges} variant="outline" size="sm" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>

              {/* Chat Mode Toggle */}
              <div className="flex bg-muted rounded-lg p-1 mt-2">
                <Button
                  variant={chatMode === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChatMode('all')}
                  className="flex-1"
                >
                  All Chat
                </Button>
                <Button
                  variant={chatMode === 'groups' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChatMode('groups')}
                  className="flex-1"
                >
                  Groups
                </Button>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') setSearchTerm(searchTerm);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto">
              <ScrollArea className="h-[500px]">
                {chatMode === 'all' ? (
                  // All Chat Mode
                  <>
                    {filteredColleges.length === 0 && searchTerm.trim() !== '' && (
                      <div className="p-4 text-muted-foreground text-sm text-center">No colleges found for this category.</div>
                    )}
                    {filteredColleges.map((col: any) => (
                      <div key={col.Username}>
                        <div
                          className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer mb-1 shadow-sm border border-transparent
                        ${selectedCollege === col.Username ? 'border-l-4 border-primary shadow-md' : 'hover:bg-muted/60'}`}
                          onClick={() => setSelectedCollege(col.Username)}
                        >
                          {/* User Icon */}
                          <div className="h-12 w-12 border-2 border-primary/30 shadow rounded-full bg-muted flex items-center justify-center">
                            <User className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-foreground text-base break-words">{col['College Name'] || col.Username}</span>

                            </div>
                            <span className="text-xs text-muted-foreground truncate">{col.Username}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  // Groups Mode - Show only predefined group categories
                  <>
                    {groupCategories.map((category) => {
                      const collegesInGroup = groupedColleges[category] || [];
                      return (
                        <div key={category} className="mb-3">
                          <div
                            className={`px-4 py-3 bg-muted/50 rounded-lg cursor-pointer transition-colors hover:bg-muted/70
                              ${selectedCollege === category ? 'border-l-4 border-primary shadow-md' : ''}`}
                            onClick={() => setSelectedCollege(category)}
                          >
                            <div className="flex items-center gap-3">
                              {/* User Icon for Group */}
                              <div className="h-10 w-10 border-2 border-primary/30 shadow rounded-full bg-muted flex items-center justify-center">
                                <User className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-sm text-foreground">{category}</h3>
                                <p className="text-xs text-muted-foreground">{collegesInGroup.length} colleges</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
          {/* Enhanced Chat Interface */}
          <Card className="lg:col-span-2 shadow-xl rounded-2xl flex flex-col h-full lg:max-h-[100vh]">
            {selectedCollege ? (
              <>
                <CardHeader className="sticky top-0 z-10 bg-background rounded-t-2xl">
                  <div className="flex items-center space-x-3">
                    {/* User Icon */}
                    <div className="h-10 w-10 border-2 border-primary/30 shadow-sm rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {chatMode === 'groups' ? selectedCollege :
                          (filteredColleges.find(c => c.Username === selectedCollege)?.['College Name'] || selectedCollege)}
                      </CardTitle>
                      <CardDescription>
                        {chatMode === 'groups' ? 'Group Chat' : 'College Chat'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 overflow-hidden bg-background rounded-b-2xl">
                  <ScrollArea className="flex-1 p-4 overflow-y-auto">

                    <div className="space-y-4">
                      {messages.map((message, idx) => (
                        <div
                          key={idx}
                          className={`flex ${message.sender === 'ddpo' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl p-3 shadow transition-all
                              ${message.sender === 'ddpo'
                                ? 'bg-muted text-foreground'
                                : 'bg-muted text-foreground'
                              }`}
                          >
                            {message.sender !== 'ddpo' && (
                              <span className="text-xs font-medium mb-1 opacity-70 block">
                                {message.sender}
                              </span>
                            )}
                            <div className="text-sm whitespace-pre-line">{renderTextWithLinks(message.content)}</div>
                            <div className={`text-xs mt-1 ${message.sender === 'ddpo' ? 'opacity-70' : 'text-muted-foreground'}`}>
                              {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''}
                              {message.isGroupMessage && (
                                <span className="ml-2 text-xs opacity-60">(Group: {message.groupCategory})</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  {/* Enhanced Message Input */}
                  <div className="border-t pt-4 bg-background rounded-b-2xl">
                    <div className="flex items-center gap-2 bg-background rounded-xl shadow px-3 py-2 mt-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1 border-none focus:ring-0 bg-transparent"
                      />
                      <Button onClick={handleSendMessage} disabled={!newMessage.trim()} className="rounded-full">
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full text-muted-foreground">
                Select a college to start chatting.
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    );
  }

  if (user?.role !== 'ddpo') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground text-left mb-2">Chat</h1>
        </div>
        <div className="flex justify-center">
          <Card className="w-full max-w-2xl shadow-xl rounded-2xl">
            <CardHeader className="bg-background rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 py-2">
                  {/* User Icon */}
                  <div className="h-12 w-12 border-2 border-primary/30 shadow-sm rounded-full bg-muted flex items-center justify-center">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold">DDPU Office</CardTitle>
                    <CardDescription>
                      Chat
                    </CardDescription>
                  </div>
                </div>
                <Button onClick={handleRefreshMessages} variant="outline" size="sm" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 h-[500px] bg-background rounded-b-2xl">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message, idx) => (
                    <div key={idx} className="flex justify-start">
                      <div className="max-w-[70%] rounded-2xl p-3 shadow bg-muted text-foreground">
                        <div className="text-sm whitespace-pre-line">
                          {renderTextWithLinks(message.content)}
                        </div>
                        <div className="text-xs mt-1 text-muted-foreground">
                          {message.timestamp ? (() => {
                            const d = new Date(message.timestamp);
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const year = String(d.getFullYear()).slice(-2);
                            let hours = d.getHours();
                            const minutes = String(d.getMinutes()).padStart(2, '0');
                            const seconds = String(d.getSeconds()).padStart(2, '0');
                            const ampm = hours >= 12 ? 'PM' : 'AM';
                            hours = hours % 12 || 12;
                            return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
                          })() : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Scroll target */}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>

              {/* Enhanced Message Input (read-only for college) */}
              <div className="border-t pt-4 bg-background rounded-b-2xl">
                <div className="flex items-center gap-2 bg-background rounded-xl shadow px-3 py-2 mt-2">
                  <Input
                    placeholder="Type your message..."
                    value={''}
                    disabled
                    className="flex-1 border-none focus:ring-0 bg-transparent opacity-60 cursor-not-allowed"
                  />
                  <Button disabled className="rounded-full opacity-60 cursor-not-allowed">
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Optionally, a fallback for other roles
  return <div>Not authorized</div>;
}