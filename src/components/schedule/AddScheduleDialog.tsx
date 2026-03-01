import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { ScheduleType, ScheduleFormData } from '@/types';
import { useSchedule } from '@/context/ScheduleContext';
import { BookOpen, FileText, ClipboardCheck, GraduationCap, CalendarDays } from 'lucide-react';

interface AddScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: ScheduleType;
}

const typeConfig: Record<ScheduleType, { icon: React.ElementType; label: string; color: string }> = {
  class: { icon: BookOpen, label: 'Class', color: 'text-blue-600' },
  assignment: { icon: FileText, label: 'Assignment', color: 'text-amber-600' },
  test: { icon: ClipboardCheck, label: 'Test', color: 'text-purple-600' },
  exam: { icon: GraduationCap, label: 'Exam', color: 'text-red-600' },
  activity: { icon: CalendarDays, label: 'Activity', color: 'text-green-600' },
};

const AddScheduleDialog: React.FC<AddScheduleDialogProps> = ({ 
  isOpen, 
  onClose, 
  defaultType = 'class' 
}) => {
  const { addSchedule } = useSchedule();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ScheduleFormData>({
    type: defaultType,
    courseName: '',
    courseCode: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    time: '',
    venue: '',
    isOnline: false,
    meetLink: '',
  });

  const handleTypeChange = (type: ScheduleType) => {
    setFormData(prev => ({ ...prev, type }));
  };

  const handleInputChange = (field: keyof ScheduleFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await addSchedule(formData);
    
    if (result.success) {
      // Reset form
      setFormData({
        type: defaultType,
        courseName: '',
        courseCode: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        time: '',
        venue: '',
        isOnline: false,
        meetLink: '',
      });
      onClose();
    }
    
    setIsSubmitting(false);
  };

  const TypeIcon = typeConfig[formData.type].icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className={typeConfig[formData.type].color} />
            Add New {typeConfig[formData.type].label}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selection */}
          <div className="space-y-2">
            <Label>Schedule Type</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(typeConfig) as ScheduleType[]).map((type) => {
                const { icon: Icon, label, color } = typeConfig[type];
                const isSelected = formData.type === type;
                
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeChange(type)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isSelected 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : color}`} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Course Name */}
          <div className="space-y-2">
            <Label htmlFor="courseName">Course Name *</Label>
            <Input
              id="courseName"
              value={formData.courseName}
              onChange={(e) => handleInputChange('courseName', e.target.value)}
              placeholder="e.g., Introduction to Programming"
              required
            />
          </div>

          {/* Course Code */}
          <div className="space-y-2">
            <Label htmlFor="courseCode">Course Code *</Label>
            <Input
              id="courseCode"
              value={formData.courseCode}
              onChange={(e) => handleInputChange('courseCode', e.target.value)}
              placeholder="e.g., CSC 101"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Add any additional details..."
              rows={3}
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate">
              {formData.type === 'assignment' ? 'Assignment Date *' : 'Date *'}
            </Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              required
            />
          </div>

          {/* Deadline for Assignments */}
          {formData.type === 'assignment' && (
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline (Optional)</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline || ''}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
              />
            </div>
          )}

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time">Time *</Label>
            <Input
              id="time"
              value={formData.time}
              onChange={(e) => handleInputChange('time', e.target.value)}
              placeholder="e.g., 09:00 AM - 11:00 AM"
              required
            />
          </div>

          {/* Venue */}
          <div className="space-y-2">
            <Label htmlFor="venue">Venue/Location *</Label>
            <Input
              id="venue"
              value={formData.venue}
              onChange={(e) => handleInputChange('venue', e.target.value)}
              placeholder="e.g., Lecture Hall A or Online"
              required
            />
          </div>

          {/* Online Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isOnline">Online Session</Label>
              <p className="text-xs text-gray-500">Enable if this is an online class/meeting</p>
            </div>
            <Switch
              id="isOnline"
              checked={formData.isOnline}
              onCheckedChange={(checked) => handleInputChange('isOnline', checked)}
            />
          </div>

          {/* Meet Link (only for online) */}
          {formData.isOnline && (
            <div className="space-y-2">
              <Label htmlFor="meetLink">Meeting Link</Label>
              <Input
                id="meetLink"
                type="url"
                value={formData.meetLink}
                onChange={(e) => handleInputChange('meetLink', e.target.value)}
                placeholder="https://meet.google.com/..."
              />
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddScheduleDialog;
