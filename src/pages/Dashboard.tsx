import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useSchedule } from '@/context/ScheduleContext';
import { useAuth } from '@/context/AuthContext';
import Calendar from '@/components/schedule/Calendar';
import ScheduleCard from '@/components/schedule/ScheduleCard';
import FloatingActionButton from '@/components/ui-custom/FloatingActionButton';
import AddScheduleDialog from '@/components/schedule/AddScheduleDialog';
import { 
  BookOpen, 
  FileText, 
  ClipboardCheck, 
  GraduationCap, 
  CalendarDays,
  ChevronRight,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import type { Schedule, ScheduleType } from '@/types';
import { mockDataStore } from '@/lib/db/mockData';

interface DashboardStats {
  totalSchedules: number;
  upcomingClasses: number;
  pendingAssignments: number;
  upcomingExams: number;
  upcomingTests: number;
}

const statConfig = {
  upcomingClasses: { icon: BookOpen, color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'Upcoming Classes' },
  pendingAssignments: { icon: FileText, color: 'text-amber-600', bgColor: 'bg-amber-50', label: 'Pending Assignments' },
  upcomingTests: { icon: ClipboardCheck, color: 'text-purple-600', bgColor: 'bg-purple-50', label: 'Upcoming Tests' },
  upcomingExams: { icon: GraduationCap, color: 'text-red-600', bgColor: 'bg-red-50', label: 'Upcoming Exams' },
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isCoordinator } = useAuth();
  const { schedules, selectedDate, setSelectedDate, getSchedulesByDate } = useSchedule();
  const [stats, setStats] = useState<DashboardStats>({
    totalSchedules: 0,
    upcomingClasses: 0,
    pendingAssignments: 0,
    upcomingExams: 0,
    upcomingTests: 0,
  });
  const [todaysSchedules, setTodaysSchedules] = useState<Schedule[]>([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState<Schedule[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addDialogType, setAddDialogType] = useState<ScheduleType>('class');

  useEffect(() => {
    loadDashboardData();
  }, [schedules]);

  const loadDashboardData = async () => {
    // Load stats
    const dashboardStats = await mockDataStore.getDashboardStats();
    setStats(dashboardStats);

    // Get today's schedules
    const today = new Date();
    const todayScheds = getSchedulesByDate(today);
    setTodaysSchedules(todayScheds);

    // Get upcoming schedules (next 7 days)
    const upcoming: Schedule[] = [];
    for (let i = 1; i <= 7; i++) {
      const date = addDays(today, i);
      const dayScheds = getSchedulesByDate(date);
      upcoming.push(...dayScheds);
    }
    setUpcomingSchedules(upcoming.slice(0, 5)); // Show only first 5
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    navigate('/schedule');
  };

  const handleAddSchedule = (type: ScheduleType) => {
    setAddDialogType(type);
    setIsAddDialogOpen(true);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {isCoordinator ? 'Coordinator' : 'Student'}!
          </h1>
          <p className="text-gray-500 mt-1">
            Here's what's happening with your academic schedule
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Object.entries(statConfig).map(([key, config]) => {
            const Icon = config.icon;
            const value = stats[key as keyof DashboardStats];
            
            return (
              <Card key={key} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{value}</p>
                      <p className="text-xs text-gray-500">{config.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Calendar & Today's Schedule */}
          <div className="lg:col-span-2 space-y-6">
            {/* Calendar */}
            <Calendar 
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
            />

            {/* Today's Schedule */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Today's Schedule
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/schedule')}
                  >
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {todaysSchedules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No schedules for today</p>
                    <p className="text-sm mt-1">Enjoy your free time!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todaysSchedules.map((schedule) => (
                      <ScheduleCard 
                        key={schedule.id} 
                        schedule={schedule}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Upcoming & Quick Actions */}
          <div className="space-y-6">
            {/* Upcoming Schedule */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  Upcoming (Next 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {upcomingSchedules.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No upcoming schedules</p>
                    </div>
                  ) : (
                    <div className="space-y-3 pr-4">
                      {upcomingSchedules.map((schedule) => (
                        <div 
                          key={schedule.id}
                          className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => navigate('/schedule')}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2 h-2 rounded-full ${
                              schedule.type === 'class' ? 'bg-blue-500' :
                              schedule.type === 'assignment' ? 'bg-amber-500' :
                              schedule.type === 'test' ? 'bg-purple-500' :
                              schedule.type === 'exam' ? 'bg-red-500' : 'bg-green-500'
                            }`} />
                            <span className="font-medium text-sm text-gray-900">{schedule.courseCode}</span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-1">{schedule.courseName}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {format(new Date(schedule.startDate), 'MMM dd')} • {schedule.time}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  <ScrollBar />
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Quick Tips</h3>
                <ul className="space-y-2 text-sm text-blue-100">
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-white mt-2 flex-shrink-0" />
                    Click on any date in the calendar to view schedules
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-white mt-2 flex-shrink-0" />
                    Use the + button to add new schedules
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-white mt-2 flex-shrink-0" />
                    Check notifications for updates
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating Action Button (Coordinators only) */}
      {isCoordinator && (
        <FloatingActionButton onAddSchedule={handleAddSchedule} />
      )}

      {/* Add Schedule Dialog */}
      <AddScheduleDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        defaultType={addDialogType}
      />
    </div>
  );
};

export default Dashboard;
