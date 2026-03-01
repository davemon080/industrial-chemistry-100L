import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useSchedule } from '@/context/ScheduleContext';
import { useAuth } from '@/context/AuthContext';
import ScheduleCard from '@/components/schedule/ScheduleCard';
import FloatingActionButton from '@/components/ui-custom/FloatingActionButton';
import AddScheduleDialog from '@/components/schedule/AddScheduleDialog';
import { 
  format, 
  addDays, 
  startOfWeek, 
  isSameDay,
  isToday,
  addWeeks,
  subWeeks
} from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import type { Schedule, ScheduleType } from '@/types';
import { cn } from '@/lib/utils';

const SchedulePage: React.FC = () => {
  const { isCoordinator } = useAuth();
  const { schedules, getSchedulesByDate, getSchedulesByType } = useSchedule();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [displayedSchedules, setDisplayedSchedules] = useState<Schedule[]>([]);
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date()));
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addDialogType, setAddDialogType] = useState<ScheduleType>('class');
  const [activeTab, setActiveTab] = useState('all');

  // Generate week days
  useEffect(() => {
    const days: Date[] = [];
    const start = currentWeekStart;
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    setWeekDays(days);
  }, [currentWeekStart]);

  // Update displayed schedules when date or tab changes
  useEffect(() => {
    let filtered: Schedule[];
    
    if (activeTab === 'all') {
      filtered = getSchedulesByDate(selectedDate);
    } else {
      filtered = getSchedulesByType(activeTab as ScheduleType).filter(s => {
        const scheduleDate = new Date(s.startDate);
        scheduleDate.setHours(0, 0, 0, 0);
        const selected = new Date(selectedDate);
        selected.setHours(0, 0, 0, 0);
        
        // Also check deadline for assignments
        if (s.deadline) {
          const deadlineDate = new Date(s.deadline);
          deadlineDate.setHours(0, 0, 0, 0);
          return scheduleDate.getTime() === selected.getTime() || 
                 deadlineDate.getTime() === selected.getTime();
        }
        
        return scheduleDate.getTime() === selected.getTime();
      });
    }
    
    setDisplayedSchedules(filtered);
  }, [selectedDate, activeTab, schedules]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handlePrevWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentWeekStart(startOfWeek(today));
    setSelectedDate(today);
  };

  const handleAddSchedule = (type: ScheduleType) => {
    setAddDialogType(type);
    setIsAddDialogOpen(true);
  };

  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'class', label: 'Classes' },
    { value: 'assignment', label: 'Assignments' },
    { value: 'test', label: 'Tests' },
    { value: 'exam', label: 'Exams' },
    { value: 'activity', label: 'Activities' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
            <p className="text-gray-500 mt-1">
              {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleGoToToday}
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            Today
          </Button>
        </div>

        {/* Sliding Calendar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Button variant="ghost" size="icon" onClick={handlePrevWeek}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="font-medium text-gray-700">
                {format(currentWeekStart, 'MMMM yyyy')}
              </span>
              <Button variant="ghost" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex justify-between gap-1">
              {weekDays.map((day, index) => {
                const isSelected = isSameDay(day, selectedDate);
                const dayIsToday = isToday(day);
                const daySchedules = getSchedulesByDate(day);
                
                return (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(day)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 flex-1 min-w-0",
                      isSelected 
                        ? "bg-blue-600 text-white shadow-lg" 
                        : "hover:bg-gray-100 text-gray-700",
                      dayIsToday && !isSelected && "bg-blue-50 text-blue-600 font-semibold"
                    )}
                  >
                    <span className={cn(
                      "text-xs mb-1",
                      isSelected ? "text-blue-100" : "text-gray-500"
                    )}>
                      {format(day, 'EEE')}
                    </span>
                    <span className={cn(
                      "text-lg font-semibold w-8 h-8 flex items-center justify-center rounded-full",
                      dayIsToday && !isSelected && "bg-blue-600 text-white"
                    )}>
                      {format(day, 'd')}
                    </span>
                    
                    {/* Schedule indicators */}
                    {daySchedules.length > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {daySchedules.slice(0, 3).map((s, i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-1 h-1 rounded-full",
                              isSelected ? "bg-white/70" : 
                              s.type === 'class' ? 'bg-blue-500' :
                              s.type === 'assignment' ? 'bg-amber-500' :
                              s.type === 'test' ? 'bg-purple-500' :
                              s.type === 'exam' ? 'bg-red-500' : 'bg-green-500'
                            )}
                          />
                        ))}
                        {daySchedules.length > 3 && (
                          <span className={cn(
                            "text-[8px]",
                            isSelected ? "text-white/70" : "text-gray-400"
                          )}>
                            +
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tabs and Schedules */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <ScrollArea className="w-full whitespace-nowrap mb-4">
            <TabsList className="inline-flex w-auto">
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value}
                  className="px-4"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value={activeTab} className="mt-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {format(selectedDate, 'EEEE, MMMM dd')}
                  <span className="text-gray-400 font-normal ml-2">
                    ({displayedSchedules.length} items)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {displayedSchedules.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <CalendarDays className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No schedules for this day</p>
                    <p className="text-sm mt-1">
                      {isCoordinator 
                        ? 'Click the + button to add a schedule' 
                        : 'Check back later for updates'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayedSchedules.map((schedule) => (
                      <ScheduleCard 
                        key={schedule.id} 
                        schedule={schedule}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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

export default SchedulePage;
