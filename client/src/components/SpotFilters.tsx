import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { SpotFilter, SkillLevel } from '../../../server/src/schema';
import { Filter, X, MapPin } from 'lucide-react';

interface SpotFiltersProps {
  onFilterChange: (filters?: SpotFilter) => void;
}

export function SpotFilters({ onFilterChange }: SpotFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<{
    club_name?: string;
    date_from?: string;
    date_to?: string;
    skill_level?: SkillLevel;
    is_free?: boolean;
    max_cost?: number;
    location_lat?: number;
    location_lng?: number;
    radius_km: number;
  }>({ radius_km: 10 });

  // Format date for input (YYYY-MM-DD format)
  const formatDateForInput = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleFilterChange = (key: string, value: string | number | boolean | undefined) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({ radius_km: 10 });
    onFilterChange(undefined);
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof typeof filters];
    return value !== undefined && value !== null && value !== '';
  });

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleFilterChange('location_lat', position.coords.latitude);
          handleFilterChange('location_lng', position.coords.longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  return (
    <Card className="border-orange-200">
      <CardHeader 
        className="pb-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter size={18} />
            Filters
            {hasActiveFilters && (
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm">
            {isExpanded ? '▼' : '▶'}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Club Name Filter */}
          <div className="space-y-2">
            <Label htmlFor="club_filter" className="text-sm font-medium">Club Name</Label>
            <Input
              id="club_filter"
              placeholder="Filter by club name"
              value={filters.club_name || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleFilterChange('club_name', e.target.value || undefined)
              }
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date_from" className="text-sm font-medium">From Date</Label>
              <Input
                id="date_from"
                type="date"
                min={formatDateForInput()}
                value={filters.date_from || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleFilterChange('date_from', e.target.value || undefined)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_to" className="text-sm font-medium">To Date</Label>
              <Input
                id="date_to"
                type="date"
                min={filters.date_from || formatDateForInput()}
                value={filters.date_to || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleFilterChange('date_to', e.target.value || undefined)
                }
              />
            </div>
          </div>

          {/* Skill Level Filter */}
          <div className="space-y-2">
            <Label htmlFor="skill_level" className="text-sm font-medium">Skill Level</Label>
            <Select
              value={filters.skill_level || 'all'}
              onValueChange={(value: string) =>
                handleFilterChange('skill_level', value === 'all' ? undefined : value as SkillLevel)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Any skill level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any skill level</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cost Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="is_free_filter" className="text-sm font-medium">Free Spots Only</Label>
              <Switch
                id="is_free_filter"
                checked={filters.is_free || false}
                onCheckedChange={(checked: boolean) =>
                  handleFilterChange('is_free', checked ? true : undefined)
                }
              />
            </div>
            
            {!filters.is_free && (
              <div className="space-y-2">
                <Label htmlFor="max_cost" className="text-sm font-medium">Max Cost ($)</Label>
                <Input
                  id="max_cost"
                  type="number"
                  placeholder="Maximum cost"
                  min="0"
                  step="0.01"
                  value={filters.max_cost || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleFilterChange('max_cost', parseFloat(e.target.value) || undefined)
                  }
                />
              </div>
            )}
          </div>

          {/* Location Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Nearby Spots</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={getCurrentLocation}
                className="text-xs"
              >
                <MapPin size={14} className="mr-1" />
                Use Current Location
              </Button>
            </div>
            
            {(filters.location_lat && filters.location_lng) && (
              <div className="flex items-center justify-between bg-green-50 p-2 rounded-md">
                <p className="text-xs text-green-600">
                  ✓ Showing nearby spots
                </p>
                <div className="space-y-1">
                  <Label htmlFor="radius" className="text-xs">Radius (km)</Label>
                  <Input
                    id="radius"
                    type="number"
                    min="1"
                    max="50"
                    className="w-20 h-6 text-xs"
                    value={filters.radius_km || 10}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleFilterChange('radius_km', parseInt(e.target.value) || 10)
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="w-full"
            >
              <X size={16} className="mr-2" />
              Clear All Filters
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}