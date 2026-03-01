import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { useSchedule } from '@/context/ScheduleContext';
import type { Schedule } from '@/types';

interface CalendarProps {
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
  compact?: boolean;
}

interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  schedules: Schedule[];
}

const Calendar: React.FC<CalendarProps> = ({ 
  onDateSelect, 
  selectedDate = new Date(),
  compact = false 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<DayCell[]>([]);
  const { schedules, getSchedulesByDate } = useSchedule();

  useEffect(() => {
    generateCalendarDays();
  }, [currentMonth, schedules]);

  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days: DayCell[] = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      const daySchedules = getSchedulesByDate(day);
      days.push({
        date: new Date(day),
        isCurrentMonth: isSameMonth(day, monthStart),
        isToday: isSameDay(day, new Date()),
        schedules: daySchedules,
      });
      day = addDays(day, 1);
    }

    setCalendarDays(days);
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect?.(today);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getScheduleIndicators = (dayCell: DayCell) => {
    const types = new Set(dayCell.schedules.map(s => s.type));
    const indicators: { color: string; type: string }[] = [];
    
    const typeColors: Record<string, string> = {
      class: 'bg-blue-500',
      assignment: 'bg-amber-500',
      test: 'bg-purple-500',
      exam: 'bg-red-500',
      activity: 'bg-green-500',
    };

    types.forEach(type => {
      indicators.push({ color: typeColors[type] || 'bg-gray-400', type });
    });

    return indicators;
  };

  return (
    <div className={cn("bg-white rounded-xl shadow-sm border", compact ? "p-3" : "p-4")}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className={cn("font-semibold text-gray-900", compact ? "text-sm" : "text-lg")}>
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-1">
          {!compact && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={goToToday}
              className="text-xs h-7"
            >
              Today
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={prevMonth}
            className={cn("h-7 w-7", compact && "h-6 w-6")}
          >
            <ChevronLeft className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={nextMonth}
            className={cn("h-7 w-7", compact && "h-6 w-6")}
          >
            <ChevronRight className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
          </Button>
        </div>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((day) => (
          <div 
            key={day} 
            className={cn(
              "text-center font-medium text-gray-500",
              compact ? "text-[10px]" : "text-xs"
            )}
          >
            {compact ? day.charAt(0) : day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((dayCell, index) => {
          const isSelected = isSameDay(dayCell.date, selectedDate);
          const indicators = getScheduleIndicators(dayCell);

          return (
            <button
              key={index}
              onClick={() => onDateSelect?.(dayCell.date)}
              className={cn(
                "relative rounded-lg transition-all duration-200 flex flex-col items-center justify-center",
                compact ? "h-8 text-[10px]" : "h-10 text-sm",
                !dayCell.isCurrentMonth && "text-gray-300",
                dayCell.isCurrentMonth && "text-gray-700 hover:bg-gray-100",
                dayCell.isToday && "font-bold text-blue-600",
                isSelected && "bg-blue-600 text-white hover:bg-blue-700",
                isSelected && dayCell.isToday && "text-white"
              )}
            >
              <span>{format(dayCell.date, 'd')}</span>
              
              {/* Schedule Indicators */}
              {indicators.length > 0 && (
                <div className={cn(
                  "flex gap-0.5 mt-0.5",
                  isSelected && "opacity-80"
                )}>
                  {indicators.slice(0, 3).map((indicator, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-full",
                        indicator.color,
                        compact ? "w-1 h-1" : "w-1.5 h-1.5"
                      )}
                      title={indicator.type}
                    />
                  ))}
                  {indicators.length > 3 && (
                    <span className={cn(
                      "text-gray-400",
                      compact ? "text-[6px]" : "text-[8px]"
                    )}>
                      +{indicators.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      {!compact && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-600">Class</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-gray-600">Assignment</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-gray-600">Test</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-gray-600">Exam</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-600">Activity</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
