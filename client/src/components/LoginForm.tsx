import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogInIcon, AlertCircleIcon } from 'lucide-react';

interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<void>;
  isLoading: boolean;
}

export function LoginForm({ onLogin, isLoading }: LoginFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      await onLogin(formData.username, formData.password);
    } catch (error) {
      console.error('Login form error:', error);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Demo Credentials Alert */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircleIcon className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 text-sm">
          <strong>Demo Mode:</strong> The backend handlers are currently stubs. 
          Login will show "not yet implemented" message.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="login-username">Username</Label>
        <Input
          id="login-username"
          type="text"
          value={formData.username}
          onChange={handleChange('username')}
          placeholder="Enter your username"
          className={errors.username ? 'border-red-500' : ''}
          disabled={isLoading}
        />
        {errors.username && (
          <p className="text-red-500 text-sm">{errors.username}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          value={formData.password}
          onChange={handleChange('password')}
          placeholder="Enter your password"
          className={errors.password ? 'border-red-500' : ''}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password}</p>
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
            <span>Signing In...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <LogInIcon className="h-4 w-4" />
            <span>Sign In</span>
          </div>
        )}
      </Button>

      {/* Sample Credentials */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Sample Test Credentials:</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div><strong>Admin:</strong> admin / password123</div>
          <div><strong>Pendaftar:</strong> user1 / password123</div>
        </div>
      </div>
    </form>
  );
}