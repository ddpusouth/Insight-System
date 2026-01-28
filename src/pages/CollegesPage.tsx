import React, { useMemo } from 'react';
import { API_BASE_URL } from '@/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Building2,
  MapPin,
  Users,
  Phone,
  Mail,
  Search,
  Eye,
  Edit,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export const CollegesPage: React.FC = () => {
  const { user } = useAuth();
  const [colleges, setColleges] = React.useState<any[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  const fetchColleges = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/colleges/all`);
      const data = await res.json();
      setColleges(data.colleges || []);
    } catch (error) {
      console.error('Error fetching colleges:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchColleges();
  }, []);

  const handleRefresh = async () => {
    await fetchColleges();
  };

  // Debug logs
  console.log('All colleges:', colleges);

  const categories = useMemo(() => {
    const cats = new Set(colleges.map(c => c.Category || c.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [colleges]);

  const filteredColleges = colleges.filter(college => {
    const term = searchTerm.trim().toLowerCase();
    const collegeCategory = college.Category || college.category;

    // Category Filter
    if (selectedCategory !== 'all' && collegeCategory !== selectedCategory) {
      return false;
    }

    if (!term) return true; // Show all if search is empty
    const matchesSearch =
      (college['College Name'] || '').toLowerCase().includes(term) ||
      (college['College Code'] || '').toLowerCase().includes(term) ||
      (college['Address'] || '').toLowerCase().includes(term);
    return matchesSearch;
  });

  console.log('Filtered colleges:', filteredColleges);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Colleges Management</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor all colleges</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <Button onClick={handleRefresh} variant="outline" size="sm" className="flex items-center gap-2 w-full sm:w-auto justify-center">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search colleges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat: any) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="max-w-7xl mx-auto bg-white shadow rounded-lg p-6">
          <table className="min-w-full divide-y divide-border rounded-lg overflow-hidden">
            <thead className="bg-muted sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">College Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border">
              {filteredColleges.map((college, idx) => (
                <tr key={college._id} className={cn(
                  "hover:bg-muted/60 transition-colors",
                  idx % 2 === 0 ? "bg-muted/10" : "bg-white"
                )}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-foreground">{college['College Name']}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => navigate(`/colleges/${college['College Code']}/view`)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {filteredColleges.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No colleges found</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
};