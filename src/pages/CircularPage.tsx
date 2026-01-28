import React from 'react';
import { API_BASE_URL } from '@/config';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, Filter, RefreshCw } from 'lucide-react';
import { toast, useToast } from '@/hooks/use-toast';
import { FaFilePdf, FaFileWord, FaFileImage, FaFileAlt, FaFileExcel } from "react-icons/fa";

const MAX_FILE_SIZE = 1 * 1024 * 1024;

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return <FaFileAlt className="text-gray-500" />;
  if (["pdf"].includes(ext)) return <FaFilePdf className="text-red-500" />;
  if (["doc", "docx"].includes(ext)) return <FaFileWord className="text-blue-500" />;
  if (["xls", "xlsx"].includes(ext)) return <FaFileExcel className="text-green-700" />;
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) return <FaFileImage className="text-green-500" />;
  return <FaFileAlt className="text-gray-500" />;
}

const CircularPage: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <div className="text-center mt-10">Not authorized</div>;

  if (user.role === 'ddpo') {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card>
          <CardHeader>
            <CardTitle>Send New Circular</CardTitle>
            <CardDescription>Enter the circular title, select college category and upload a file or document.</CardDescription>
          </CardHeader>
          <CardContent>
            <CircularForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Circulars Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentCirculars showDelete={true} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // For college users and admin users (treating admin like colleges)
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Circulars</h1>
          <p className="text-muted-foreground mt-1">View circulars sent to your college.</p>
        </div>
        <Button onClick={() => window.dispatchEvent(new Event('circulars-updated'))} variant="outline" size="sm" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      <RecentCirculars showDelete={false} />
    </div>
  );
};

function CircularForm() {
  const { user } = useAuth();
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState('');
  const [error, setError] = React.useState('');
  const [colleges, setColleges] = React.useState<any[]>([]);
  const [selectedColleges, setSelectedColleges] = React.useState<string[]>([]);

  // Fetch colleges for DDPO
  React.useEffect(() => {
    if (user?.role === 'ddpo') {
      fetch(`${API_BASE_URL}/api/circulars/colleges`)
        .then(res => res.json())
        .then(data => setColleges(data))
        .catch(err => console.error('Error fetching colleges:', err));
    }
  }, [user]);

  // When category changes, select all matching colleges by default
  React.useEffect(() => {
    if (user?.role === 'ddpo' && category) {
      const visibleColleges = colleges.filter(col => {
        const colCategory = col.Category || col.type;
        return !category || category === 'All Colleges' || colCategory === category;
      });
      setSelectedColleges(visibleColleges.map(c => c.Username));
    }
  }, [category, colleges, user]);

  // College categories for DDPO
  const allowedCategories = [
    'All Colleges',
    'Un-Aided',
    'Aided',
    'Bifurcated',
    'Government',
    'Corporation',
    'Kittur Rani Chennamma',
  ];

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear old messages
    setError('');
    setSuccess('');

    // Basic validation
    if (!title || !file) {
      setError('Please enter a title and select a file.');
      return;
    }

    if (user?.role === 'ddpo') {
      if (!category) {
        setError('Please select a college category.');
        return;
      }
      if (selectedColleges.length === 0) {
        setError('Please select at least one college.');
        return;
      }
    } else {
      if (!category) {
        setError('Please select a category.');
        return;
      }
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File Too Large',
        description: `The selected file exceeds the ${MAX_FILE_SIZE / (1024 * 1024)} MB limit.`,
        variant: 'destructive'
      });

      setTitle('');
      setCategory('');
      setFile(null);

      // Reset the input element so filename disappears
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    // File type validation
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF, Word, or image files are allowed.');
      return;
    }

    // Passed validation — start loading
    setLoading(true);

    // Prepare data
    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('file', file);

    if (user?.role === 'ddpo') {
      formData.append('sender', user.username);

      const visibleColleges = colleges.filter(col => {
        const colCategory = col.Category || col.type;
        return !category || category === 'All Colleges' || colCategory === category;
      });

      const isAllSelected = visibleColleges.length > 0 && visibleColleges.every(c => selectedColleges.includes(c.Username));

      if (isAllSelected) {
        formData.append('sendToAllColleges', 'true');
      } else {
        formData.append('sendToAllColleges', 'false');
        formData.append('selectedColleges', JSON.stringify(selectedColleges));
      }
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/circulars`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to upload circular');

      toast({
        title: 'Success',
        description: 'Circular sent successfully!',
        className: 'bg-green-500 text-white border border-green-100 rounded-xl' // or 'success' if your toast system supports it
      });

      // Reset form
      setTitle('');
      setCategory('');
      setFile(null);
      setSelectedColleges([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }


      // Notify other components
      window.dispatchEvent(new Event('circulars-updated'));
    } catch (err: any) {
      setError(err.message || 'Error uploading circular');
      setTimeout(() => setError(''), 2500);
    } finally {
      setLoading(false);
    }
  };

  const getVisibleColleges = () => {
    return colleges.filter(col => {
      const colCategory = col.Category || col.type;
      return !category || category === 'All Colleges' || colCategory === category;
    });
  };

  const visibleColleges = getVisibleColleges();
  const isAllSelected = visibleColleges.length > 0 && visibleColleges.every(c => selectedColleges.includes(c.Username));
  const isIndeterminate = visibleColleges.some(c => selectedColleges.includes(c.Username)) && !isAllSelected;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Circular Title</label>
        <input
          type="text"
          className="border rounded px-3 py-2 w-full"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
      </div>

      {user?.role === 'ddpo' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">College Category</label>
            <Select required value={category} onValueChange={setCategory}>
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

          {category && (
            <div className="space-y-3 border rounded-lg p-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={isAllSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedColleges(visibleColleges.map(c => c.Username));
                      } else {
                        setSelectedColleges([]);
                      }
                    }}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium leading-none cursor-pointer">
                    Select All ({visibleColleges.length})
                  </label>
                </div>
                <span className="text-xs text-muted-foreground">
                  {selectedColleges.length} selected
                </span>
              </div>

              <ScrollArea className="h-60 w-full rounded-md border bg-white p-4">
                <div className="space-y-2">
                  {visibleColleges.map(col => (
                    <div key={col._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`col-${col._id}`}
                        checked={selectedColleges.includes(col.Username)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedColleges(prev => [...prev, col.Username]);
                          } else {
                            setSelectedColleges(prev => prev.filter(id => id !== col.Username));
                          }
                        }}
                      />
                      <label
                        htmlFor={`col-${col._id}`}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {col['College Name']} <span className="text-xs text-muted-foreground">({col['College Code']})</span>
                      </label>
                    </div>
                  ))}
                  {visibleColleges.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No colleges found in this category.</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Upload File/Document</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="border rounded px-3 py-2 w-full"
              onChange={e => setFile(e.target.files?.[0] || null)}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Max file size: 1MB</p>
          </div>
        </>
      )}

      {user?.role !== 'ddpo' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="administrative">Administrative</SelectItem>
                <SelectItem value="examination">Examination</SelectItem>
                <SelectItem value="admission">Admission</SelectItem>
                <SelectItem value="events">Events</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Upload File/Document</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="border rounded px-3 py-2 w-full"
              onChange={e => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>
        </>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Circular'}
      </Button>
      {success && <p className="text-green-600 text-sm mt-2">{success}</p>}
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </form>
  );
}

function RecentCirculars({ showDelete = false }: { showDelete?: boolean }) {
  const { user } = useAuth();
  const [circulars, setCirculars] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [categories, setCategories] = React.useState<string[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pagination, setPagination] = React.useState<any>(null);
  const [colleges, setColleges] = React.useState<any[]>([]);
  const [expandedRecipients, setExpandedRecipients] = React.useState<string | null>(null);
  const { toast } = useToast();

  const fetchCirculars = async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') {
      params.append('category', selectedCategory);
    }
    // Treat admin like college users - filter by username
    if (user?.role !== 'ddpo') {
      params.append('username', user?.username || '');
    }
    params.append('page', page.toString());
    params.append('limit', '10');

    const res = await fetch(`${API_BASE_URL}/api/circulars?${params.toString()}`);
    const data = await res.json();
    setCirculars(data.circulars || []);
    setPagination(data.pagination);
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/circulars/categories`);
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchColleges = async () => {
    if (user?.role === 'ddpo') {
      try {
        const res = await fetch(`${API_BASE_URL}/api/circulars/colleges`);
        const data = await res.json();
        setColleges(data);
      } catch (err) {
        console.error('Error fetching colleges:', err);
      }
    }
  };

  const handleRefresh = async () => {
    await fetchCirculars(currentPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchCirculars(page);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this circular?')) return;

    setDeleting(id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/circulars/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete circular');

      toast({ title: 'Success', description: 'Circular deleted successfully!', className: 'bg-green-500 text-white border border-green-100 rounded-xl' });
      await fetchCirculars(currentPage); // Refresh the list
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete circular', variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  React.useEffect(() => {
    fetchCirculars(currentPage);
    fetchCategories();
    fetchColleges();
    const handler = () => fetchCirculars(currentPage);
    window.addEventListener('circulars-updated', handler);
    return () => window.removeEventListener('circulars-updated', handler);
  }, [selectedCategory, user, currentPage]);

  // Reset to page 1 when category changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  const getCollegeName = (username: string) => {
    const college = colleges.find(c => c.Username === username);
    return college ? college['College Name'] : username;
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to opening in new tab
      window.open(url, '_blank');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!circulars.length) return <p>No circulars found.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Circulars</h3>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {circulars.map(c => (
          <Card key={c._id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl text-muted-foreground">
                    {getFileIcon(c.fileName)}
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold line-clamp-1" title={c.title}>
                      {c.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs font-normal">
                        {c.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                {showDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    onClick={() => handleDelete(c._id)}
                    disabled={deleting === c._id}
                    title="Delete circular"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.role === 'ddpo' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sent to:</span>
                    <span className="font-medium">{c.recipients?.length || 0} Colleges</span>
                  </div>
                  <div className="border rounded-md p-2 bg-muted/30">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedRecipients(expandedRecipients === c._id ? null : c._id)}
                    >
                      <span className="text-xs text-muted-foreground">
                        {expandedRecipients === c._id ? 'Hide Recipients' : 'View Recipients'}
                      </span>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                        {expandedRecipients === c._id ? '−' : '+'}
                      </Button>
                    </div>

                    {expandedRecipients === c._id && (
                      <ScrollArea className="h-32 mt-2 w-full">
                        <div className="space-y-1">
                          {c.recipients?.map((recipient: string) => (
                            <div key={recipient} className="text-xs py-1 border-b border-border/50 last:border-0">
                              {getCollegeName(recipient)}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => handleDownload(c.fileUrl.startsWith('http') ? c.fileUrl : `${API_BASE_URL}${c.fileUrl}`, c.fileName)}
                  className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-medium gap-2"
                >
                  <FaFileAlt /> Download {c.fileName.split('.').pop()?.toUpperCase()}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
            {pagination.totalItems} circulars
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.currentPage ? "default" : "outline"}
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
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CircularPage; 
