import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Upload, Plus, Folder, File, CheckCircle, RefreshCw, Eye, Pencil, Trash2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface Category {
    _id: string;
    name: string;
    description: string;
    submissionCount?: number;
}

interface Document {
    _id: string;
    title: string;
    description: string;
    fileUrl: string;
    fileName: string;
    categoryId: string | { _id: string, name: string };
    createdAt: string;
    collegeId?: { 'College Name': string, Code: string };
    username?: string;
}

export const DocumentsPage: React.FC = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // College State
    const [myDocuments, setMyDocuments] = useState<Document[]>([]);

    // DDPO State
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [categorySubmissions, setCategorySubmissions] = useState<Document[]>([]);
    const [allColleges, setAllColleges] = useState<any[]>([]);

    // Forms
    const [isUploading, setIsUploading] = useState(false);
    const [openUpload, setOpenUpload] = useState(false);
    const [openCreateCat, setOpenCreateCat] = useState(false);

    const [uploadTitle, setUploadTitle] = useState('');
    // const [uploadDesc, setUploadDesc] = useState(''); // Removed description state
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [targetCategory, setTargetCategory] = useState<string>('');
    const [agreed, setAgreed] = useState(false);

    const [newCatName, setNewCatName] = useState('');
    const [openEditCat, setOpenEditCat] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editCatName, setEditCatName] = useState('');


    useEffect(() => {
        refreshData();
    }, [user]);

    const refreshData = () => {
        fetchCategories();
        if (user?.role === 'ddpo') {
            fetchAllColleges();
        } else {
            fetchMyDocuments();
        }
    }

    const fetchAllColleges = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/colleges/all`);
            if (res.ok) {
                const data = await res.json();
                // Response format is { count: number, colleges: Array }
                if (data.colleges && Array.isArray(data.colleges)) {
                    setAllColleges(data.colleges);
                } else if (Array.isArray(data)) {
                    setAllColleges(data);
                }
            }
        } catch (error) {
            console.error('Error fetching colleges:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/documents/categories`);
            const data = await res.json();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyDocuments = async () => {
        if (!user?.username) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/documents/${user.username}`);
            const data = await res.json();
            setMyDocuments(data);
        } catch (error) {
            console.error('Error fetching my documents:', error);
        }
    };

    const fetchCategorySubmissions = async (categoryId: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/documents/categories/${categoryId}/submissions`);
            const data = await res.json();
            setCategorySubmissions(data);
        } catch (error) {
            console.error('Error fetching submissions:', error);
        }
    };

    // --- Actions ---

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/api/documents/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCatName })
            });
            if (!res.ok) throw new Error('Failed to create category');

            toast({ title: 'Success', description: 'Category created' });
            setOpenCreateCat(false);
            setNewCatName('');

            fetchCategories();
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive', description: 'Could not create category' });
        }
    };

    const handleEditCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategory) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/documents/categories/${editingCategory._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editCatName })
            });
            if (!res.ok) throw new Error('Failed to update category');

            toast({ title: 'Success', description: 'Category updated successfully' });
            setOpenEditCat(false);
            setEditingCategory(null);
            setEditCatName('');

            fetchCategories();
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive', description: 'Could not update category' });
        }
    };

    const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
        if (!confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/documents/categories/${categoryId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete category');

            toast({ title: 'Success', description: 'Category deleted successfully' });
            fetchCategories();
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive', description: 'Could not delete category' });
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile || !uploadTitle || !targetCategory) return;

        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('title', uploadTitle);
        formData.append('description', ''); // Sending empty description
        formData.append('categoryId', targetCategory);
        formData.append('username', user?.username || '');

        setIsUploading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/documents`, {
                method: 'POST',
                body: formData
            });
            if (!res.ok) throw new Error('Upload failed');

            toast({ title: 'Success', description: 'Document uploaded successfully' });
            setOpenUpload(false);
            setUploadFile(null);
            setUploadTitle('');
            // setUploadDesc('');
            setAgreed(false);
            fetchMyDocuments();
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive', description: 'Upload failed' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownloadZip = async (cat: Category) => {
        try {
            window.open(`${API_BASE_URL}/api/documents/categories/${cat._id}/zip`, '_blank');
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive', description: 'Download failed' });
        }
    }

    const getCollegeCode = (col: any) => {
        if (!col) return '-';
        return col['College Code'] || col.Code || col.code || col.collegeCode || col['CollegeCode'] || '-';
    };

    const downloadCSV = (type: 'submitted' | 'pending', categoryName: string) => {
        let csvData: any[] = [];
        const filename = `${categoryName}_${type}_colleges.csv`;

        if (type === 'submitted') {
            csvData = categorySubmissions.map(sub => ({
                'Category': categoryName,
                'College Name': (sub.collegeId as any)?.['College Name'] || sub.username,
                'College Code': getCollegeCode(sub.collegeId),
                'Status': 'uploaded'
            }));
        } else {
            csvData = allColleges
                .filter(col => !categorySubmissions.some(sub =>
                    (sub.collegeId as any)?._id === col._id || sub.username === col.Username
                ))
                .map(col => ({
                    'Category': categoryName,
                    'College Name': col['College Name'],
                    'College Code': getCollegeCode(col),
                    'Status': 'not uploaded'
                }));
        }

        if (csvData.length === 0) {
            toast({ title: 'No data', description: `No colleges in ${type} list.` });
            return;
        }

        const headers = Object.keys(csvData[0]);
        const csvRows = [
            headers.join(','),
            ...csvData.map(row =>
                headers.map(fieldName => {
                    const value = row[fieldName] || '';
                    return `"${String(value).replace(/"/g, '""')}"`;
                }).join(',')
            )
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };


    // --- Render ---

    if (loading && categories.length === 0) return <div className="p-8 text-center">Loading...</div>;

    const isDdpo = user?.role === 'ddpo';

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        Documents & Compliance
                        <Button variant="ghost" size="icon" onClick={refreshData} title="Refresh Data">
                            <RefreshCw className="h-5 w-5" />
                        </Button>
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {isDdpo ? 'Manage document categories and view submissions.' : 'Upload required compliance documents.'}
                    </p>
                </div>

                {isDdpo && (
                    <>
                        <Dialog open={openCreateCat} onOpenChange={setOpenCreateCat}>
                            <DialogTrigger asChild>
                                <Button className="gap-2"><Plus className="w-4 h-4" /> Create Category</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create Document Category</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleCreateCategory} className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Category Name</label>
                                        <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} required placeholder="e.g. Fire Safety" />
                                    </div>

                                    <Button type="submit" className="w-full">Create Category</Button>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={openEditCat} onOpenChange={setOpenEditCat}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Document Category</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleEditCategory} className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Category Name</label>
                                        <Input value={editCatName} onChange={e => setEditCatName(e.target.value)} required placeholder="e.g. Fire Safety" />
                                    </div>

                                    <Button type="submit" className="w-full">Update Category</Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </>
                )}
            </div>

            {/* DDPO VIEW */}
            {isDdpo && (
                <div className="grid gap-6">
                    {categories.map(cat => (
                        <Card key={cat._id} className="overflow-hidden">
                            <CardHeader className="bg-muted/30 pb-4">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Folder className="w-5 h-5 text-blue-600" />
                                            {cat.name}
                                        </CardTitle>

                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                                        <Badge variant="secondary" className="text-sm">
                                            {cat.submissionCount} Submissions
                                        </Badge>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setEditingCategory(cat);
                                                setEditCatName(cat.name);
                                                setOpenEditCat(true);
                                            }}
                                            className="gap-1.5"
                                        >
                                            <Pencil className="w-3.5 h-3.5" /> Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteCategory(cat._id, cat.name)}
                                            className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleDownloadZip(cat)}>
                                            <Download className="w-4 h-4 mr-2" /> Download All (ZIP)
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0 p-0">
                                <Accordion type="single" collapsible onValueChange={(val) => {
                                    if (val === cat._id) fetchCategorySubmissions(cat._id);
                                }}>
                                    <AccordionItem value={cat._id} className="border-none">
                                        <AccordionTrigger className="px-6 py-3 hover:bg-muted/50 text-sm text-muted-foreground">
                                            View Submissions
                                        </AccordionTrigger>
                                        <AccordionContent className="px-6 pb-4">
                                            <div className="space-y-4">
                                                <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                        <span>Submitted: <span className="font-semibold text-foreground">{categorySubmissions.length}</span></span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 hover:bg-green-100 hover:text-green-700"
                                                            onClick={() => downloadCSV('submitted', cat.name)}
                                                            title="Download Submitted Colleges CSV"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-orange-500" />
                                                        <span>Pending: <span className="font-semibold text-foreground">{allColleges.length - categorySubmissions.length}</span></span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 hover:bg-orange-100 hover:text-orange-700"
                                                            onClick={() => downloadCSV('pending', cat.name)}
                                                            title="Download Pending Colleges CSV"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="border rounded-md overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>College Name</TableHead>
                                                                <TableHead>Status</TableHead>
                                                                <TableHead>Document</TableHead>
                                                                <TableHead>Date</TableHead>
                                                                <TableHead className="text-right">Actions</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {/* Show Submitted First */}
                                                            {categorySubmissions.map(doc => (
                                                                <TableRow key={doc._id}>
                                                                    <TableCell className="font-medium">
                                                                        {(doc.collegeId as any)?.['College Name'] || doc.username}
                                                                        <div className="text-xs text-muted-foreground">{(doc.collegeId as any)?.['Code']}</div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Badge className="bg-green-600">Submitted</Badge>
                                                                    </TableCell>
                                                                    <TableCell className="max-w-[200px] truncate" title={doc.fileName}>
                                                                        {doc.fileName}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {new Date(doc.createdAt).toLocaleDateString()}
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        <Button variant="ghost" size="sm" onClick={() => window.open(`${API_BASE_URL}${doc.fileUrl}`, '_blank')}>
                                                                            <Eye className="w-4 h-4 mr-1" /> View
                                                                        </Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}

                                                            {/* Show Pending Colleges (Optional enhancement: Fetch list of all colleges to show who hasn't submitted)
                                                                For now, user asked to "show all college and who have uploaded". 
                                                                To do this accurately, we need the full list of colleges. 
                                                                The current implementation only has submissions.
                                                                I will merge the lists if I can fetch all colleges.
                                                             */}
                                                            {allColleges
                                                                .filter(col => !categorySubmissions.some(sub =>
                                                                    (sub.collegeId as any)?._id === col._id || sub.username === col.Username
                                                                ))
                                                                .map(col => (
                                                                    <TableRow key={col._id} className="opacity-60 bg-muted/5">
                                                                        <TableCell className="font-medium">
                                                                            {col['College Name']}
                                                                            <div className="text-xs text-muted-foreground">{col.Code}</div>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50">Pending</Badge>
                                                                        </TableCell>
                                                                        <TableCell>-</TableCell>
                                                                        <TableCell>-</TableCell>
                                                                        <TableCell className="text-right">-</TableCell>
                                                                    </TableRow>
                                                                ))
                                                            }
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </CardContent>
                        </Card>
                    ))}
                    {categories.length === 0 && <p className="text-center text-muted-foreground">No categories created yet.</p>}
                </div>
            )}

            {/* COLLEGE VIEW */}
            {!isDdpo && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map(cat => {
                        const existingDoc = myDocuments.find(d => {
                            if (typeof d.categoryId === 'string') return d.categoryId === cat._id;
                            return (d.categoryId as any)?._id === cat._id;
                        });

                        return (
                            <Card key={cat._id} className={`flex flex-col ${existingDoc ? 'border-green-200 bg-green-50/10' : ''}`}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <Badge variant={existingDoc ? "default" : "outline"} className={existingDoc ? "bg-green-600 hover:bg-green-700" : ""}>
                                            {existingDoc ? 'Completed' : 'Pending'}
                                        </Badge>
                                        {existingDoc && <CheckCircle className="w-5 h-5 text-green-600" />}
                                    </div>
                                    <CardTitle className="mt-2">{cat.name}</CardTitle>
                                    <CardDescription>{cat.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    {existingDoc ? (
                                        <div className="space-y-3">
                                            <div className="bg-muted/50 rounded-lg p-3 text-sm">
                                                <p className="font-medium text-foreground flex items-center gap-2">
                                                    <FileText className="w-4 h-4" /> {existingDoc.fileName}
                                                </p>
                                                <p className="text-muted-foreground text-xs mt-1">Uploaded on {new Date(existingDoc.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <Button
                                                variant="secondary"
                                                className="w-full gap-2"
                                                onClick={() => window.open(`${API_BASE_URL}${existingDoc.fileUrl}`, '_blank')}
                                            >
                                                <Eye className="w-4 h-4" /> View Document
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="h-20 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                                            Document required
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Dialog open={openUpload && targetCategory === cat._id} onOpenChange={(open) => {
                                        if (!open) setOpenUpload(false);
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button
                                                className="w-full"
                                                variant={existingDoc ? "outline" : "default"}
                                                onClick={() => {
                                                    setTargetCategory(cat._id);
                                                    setOpenUpload(true);
                                                    setUploadTitle(cat.name); // default title
                                                }}
                                            >
                                                {existingDoc ? 'Replace Document' : 'Upload Document'}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Upload {cat.name}</DialogTitle>
                                                <DialogDescription>{cat.description}</DialogDescription>
                                            </DialogHeader>
                                            <form onSubmit={handleUpload} className="space-y-4 pt-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Document Title</label>
                                                    <Input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} required />
                                                </div>
                                                {/* Removed Description Field */}
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">File (PDF)</label>
                                                    <Input type="file" accept=".pdf" onChange={e => setUploadFile(e.target.files?.[0] || null)} required />
                                                    <p className="text-xs text-muted-foreground mt-1">Max file size: 1MB</p>
                                                </div>
                                                <div className="flex items-start space-x-2 py-2">
                                                    <Checkbox id="terms" checked={agreed} onCheckedChange={(c) => setAgreed(c as boolean)} />
                                                    <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                                                        I hereby declare that the information provided is true and accurate.
                                                    </label>
                                                </div>
                                                <Button type="submit" disabled={!agreed || isUploading} className="w-full">
                                                    {isUploading ? 'Uploading...' : 'Submit Document'}
                                                </Button>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};