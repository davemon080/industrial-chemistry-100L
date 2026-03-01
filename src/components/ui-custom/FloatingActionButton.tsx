import React, { useState } from 'react';
import { Plus, X, BookOpen, FileText, ClipboardCheck, GraduationCap, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ScheduleType } from '@/types';

interface FloatingActionButtonProps {
  onAddSchedule: (type: ScheduleType) => void;
}

interface MenuItem {
  type: ScheduleType;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const menuItems: MenuItem[] = [
  {
    type: 'class',
    label: 'Add Class',
    icon: BookOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    type: 'assignment',
    label: 'Add Assignment',
    icon: FileText,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  {
    type: 'test',
    label: 'Add Test',
    icon: ClipboardCheck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    type: 'exam',
    label: 'Add Exam',
    icon: GraduationCap,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  {
    type: 'activity',
    label: 'Add Activity',
    icon: CalendarDays,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
];

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onAddSchedule }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleItemClick = (type: ScheduleType) => {
    onAddSchedule(type);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Menu Items */}
      <div className={cn(
        "absolute bottom-16 right-0 flex flex-col items-end gap-3 transition-all duration-300",
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              onClick={() => handleItemClick(item.type)}
              className={cn(
                "flex items-center gap-3 group transition-all duration-200",
                isOpen ? "translate-x-0" : "translate-x-4"
              )}
              style={{
                transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
              }}
            >
              {/* Label */}
              <span className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm",
                "bg-white text-gray-700 whitespace-nowrap",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                isOpen && "opacity-100"
              )}>
                {item.label}
              </span>
              
              {/* Icon Button */}
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shadow-lg",
                "transform transition-transform duration-200 hover:scale-110",
                item.bgColor
              )}>
                <Icon className={cn("w-5 h-5", item.color)} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Main FAB Button */}
      <Button
        onClick={toggleMenu}
        size="lg"
        className={cn(
          "w-14 h-14 rounded-full shadow-xl transition-all duration-300",
          "bg-blue-600 hover:bg-blue-700 hover:scale-105",
          isOpen && "bg-gray-800 hover:bg-gray-900 rotate-45"
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default FloatingActionButton;
