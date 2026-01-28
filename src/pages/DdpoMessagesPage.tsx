import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/config';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Calendar, RefreshCw, Trash2, User, MessageSquare, Reply, Inbox, ChevronDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ContactMessage {
    _id: string;
    name: string;
    subject: string;
    message: string;
    createdAt: string;
}

const DdpoMessagesPage: React.FC = () => {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchMessages = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE_URL}/api/contactus`);
            const data = await res.json();
            setMessages(data);
        } catch (err) {
            setError('Failed to fetch messages');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        await fetchMessages();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
            return;
        }

        setDeletingId(id);
        try {
            const res = await fetch(`${API_BASE_URL}/api/contactus/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error('Failed to delete message');
            }

            setMessages(messages.filter(msg => msg._id !== id));
        } catch (err) {
            setError('Failed to delete message');
        } finally {
            setDeletingId(null);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    // Helper to generate initials
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Helper to get random soft background color for avatar
    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-red-100 text-red-600',
            'bg-green-100 text-green-600',
            'bg-blue-100 text-blue-600',
            'bg-yellow-100 text-yellow-600',
            'bg-purple-100 text-purple-600',
            'bg-pink-100 text-pink-600',
            'bg-indigo-100 text-indigo-600',
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className="container mx-auto py-8 animate-fade-in space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Contact Messages
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage inquiries and support requests ({messages.length})
                    </p>
                </div>
                <Button onClick={handleRefresh} variant="outline" className="gap-2 shadow-sm hover:shadow-md transition-shadow">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Lists
                </Button>
            </div>

            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 rounded-xl bg-gray-100 animate-pulse" />
                    ))}
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
                    <span className="font-semibold">Error:</span> {error}
                </div>
            )}

            {!loading && !error && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-2xl border border-dashed border-gray-200">
                    <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Inbox className="h-10 w-10 text-gray-300" />
                    </div>
                    <p className="text-xl font-medium text-gray-900">No messages yet</p>
                    <p className="text-muted-foreground">Your inbox is completely empty.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {messages.map((msg, index) => (
                    <Card
                        key={msg._id}
                        className={`group hover:shadow-xl transition-all duration-300 border-border/50 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 animate-slide-up stagger-${(index % 9) + 1}`}
                    >
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-3">
                                <Avatar className={`h-10 w-10 border-2 border-white shadow-sm ${getAvatarColor(msg.name)}`}>
                                    <AvatarFallback>{getInitials(msg.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm line-clamp-1">{msg.name}</span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        {new Date(msg.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            {/* New Badge Logic could go here if we tracked read status */}
                            <Badge variant="secondary" className="text-[10px] px-1.5 h-5">New</Badge>
                        </CardHeader>
                        <CardContent className="pt-4 pb-2">
                            <div className="mb-2">
                                <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
                                    {msg.subject}
                                </h3>
                            </div>
                            <p className={`text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words ${expandedId === msg._id ? '' : 'line-clamp-3'}`}>
                                {msg.message}
                            </p>
                            {msg.message.length > 150 && (
                                <button
                                    onClick={() => setExpandedId(expandedId === msg._id ? null : msg._id)}
                                    className="text-xs text-primary hover:text-primary/80 mt-2 flex items-center gap-1 transition-colors"
                                >
                                    <span>{expandedId === msg._id ? 'Show less' : 'Read more'}</span>
                                    <ChevronDown className={`h-3 w-3 transition-transform ${expandedId === msg._id ? 'rotate-180' : ''}`} />
                                </button>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-end pt-4 border-t border-gray-100/50 mt-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(msg._id)}
                                disabled={deletingId === msg._id}
                                className="text-muted-foreground hover:text-red-600 hover:bg-red-50 gap-1.5 h-8 px-2 transition-colors"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span className="text-xs">{deletingId === msg._id ? 'Deleting...' : 'Delete'}</span>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default DdpoMessagesPage;
