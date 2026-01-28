import React from 'react';
import { API_BASE_URL } from '@/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Upload, Folder, File, Search, ChevronLeft, ChevronRight, Download, Share2, X, Eye, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const PAGE_SIZE = 9;
const MAX_FILE_SIZE = 100 * 1024; // 100 KB


export const InfrastructurePage: React.FC = () => {
  const { user } = useAuth();
  const username = user?.username;
  const [categories, setCategories] = React.useState<any[]>([]);
  const [allPhotos, setAllPhotos] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [sort, setSort] = React.useState<'latest' | 'oldest'>('latest');
  const [page, setPage] = React.useState(1);
  const [newCategory, setNewCategory] = React.useState('');
  const [adding, setAdding] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [uploadFiles, setUploadFiles] = React.useState<File[]>([]);
  const [uploadLabel, setUploadLabel] = React.useState('');
  const [uploadDescription, setUploadDescription] = React.useState('');
  const [uploadDimension, setUploadDimension] = React.useState('');
  const [selectedCategoryForUpload, setSelectedCategoryForUpload] = React.useState('');
  const [deletingCategory, setDeletingCategory] = React.useState<string | null>(null);
  const [deletingPhoto, setDeletingPhoto] = React.useState<string | null>(null);
  const [uploadAgreed, setUploadAgreed] = React.useState(false);

  // Fetch categories and all photos for this college
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/infrastructure?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      setCategories(data);
      // Flatten all files for photos gallery
      const photos = data.flatMap((cat: any) =>
        (cat.files || []).map((file: any) => ({
          ...file,
          category: cat.name,
          categoryLabel: cat.name,
          updatedAt: file.uploadedAt || file.updatedAt,
          categoryObj: cat
        }))
      );
      setAllPhotos(photos);
    } catch (err) {
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (username) fetchCategories();
  }, [username]);

  // Refresh categories and photos
  const handleRefresh = async () => {
    await fetchCategories();
  };

  // Add new category
  const handleAddCategory = async () => {
    if (!newCategory.trim() || !username) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/infrastructure/category`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory.trim(), username })
      });
      if (!res.ok) throw new Error('Failed to add category');
      const cat = await res.json();

      // Immediately update the categories state with the new category
      setCategories(prev => [...prev, { name: newCategory.trim(), files: [] }]);
      setNewCategory('');
      setAdding(false);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to add category');
    }
  };

  // Handle file upload for a category
  const MAX_FILE_SIZE = 100 * 1024; // 100 KB

  const handleFileUpload = async (files: File[], categoryName: string) => {
    if (!files.length || !username || !categoryName) return;

    if (!uploadAgreed) {
      alert('Please agree to the disclaimer.');
      return;
    }

    // ⬅️ Validate file sizes
    const oversized = files.filter(f => f.size > MAX_FILE_SIZE);
    if (oversized.length) {
      alert(`File size exceeded ${MAX_FILE_SIZE / 1024} KB!:\n${oversized.map(f => f.name).join('\n')}`);

      // Reset the upload state instead of reloading
      setUploadFiles([]);
      setUploadLabel('');
      setUploadDescription('');
      setUploadDimension('');
      setSelectedCategoryForUpload('');
      setUploadAgreed(false);
      return;
    }

    setUploading(true);
    const formData = new FormData();
    for (const file of files) formData.append('file', file);
    formData.append('username', username);
    formData.append('label', uploadLabel);
    formData.append('description', uploadDescription);
    formData.append('dimension', uploadDimension);

    try {
      const res = await fetch(`${API_BASE_URL}/api/infrastructure/${encodeURIComponent(categoryName)}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || errData?.message || 'Failed to upload file');
      }

      const updatedCat = await res.json();

      // Update categories state with the updated category
      setCategories(prev => prev.map(cat => cat.name === updatedCat.name ? updatedCat : cat));

      // Update allPhotos state with the new photos
      const newPhotos = files.map(file => ({
        fileName: file.name,
        fileUrl: `${API_BASE_URL}/uploads/infrastructure/${Date.now()}-${file.name}`,
        label: uploadLabel || '',
        description: uploadDescription || '',
        dimension: uploadDimension || '',
        category: categoryName,
        categoryLabel: categoryName,
        updatedAt: new Date().toISOString(),
        size: file.size
      }));

      setAllPhotos(prev => [...newPhotos, ...prev]);
      setError('');
      setUploadFiles([]);
      setUploadLabel('');
      setUploadDescription('');
      setUploadDimension('');
      setSelectedCategoryForUpload('');
      setUploadAgreed(false);
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  // Filter, sort, and paginate photos
  const filteredPhotos = allPhotos
    .filter(photo => (!search || photo.fileName.toLowerCase().includes(search.toLowerCase())) && (!selectedCategory || photo.category === selectedCategory))
    .sort((a, b) => sort === 'latest' ? new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime() : new Date(a.updatedAt || a.createdAt).getTime() - new Date(b.updatedAt || b.createdAt).getTime());
  const totalPages = Math.ceil(filteredPhotos.length / PAGE_SIZE);
  const pagedPhotos = filteredPhotos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Category card stats
  const getCategoryStats = (cat: any) => {
    const count = cat.files?.length || 0;
    const lastUpdated = count ? new Date(Math.max(...cat.files.map((f: any) => new Date(f.uploadedAt || f.updatedAt || f.createdAt).getTime()))) : null;
    return { count, lastUpdated };
  };

  // Delete category
  const handleDeleteCategory = async (categoryName: string) => {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"? This will also delete all photos in this category. This action cannot be undone.`)) {
      return;
    }

    setDeletingCategory(categoryName);
    try {
      const res = await fetch(`${API_BASE_URL}/api/infrastructure/category/${encodeURIComponent(categoryName)}?username=${encodeURIComponent(username)}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete category');
      }

      // Remove the deleted category from the state
      setCategories(prev => prev.filter(cat => cat.name !== categoryName));
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
    } finally {
      setDeletingCategory(null);
    }
  };

  // Delete photo
  const handleDeletePhoto = async (photo: any) => {
    if (!confirm(`Are you sure you want to delete "${photo.fileName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingPhoto(photo.fileName);
    try {
      const res = await fetch(`${API_BASE_URL}/api/infrastructure/${encodeURIComponent(photo.category)}/file/${encodeURIComponent(photo.fileName)}?username=${encodeURIComponent(username)}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete photo');
      }

      // Remove the deleted photo from the state
      setAllPhotos(prev => prev.filter(p => !(p.fileName === photo.fileName && p.category === photo.category)));
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to delete photo');
    } finally {
      setDeletingPhoto(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-12 animate-fade-in">
      {/* Categories Section */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 md:gap-0">
          <h2 className="text-2xl font-bold">Infrastructure Categories</h2>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => setAdding(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </div>
        </div>

        {/* Add Category Modal */}
        {adding && (
          <Card className="mb-6 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Add New Category</span>
                <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Enter category name (e.g., Classroom, Library, Lab)"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <Button onClick={handleAddCategory} disabled={!newCategory.trim()}>
                  Add Category
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const stats = getCategoryStats(category);
            return (
              <Card key={category.name} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Folder className="h-5 w-5 text-primary" />
                      {category.name}
                    </div>
                    <Button
                      onClick={() => handleDeleteCategory(category.name)}
                      variant="destructive"
                      size="sm"
                      disabled={deletingCategory === category.name}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      {deletingCategory === category.name ? 'Deleting...' : ''}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Photos: {stats.count}</span>
                      {stats.lastUpdated && (
                        <span className="text-xs text-muted-foreground">
                          Updated: {stats.lastUpdated.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={() => setSelectedCategoryForUpload(category.name)}
                      className="w-full"
                      variant="outline"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Add Photos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Upload Section */}
      {selectedCategoryForUpload && (
        <div className="mb-10">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Upload Photos to "{selectedCategoryForUpload}"</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCategoryForUpload('')}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  type="text"
                  className="w-full"
                  placeholder="Enter a label for these photos"
                  value={uploadLabel}
                  onChange={e => setUploadLabel(e.target.value)}
                />
                <Input
                  type="text"
                  className="w-full"
                  placeholder="Enter a description for these photos"
                  value={uploadDescription}
                  onChange={e => setUploadDescription(e.target.value)}
                />
                <Input
                  type="text"
                  className="w-full"
                  placeholder="Enter dimensions (e.g., 20x30 ft)"
                  value={uploadDimension}
                  onChange={e => setUploadDimension(e.target.value)}
                />
                <div className="border-2 border-dashed rounded-2xl p-8 text-center bg-muted/10 min-h-[160px] flex flex-col items-center justify-center"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.type.startsWith('application/'));
                    setUploadFiles(files);
                  }}>
                  <Upload className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                  <div className="text-lg font-medium">Drag and drop your photos here</div>
                  <div className="text-sm text-muted-foreground mb-2">
                    or <label className="underline cursor-pointer">
                      <input type="file" multiple className="hidden" onChange={e => setUploadFiles(Array.from(e.target.files || []))} />
                      click to browse files
                    </label>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">Supports: JPG, PNG, JPEG upto 100KB</div>
                  {uploadFiles.length > 0 && <div className="mt-2 text-xs">{uploadFiles.length} file(s) selected</div>}

                  <div className="flex items-start space-x-2 py-4 mt-2 max-w-lg mx-auto text-left">
                    <Checkbox
                      id="infra-terms"
                      checked={uploadAgreed}
                      onCheckedChange={(checked) => setUploadAgreed(checked as boolean)}
                    />
                    <label
                      htmlFor="infra-terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-red-600"
                    >
                      Any incorrect information entered by the college is the college’s responsibility. Please check all details before submitting.
                    </label>
                  </div>

                  <Button
                    className="mt-4 px-6 py-2 rounded-lg text-base font-semibold"
                    disabled={!uploadFiles.length || uploading || !uploadLabel.trim() || !uploadAgreed}
                    onClick={() => handleFileUpload(uploadFiles, selectedCategoryForUpload)}
                  >
                    {uploading ? 'Uploading...' : 'Upload to ' + selectedCategoryForUpload}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Photos Gallery Section */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 md:gap-0">
          <h2 className="text-2xl font-bold">All Photos</h2>
          <div className="flex gap-4 items-center w-full md:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full md:w-auto"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-20">Loading...</div>
        ) : pagedPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
            <img src="/empty-state.svg" alt="No photos" className="h-32 mb-4 opacity-70" onError={e => (e.currentTarget.style.display = 'none')} />
            <div className="text-xl font-semibold mb-2">No photos found</div>
            <div className="text-sm">Try uploading some infrastructure photos or adjusting your search/filter.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {pagedPhotos.map((photo, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg border hover:shadow-xl transition-shadow flex flex-col overflow-hidden relative">
                {photo.label && (
                  <div className="text-xs font-semibold text-primary mb-1 p-2 text-center">{photo.label}</div>
                )}
                {photo.fileUrl && photo.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <img
                    src={photo.fileUrl.startsWith('http') ? photo.fileUrl : `${API_BASE_URL}${photo.fileUrl}`}
                    alt={photo.fileName}
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="h-56 w-full flex items-center justify-center bg-muted">
                    <File className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}

                <div className="p-4 flex-1 flex flex-col">
                  {photo.description && (
                    <div className="text-sm text-muted-foreground mb-2 italic">
                      "{photo.description}"
                    </div>
                  )}
                  {photo.dimension && (
                    <div className="text-xs text-muted-foreground mb-2">
                      <span className="font-semibold">Dimensions:</span> {photo.dimension}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Uploaded on {photo.uploadedAt ? new Date(photo.uploadedAt).toLocaleDateString() : (photo.updatedAt ? new Date(photo.updatedAt).toLocaleDateString() : '-')}</span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => window.open(photo.fileUrl.startsWith('http') ? photo.fileUrl : `${API_BASE_URL}${photo.fileUrl}`, '_blank')}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeletePhoto(photo)}
                        disabled={deletingPhoto === photo.fileName}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs text-muted-foreground mb-2">
                    {photo.size && <span>{(photo.size / (1024 * 1024)).toFixed(1)} MB</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button size="icon" variant="outline" className="rounded-full" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => (
              <Button key={i} size="icon" variant={page === i + 1 ? 'default' : 'outline'} className="rounded-full" onClick={() => setPage(i + 1)}>
                {i + 1}
              </Button>
            ))}
            <Button size="icon" variant="outline" className="rounded-full" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight />
            </Button>
          </div>
        )}
      </div>

      {error && <div className="text-red-600 mt-4 text-center">{error}</div>}
    </div>
  );
};
