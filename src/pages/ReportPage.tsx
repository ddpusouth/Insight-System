import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, BarChart3, Users, Building, CheckCircle, RefreshCw } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface Category {
    _id: string;
    name: string;
    description: string;
    submissionCount?: number;
    submissions?: Document[];
}

interface Document {
    _id: string;
    title: string;
    description: string;
    fileUrl: string;
    fileName: string;
    categoryId: string | { _id: string, name: string };
    createdAt: string;
    collegeId?: { 'College Name': string, Code: string, _id: string };
    username?: string;
}

export const ReportPage: React.FC = () => {
    const { user } = useAuth(); // eslint-disable-line @typescript-eslint/no-unused-vars
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [allColleges, setAllColleges] = useState<any[]>([]);
    const [allDashboards, setAllDashboards] = useState<any[]>([]);
    const [allInfrastructure, setAllInfrastructure] = useState<any[]>([]);
    const [queries, setQueries] = useState<any[]>([]);
    const [isGenerating, setIsGenerating] = useState<string | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchCategories(),
                fetchAllColleges(),
                fetchAllDashboards(),
                fetchAllInfrastructure(),
                fetchAllQueries()
            ]);
        } catch (error) {
            console.error('Error fetching initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/documents/categories`);
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchAllColleges = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/colleges/all`);
            if (res.ok) {
                const data = await res.json();
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

    const fetchAllDashboards = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/college-dashboard/all`);
            if (res.ok) {
                const data = await res.json();
                setAllDashboards(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching dashboards:', error);
        }
    };

    const fetchAllInfrastructure = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/infrastructure/all`);
            if (res.ok) {
                const data = await res.json();
                setAllInfrastructure(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching infrastructure:', error);
        }
    };

    const fetchAllQueries = async () => {
        try {
            const [standardRes, linkRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/queries/all/standard`),
                fetch(`${API_BASE_URL}/api/queries/all/link`)
            ]);

            if (standardRes.ok && linkRes.ok) {
                const standard = await standardRes.json();
                const links = await linkRes.json();

                const s = Array.isArray(standard) ? standard : [];
                const l = Array.isArray(links) ? links : [];

                // Tag them so we can distinguish if needed
                const combined = [
                    ...s.map((q: any) => ({ ...q, _queryType: 'standard' })),
                    ...l.map((q: any) => ({ ...q, _queryType: 'link' }))
                ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setQueries(combined);
            }
        } catch (error) {
            console.error('Error fetching queries:', error);
        }
    };

    const isLoggedIn = (dashboard: any) => {
        if (!dashboard) return false;

        // Helper to check if a value is considered "filled" (non-zero, non-empty)
        const isEffectiveValue = (val: any) => {
            if (val === null || val === undefined) return false;
            if (typeof val === 'number') return val > 0;
            if (typeof val === 'string') {
                const trimmed = val.trim();
                return trimmed !== '' && trimmed !== '0';
            }
            return false;
        };

        const stats = dashboard.stats || {};
        const info = dashboard.information || {};

        // Check all 15 fields from the dashboard
        // 11 Statistics fields
        const statsFields = [
            stats.totalStudents,
            stats.firstPUStudents,
            stats.secondPUStudents,
            stats.totalStaff,
            stats.aidedStaff,
            stats.unaidedStaff,
            stats.nonTeachingStaff,
            stats.boys,
            stats.girls,
            stats.maleTeacher,
            stats.femaleTeacher
        ];

        // 4 Information fields
        const infoFields = [
            info.principalName,
            info.contact1,
            info.email,
            info.address
        ];

        // Combine all fields
        const allFields = [...statsFields, ...infoFields];

        // Return true (Completed Data) if ANY field has a valid value
        // Return false (Not Entered Data) if ALL fields are 0 or empty
        return allFields.some(field => isEffectiveValue(field));
    };

    const hasInfrastructure = (username: string) => {
        const infra = allInfrastructure.find(i => i.username === username);
        if (!infra || !infra.categories) return false;
        return infra.categories.some((cat: any) => cat.files && cat.files.length > 0);
    };

    const downloadCSV = (data: any[], filename: string) => {
        if (data.length === 0) {
            toast({ title: 'No data', description: 'No records found for this report.' });
            return;
        }

        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map(row =>
                headers.map(fieldName => {
                    const val = row[fieldName];
                    const value = (val !== null && val !== undefined) ? val : '';
                    return `"${String(value).replace(/"/g, '""')}"`;
                }).join(',')
            )
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const getCollegeCode = (col: any) => {
        if (!col) return '-';
        return col['College Code'] || col.Code || col.code || col.collegeCode || col['CollegeCode'] || '-';
    };

    const generateCollegesReport = () => {
        setIsGenerating('colleges');
        const reportData = allColleges.map(col => ({
            'College Name': col['College Name'],
            'Code': getCollegeCode(col),
            'Username': col.Username
        }));
        downloadCSV(reportData, 'all_colleges_report');
        setIsGenerating(null);
    };

    const generateCategoryReport = async (category: Category) => {
        setIsGenerating(category._id);
        try {
            const res = await fetch(`${API_BASE_URL}/api/documents/categories/${category._id}/submissions`);
            const submissionsRaw = await res.json();
            const submissions: Document[] = Array.isArray(submissionsRaw) ? submissionsRaw : [];

            const reportData = allColleges.map(col => {
                const submission = submissions.find(sub =>
                    (sub.collegeId as any)?._id === col._id || sub.username === col.Username
                );

                return {
                    'College Name': col['College Name'],
                    'Code': getCollegeCode(col),
                    'Category': category.name,
                    'Status': submission ? 'uploaded' : 'not uploaded',
                    'Upload Date': submission ? new Date(submission.createdAt).toLocaleDateString() : '-'
                };
            });

            downloadCSV(reportData, `${category.name.replace(/\s+/g, '_')}_compliance_report`);
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', variant: 'destructive', description: 'Failed to generate category report.' });
        } finally {
            setIsGenerating(null);
        }
    };

    const getDashboard = (username: string) => {
        if (!username) return undefined;
        const target = String(username).trim().toLowerCase();
        return allDashboards.find(d =>
            d.username && String(d.username).trim().toLowerCase() === target
        );
    };

    const generateLoginReport = () => {
        setIsGenerating('login');
        const reportData = allColleges.map(col => {
            const dashboard = getDashboard(col.Username);
            const loggedIn = isLoggedIn(dashboard);
            return {
                'College Name': col['College Name'],
                'Code': getCollegeCode(col),
                'Status': loggedIn ? 'Logged In' : 'Never Logged In',
                'Last Updated': dashboard?.lastUpdated ? new Date(dashboard.lastUpdated).toLocaleString() : '-'
            };
        });
        downloadCSV(reportData, 'college_login_status_report');
        setIsGenerating(null);
    };

    const generateFilteredDashboardReport = (status: 'completed' | 'pending') => {
        setIsGenerating(`dashboard_${status}`);
        const filteredColleges = allColleges.filter(col => {
            const dashboard = getDashboard(col.Username);
            const hasData = isLoggedIn(dashboard);
            return status === 'completed' ? hasData : !hasData;
        });

        const reportData = filteredColleges.map(col => {
            const dashboard = getDashboard(col.Username);
            const stats = dashboard?.stats || {};
            const info = dashboard?.information || {};

            return {
                'College Name': col['College Name'],
                'Code': getCollegeCode(col),
                'Principal Name': info.principalName || '-',
                'Email': info.email || col.Email || '-',
                'Contact': info.contact1 || '-',
                'Address': info.address || '-',
                'Total Students': stats.totalStudents || 0,
                '1st PU Students': stats.firstPUStudents || 0,
                '2nd PU Students': stats.secondPUStudents || 0,
                'Boys': stats.boys || 0,
                'Girls': stats.girls || 0,
                'Total Staff': stats.totalStaff || 0,
                'Aided Staff': stats.aidedStaff || 0,
                'Unaided Staff': stats.unaidedStaff || 0,
                'Non-Teaching Staff': stats.nonTeachingStaff || 0,
                'Male Teachers': stats.maleTeacher || 0,
                'Female Teachers': stats.femaleTeacher || 0,
                'Last Updated': dashboard?.lastUpdated ? new Date(dashboard.lastUpdated).toLocaleString() : 'Never'
            };
        });

        downloadCSV(reportData, `colleges_dashboard_${status}_report`);
        setIsGenerating(null);
    };

    const generateDetailedStatsReport = () => {
        setIsGenerating('detailed_stats');
        const reportData = allColleges.map(col => {
            const dashboard = getDashboard(col.Username);
            const stats = dashboard?.stats || {};
            const info = dashboard?.information || {};

            // Fields to check for 0 or empty to determine "Not Entered" status
            const checkFields = [
                stats.totalStudents,
                stats.firstPUStudents,
                stats.secondPUStudents,
                stats.boys,
                stats.girls,
                stats.totalStaff,
                stats.aidedStaff,
                stats.unaidedStaff,
                stats.nonTeachingStaff,
                stats.maleTeacher,
                stats.femaleTeacher,
                info.principalName,
                info.email,
                info.contact1,
                info.address
            ];

            // Count how many fields are 0 or empty strings
            const zeroOrEmptyCount = checkFields.reduce((count, value) => {
                if (value === 0 || value === '0' || !value || (typeof value === 'string' && value.trim() === '')) {
                    return count + 1;
                }
                return count;
            }, 0);

            const status = zeroOrEmptyCount >= 3 ? 'Not Entered Data' : 'Data Entered';

            return {
                'College Name': col['College Name'],
                'Code': getCollegeCode(col),
                'Data Status': status,
                'Principal Name': info.principalName || '-',
                'Email': info.email || col.Email || '-',
                'Contact': info.contact1 || '-',
                'Address': info.address || '-',
                'Total Students': stats.totalStudents || 0,
                '1st PU': stats.firstPUStudents || 0,
                '2nd PU': stats.secondPUStudents || 0,
                'Boys': stats.boys || 0,
                'Girls': stats.girls || 0,
                'Total Staff': stats.totalStaff || 0,
                'Aided Staff': stats.aidedStaff || 0,
                'Unaided Staff': stats.unaidedStaff || 0,
                'Non-Teaching': stats.nonTeachingStaff || 0,
                'Male Teachers': stats.maleTeacher || 0,
                'Female Teachers': stats.femaleTeacher || 0,
                'Last Updated': dashboard?.lastUpdated ? new Date(dashboard.lastUpdated).toLocaleString() : 'Never'
            };
        });
        downloadCSV(reportData, 'detailed_college_dashboard_report');
        setIsGenerating(null);
    };

    const generateQueryReport = (query: any) => {
        setIsGenerating(`query_${query._id}`);

        const reportData = (query.selectedColleges || []).map((username: string) => {
            const targetUser = String(username).trim();

            // Try robust matching for the college
            const college = allColleges.find(c =>
                (c.Username && String(c.Username).trim() === targetUser) ||
                (c.Username && String(c.Username).trim().toLowerCase() === targetUser.toLowerCase())
            );

            // Handle various possible field names for Code
            const collegeCode = getCollegeCode(college);

            // Find response
            const response = (query.responses || []).find((r: any) =>
                (r.college && String(r.college).trim() === targetUser)
            );

            return {
                'College Name': college?.['College Name'] || username,
                'Code': collegeCode,
                'Query Type': query.type,
                'Status': response?.status || 'Pending',
                'Responded At': response?.respondedAt ? new Date(response.respondedAt).toLocaleString() : '-'
            };
        });

        const safeTitle = (query.type || 'query').replace(/\s+/g, '_');
        downloadCSV(reportData, `${safeTitle}_response_report`);
        setIsGenerating(null);
    };

    const generateInfrastructureReport = (status: 'uploaded' | 'pending') => {
        setIsGenerating(`infra_${status}`);
        const filteredColleges = allColleges.filter(col => {
            const uploaded = hasInfrastructure(col.Username);
            return status === 'uploaded' ? uploaded : !uploaded;
        });

        const reportData = filteredColleges.map(col => {
            const infra = allInfrastructure.find(i => i.username === col.Username);
            const categoriesUploaded = infra?.categories
                ?.filter((cat: any) => cat.files && cat.files.length > 0)
                .map((cat: any) => cat.name)
                .join('; ') || '-';

            const totalPhotos = infra?.categories?.reduce((acc: number, cat: any) => acc + (cat.files?.length || 0), 0) || 0;

            return {
                'College Name': col['College Name'],
                'Code': getCollegeCode(col),
                'Categories with Photos': categoriesUploaded,
                'Total Photos': totalPhotos,
                'Status': status === 'uploaded' ? 'Uploaded' : 'Pending'
            };
        });

        downloadCSV(reportData, `colleges_infrastructure_${status}_report`);
        setIsGenerating(null);
    };


    if (loading) return <div className="p-8 text-center flex flex-col items-center gap-4">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p>Loading report data...</p>
    </div>;

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <BarChart3 className="h-8 w-8 text-primary" />
                        Reports Center
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Download detailed CSV reports for compliance and college management.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Compliance Statistics Summary */}
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            System Overview & Login Status
                        </CardTitle>
                        <CardDescription>Summary of login activity and compliance</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                                <p className="text-sm font-medium text-purple-800">Colleges Logged In</p>
                                <p className="text-3xl font-bold text-purple-900">
                                    {allColleges.filter(col => {
                                        const dashboard = getDashboard(col.Username);
                                        return isLoggedIn(dashboard);
                                    }).length}
                                </p>
                            </div>
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                <p className="text-sm font-medium text-blue-800">Total Colleges</p>
                                <p className="text-3xl font-bold text-blue-900">{allColleges.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* General Reports */}
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building className="h-5 w-5 text-blue-600" />
                            General Reports
                        </CardTitle>
                        <CardDescription>Overall college and system information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">All Colleges List</p>
                                    <p className="text-xs text-muted-foreground">Detailed list of all {allColleges.length} registered colleges</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={generateCollegesReport}
                                disabled={isGenerating === 'colleges'}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                {isGenerating === 'colleges' ? 'Generating...' : 'Download'}
                            </Button>
                        </div>


                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Login Status Report</p>
                                    <p className="text-xs text-muted-foreground">List of colleges that have entered dashboard data</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={generateLoginReport}
                                disabled={isGenerating === 'login'}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                {isGenerating === 'login' ? 'Generating...' : 'Download'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Dashboard Details Section */}
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-purple-600" />
                            Dashboard Details
                        </CardTitle>
                        <CardDescription>Detailed statistics and institutional data</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                                <p className="text-sm font-medium text-purple-800">Completed Data</p>
                                <p className="text-3xl font-bold text-purple-900">
                                    {allColleges.filter(col => {
                                        const dashboard = allDashboards.find(d => d.username === col.Username);
                                        return isLoggedIn(dashboard);
                                    }).length}
                                </p>
                            </div>
                            <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                                <p className="text-sm font-medium text-red-800">Not Entered Data</p>
                                <p className="text-3xl font-bold text-red-900">
                                    {allColleges.filter(col => {
                                        const dashboard = getDashboard(col.Username);
                                        return !isLoggedIn(dashboard);
                                    }).length}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Detailed Dashboard Stats</p>
                                    <p className="text-xs text-muted-foreground">Export all student, staff and principal details</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={generateDetailedStatsReport}
                                disabled={isGenerating === 'detailed_stats'}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                {isGenerating === 'detailed_stats' ? 'Generating...' : 'Download'}
                            </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-green-50/50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="font-medium text-green-900">Completed Data List</p>
                                    <p className="text-xs text-green-700">List of colleges that have filled dashboard data</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-white hover:bg-green-50"
                                onClick={() => generateFilteredDashboardReport('completed')}
                                disabled={isGenerating === 'dashboard_completed'}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                {isGenerating === 'dashboard_completed' ? 'Generating...' : 'Download'}
                            </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-lg border border-red-200">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-red-600" />
                                <div>
                                    <p className="font-medium text-red-900">Pending Data List</p>
                                    <p className="text-xs text-red-700">List of colleges that have NOT filled data</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-white hover:bg-red-50"
                                onClick={() => generateFilteredDashboardReport('pending')}
                                disabled={isGenerating === 'dashboard_pending'}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                {isGenerating === 'dashboard_pending' ? 'Generating...' : 'Download'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Infrastructure Details Section */}
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building className="h-5 w-5 text-indigo-600" />
                            Infrastructure Details
                        </CardTitle>
                        <CardDescription>Status of infrastructure photo uploads</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                                <p className="text-sm font-medium text-indigo-800">Photos Uploaded</p>
                                <p className="text-3xl font-bold text-indigo-900">
                                    {allColleges.filter(col => hasInfrastructure(col.Username)).length}
                                </p>
                            </div>
                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
                                <p className="text-sm font-medium text-amber-800">No Photos Yet</p>
                                <p className="text-3xl font-bold text-amber-900">
                                    {allColleges.filter(col => !hasInfrastructure(col.Username)).length}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-green-50/50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="font-medium text-green-900">Infrastructure Uploaded List</p>
                                    <p className="text-xs text-green-700">Colleges that have uploaded infrastructure photos</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-white hover:bg-green-50"
                                onClick={() => generateInfrastructureReport('uploaded')}
                                disabled={isGenerating === 'infra_uploaded'}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                {isGenerating === 'infra_uploaded' ? 'Generating...' : 'Download'}
                            </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-amber-50/50 rounded-lg border border-amber-200">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-amber-600" />
                                <div>
                                    <p className="font-medium text-amber-900">Infrastructure Pending List</p>
                                    <p className="text-xs text-amber-700">Colleges that have NOT uploaded any photos</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-white hover:bg-amber-50"
                                onClick={() => generateInfrastructureReport('pending')}
                                disabled={isGenerating === 'infra_pending'}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                {isGenerating === 'infra_pending' ? 'Generating...' : 'Download'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Document Reports Section */}
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-amber-600" />
                        Document Reports
                    </CardTitle>
                    <CardDescription>Status and reports for each document category</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.map(cat => (
                            <div key={cat._id} className="flex flex-col p-4 border rounded-lg hover:bg-muted/30 transition-colors gap-3">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-sm truncate max-w-[180px]" title={cat.name}>{cat.name}</p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => generateCategoryReport(cat)}
                                        disabled={!!isGenerating}
                                        title="Download Detailed Report"
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 text-[10px]">
                                        Uploaded: {cat.submissionCount || 0}
                                    </Badge>
                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-100 text-[10px]">
                                        Pending: {Math.max(0, allColleges.length - (cat.submissionCount || 0))}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Query Reports Section */}
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        Query Response Reports
                    </CardTitle>
                    <CardDescription>Status and response reports for active queries</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {queries.map(query => {
                            const respondedCount = (query.responses || []).filter((r: any) => r.status === 'Responded').length;
                            const totalExpected = (query.selectedColleges || []).length;
                            const pendingCount = Math.max(0, totalExpected - respondedCount);

                            return (
                                <div key={query._id} className="flex flex-col p-4 border rounded-lg hover:bg-muted/30 transition-colors gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="font-semibold text-sm truncate max-w-[180px]" title={query.type}>{query.type}</p>
                                            <p className="text-[10px] text-muted-foreground">Due: {new Date(query.dueDate).toLocaleDateString()}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => generateQueryReport(query)}
                                            disabled={!!isGenerating}
                                            title="Download Detailed Report"
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-[10px]">
                                            Responded: {respondedCount}
                                        </Badge>
                                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-100 text-[10px]">
                                            Pending: {pendingCount}
                                        </Badge>
                                    </div>
                                </div>
                            );
                        })}
                        {queries.length === 0 && (
                            <div className="col-span-full py-8 text-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                                No active queries found.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
