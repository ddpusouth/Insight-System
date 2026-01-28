import React from 'react';
import { API_BASE_URL } from '@/config';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  BookOpen,
  MessageSquare,
  TrendingUp,
  Calendar,
  Bell,
  FileText,
  BarChart3,
  GraduationCap,
  Building,
  X,
  Edit,
  Check,
  X as XIcon,
  Trash2,
  User,
  MapPin,
  Phone,
  Mail,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const adminStatsInitial = [
  { name: 'Total Students', key: 'totalStudents', value: 0 },
  { name: '1st PU Students', key: 'firstPUStudents', value: 0 },
  { name: '2nd PU Students', key: 'secondPUStudents', value: 0 },
  { name: 'Total Teachers', key: 'totalStaff', value: 0 },
  { name: 'Aided Teachers', key: 'aidedStaff', value: 0 },
  { name: 'Un-aided  Teachers', key: 'unaidedStaff', value: 0 },
  { name: 'Non-teaching Staffs', key: 'nonTeachingStaff', value: 0 },
  { name: 'Boys', key: 'boys', value: 0 },
  { name: 'Girls', key: 'girls', value: 0 },
  { name: 'Male Teachers', key: 'maleTeacher', value: 0 },
  { name: 'Female Teachers', key: 'femaleTeacher', value: 0 },
];

const informationInitial = [
  { name: 'Principal Name', key: 'principalName', value: '', icon: User },
  { name: 'Address', key: 'address', value: '', icon: MapPin },
  { name: 'Contact 1, Contact 2', key: 'contact1', value: '', icon: Phone },
  { name: 'Email', key: 'email', value: '', icon: Mail },
];

const ddpoStatsInitial = [
  { name: 'Private Colleges', key: 'privateColleges', value: 0 },
  { name: 'Govt-aided Colleges', key: 'govtAidedColleges', value: 0 },
  { name: 'Govt Colleges', key: 'govtColleges', value: 0 },
  { name: 'Bifurcated Colleges', key: 'bifurcatedColleges', value: 0 },
  { name: 'Corporate Colleges', key: 'corporateColleges', value: 0 },
  { name: 'Kittur Rani Chennamma', key: 'kitturranichennamma', value: 0 },
  { name: 'Total Colleges', key: 'totalColleges', value: 0 },
  { name: 'Total Students', key: 'totalStudents', value: 0 },
  { name: 'Total Teachers', key: 'totalTeacher', value: 0 },
];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.role || 'admin';
  const username = user?.username;
  const [adminStats, setAdminStats] = React.useState(adminStatsInitial);
  const [information, setInformation] = React.useState(informationInitial);
  const [loading, setLoading] = React.useState(false);

  // Fetch dashboard stats from backend for admin
  React.useEffect(() => {
    if (userRole === 'admin' && username) {
      setLoading(true);
      axios.get(`${API_BASE_URL}/api/college-dashboard/${username}`)
        .then(res => {
          if (res.data) {
            if (res.data.stats) {
              setAdminStats(adminStatsInitial.map(stat => ({
                ...stat,
                value: res.data.stats[stat.key] ?? stat.value
              })));
            }
            if (res.data.information) {
              setInformation(informationInitial.map(info => ({
                ...info,
                value: res.data.information[info.key] ?? info.value
              })));
            }
          }
        })
        .catch(() => { })
        .finally(() => setLoading(false));
    }
  }, [userRole, username]);

  // Update dashboard stats in backend for admin
  const updateStat = (key: string, value: number) => {
    if (userRole === 'admin' && username) {
      const newStats = Object.fromEntries(adminStats.map(s => [s.key, s.key === key ? value : s.value]));
      setAdminStats(adminStats.map(s => s.key === key ? { ...s, value } : s));
      axios.post(`${API_BASE_URL}/api/college-dashboard/${username}`, { stats: newStats });
    }
  };

  // Update information in backend for admin
  const updateInformation = (key: string, value: string) => {
    if (userRole === 'admin' && username) {
      const newInformation = Object.fromEntries(information.map(info => [info.key, info.key === key ? value : info.value]));
      setInformation(information.map(info => info.key === key ? { ...info, value } : info));
      axios.post(`${API_BASE_URL}/api/college-dashboard/${username}`, { information: newInformation });
    }
  };

  // DDPO stats state
  const [ddpoStats, setDdpoStats] = React.useState(ddpoStatsInitial);
  const [editingDdpoIndex, setEditingDdpoIndex] = React.useState<number | null>(null);
  const [editingDdpoValue, setEditingDdpoValue] = React.useState<number>(0);

  // Fetch dashboard stats from backend for ddpo
  React.useEffect(() => {
    if (userRole === 'ddpo' && username) {
      setLoading(true);
      axios.get(`${API_BASE_URL}/api/ddpu-dashboard/${username}`)
        .then(res => {
          if (res.data && res.data.stats) {
            setDdpoStats(ddpoStatsInitial.map(stat => ({
              ...stat,
              value: res.data.stats[stat.key] ?? stat.value
            })));
          }
        })
        .catch(() => { })
        .finally(() => setLoading(false));
    }
  }, [userRole, username]);

  // Update dashboard stats in backend for ddpo
  const updateDdpoStat = (key: string, value: number) => {
    if (userRole === 'ddpo' && username) {
      const newStats = Object.fromEntries(ddpoStats.map(s => [s.key, s.key === key ? value : s.value]));
      setDdpoStats(ddpoStats.map(s => s.key === key ? { ...s, value } : s));
      axios.post(`${API_BASE_URL}/api/ddpu-dashboard/${username}`, { stats: newStats });
    }
  };

  const handleDdpoEditClick = (index: number) => {
    setEditingDdpoIndex(index);
    setEditingDdpoValue(ddpoStats[index].value);
  };
  const handleDdpoEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingDdpoValue(parseInt(e.target.value, 10) || 0);
  };
  const handleDdpoEditSave = (index: number) => {
    updateDdpoStat(ddpoStats[index].key, editingDdpoValue);
    setEditingDdpoIndex(null);
  };
  const handleDdpoEditCancel = () => {
    setEditingDdpoIndex(null);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'ddpo': return 'DDPU Dashboard';
      case 'admin': return 'College Dashboard';
      default: return `${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard`;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-card rounded-lg p-6 shadow-glow">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {getGreeting()}, {user?.name}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome to your dashboard.
            </p>
          </div>
          <Badge className="bg-primary text-primary-foreground px-3 py-1">
            {getRoleTitle(userRole)}
          </Badge>
        </div>
      </div>

      {/* Admin Custom Stats Grid */}
      {userRole === 'admin' && (
        <>
          {/* Disclaimer */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 animate-fade-in">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {adminStats.map((stat, index) => {
              const [editing, setEditing] = React.useState(false);
              const [editValue, setEditValue] = React.useState(String(stat.value));
              const handleSave = () => {
                updateStat(stat.key, parseInt(editValue, 10) || 0);
                setEditing(false);
              };
              const handleCancel = () => {
                setEditValue(String(stat.value));
                setEditing(false);
              };
              React.useEffect(() => { setEditValue(String(stat.value)); }, [stat.value]);
              return (
                <Card key={stat.key} className="shadow-md hover:shadow-lg transition-shadow relative">
                  <CardContent className="p-6">
                    <button
                      className="absolute top-3 right-3 text-muted-foreground hover:text-primary focus:outline-none"
                      onClick={() => setEditing(true)}
                      aria-label={`Edit ${stat.name}`}
                      style={{ display: editing ? 'none' : 'block' }}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                      {editing ? (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="number"
                            min={0}
                            className="border rounded px-2 py-1 w-20 text-center bg-muted text-foreground focus:ring focus:ring-primary"
                            value={editValue}
                            onChange={e => {
                              // Always store as string, but strip leading zeros (except for '0')
                              let val = e.target.value.replace(/^0+(?!$)/, '');
                              setEditValue(val);
                            }}
                            onBlur={() => {
                              // If the field is left empty, reset to '0'
                              if (editValue === '') setEditValue('0');
                            }}
                            autoFocus
                          />
                          <button
                            className="text-green-600 hover:text-green-800"
                            onClick={handleSave}
                            disabled={parseInt(editValue, 10) < 0 || parseInt(editValue, 10) === Number(stat.value)}
                            aria-label="Save"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800"
                            onClick={handleCancel}
                            aria-label="Cancel"
                          >
                            <XIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Information Section */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Information
              </CardTitle>
              <CardDescription>
                College contact and principal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {information.map((info, index) => {
                  const [editing, setEditing] = React.useState(false);
                  const [editValue, setEditValue] = React.useState(info.value);
                  const IconComponent = info.icon;

                  const handleSave = () => {
                    if (info.key === 'email') {
                      // Simple email regex for validation
                      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
                      if (!emailRegex.test(editValue)) {
                        alert('Please enter a valid email address.');
                        return;
                      }
                    }
                    updateInformation(info.key, editValue);
                    setEditing(false);
                  };
                  const handleCancel = () => {
                    setEditValue(info.value);
                    setEditing(false);
                  };

                  React.useEffect(() => { setEditValue(info.value); }, [info.value]);

                  return (
                    <div key={info.key} className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                        <label className="text-sm font-medium text-muted-foreground">{info.name}</label>
                        <button
                          className="ml-auto text-muted-foreground hover:text-primary focus:outline-none"
                          onClick={() => setEditing(true)}
                          aria-label={`Edit ${info.name}`}
                          style={{ display: editing ? 'none' : 'block' }}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>

                      {editing ? (
                        <div className="space-y-2">
                          <input
                            type={info.key === 'email' ? 'email' : 'text'}
                            className="w-full border rounded px-3 py-2 bg-muted text-foreground focus:ring focus:ring-primary"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            autoFocus
                          />
                          <div className="flex items-center gap-2">
                            <button
                              className="text-green-600 hover:text-green-800 text-sm"
                              onClick={handleSave}
                              disabled={editValue === info.value}
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-800 text-sm"
                              onClick={handleCancel}
                            >
                              <XIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-foreground font-medium">
                          {info.value || <span className="text-muted-foreground italic">Not set</span>}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* DDPO dashboard remains unchanged */}
      {userRole === 'ddpo' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ddpoStats.map((stat, index) => (
            <Card key={stat.key} className="shadow-md hover:shadow-lg transition-shadow relative">
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center">
                  <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                  {editingDdpoIndex === index ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="number"
                        min={0}
                        className="border rounded px-2 py-1 w-20 text-center bg-muted text-foreground focus:ring focus:ring-primary"
                        value={editingDdpoValue}
                        onChange={handleDdpoEditChange}
                        autoFocus
                      />
                      <button
                        className="text-green-600 hover:text-green-800"
                        onClick={() => handleDdpoEditSave(index)}
                        aria-label="Save"
                        disabled={editingDdpoValue < 0 || editingDdpoValue === stat.value}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={handleDdpoEditCancel}
                        aria-label="Cancel"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                      <button
                        className="absolute top-3 right-3 text-muted-foreground hover:text-primary focus:outline-none"
                        onClick={() => handleDdpoEditClick(index)}
                        aria-label={`Edit ${stat.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

function CircularForm() {
  const [title, setTitle] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    if (!title || !file) {
      setError('Please enter a title and select a file.');
      setLoading(false);
      return;
    }
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);
    try {
      const res = await fetch(`${API_BASE_URL}/api/circulars`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload circular');
      setSuccess('Circular sent successfully!');
      setTitle('');
      setFile(null);
      // Optionally, trigger refresh of recent circulars
      window.dispatchEvent(new Event('circulars-updated'));
    } catch (err: any) {
      setError(err.message || 'Error uploading circular');
    } finally {
      setLoading(false);
    }
  };

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
      <div>
        <label className="block text-sm font-medium mb-1">Upload File/Document</label>
        <input
          type="file"
          className="border rounded px-3 py-2 w-full"
          onChange={e => setFile(e.target.files?.[0] || null)}
          required
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Circular'}
      </Button>
      {success && <p className="text-green-600 text-sm mt-2">{success}</p>}
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </form>
  );
}

function RecentCirculars() {
  const [circulars, setCirculars] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const { toast } = useToast();

  const fetchCirculars = async () => {
    setLoading(true);
    const res = await fetch(`${API_BASE_URL}/api/circulars`);
    const data = await res.json();
    setCirculars(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this circular?')) return;

    setDeleting(id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/circulars/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete circular');

      toast({ title: 'Success', description: 'Circular deleted successfully' });
      await fetchCirculars(); // Refresh the list
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete circular', variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  React.useEffect(() => {
    fetchCirculars();
    const handler = () => fetchCirculars();
    window.addEventListener('circulars-updated', handler);
    return () => window.removeEventListener('circulars-updated', handler);
  }, [toast]);

  if (loading) return <p>Loading...</p>;
  if (!circulars.length) return <p>No circulars sent yet.</p>;
  return (
    <ul className="space-y-3">
      {circulars.map(c => (
        <li key={c._id} className="border rounded p-3 flex items-center justify-between">
          <div>
            <div className="font-medium">{c.title}</div>
            <div className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={c.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline text-sm"
              download={c.fileName}
            >
              Download
            </a>
            <button
              onClick={() => handleDelete(c._id)}
              disabled={deleting === c._id}
              className="text-destructive hover:text-destructive/80 p-1 rounded transition-colors"
              title="Delete circular"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function AdminCircularsList() {
  const [circulars, setCirculars] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchCirculars = async () => {
    setLoading(true);
    const res = await fetch(`${API_BASE_URL}/api/circulars`);
    const data = await res.json();
    setCirculars(data);
    setLoading(false);
  };

  React.useEffect(() => {
    fetchCirculars();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!circulars.length) return <p>No circulars sent yet.</p>;
  return (
    <ul className="space-y-3">
      {circulars.map(c => (
        <li key={c._id} className="border rounded p-3 flex items-center justify-between">
          <div>
            <div className="font-medium">{c.title}</div>
            <div className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</div>
          </div>
          <a
            href={c.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline text-sm"
            download={c.fileName}
          >
            Download
          </a>
        </li>
      ))}
    </ul>
  );
}