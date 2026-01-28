import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Download, CheckCircle, XCircle, Clock, Bell } from 'lucide-react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const AttendancePage: React.FC = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    // DDPO State
    const [date, setDate] = useState<Date>(new Date());
    const [report, setReport] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, present: 0, absent: 0 });
    const [loading, setLoading] = useState(false);

    // College State
    const [marked, setMarked] = useState(false);
    const [collegeAttendance, setCollegeAttendance] = useState<any>(null);
    const [markingLoading, setMarkingLoading] = useState(false);

    // Helper to format date as YYYY-MM-DD for API
    const formatDate = (d: Date) => {
        return format(d, 'yyyy-MM-dd');
    };

    useEffect(() => {
        if (user?.role === 'ddpo') {
            fetchReport(date);
        } else {
            fetchStatus();
        }
    }, [user, date]);

    // For DDPO
    const fetchReport = async (selectedDate: Date) => {
        setLoading(true);
        try {
            const dateStr = formatDate(selectedDate);
            const res = await fetch(`${API_BASE_URL}/api/attendance/report?date=${dateStr}`);
            const data = await res.json();
            setReport(data.report || []);
            setStats(data.stats || { total: 0, present: 0, absent: 0 });
        } catch (error) {
            console.error('Error fetching report:', error);
            toast({ title: 'Error', description: 'Failed to fetch attendance report', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = async () => {
        try {
            const dateStr = formatDate(date);
            window.open(`${API_BASE_URL}/api/attendance/export?date=${dateStr}`, '_blank');
        } catch (error) {
            console.error('Error downloading CSV:', error);
            toast({ title: 'Error', description: 'Failed to download report', variant: 'destructive' });
        }
    };

    // For Colleges
    const fetchStatus = async () => {
        if (!user?.username) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/attendance/status/${user.username}`);
            const data = await res.json();
            setMarked(data.marked);
            setCollegeAttendance(data.attendance);
        } catch (error) {
            console.error('Error fetching status:', error);
        }
    };

    const markAttendance = async () => {
        setMarkingLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/attendance/mark`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collegeUsername: user?.username })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to mark attendance');
            }

            setMarked(true);
            setCollegeAttendance(data.attendance);
            toast({
                title: 'Success',
                description: 'Attendance marked successfully!',
                className: 'bg-green-500 text-white border border-green-100 rounded-xl'
            });
        } catch (error: any) {
            console.error('Error marking attendance:', error);
            toast({
                title: 'Failed',
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setMarkingLoading(false);
        }
    };

    // --- Views ---

    if (user?.role === 'ddpo') {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Attendance Overview</h1>
                        <p className="text-muted-foreground mt-1">Track daily login attendance of colleges.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                        {/* Date Picker */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full sm:w-[240px] justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(d) => d && setDate(d)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        <Button onClick={downloadCSV} variant="default" className="flex items-center justify-center gap-2 w-full sm:w-auto">
                            <Download className="h-4 w-4" />
                            Download CSV
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Colleges</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-700">Present</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-700">{stats.present}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-red-50 border-red-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-red-700">Absent</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-700">{stats.absent}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Attendance Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>College Status - {format(date, "PPP")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p>Loading...</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>College Code</TableHead>
                                        <TableHead>College Name</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Marked At</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {report.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-4">No data available</TableCell>
                                        </TableRow>
                                    ) : (
                                        report.map((item: any) => (
                                            <TableRow key={item.username}>
                                                <TableCell className="font-medium">{item.collegeCode || '-'}</TableCell>
                                                <TableCell>{item.collegeName}</TableCell>
                                                <TableCell>
                                                    <span className={cn(
                                                        "px-2 py-1 rounded text-xs font-semibold",
                                                        item.status === 'Present' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                                    )}>
                                                        {item.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {item.status === 'Present' && item.markedAt
                                                        ? new Date(item.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                        : '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    const renderMarkingSection = () => {
        const now = new Date();
        const hour = now.getHours();
        // Strictly close at 9:00 PM (hour 21)
        const isWindowOpen = hour >= 9 && hour < 21;

        if (!isWindowOpen) {
            return (
                <div className="text-center space-y-4 w-full">
                    <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-200">
                        Attendance window is currently closed.
                        <br />Please return between 9:00 AM and 9:00 PM.
                    </div>

                    <div className="p-4 bg-orange-50 text-orange-800 rounded-lg text-sm border border-orange-200 flex items-center gap-3 text-left">
                        <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 text-orange-600">
                            <Bell className="h-4 w-4" />
                        </div>
                        <span>
                            After entering the attendance in SATS portal, please mark the attendance in Insight system.
                        </span>
                    </div>

                    <Button disabled size="lg" className="w-full max-w-xs text-lg h-12 opacity-50 cursor-not-allowed">
                        Window Closed
                    </Button>
                </div>
            );
        }

        return (
            <div className="text-center space-y-6 w-full">
                <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
                    Please click the button below to mark your attendance for today.
                    <br />Ensure you are logging in between 9:00 AM and 9:00 PM.
                </div>

                <div className="p-4 bg-orange-50 text-orange-800 rounded-lg text-sm border border-orange-200 flex items-center gap-3 text-left">
                    <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 text-orange-600">
                        <Bell className="h-4 w-4" />
                    </div>
                    <span>
                        After entering the attendance in SATS portal, please mark the attendance in Insight system.
                    </span>
                </div>

                <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                    <Clock className="h-12 w-12" />
                </div>

                <Button
                    size="lg"
                    className="w-full max-w-xs text-lg h-12"
                    onClick={markAttendance}
                    disabled={markingLoading}
                >
                    {markingLoading ? 'Marking...' : 'Mark Attendance'}
                </Button>
            </div>
        );
    };

    // Admin / College View
    return (
        <div className="max-w-xl mx-auto py-10 animate-fade-in space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Daily Attendance</h1>
                <p className="text-muted-foreground mt-1">Mark your daily presence in the portal.</p>
            </div>

            <Card className="shadow-lg border-t-4 border-t-primary">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between">
                        <span>{format(new Date(), "EEEE, MMMM do, yyyy")}</span>
                        <Clock className="h-5 w-5 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>
                        Attendance window: 9:00 AM - 9:00 PM
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-8 space-y-6">

                    {marked ? (
                        <div className="text-center space-y-4 animate-in zoom-in duration-300">
                            <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                                <CheckCircle className="h-12 w-12" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-green-700">Attendance Marked!</h2>
                                <p className="text-muted-foreground mt-1">
                                    You successfully marked your attendance at {' '}
                                    {collegeAttendance?.timestamp && new Date(collegeAttendance.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                                </p>
                            </div>
                        </div>
                    ) : (
                        renderMarkingSection()
                    )}

                </CardContent>
            </Card>
        </div>
    );
};
