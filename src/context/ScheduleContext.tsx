import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Schedule, ScheduleType, ScheduleFormData, Notification } from '@/types';
import { mockDataStore } from '@/lib/db/mockData';
import { useAuth } from './AuthContext';

interface ScheduleContextType {
  schedules: Schedule[];
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  getSchedulesByDate: (date: Date) => Schedule[];
  getSchedulesByType: (type: ScheduleType) => Schedule[];
  addSchedule: (data: ScheduleFormData) => Promise<{ success: boolean; error?: string }>;
  updateSchedule: (id: string, data: Partial<ScheduleFormData>) => Promise<{ success: boolean; error?: string }>;
  deleteSchedule: (id: string) => Promise<{ success: boolean; error?: string }>;
  refreshSchedules: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { user, isCoordinator } = useAuth();

  const refreshSchedules = async () => {
    try {
      const allSchedules = await mockDataStore.getAllSchedules();
      setSchedules(allSchedules);
    } catch (error) {
      console.error('Error refreshing schedules:', error);
    }
  };

  const refreshNotifications = async () => {
    if (!user) return;
    try {
      const userNotifications = await mockDataStore.getNotificationsByUserId(user.id);
      const count = await mockDataStore.getUnreadNotificationsCount(user.id);
      setNotifications(userNotifications);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await refreshSchedules();
      if (user) {
        await refreshNotifications();
      }
      setIsLoading(false);
    };

    loadData();
  }, [user]);

  const getSchedulesByDate = (date: Date): Schedule[] => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return schedules.filter(s => {
      const scheduleDate = new Date(s.startDate);
      scheduleDate.setHours(0, 0, 0, 0);
      
      // Also check deadline for assignments
      if (s.deadline) {
        const deadlineDate = new Date(s.deadline);
        deadlineDate.setHours(0, 0, 0, 0);
        return scheduleDate.getTime() === targetDate.getTime() || 
               deadlineDate.getTime() === targetDate.getTime();
      }
      
      return scheduleDate.getTime() === targetDate.getTime();
    });
  };

  const getSchedulesByType = (type: ScheduleType): Schedule[] => {
    return schedules.filter(s => s.type === type);
  };

  const addSchedule = async (data: ScheduleFormData): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isCoordinator) {
      return { success: false, error: 'Only coordinators can add schedules' };
    }

    try {
      const newSchedule = await mockDataStore.createSchedule({
        type: data.type,
        courseName: data.courseName,
        courseCode: data.courseCode,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        time: data.time,
        venue: data.venue,
        isOnline: data.isOnline,
        meetLink: data.meetLink,
        createdBy: user.id,
        status: 'upcoming',
      });

      // Create notification for new schedule
      await mockDataStore.createNotification({
        title: `New ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Added`,
        message: `${data.courseName} (${data.courseCode}) has been scheduled`,
        type: data.type,
        scheduleId: newSchedule.id,
        read: false,
        userId: '', // Empty means for all users
      });

      await refreshSchedules();
      await refreshNotifications();
      return { success: true };
    } catch (error) {
      console.error('Error adding schedule:', error);
      return { success: false, error: 'Failed to add schedule' };
    }
  };

  const updateSchedule = async (id: string, data: Partial<ScheduleFormData>): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isCoordinator) {
      return { success: false, error: 'Only coordinators can update schedules' };
    }

    try {
      const updates: Partial<Schedule> = {};
      
      if (data.type) updates.type = data.type;
      if (data.courseName) updates.courseName = data.courseName;
      if (data.courseCode) updates.courseCode = data.courseCode;
      if (data.description !== undefined) updates.description = data.description;
      if (data.startDate) updates.startDate = new Date(data.startDate);
      if (data.endDate !== undefined) updates.endDate = data.endDate ? new Date(data.endDate) : undefined;
      if (data.deadline !== undefined) updates.deadline = data.deadline ? new Date(data.deadline) : undefined;
      if (data.time) updates.time = data.time;
      if (data.venue) updates.venue = data.venue;
      if (data.isOnline !== undefined) updates.isOnline = data.isOnline;
      if (data.meetLink !== undefined) updates.meetLink = data.meetLink;

      await mockDataStore.updateSchedule(id, updates);
      await refreshSchedules();
      return { success: true };
    } catch (error) {
      console.error('Error updating schedule:', error);
      return { success: false, error: 'Failed to update schedule' };
    }
  };

  const deleteSchedule = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isCoordinator) {
      return { success: false, error: 'Only coordinators can delete schedules' };
    }

    try {
      await mockDataStore.deleteSchedule(id);
      await refreshSchedules();
      return { success: true };
    } catch (error) {
      console.error('Error deleting schedule:', error);
      return { success: false, error: 'Failed to delete schedule' };
    }
  };

  const markNotificationAsRead = async (id: string) => {
    await mockDataStore.markNotificationAsRead(id);
    await refreshNotifications();
  };

  const markAllNotificationsAsRead = async () => {
    if (!user) return;
    await mockDataStore.markAllNotificationsAsRead(user.id);
    await refreshNotifications();
  };

  const value: ScheduleContextType = {
    schedules,
    notifications,
    unreadCount,
    isLoading,
    selectedDate,
    setSelectedDate,
    getSchedulesByDate,
    getSchedulesByType,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    refreshSchedules,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    refreshNotifications,
  };

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = (): ScheduleContextType => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};

export default ScheduleContext;
