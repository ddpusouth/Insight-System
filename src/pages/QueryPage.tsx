import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '@/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Plus,
  Eye,
  Reply,
  User,
  Calendar,
  Download,
  Upload as UploadIcon,
  RefreshCw,
  File,
  Link,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
// Import useNavigate for navigation
import { useNavigate, useParams } from 'react-router-dom';


// Disclaimer Component
const Disclaimer = () => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 animate-fade-in mb-6">
    <div className="h-10 w-10 flex-shrink-0 bg-red-100 rounded-full flex items-center justify-center text-red-600">
      <AlertTriangle className="h-5 w-5" />
    </div>
    <div>
      <h3 className="font-semibold text-red-900">Important Disclaimer</h3>
      <p className="text-red-700 text-sm">
        Warning: Any incorrect information entered by the college is the college's responsibility. Please check all details before submitting.
      </p>
    </div>
  </div>
);

function GoogleSheetLinkForm() {
  const [sheetQueries, setSheetQueries] = useState([
  ]);
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Id</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Query Type</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Due Date</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Link</th>
          </tr>
        </thead>
        <tbody>
          {sheetQueries.map((row) => (
            <tr key={row.id} className="hover:bg-muted/40">
              <td className="px-4 py-2 whitespace-nowrap font-medium">{row.id}</td>
              <td className="px-4 py-2 whitespace-nowrap">{row.queryType}</td>
              <td className="px-4 py-2 whitespace-nowrap">{row.dueDate}</td>
              <td className="px-4 py-2 whitespace-nowrap">
                <a href={row.link} target="_blank" rel="noopener noreferrer" className="text-primary underline">Open Sheet</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const DDPOQueryPage: React.FC = () => {
  const allowedCategories = [
    'Un-Aided',
    'Aided',
    'Bifurcated',
    'Government',
    'Corporation',
    'Kittur Rani Chennamma',
  ];
  const { user } = useAuth();
  // State for tab selection
  const [activeTab, setActiveTab] = useState<'excel' | 'google'>('excel');
  const handleTabChange = (value: string) => setActiveTab(value as 'excel' | 'google');
  const MAX_FILE_SIZE = 1 * 1024 * 1024;
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  // State for form fields
  const [type, setType] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [collegeType, setCollegeType] = useState('');
  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null); // NEW
  const [submitting, setSubmitting] = useState(false);
  const [description, setDescription] = useState('');
  const { toast } = useToast();
  const socketRef = useRef<Socket | null>(null);

  // Fetch queries for responses table
  const [queries, setQueries] = useState<any[]>([]);
  const [googleSheetQueries, setGoogleSheetQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [googleCurrentPage, setGoogleCurrentPage] = useState(1);
  const [queriesPagination, setQueriesPagination] = useState<any>(null);
  const [googleQueriesPagination, setGoogleQueriesPagination] = useState<any>(null);

  // Search state
  const [fileSearchTerm, setFileSearchTerm] = useState('');
  const [linkSearchTerm, setLinkSearchTerm] = useState('');

  // Add at the top of DDPOQueryPage:
  const [colleges, setColleges] = useState<any[]>([]);

  const fetchColleges = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/colleges/all`);
      const data = await res.json();
      setColleges(data.colleges || []);
    } catch (error) {
      console.error('Error fetching colleges:', error);
    }
  };

  React.useEffect(() => {
    fetchColleges();
  }, []);

  const fetchQueries = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');

      const res = await fetch(`${API_BASE_URL}/api/queries?${params.toString()}`);
      const data = await res.json();
      setQueries(data.queries || []);
      setQueriesPagination(data.pagination);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to fetch queries' });
    } finally {
      setLoading(false);
    }
  };

  const fetchGoogleSheetQueries = async (page = 1) => {
    setGoogleLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');

      console.log('Fetching Google Sheet queries with params:', params.toString());
      const res = await fetch(`${API_BASE_URL}/api/queries/google-sheet-queries?${params.toString()}`);
      const data = await res.json();
      console.log('Google Sheet queries response:', data);
      setGoogleSheetQueries(data.queries || []);
      setGoogleQueriesPagination(data.pagination);
      console.log('Google Sheet queries set:', data.queries?.length || 0);
    } catch (err) {
      console.error('Error fetching Google Sheet queries:', err);
      toast({ title: 'Error', description: 'Failed to fetch Link queries', variant: 'destructive' });
    } finally {
      setGoogleLoading(false);
    }
  };

  // Refresh functions for DDPO
  const handleRefreshQueries = async () => {
    await fetchQueries(currentPage);
  };

  const handleRefreshGoogleSheetQueries = async () => {
    await fetchGoogleSheetQueries(googleCurrentPage);
  };

  const handleRefreshColleges = async () => {
    await fetchColleges();
  };

  // Filter queries based on search term
  const filteredFileQueries = queries.filter(query =>
    query.type?.toLowerCase().includes(fileSearchTerm.toLowerCase()) ||
    query.description?.toLowerCase().includes(fileSearchTerm.toLowerCase())
  );

  const filteredLinkQueries = googleSheetQueries.filter(query =>
    query.type?.toLowerCase().includes(linkSearchTerm.toLowerCase()) ||
    query.description?.toLowerCase().includes(linkSearchTerm.toLowerCase())
  );

  // Delete query handler
  const handleDeleteQuery = async (queryId: string) => {
    if (!confirm('Are you sure you want to delete this query? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/queries/${queryId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete query');
      }

      toast({ title: 'Success', description: 'Query deleted successfully' });
      fetchQueries(currentPage); // Refresh the queries list
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete query', variant: 'destructive' });
    }
  };

  // Delete Google Sheet query handler
  const handleDeleteGoogleSheetQuery = async (queryId: string) => {
    if (!confirm('Are you sure you want to delete this link query? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/queries/google-sheet-queries/${queryId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete link query');
      }

      toast({ title: 'Success', description: 'Link query deleted successfully' });
      fetchGoogleSheetQueries(googleCurrentPage); // Refresh the queries list
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete link query', variant: 'destructive' });
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchQueries(page);
  };

  const handleGooglePageChange = (page: number) => {
    setGoogleCurrentPage(page);
    fetchGoogleSheetQueries(page);
  };

  React.useEffect(() => {
    fetchQueries(1);
    fetchGoogleSheetQueries(1);
  }, []);

  const handleExcelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ title: 'File Required', description: 'Please select a file to upload.', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File Too Large',
        description: `The selected file exceeds the ${MAX_FILE_SIZE / (1024 * 1024)} MB limit.`,
        variant: 'destructive'
      });

      setType('');
      setDueDate('');
      setCollegeType('');
      setSelectedColleges([]);
      setFile(null);
      setDescription('');

      // Reset the input element so filename disappears
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFile(null);

      fetchQueries(); // Refetch after submission
      return;
    }

    setSubmitting(true);
    try {
      // Filter out empty and duplicate usernames
      const uniqueColleges = Array.from(new Set(selectedColleges.filter(Boolean)));
      if (uniqueColleges.length === 0) {
        toast({ title: 'No Colleges Selected', description: 'Please select at least one college.', variant: 'destructive' });
        setSubmitting(false);
        return;
      }
      const formData = new FormData();
      formData.append('type', type);
      formData.append('dueDate', dueDate);
      formData.append('collegeType', collegeType);
      formData.append('selectedColleges', JSON.stringify(uniqueColleges));
      formData.append('description', description);
      formData.append('file', file);
      const queryData = {
        ...formData,
        college: user?.username,
      };
      const res = await fetch(`${API_BASE_URL}/api/queries`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to submit query');

      // Get the created query from the response
      const createdQuery = await res.json();

      // Emit socket event with the query data
      if (socketRef.current) {
        socketRef.current.emit('query message', {
          ...createdQuery,
          selectedColleges: uniqueColleges,
          type: type,
          dueDate: dueDate
        });
      }

      toast({
        title: 'Query Sent',
        description: 'Your file query was sent successfully!',
        className: 'bg-green-500 text-white border border-green-100 rounded-xl' // this will make the toast green
      });

      setType('');
      setDueDate('');
      setCollegeType('');
      setSelectedColleges([]);
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFile(null);
      fetchQueries(); // Refetch after submission
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to submit query', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const [googleType, setGoogleType] = useState('');
  const [googleDueDate, setGoogleDueDate] = useState('');
  const [googleCollegeType, setGoogleCollegeType] = useState('');
  const [googleSelectedColleges, setGoogleSelectedColleges] = useState<string[]>([]);
  const [googleLink, setGoogleLink] = useState('');
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  // Add state for description fields
  const [googleDescription, setGoogleDescription] = useState('');

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleSubmitting(true);
    try {
      // Filter out empty and duplicate usernames
      const uniqueColleges = Array.from(new Set(googleSelectedColleges.filter(Boolean)));
      if (uniqueColleges.length === 0) {
        toast({ title: 'No Colleges Selected', description: 'Please select at least one college.', variant: 'destructive' });
        setGoogleSubmitting(false);
        return;
      }
      const queryData = {
        type: googleType,
        dueDate: googleDueDate,
        collegeType: googleCollegeType,
        selectedColleges: uniqueColleges,
        googleLink,
        description: googleDescription
      };

      const res = await fetch(`${API_BASE_URL}/api/queries/google-sheet-queries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryData)
      });
      if (!res.ok) throw new Error('Failed to submit query');

      // Get the created query from the response
      const createdQuery = await res.json();

      // Emit socket event with the query data
      if (socketRef.current) {
        socketRef.current.emit('query message', {
          ...createdQuery,
          selectedColleges: uniqueColleges,
          type: 'google-sheet-query'
        });
      }

      toast({ title: 'Query Sent', description: 'Your Link query was sent successfully!', className: 'bg-green-500 text-white border border-green-100 rounded-xl' });
      setGoogleType('');
      setGoogleDueDate('');
      setGoogleCollegeType('');
      setGoogleSelectedColleges([]);
      setGoogleLink('');
      setGoogleDescription('');
      fetchGoogleSheetQueries(); // Refetch after submission
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to submit query', variant: 'destructive' });
    } finally {
      setGoogleSubmitting(false);
    }
  };

  // In DDPOQueryPage, add state for responded Google Sheet queries
  const [respondedGoogleSheetIds, setRespondedGoogleSheetIds] = useState<string[]>([]);

  // Add state for expanded card
  const [expandedQueryCard, setExpandedQueryCard] = useState<string | null>(null);

  // Add state for expanded link query card
  const [expandedLinkQueryCard, setExpandedLinkQueryCard] = useState<string | null>(null);

  // Add navigate hook in DDPOQueryPage component
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Queries Management</h1>
        <p className="text-muted-foreground mt-1">Create and manage queries for colleges</p>
      </div>
      {/* Toggle Tabs for Forms */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList>
          <TabsTrigger value="excel">File Query</TabsTrigger>
          <TabsTrigger value="google">Link Query</TabsTrigger>
        </TabsList>
        <TabsContent value="excel">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Send File Query</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleExcelSubmit} encType="multipart/form-data">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Query Title</label>
                    <Input placeholder="Enter Query Title" required value={type} onChange={e => setType(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Due Date</label>
                    <Input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea placeholder="Enter description (optional)" value={description} onChange={e => setDescription(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Upload File</label>
                    <Input
                      type="file"
                      required
                      ref={fileInputRef}
                      onChange={(e) => {
                        const selectedFile = e.target.files?.[0];
                        if (selectedFile) {
                          if (selectedFile.size > (1 * 1024 * 1024)) {
                            toast({ title: 'File Too Large', description: 'The selected file exceeds 1MB limit.', variant: 'destructive' });
                            e.target.value = '';
                            setFile(null);
                          } else {
                            setFile(selectedFile);
                          }
                        } else {
                          setFile(null);
                        }
                      }}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Max file size: 1MB</p>
                    {file && <span className="text-xs text-muted-foreground">Selected: {file.name}</span>}
                  </div>

                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">College Category</label>
                    <Select required value={collegeType} onValueChange={setCollegeType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select College Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {allowedCategories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Selected Colleges</label>
                    <div className="flex gap-2 mb-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const filtered = colleges.filter(col => (collegeType ? (col.Category === collegeType) : true));
                          setSelectedColleges(filtered.map(col => col.Username));
                        }}
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedColleges([])}
                      >
                        Deselect All
                      </Button>
                    </div>
                    <div className="max-h-40 overflow-y-auto border rounded p-2 bg-muted/10">
                      {colleges.filter(col => (collegeType ? (col.Category === collegeType) : true) && col.Username).map(col => (
                        <label key={col._id} className="flex items-center space-x-2 mb-1">
                          <input
                            type="checkbox"
                            value={col.Username}
                            checked={selectedColleges.includes(col.Username)}
                            onChange={e => {
                              if (e.target.checked) setSelectedColleges([...selectedColleges, col.Username]);
                              else setSelectedColleges(selectedColleges.filter(u => u !== col.Username));
                            }}
                          />
                          <span>{col['College Name']} ({col.Username})</span>
                        </label>
                      ))}
                      {colleges.filter(col => (collegeType ? (col.Category === collegeType) : true) && col.Username).length === 0 && (
                        <span className="text-xs text-muted-foreground">No colleges with usernames found for this type.</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" className="mt-2" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Query'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          {/* File Responses Section - Card Layout */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                <CardTitle>File Responses</CardTitle>
                <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
                  <div className="relative w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by title..."
                      value={fileSearchTerm}
                      onChange={(e) => setFileSearchTerm(e.target.value)}
                      className="pl-10 w-full md:w-64"
                    />
                  </div>
                  <Button onClick={handleRefreshQueries} variant="outline" size="sm" className="flex items-center gap-2 w-full md:w-auto justify-center">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading...</p>
              ) : filteredFileQueries.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {fileSearchTerm ? `No queries found matching "${fileSearchTerm}"` : 'No file queries found'}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFileQueries.map((query) => {
                    const totalColleges = query.selectedColleges?.length || 0;
                    const respondedColleges = query.responses?.filter(r => r.status === 'Responded').length || 0;
                    const pendingColleges = totalColleges - respondedColleges;

                    return (
                      <Card key={query._id} className="shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setExpandedQueryCard(expandedQueryCard === query._id ? null : query._id)}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <File className="h-5 w-5 text-primary" />
                              {query.type || 'Query'}
                            </div>
                            <Badge variant={respondedColleges === totalColleges ? "default" : "secondary"}>
                              {respondedColleges}/{totalColleges}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Due Date: {query.dueDate ? new Date(query.dueDate).toLocaleDateString() : 'Not set'}</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span>Responded: {respondedColleges}</span>
                                <span>Pending: {pendingColleges}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${totalColleges > 0 ? (respondedColleges / totalColleges) * 100 : 0}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/query/details/${query._id}`);
                                }}
                                className="flex-1"
                                variant="outline"
                              >
                                View Details
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteQuery(query._id);
                                }}
                                className="px-3"
                                variant="destructive"
                                size="sm"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Pagination for File Responses */}
              {queriesPagination && queriesPagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {((queriesPagination.currentPage - 1) * queriesPagination.itemsPerPage) + 1} to{' '}
                    {Math.min(queriesPagination.currentPage * queriesPagination.itemsPerPage, queriesPagination.totalItems)} of{' '}
                    {queriesPagination.totalItems} queries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(queriesPagination.currentPage - 1)}
                      disabled={!queriesPagination.hasPrevPage}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, queriesPagination.totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === queriesPagination.currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(queriesPagination.currentPage + 1)}
                      disabled={!queriesPagination.hasNextPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="google">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Send Link Query</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleGoogleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Query Type</label>
                    <Input placeholder="Enter Query Type" required value={googleType} onChange={e => setGoogleType(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Due Date</label>
                    <Input type="date" required value={googleDueDate} onChange={e => setGoogleDueDate(e.target.value)} />
                  </div>
                  {/* Add state for description fields */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea placeholder="Enter description (optional)" value={googleDescription} onChange={e => setGoogleDescription(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Link</label>
                    <Input placeholder="Paste Link" required value={googleLink} onChange={e => setGoogleLink(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">College Category</label>
                    <Select required value={googleCollegeType} onValueChange={setGoogleCollegeType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select College Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {allowedCategories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Selected Colleges</label>
                    <div className="flex gap-2 mb-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const filtered = colleges.filter(col => (googleCollegeType ? (col.Category === googleCollegeType) : true));
                          setGoogleSelectedColleges(filtered.map(col => col.Username));
                        }}
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setGoogleSelectedColleges([])}
                      >
                        Deselect All
                      </Button>
                    </div>
                    <div className="max-h-40 overflow-y-auto border rounded p-2 bg-muted/10">
                      {colleges.filter(col => (googleCollegeType ? (col.Category === googleCollegeType) : true) && col.Username).map(col => (
                        <label key={col._id} className="flex items-center space-x-2 mb-1">
                          <input
                            type="checkbox"
                            value={col.Username}
                            checked={googleSelectedColleges.includes(col.Username)}
                            onChange={e => {
                              if (e.target.checked) setGoogleSelectedColleges([...googleSelectedColleges, col.Username]);
                              else setGoogleSelectedColleges(googleSelectedColleges.filter(u => u !== col.Username));
                            }}
                          />
                          <span>{col['College Name']} ({col.Username})</span>
                        </label>
                      ))}
                      {colleges.filter(col => (googleCollegeType ? (col.Category === googleCollegeType) : true) && col.Username).length === 0 && (
                        <span className="text-xs text-muted-foreground">No colleges with usernames found for this type.</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" className="mt-2" disabled={googleSubmitting}>{googleSubmitting ? 'Submitting...' : 'Submit Query'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          {/* Link Responses Section - Card Layout */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                <CardTitle>Link Responses</CardTitle>
                <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
                  <div className="relative w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by title..."
                      value={linkSearchTerm}
                      onChange={(e) => setLinkSearchTerm(e.target.value)}
                      className="pl-10 w-full md:w-64"
                    />
                  </div>
                  <Button onClick={handleRefreshGoogleSheetQueries} variant="outline" size="sm" className="flex items-center gap-2 w-full md:w-auto justify-center">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {googleLoading ? (
                <p>Loading...</p>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Debug: {googleSheetQueries.length} queries found, {filteredLinkQueries.length} filtered
                  </p>
                  {filteredLinkQueries.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      {linkSearchTerm ? `No queries found matching "${linkSearchTerm}"` : 'No link queries found'}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredLinkQueries.map((query) => {
                        const totalColleges = query.selectedColleges?.length || 0;
                        const respondedColleges = query.responses?.filter(r => r.status === 'Responded').length || 0;
                        const pendingColleges = totalColleges - respondedColleges;

                        return (
                          <Card key={query._id} className="shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => setExpandedLinkQueryCard(expandedLinkQueryCard === query._id ? null : query._id)}>
                            <CardHeader>
                              <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Link className="h-5 w-5 text-primary" />
                                  {query.type || 'Query'}
                                </div>
                                <Badge variant={respondedColleges === totalColleges ? "default" : "secondary"}>
                                  {respondedColleges}/{totalColleges}
                                </Badge>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Due Date: {query.dueDate ? new Date(query.dueDate).toLocaleDateString() : 'Not set'}</span>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs">
                                    <span>Responded: {respondedColleges}</span>
                                    <span>Pending: {pendingColleges}</span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                      className="bg-primary h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${totalColleges > 0 ? (respondedColleges / totalColleges) * 100 : 0}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/query/details/${query._id}`);
                                    }}
                                    className="flex-1"
                                    variant="outline"
                                  >
                                    View Details
                                  </Button>
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteGoogleSheetQuery(query._id);
                                    }}
                                    className="px-3"
                                    variant="destructive"
                                    size="sm"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Pagination for Link Responses */}
              {googleQueriesPagination && googleQueriesPagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {((googleQueriesPagination.currentPage - 1) * googleQueriesPagination.itemsPerPage) + 1} to{' '}
                    {Math.min(googleQueriesPagination.currentPage * googleQueriesPagination.itemsPerPage, googleQueriesPagination.totalItems)} of{' '}
                    {googleQueriesPagination.totalItems} queries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGooglePageChange(googleQueriesPagination.currentPage - 1)}
                      disabled={!googleQueriesPagination.hasPrevPage}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, googleQueriesPagination.totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === googleQueriesPagination.currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleGooglePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGooglePageChange(googleQueriesPagination.currentPage + 1)}
                      disabled={!googleQueriesPagination.hasNextPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// College Query Page Component
const CollegeQueryPage: React.FC = () => {
  const MAX_FILE_SIZE = 1 * 1024 * 1024;
  const { user } = useAuth();
  const [queries, setQueries] = useState<any[]>([]);
  const [googleSheetQueries, setGoogleSheetQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(true);
  const { toast } = useToast();
  const socketRef = useRef<Socket | null>(null);

  // Add state to track responded Google Sheet queries
  const [respondedGoogleSheetIds, setRespondedGoogleSheetIds] = useState<string[]>([]);

  // Pagination state for college queries
  const [currentPage, setCurrentPage] = useState(1);
  const [googleCurrentPage, setGoogleCurrentPage] = useState(1);
  const [queriesPagination, setQueriesPagination] = useState<any>(null);
  const [googleQueriesPagination, setGoogleQueriesPagination] = useState<any>(null);



  // Refresh functions
  const handleRefreshQueries = async () => {
    await fetchQueries(currentPage);
  };

  const handleRefreshGoogleSheetQueries = async () => {
    await fetchGoogleSheetQueries(googleCurrentPage);
  };

  // Fetch queries for this specific college
  const fetchQueries = async (page = 1) => {
    setLoading(true);
    try {
      console.log('Fetching queries for user:', user?.username);
      const params = new URLSearchParams();
      params.append('college', user?.username || '');
      params.append('page', page.toString());
      params.append('limit', '10'); // Pagination only shows when totalPages > 1

      const res = await fetch(`/api/queries?${params.toString()}`);
      const data = await res.json();
      setQueries(data.queries || []);
      setQueriesPagination(data.pagination);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to fetch queries', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Google Sheet queries for this specific college
  const fetchGoogleSheetQueries = async (page = 1) => {
    setGoogleLoading(true);
    try {
      console.log('Fetching Google Sheet queries for user:', user?.username);
      const params = new URLSearchParams();
      params.append('college', user?.username || '');
      params.append('page', page.toString());
      params.append('limit', '10');

      const res = await fetch(`/api/queries/google-sheet-queries?${params.toString()}`);
      const data = await res.json();
      setGoogleSheetQueries(data.queries || []);
      setGoogleQueriesPagination(data.pagination);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to fetch Google Sheet queries', variant: 'destructive' });
    } finally {
      setGoogleLoading(false);
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchQueries(page);
  };

  const handleGooglePageChange = (page: number) => {
    setGoogleCurrentPage(page);
    fetchGoogleSheetQueries(page);
  };

  React.useEffect(() => {
    if (user?.username) {
      fetchQueries(1);
      fetchGoogleSheetQueries(1);

      // Set up socket connection
      socketRef.current = io(API_BASE_URL);

      // Join the college-specific room
      socketRef.current.emit('join college room', user.username);

      // Listen for query messages
      socketRef.current.on('query message', (msg: any) => {
        // If the message is for this college, update the queries
        if (msg.selectedColleges && Array.isArray(msg.selectedColleges) &&
          msg.selectedColleges.includes(user.username)) {
          // Update the appropriate query list based on message type
          if (msg.type === 'google-sheet-query') {
            setGoogleSheetQueries(prev => [msg, ...prev]);
          } else {
            setQueries(prev => [msg, ...prev]);
          }
          toast({ title: 'New Query', description: `You received a new ${msg.type || 'data'} query` });
        }
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [user?.username]);

  const handleDownloadExcel = (query: any) => {
    if (!query.fileUrl) {
      toast({ title: 'No file', description: 'No Excel file available for this query', variant: 'destructive' });
      return;
    }
    // Remove college param to ensure we always download the original DDPO file, not the response file
    window.open(`${API_BASE_URL}/api/queries/${query._id}/download`, '_blank');

  };

  const handleUploadFile = async (queryId: string, file: File | null) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File Too Large',
        description: 'The selected file exceeds 1MB limit.',
        variant: 'destructive'
      });
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('college', user?.username || '');

    try {
      const res = await fetch(`${API_BASE_URL}/api/queries/${queryId}/respond`, {
        method: 'PATCH',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to upload response');

      toast({ title: 'Success', description: 'Response uploaded successfully' });
      fetchQueries(); // Refresh the queries
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to upload response', variant: 'destructive' });
    }
  };

  // Add state for dialog
  const [openDescription, setOpenDescription] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Queries</h1>
        <p className="text-muted-foreground mt-1">View and respond to queries sent to your college.</p>
      </div>

      <Disclaimer />

      <Tabs defaultValue="excel" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="excel">File Queries</TabsTrigger>
          <TabsTrigger value="google">Google Sheet Queries</TabsTrigger>
        </TabsList>

        <TabsContent value="excel">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>File Queries</CardTitle>
                  <CardDescription>file queries sent to your college</CardDescription>
                </div>
                <Button onClick={handleRefreshQueries} variant="outline" size="sm" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {loading ? (
                  <p>Loading...</p>
                ) : queries.length === 0 ? (
                  <p className="text-muted-foreground">No queries received yet.</p>
                ) : (
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">QUERY TYPE</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">QUERY DESCRIPTION</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">DUE DATE</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">RESPONSE STATUS</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">DOWNLOAD</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">UPLOAD <span className="normal-case text-[10px]">(Max: 1MB)</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {queries.map((query) => {
                        const resp = query.responses?.find(r => r.college === user.username);
                        const status = resp ? resp.status : (query.status || 'Pending');
                        return (
                          <tr key={query._id} className="hover:bg-muted/40">
                            <td className="px-4 py-2 whitespace-nowrap">{query.type}</td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              {query.description && query.description.split(' ').length > 5 ? (
                                <>
                                  {query.description.split(' ').slice(0, 5).join(' ')}...{' '}
                                  <button className="text-primary underline text-xs" onClick={() => setOpenDescription(query.description)}>View</button>
                                </>
                              ) : (
                                query.description || '-'
                              )}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              {query.dueDate ? new Date(query.dueDate).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${status === 'Responded' ? 'bg-success text-white' : 'bg-warning text-white'}`}>{status}</span>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              {query.fileUrl ? (
                                <Button size="sm" variant="outline" onClick={() => handleDownloadExcel(query)}>
                                  Download
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">No file</span>
                              )}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <label className="inline-flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    if (file) {
                                      e.target.value = ''; // Reset
                                      handleUploadFile(query._id, file);
                                    }
                                  }}
                                />
                                <Button size="sm" variant="outline" asChild>
                                  <span>Upload File</span>
                                </Button>
                                {query.uploadStatus && (
                                  <span className="ml-2 text-xs text-success">{query.uploadStatus}</span>
                                )}
                              </label>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {/* Pagination for College Queries */}
                {queriesPagination && queriesPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-muted-foreground">
                      Showing {((queriesPagination.currentPage - 1) * queriesPagination.itemsPerPage) + 1} to{' '}
                      {Math.min(queriesPagination.currentPage * queriesPagination.itemsPerPage, queriesPagination.totalItems)} of{' '}
                      {queriesPagination.totalItems} queries
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(queriesPagination.currentPage - 1)}
                        disabled={!queriesPagination.hasPrevPage}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, queriesPagination.totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === queriesPagination.currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(queriesPagination.currentPage + 1)}
                        disabled={!queriesPagination.hasNextPage}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="google">
          {/* Red alert message */}


          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Link Queries</CardTitle>
                  <CardDescription>link queries sent to your college</CardDescription>
                </div>
                <Button onClick={handleRefreshGoogleSheetQueries} variant="outline" size="sm" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {googleLoading ? (
                  <p>Loading...</p>
                ) : googleSheetQueries.length === 0 ? (
                  <p className="text-muted-foreground">No Google Sheet queries received yet.</p>
                ) : (
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">QUERY TYPE</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">QUERY DESCRIPTION</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">DUE DATE</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">RESPONSE STATUS</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">LINK</th>
                      </tr>
                    </thead>
                    <tbody>
                      {googleSheetQueries.map((query) => {
                        const resp = query.responses?.find(r => r.college === user.username);
                        const status = resp ? resp.status : (query.status || 'Pending');
                        return (
                          <tr key={query._id} className="hover:bg-muted/40">
                            <td className="px-4 py-2 whitespace-nowrap">{query.type}</td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              {query.description && query.description.split(' ').length > 5 ? (
                                <>
                                  {query.description.split(' ').slice(0, 5).join(' ')}...{' '}
                                  <button className="text-primary underline text-xs" onClick={() => setOpenDescription(query.description)}>View</button>
                                </>
                              ) : (
                                query.description || '-'
                              )}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              {query.dueDate ? new Date(query.dueDate).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${status === 'Responded' ? 'bg-success text-white' : 'bg-warning text-white'}`}>{status}</span>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              {query.googleLink ? (
                                <Button
                                  variant="link"
                                  className="p-0 h-auto text-primary underline"
                                  onClick={async () => {
                                    try {
                                      // Open the Google Sheet link FIRST (before API call)
                                      if (query.googleLink) {
                                        console.log('Opening Google Sheet link:', query.googleLink);
                                        console.log('Link type:', typeof query.googleLink);
                                        console.log('Link length:', query.googleLink.length);

                                        // Check if the link is valid
                                        if (!query.googleLink.startsWith('http')) {
                                          toast({
                                            title: 'Invalid Link',
                                            description: 'The link appears to be invalid',
                                            variant: 'destructive'
                                          });
                                          return;
                                        }

                                        const newWindow = window.open(query.googleLink, '_blank');
                                        if (!newWindow) {
                                          toast({
                                            title: 'Popup Blocked',
                                            description: 'Please allow popups for this site to open the link',
                                            variant: 'destructive'
                                          });
                                          return;
                                        }
                                      } else {
                                        toast({
                                          title: 'No Link',
                                          description: 'No Google Sheet link found for this query',
                                          variant: 'destructive'
                                        });
                                        return;
                                      }

                                      // Update status immediately for better UX
                                      const updatedQueries = googleSheetQueries.map(q => {
                                        if (q._id === query._id) {
                                          return {
                                            ...q,
                                            responses: [
                                              ...(q.responses || []).filter(r => r.college !== user.username),
                                              { college: user.username, status: 'Responded', respondedAt: new Date() }
                                            ]
                                          };
                                        }
                                        return q;
                                      });
                                      setGoogleSheetQueries(updatedQueries);

                                      // Make API call to update backend
                                      const res = await fetch(`${API_BASE_URL}/api/queries/google-sheet-queries/${query._id}/respond`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ college: user.username }),
                                      });

                                      if (!res.ok) {
                                        throw new Error('Failed to update response status');
                                      }

                                      toast({
                                        title: 'Status Updated',
                                        description: 'Response status updated to "Responded"'
                                      });

                                      // Refresh the queries to ensure consistency
                                      fetchGoogleSheetQueries();
                                    } catch (err: any) {
                                      toast({
                                        title: 'Error',
                                        description: err.message || 'Failed to update status',
                                        variant: 'destructive'
                                      });
                                      // Revert the optimistic update on error
                                      fetchGoogleSheetQueries();
                                    }
                                  }}
                                >
                                  Open Link
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">No link</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {/* Pagination for College Google Sheet Queries */}
                {googleQueriesPagination && googleQueriesPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-muted-foreground">
                      Showing {((googleQueriesPagination.currentPage - 1) * googleQueriesPagination.itemsPerPage) + 1} to{' '}
                      {Math.min(googleQueriesPagination.currentPage * googleQueriesPagination.itemsPerPage, googleQueriesPagination.totalItems)} of{' '}
                      {googleQueriesPagination.totalItems} queries
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGooglePageChange(googleQueriesPagination.currentPage - 1)}
                        disabled={!googleQueriesPagination.hasPrevPage}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, googleQueriesPagination.totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === googleQueriesPagination.currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleGooglePageChange(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGooglePageChange(googleQueriesPagination.currentPage + 1)}
                        disabled={!googleQueriesPagination.hasNextPage}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {openDescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
            <h2 className="text-lg font-semibold mb-2">Full Description</h2>
            <p className="mb-4 whitespace-pre-line">{openDescription}</p>
            <button className="px-4 py-2 bg-primary text-white rounded" onClick={() => setOpenDescription(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Add the QueryDetailsPage component at the end of the file
const QueryDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState<any>(null);
  const [colleges, setColleges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'responded'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('QueryDetailsPage: Fetching query with ID:', id);

        // First try to fetch as a regular query (file query)
        let queryRes = await fetch(`${API_BASE_URL}/api/queries/${id}`);
        let queryData;

        console.log('QueryDetailsPage: First attempt response status:', queryRes.status);

        if (queryRes.ok) {
          queryData = await queryRes.json();
          console.log('QueryDetailsPage: Found as regular query:', queryData);
        } else {
          // If not found, try as a Google Sheet query
          console.log('QueryDetailsPage: Trying as Google Sheet query...');
          queryRes = await fetch(`${API_BASE_URL}/api/queries/google-sheet-queries/${id}`);
          console.log('QueryDetailsPage: Second attempt response status:', queryRes.status);

          if (queryRes.ok) {
            queryData = await queryRes.json();
            console.log('QueryDetailsPage: Found as Google Sheet query:', queryData);
            console.log('QueryDetailsPage: Query data structure:', {
              id: queryData._id,
              type: queryData.type,
              dueDate: queryData.dueDate,
              selectedColleges: queryData.selectedColleges,
              description: queryData.description,
              responses: queryData.responses
            });
          } else {
            const errorText = await queryRes.text();
            console.log('QueryDetailsPage: Error response:', errorText);
            throw new Error('Query not found');
          }
        }

        console.log('QueryDetailsPage: About to set query data:', queryData);
        setQuery(queryData);
        console.log('QueryDetailsPage: Query state set, checking in next render...');

        // Fetch all colleges for college names
        const collegesRes = await fetch(`${API_BASE_URL}/api/colleges/all`);
        const collegesData = await collegesRes.json();
        setColleges(collegesData.colleges || []);
      } catch (error) {
        console.error('Error fetching query details:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  console.log('QueryDetailsPage: Current state - loading:', loading, 'query:', query);

  // Calculate status counts
  const statusCounts = query?.selectedColleges?.reduce((acc: any, collegeUsername: string) => {
    const resp = query.responses?.find((r: any) => r.college === collegeUsername);
    const status = resp ? resp.status : (query.status || 'Pending');
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {}) || {};

  // Filter colleges based on status
  const filteredColleges = query?.selectedColleges?.filter((collegeUsername: string) => {
    if (statusFilter === 'all') return true;

    const resp = query.responses?.find((r: any) => r.college === collegeUsername);
    const status = resp ? resp.status : (query.status || 'Pending');

    if (statusFilter === 'pending') return status === 'Pending';
    if (statusFilter === 'responded') return status === 'Responded';

    return true;
  }) || [];

  if (loading) return <div>Loading...</div>;
  if (!query) return <div>Query not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Query Details</h1>
          <p className="text-muted-foreground mt-1">Detailed responses for: {query.type}</p>
        </div>
        <Button onClick={() => navigate('/query')} variant="outline">
          Back to Queries
        </Button>
      </div>

      {/* Query Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Query Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Query Type</label>
                <p className="text-foreground font-medium">{query.type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                <p className="text-foreground font-medium">
                  {query.dueDate ? new Date(query.dueDate).toLocaleDateString() : "Not set"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Colleges</label>
                <p className="text-foreground font-medium">{query.selectedColleges?.length || 0}</p>
              </div>
            </div>

            {/* Description + File */}
            <div className="flex gap-12">
              {/* Description */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-foreground font-medium">{query.description || "No description"}</p>
              </div>

              {/* File */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Attachment</label>

                {query.file && query.fileUrl ? (
                  // ✅ Normal query file
                  <p className="text-foreground font-medium">
                    <a
                      href={query.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View File
                    </a>
                  </p>
                ) : query.googleLink ? (
                  // ✅ Google Sheet query
                  <p className="text-foreground font-medium">
                    <a
                      href={query.googleLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:underline"
                    >
                      View Google Sheet
                    </a>
                  </p>
                ) : (
                  // ❌ Neither file nor google link
                  <p className="text-foreground font-medium">No file or link</p>
                )}
              </div>

            </div>
          </div>


        </CardContent>
      </Card>

      {/* Detailed Responses Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Detailed Responses</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filter:</span>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'pending' | 'responded')}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Responses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="responded">Responded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`${API_BASE_URL}/api/queries/${query._id}/download-zip`, '_blank')}
                >
                  <Download className="w-4 h-4 mr-2" /> Download All (ZIP)
                </Button>
                <Badge variant="outline" className="bg-success/10 text-success">
                  Responded: {statusCounts['Responded'] || 0}
                </Badge>
                <Badge variant="outline" className="bg-warning/10 text-warning">
                  Pending: {statusCounts['Pending'] || 0}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredColleges.length} of {query.selectedColleges?.length || 0} colleges
            {statusFilter !== 'all' && (
              <span> (filtered by {statusFilter})</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">College Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Response Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Responded At</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                    {query.googleLink ? '' : 'File'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredColleges.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      {statusFilter === 'all' ? 'No colleges found' : `No ${statusFilter} responses found`}
                    </td>
                  </tr>
                ) : (
                  filteredColleges.map((collegeUsername: string) => {
                    const collegeObj = colleges.find(c => c.Username === collegeUsername);
                    const resp = query.responses?.find((r: any) => r.college === collegeUsername);
                    const status = resp ? resp.status : (query.status || 'Pending');
                    const respondedAt = resp ? resp.respondedAt : query.respondedAt;
                    return (
                      <tr key={query._id + '-' + collegeUsername} className="hover:bg-muted/40">
                        <td className="px-4 py-2 whitespace-nowrap">{collegeObj ? collegeObj['College Name'] : collegeUsername}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${status === 'Responded' ? 'bg-success text-white' : 'bg-warning text-white'}`}>{status}</span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">{respondedAt ? new Date(respondedAt).toLocaleString() : 'N/A'}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {query.googleLink ? (
                            // ✅ Link query → hide content, keep empty cell
                            <></>
                          ) : query.fileUrl ? (
                            status === 'Responded' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  window.open(
                                    `/api/queries/${query._id}/download?college=${collegeUsername}`,
                                    '_blank'
                                  )
                                }
                              >
                                Download File
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-sm">Not Responded</span>
                            )
                          ) : (
                            <span className="text-destructive font-medium">No File</span>
                          )}
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Update the main QueryPage component to include the new route
export const QueryPage: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams();

  // If we have an ID parameter, show the details page
  if (id) {
    return <QueryDetailsPage />;
  }

  // Otherwise show the main query page
  if (user?.role === 'ddpo') return <DDPOQueryPage />;
  return <CollegeQueryPage />;
};

export default QueryPage;
