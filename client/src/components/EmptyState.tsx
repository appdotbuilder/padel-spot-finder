import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Users } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  const defaultIcon = <MapPin className="h-16 w-16 text-orange-300 mb-4" />;

  return (
    <Card className="text-center py-12 border-dashed border-2 border-orange-200">
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          {icon || defaultIcon}
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">{description}</p>
        </div>
        {action && (
          <Button 
            onClick={action.onClick}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {action.label}
          </Button>
        )}
        <div className="flex justify-center space-x-8 pt-4 opacity-60">
          <div className="text-center">
            <Calendar className="h-6 w-6 text-orange-300 mx-auto mb-1" />
            <p className="text-xs text-gray-400">Browse by date</p>
          </div>
          <div className="text-center">
            <Users className="h-6 w-6 text-orange-300 mx-auto mb-1" />
            <p className="text-xs text-gray-400">Find players</p>
          </div>
          <div className="text-center">
            <MapPin className="h-6 w-6 text-orange-300 mx-auto mb-1" />
            <p className="text-xs text-gray-400">Nearby games</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}