import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlusIcon, AlertCircleIcon, CrownIcon, ClipboardIcon } from 'lucide-react';
// Type-only import for the role type
import type { UserRole } from '../../../server/src/schema';

interface RegisterFormProps {
  onRegister: (username: string, email: string, password: string, role: 'pendaftar' | 'admin') => Promise<void>;
  isLoading: boolean;
}

export function RegisterForm({ onRegister, isLoading }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'pendaftar' as UserRole
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 50) {
      newErrors.username = 'Username must be less than 50 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      await onRegister(formData.username, formData.email, formData.password, formData.role);
    } catch (error) {
      console.error('Registration form error:', error);
    }
  };

  const handleChange = (field: keyof typeof formData) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    };

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({ ...prev, role: role as UserRole }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Demo Alert */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircleIcon className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 text-sm">
          <strong>Demo Mode:</strong> Registration will show "not yet implemented" message 
          as backend handlers are currently stubs.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="register-username">Username</Label>
        <Input
          id="register-username"
          type="text"
          value={formData.username}
          onChange={handleChange('username')}
          placeholder="Choose a username (3-50 characters)"
          className={errors.username ? 'border-red-500' : ''}
          disabled={isLoading}
        />
        {errors.username && (
          <p className="text-red-500 text-sm">{errors.username}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">Email Address</Label>
        <Input
          id="register-email"
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          placeholder="your.email@example.com"
          className={errors.email ? 'border-red-500' : ''}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-role">Account Type</Label>
        <Select value={formData.role} onValueChange={handleRoleChange} disabled={isLoading}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendaftar">
              <div className="flex items-center space-x-2">
                <ClipboardIcon className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="font-medium">Pendaftar</div>
                  <div className="text-xs text-gray-500">Regular user account</div>
                </div>
              </div>
            </SelectItem>
            <SelectItem value="admin">
              <div className="flex items-center space-x-2">
                <CrownIcon className="h-4 w-4 text-amber-500" />
                <div>
                  <div className="font-medium">Administrator</div>
                  <div className="text-xs text-gray-500">Full system access</div>
                </div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <Input
          id="register-password"
          type="password"
          value={formData.password}
          onChange={handleChange('password')}
          placeholder="Enter password (min. 6 characters)"
          className={errors.password ? 'border-red-500' : ''}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-confirm-password">Confirm Password</Label>
        <Input
          id="register-confirm-password"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange('confirmPassword')}
          placeholder="Re-enter your password"
          className={errors.confirmPassword ? 'border-red-500' : ''}
          disabled={isLoading}
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading}
        size="lg"
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Creating Account...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <UserPlusIcon className="h-4 w-4" />
            <span>Create Account</span>
          </div>
        )}
      </Button>

      {/* Role Information */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Account Types:</h4>
        <div className="text-xs text-gray-600 space-y-2">
          <div className="flex items-start space-x-2">
            <ClipboardIcon className="h-3 w-3 text-blue-500 mt-0.5" />
            <div>
              <strong>Pendaftar:</strong> Standard user with access to personal dashboard and profile management.
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <CrownIcon className="h-3 w-3 text-amber-500 mt-0.5" />
            <div>
              <strong>Administrator:</strong> Full access including user management and system administration.
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}