import type { User, Schedule, Notification, UserRole, ScheduleType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Mock Data Store
class MockDataStore {
  users: User[] = [
    {
      id: 'coordinator-1',
      email: 'admin@gmail.com',
      name: 'Admin Coordinator',
      role: 'coordinator' as UserRole,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      department: 'Computer Science',
      createdAt: new Date('2024-01-01'),
    },
  ];

  schedules: Schedule[] = [
    {
      id: uuidv4(),
      type: 'class' as ScheduleType,
      courseName: 'Introduction to Programming',
      courseCode: 'CSC 101',
      description: 'Basic programming concepts using Python',
      startDate: new Date(),
      time: '09:00 AM - 11:00 AM',
      venue: 'Lecture Hall A',
      isOnline: false,
      createdBy: 'coordinator-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'upcoming',
    },
    {
      id: uuidv4(),
      type: 'class' as ScheduleType,
      courseName: 'Data Structures',
      courseCode: 'CSC 201',
      description: 'Advanced data structures and algorithms',
      startDate: new Date(),
      time: '02:00 PM - 04:00 PM',
      venue: 'Online',
      isOnline: true,
      meetLink: 'https://meet.google.com/abc-defg-hij',
      createdBy: 'coordinator-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'upcoming',
    },
    {
      id: uuidv4(),
      type: 'assignment' as ScheduleType,
      courseName: 'Database Systems',
      courseCode: 'CSC 301',
      description: 'Design a relational database for a library system',
      startDate: new Date(),
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      time: '11:59 PM',
      venue: 'Online Submission',
      isOnline: true,
      createdBy: 'coordinator-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'upcoming',
      attachments: [],
    },
    {
      id: uuidv4(),
      type: 'test' as ScheduleType,
      courseName: 'Software Engineering',
      courseCode: 'CSC 401',
      description: 'Mid-semester test covering chapters 1-5',
      startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      time: '10:00 AM - 12:00 PM',
      venue: 'Exam Hall B',
      isOnline: false,
      createdBy: 'coordinator-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'upcoming',
    },
    {
      id: uuidv4(),
      type: 'exam' as ScheduleType,
      courseName: 'Computer Networks',
      courseCode: 'CSC 501',
      description: 'Final examination',
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      time: '09:00 AM - 12:00 PM',
      venue: 'Main Auditorium',
      isOnline: false,
      createdBy: 'coordinator-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'upcoming',
    },
  ];

  notifications: Notification[] = [
    {
      id: uuidv4(),
      title: 'New Class Added',
      message: 'Introduction to Programming class has been scheduled',
      type: 'class',
      scheduleId: '',
      read: false,
      createdAt: new Date(),
      userId: '',
    },
    {
      id: uuidv4(),
      title: 'Assignment Due Soon',
      message: 'Database Systems assignment deadline is approaching',
      type: 'assignment',
      scheduleId: '',
      read: false,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      userId: '',
    },
  ];

  // User operations
  async getUserByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) || null;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const newUser: User = {
      ...userData,
      id: uuidv4(),
      createdAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  // Schedule operations
  async getAllSchedules(): Promise<Schedule[]> {
    return [...this.schedules].sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }

  async getSchedulesByDate(date: Date): Promise<Schedule[]> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return this.schedules.filter(s => {
      const scheduleDate = new Date(s.startDate);
      scheduleDate.setHours(0, 0, 0, 0);
      return scheduleDate.getTime() === targetDate.getTime();
    });
  }

  async getSchedulesByType(type: ScheduleType): Promise<Schedule[]> {
    return this.schedules.filter(s => s.type === type);
  }

  async getScheduleById(id: string): Promise<Schedule | null> {
    return this.schedules.find(s => s.id === id) || null;
  }

  async createSchedule(scheduleData: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Schedule> {
    const newSchedule: Schedule = {
      ...scheduleData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.schedules.push(newSchedule);
    return newSchedule;
  }

  async updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule | null> {
    const index = this.schedules.findIndex(s => s.id === id);
    if (index === -1) return null;
    
    this.schedules[index] = {
      ...this.schedules[index],
      ...updates,
      updatedAt: new Date(),
    };
    return this.schedules[index];
  }

  async deleteSchedule(id: string): Promise<boolean> {
    const index = this.schedules.findIndex(s => s.id === id);
    if (index === -1) return false;
    
    this.schedules.splice(index, 1);
    return true;
  }

  // Notification operations
  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    return this.notifications
      .filter(n => n.userId === userId || n.userId === '')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getUnreadNotificationsCount(userId: string): Promise<number> {
    return this.notifications.filter(n => (n.userId === userId || n.userId === '') && !n.read).length;
  }

  async createNotification(notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const newNotification: Notification = {
      ...notificationData,
      id: uuidv4(),
      createdAt: new Date(),
    };
    this.notifications.push(newNotification);
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const notification = this.notifications.find(n => n.id === id);
    if (!notification) return false;
    
    notification.read = true;
    return true;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    this.notifications.forEach(n => {
      if (n.userId === userId || n.userId === '') {
        n.read = true;
      }
    });
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalSchedules: number;
    upcomingClasses: number;
    pendingAssignments: number;
    upcomingExams: number;
    upcomingTests: number;
  }> {
    const now = new Date();
    return {
      totalSchedules: this.schedules.length,
      upcomingClasses: this.schedules.filter(s => s.type === 'class' && new Date(s.startDate) >= now).length,
      pendingAssignments: this.schedules.filter(s => s.type === 'assignment' && (!s.deadline || new Date(s.deadline) >= now)).length,
      upcomingExams: this.schedules.filter(s => s.type === 'exam' && new Date(s.startDate) >= now).length,
      upcomingTests: this.schedules.filter(s => s.type === 'test' && new Date(s.startDate) >= now).length,
    };
  }
}

export const mockDataStore = new MockDataStore();
export default mockDataStore;
