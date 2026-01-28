import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { toast } from 'sonner';
import { useEffect } from 'react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const username = user?.username;
  const [college, setCollege] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [reenterPassword, setReenterPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    fetch(`/api/colleges/${username}`)
      .then(res => res.json())
      .then(data => setCollege(data))
      .catch(() => setError('Failed to fetch college details'))
      .finally(() => setLoading(false));
  }, [username]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setSuccess('');
    setError('');

    // Validate passwords
    if (newPassword !== reenterPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/colleges/${username}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response. Please check if the server is running.');
      }

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update password');
      }

      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setReenterPassword('');
    } catch (err: any) {
      console.error('Password update error:', err);
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (!username) return <div className="text-center mt-10">Not authorized</div>;
  if (loading && !college) return <div>Loading...</div>;
  if (!college) return <div>No college details found.</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Password Change Form */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handlePasswordChange}>
        <div>
              <label className="block text-sm font-medium mb-1">Current Password</label>
              <Input 
                type="password" 
                value={currentPassword} 
                onChange={(e) => setCurrentPassword(e.target.value)} 
                required 
                placeholder="Enter your current password"
              />
        </div>
        <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <Input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
                placeholder="Enter new password"
              />
        </div>
        <div>
              <label className="block text-sm font-medium mb-1">Re-enter New Password</label>
              <Input 
                type="password" 
                value={reenterPassword} 
                onChange={(e) => setReenterPassword(e.target.value)} 
                required 
                placeholder="Re-enter new password"
              />
        </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Updating Password...' : 'Update Password'}
            </Button>
            {passwordError && <p className="text-red-600 text-sm mt-2">{passwordError}</p>}
        {success && <p className="text-green-600 text-sm mt-2">{success}</p>}
      </form>
        </CardContent>
      </Card>
    </div>
  );
};