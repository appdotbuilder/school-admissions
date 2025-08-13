import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  X, 
  Trash2, 
  CheckCheck,
  AlertCircle,
  Info,
  CheckCircle,
  Clock
} from 'lucide-react';

import { trpc } from '@/utils/trpc';
import type { Notification } from '../../../server/src/schema';

interface NotificationCenterProps {
  userId: number;
  onClose: () => void;
}

export function NotificationCenter({ userId, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const notificationsData = await trpc.getNotificationsByUser.query({ userId });
      const unreadCountData = await trpc.getUnreadNotificationCount.query({ userId });
      
      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await trpc.markNotificationAsRead.mutate({ notificationId });
      setNotifications(prev => 
        prev.map((notif: Notification) => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await trpc.markAllNotificationsAsRead.mutate({ userId });
      setNotifications(prev => 
        prev.map((notif: Notification) => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    try {
      await trpc.deleteNotification.mutate({ notificationId });
      setNotifications(prev => 
        prev.filter((notif: Notification) => notif.id !== notificationId)
      );
      // Update unread count if the deleted notification was unread
      const deletedNotif = notifications.find(n => n.id === notificationId);
      if (deletedNotif && !deletedNotif.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (title: string) => {
    if (title.toLowerCase().includes('status')) return CheckCircle;
    if (title.toLowerCase().includes('document')) return Info;
    if (title.toLowerCase().includes('deadline') || title.toLowerCase().includes('reminder')) return Clock;
    if (title.toLowerCase().includes('error') || title.toLowerCase().includes('issue')) return AlertCircle;
    return Bell;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-96">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </SheetTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SheetDescription>
            Stay updated on your application status and important announcements
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {/* Action Buttons */}
          {notifications.length > 0 && (
            <div className="flex space-x-2 mb-4">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
              )}
            </div>
          )}

          {/* Notifications List */}
          <ScrollArea className="h-[calc(100vh-200px)]">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No notifications yet</p>
                <p className="text-sm text-gray-400">
                  You'll receive updates about your application here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification: Notification) => {
                  const Icon = getNotificationIcon(notification.title);
                  
                  return (
                    <Card 
                      key={notification.id} 
                      className={`cursor-pointer transition-colors ${
                        !notification.is_read 
                          ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 p-2 rounded-full ${
                            !notification.is_read 
                              ? 'bg-blue-100' 
                              : 'bg-gray-100'
                          }`}>
                            <Icon className={`h-4 w-4 ${
                              !notification.is_read 
                                ? 'text-blue-600' 
                                : 'text-gray-500'
                            }`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h4 className={`font-medium text-sm ${
                                !notification.is_read 
                                  ? 'text-blue-900' 
                                  : 'text-gray-900'
                              }`}>
                                {notification.title}
                                {!notification.is_read && (
                                  <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full inline-block"></span>
                                )}
                              </h4>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNotification(notification.id);
                                }}
                                className="flex-shrink-0 h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <p className={`text-sm mt-1 ${
                              !notification.is_read 
                                ? 'text-blue-700' 
                                : 'text-gray-600'
                            }`}>
                              {notification.message}
                            </p>
                            
                            <p className="text-xs text-gray-400 mt-2">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}