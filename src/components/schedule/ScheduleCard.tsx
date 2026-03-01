import React from 'react';
import type { Schedule } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  FileText, 
  ClipboardCheck, 
  GraduationCap, 
  CalendarDays,
  MapPin,
  Clock,
  Video,
  ExternalLink,
  Upload,
  MoreVertical,
  Trash2,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ScheduleCardProps {
  schedule: Schedule;
  onEdit?: (schedule: Schedule) => void;
  onDelete?: (id: string) => void;
  onUpload?: (schedule: Schedule) => void;
}

const typeConfig = {
  class: {
    icon: BookOpen,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    label: 'Class',
  },
  assignment: {
    icon: FileText,
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    label: 'Assignment',
  },
  test: {
    icon: ClipboardCheck,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    label: 'Test',
  },
  exam: {
    icon: GraduationCap,
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    label: 'Exam',
  },
  activity: {
    icon: CalendarDays,
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    label: 'Activity',
  },
};

const ScheduleCard: React.FC<ScheduleCardProps> = ({ 
  schedule, 
  onEdit, 
  onDelete,
  onUpload 
}) => {
  const { isCoordinator } = useAuth();
  const config = typeConfig[schedule.type];
  const Icon = config.icon;

  const handleJoinMeeting = () => {
    if (schedule.meetLink) {
      window.open(schedule.meetLink, '_blank');
    }
  };

  const isAssignment = schedule.type === 'assignment';
  const isOnlineClass = schedule.type === 'class' && schedule.isOnline;

  return (
    <Card className={`relative overflow-hidden border-l-4 ${config.borderColor} hover:shadow-lg transition-shadow duration-200`}>
      {/* Type Indicator */}
      <div className={`absolute top-0 left-0 w-1 h-full ${config.color}`} />
      
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <Icon className={`w-5 h-5 ${config.textColor}`} />
            </div>
            <div>
              <Badge variant="secondary" className={`${config.bgColor} ${config.textColor} text-xs mb-1`}>
                {config.label}
              </Badge>
              <h3 className="font-semibold text-gray-900 leading-tight">{schedule.courseName}</h3>
              <p className="text-sm text-gray-500">{schedule.courseCode}</p>
            </div>
          </div>
          
          {isCoordinator && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(schedule)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete?.(schedule.id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-4 pb-4">
        {schedule.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{schedule.description}</p>
        )}

        <div className="space-y-2">
          {/* Time */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{schedule.time}</span>
          </div>

          {/* Venue */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{schedule.venue}</span>
            {schedule.isOnline && (
              <Badge variant="outline" className="text-xs ml-1">
                <Video className="w-3 h-3 mr-1" />
                Online
              </Badge>
            )}
          </div>

          {/* Deadline for assignments */}
          {isAssignment && schedule.deadline && (
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="w-4 h-4 text-gray-400" />
              <span className="text-amber-600 font-medium">
                Due: {format(new Date(schedule.deadline), 'MMM dd, yyyy')}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          {/* Join Class Button for Online Classes */}
          {isOnlineClass && schedule.meetLink && (
            <Button 
              onClick={handleJoinMeeting}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Video className="w-4 h-4 mr-2" />
              Join Class
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          )}

          {/* Upload Button for Assignments */}
          {isAssignment && (
            <Button 
              onClick={() => onUpload?.(schedule)}
              variant="outline"
              className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
              size="sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          )}
        </div>

        {/* Attachments Preview */}
        {schedule.attachments && schedule.attachments.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Attachments:</p>
            <div className="flex flex-wrap gap-2">
              {schedule.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" />
                  {attachment.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScheduleCard;
