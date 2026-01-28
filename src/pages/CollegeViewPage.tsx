import React from 'react';
import { useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Eye, File, Building, Users, Phone, Mail, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CollegeViewPage: React.FC = () => {
  const { collegeCode } = useParams();
  const [username, setUsername] = React.useState('');
  const [college, setCollege] = React.useState<any>(null);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<'details' | 'infrastructure'>('details');
  const [dashboardData, setDashboardData] = React.useState<any>(null);

  // Fetch college by code to get username and college details
  React.useEffect(() => {
    fetch(`/api/colleges/all`)
      .then(res => res.json())
      .then(data => {
        const collegeData = (data.colleges || []).find((c: any) => c['College Code'] === collegeCode);
        if (collegeData) {
          setCollege(collegeData);
          if (collegeData.Username) setUsername(collegeData.Username);
        }
      });
  }, [collegeCode]);

  // Fetch infrastructure for username
  React.useEffect(() => {
    if (!username) return;
    setLoading(true);
    fetch(`/api/infrastructure?username=${encodeURIComponent(username)}`)
      .then(res => res.json())
      .then(setCategories)
      .finally(() => setLoading(false));
  }, [username]);

  // Fetch dashboard data for username
  React.useEffect(() => {
    if (!username) return;
    fetch(`/api/college-dashboard/${username}`)
      .then(res => res.json())
      .then(setDashboardData)
      .catch(err => console.error('Error fetching dashboard data:', err));
  }, [username]);

  if (loading) return <div>Loading...</div>;
  if (!college) return <div>College not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{college['College Name']}</h1>
          <p className="text-muted-foreground mt-1">College Code: {college['College Code']}</p>
        </div>

        {/* Toggle Buttons */}
        <div className="flex bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === 'details' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('details')}
            className="flex items-center gap-2"
          >
            <Building className="h-4 w-4" />
            Details
          </Button>
          <Button
            variant={viewMode === 'infrastructure' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('infrastructure')}
            className="flex items-center gap-2"
          >
            <File className="h-4 w-4" />
            Infrastructure
          </Button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'details' ? (
        <CollegeDetailsView college={college} dashboardData={dashboardData} />
      ) : (
        <CollegeInfrastructureView categories={categories} />
      )}
    </div>
  );
};

// College Details/Dashboard Component
const CollegeDetailsView: React.FC<{ college: any; dashboardData: any }> = ({ college, dashboardData }) => {
  return (
    <div className="space-y-6">
      {/* College Information */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            College Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">College Name</label>
              <p className="text-foreground font-medium">{college['College Name']}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-foreground font-medium">{dashboardData?.information?.email || college['Email'] || 'Not specified'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Category</label>
              <p className="text-foreground font-medium">{college['Category'] || 'Not specified'}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Address</label>
              <p className="text-foreground font-medium">{dashboardData?.information?.address || college['Address'] || 'Not specified'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Contact</label>
              <p className="text-foreground font-medium">{dashboardData?.information?.contact1 || college['Contact'] || 'Not specified'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Principal Name</label>
              <p className="text-foreground font-medium">{dashboardData?.information?.principalName || college['Principal Name'] || 'Not specified'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Statistics */}
      {dashboardData && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Dashboard Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{dashboardData.stats?.totalStudents || 0}</div>
                <div className="text-sm text-muted-foreground">Total Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{dashboardData.stats?.firstPUStudents || 0}</div>
                <div className="text-sm text-muted-foreground">1st PU Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{dashboardData.stats?.secondPUStudents || 0}</div>
                <div className="text-sm text-muted-foreground">2nd PU Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{dashboardData.stats?.totalStaff || 0}</div>
                <div className="text-sm text-muted-foreground">Total Teachers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{dashboardData.stats?.aidedStaff || 0}</div>
                <div className="text-sm text-muted-foreground">Aided Teachers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{dashboardData.stats?.unaidedStaff || 0}</div>
                <div className="text-sm text-muted-foreground">Un-aided Teachers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{dashboardData.stats?.nonTeachingStaff || 0}</div>
                <div className="text-sm text-muted-foreground">Non-teaching Staffs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{dashboardData.stats?.boys || 0}</div>
                <div className="text-sm text-muted-foreground">Boys</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{dashboardData.stats?.girls || 0}</div>
                <div className="text-sm text-muted-foreground">Girls</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{dashboardData.stats?.maleTeacher || 0}</div>
                <div className="text-sm text-muted-foreground">Male Teachers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{dashboardData.stats?.femaleTeacher || 0}</div>
                <div className="text-sm text-muted-foreground">Female Teachers</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// College Infrastructure Component
const CollegeInfrastructureView: React.FC<{ categories: any[] }> = ({ categories }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Infrastructure Gallery</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {categories.flatMap((cat: any) =>
        (cat.files && cat.files.length > 0 ? cat.files.map((file: any, i: number) => (
          <div key={cat.name + '-' + i} className="bg-white rounded-2xl shadow-lg border hover:shadow-xl transition-shadow flex flex-col overflow-hidden relative">
            {file.label && (
              <div className="text-xs font-semibold text-primary mb-1 p-2 text-center">{file.label}</div>
            )}
            {file.fileUrl && file.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              <img src={file.fileUrl} alt={file.fileName} className="h-56 w-full object-cover" />
            ) : (
              <div className="h-56 w-full flex items-center justify-center bg-muted"><File className="h-10 w-10 text-muted-foreground" /></div>
            )}

            <div className="p-4 flex-1 flex flex-col">
              {file.description && (
                <div className="text-sm text-muted-foreground mb-2 italic">
                  "{file.description}"
                </div>
              )}
              {file.dimension && (
                <div className="text-xs text-muted-foreground mb-2">
                  <span className="font-semibold">Dimensions:</span> {file.dimension}
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Uploaded on {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : (file.updatedAt ? new Date(file.updatedAt).toLocaleDateString() : '-')}</span>
                <Button size="icon" variant="ghost" onClick={() => window.open(file.fileUrl, '_blank')}><Eye className="h-4 w-4" /></Button>
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground mb-2">
                {file.size && <span>{(file.size / (1024 * 1024)).toFixed(1)} MB</span>}
              </div>
            </div>
          </div>
        )) : []))}
      </div>
    </div>
  );
}; 