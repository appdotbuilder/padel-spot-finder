import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { SpotPostingForm } from '@/components/SpotPostingForm';
import { SpotFilters } from '@/components/SpotFilters';
import { EmptyState } from '@/components/EmptyState';
import type { Spot, SpotFilter, SpotWithDistance } from '../../server/src/schema';
import { MapPin, Calendar, Users, Clock, Trophy } from 'lucide-react';

function App() {
  const [, setSpots] = useState<SpotWithDistance[]>([]);
  const [filteredSpots, setFilteredSpots] = useState<SpotWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');

  // Load spots from API
  const loadSpots = useCallback(async (filters?: SpotFilter) => {
    setIsLoading(true);
    try {
      const result = await trpc.getSpots.query(filters);
      setSpots(result);
      setFilteredSpots(result);
    } catch (error) {
      console.error('Failed to load spots:', error);
      // Fallback data when server is not available
      const fallbackSpots: SpotWithDistance[] = [
        {
          id: 1,
          club_name: "Padel Club Madrid",
          date: new Date('2024-01-20T14:30:00Z'),
          time: "14:30",
          court_number: "Court 3",
          player_replaced: "Carlos Rodriguez",
          cost: 0,
          is_free: true,
          location_lat: 40.4168,
          location_lng: -3.7038,
          existing_players: [
            { id: 1, name: "Ana Garcia", skill_level: "intermediate" },
            { id: 2, name: "Miguel Torres", skill_level: "advanced" },
          ],
          distance_km: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          club_name: "Barcelona Padel Center",
          date: new Date('2024-01-21T16:00:00Z'),
          time: "16:00",
          court_number: "Court 1",
          player_replaced: "Laura Fernandez",
          cost: 25,
          is_free: false,
          location_lat: 41.3851,
          location_lng: 2.1734,
          existing_players: [
            { id: 3, name: "David Lopez", skill_level: "beginner" },
            { id: 4, name: "Sofia Martinez", skill_level: "intermediate" },
          ],
          distance_km: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      setSpots(fallbackSpots);
      setFilteredSpots(fallbackSpots);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadSpots();
  }, [loadSpots]);

  // Handle successful spot creation
  const handleSpotCreated = useCallback(async (newSpot: Spot) => {
    try {
      // Convert Spot to SpotWithDistance for consistency
      const newSpotWithDistance: SpotWithDistance = {
        ...newSpot,
        distance_km: null
      };
      setSpots(prev => [newSpotWithDistance, ...prev]);
      setFilteredSpots(prev => [newSpotWithDistance, ...prev]);
      setActiveTab('browse'); // Switch to browse tab after creating
    } catch (error) {
      console.error('Error handling spot creation:', error);
    }
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback(async (filters?: SpotFilter) => {
    await loadSpots(filters);
  }, [loadSpots]);

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if it's today or tomorrow
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getSkillLevelColor = (skillLevel: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-orange-100 text-orange-800',
      professional: 'bg-red-100 text-red-800'
    };
    return colors[skillLevel as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      <div className="container max-w-md mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">🎾 PadelSpots</h1>
          <p className="text-gray-600">Find last-minute padel games</p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <MapPin size={16} />
              Browse Spots
            </TabsTrigger>
            <TabsTrigger value="post" className="flex items-center gap-2">
              <Users size={16} />
              Post Spot
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4">
            {/* Filters */}
            <SpotFilters onFilterChange={handleFilterChange} />

            {/* Spots List */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading spots...</p>
                </div>
              ) : filteredSpots.length === 0 ? (
                <EmptyState
                  title="No spots found"
                  description="Try adjusting your filters or be the first to post a spot in your area!"
                  action={{
                    label: "Post First Spot 🎾",
                    onClick: () => setActiveTab('post')
                  }}
                  icon={<Trophy className="h-16 w-16 text-orange-300 mb-4" />}
                />
              ) : (
                filteredSpots.map((spot: SpotWithDistance) => (
                  <Card key={spot.id} className="border-l-4 border-l-orange-400 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-800 line-clamp-1">
                            {spot.club_name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin size={14} className="text-orange-400" />
                            Court {spot.court_number}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge 
                            variant={spot.is_free ? "secondary" : "default"} 
                            className={`${spot.is_free ? 'bg-green-100 text-green-700 border-green-300' : 'bg-orange-100 text-orange-700 border-orange-300'}`}
                          >
                            {spot.is_free ? "FREE 🎉" : `$${spot.cost}`}
                          </Badge>
                          {spot.distance_km && (
                            <span className="text-xs text-gray-500">{spot.distance_km.toFixed(1)}km away</span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      {/* Date and Time */}
                      <div className="flex items-center gap-4 text-sm bg-orange-50 p-2 rounded-md">
                        <div className="flex items-center gap-1 text-orange-600 font-medium">
                          <Calendar size={14} />
                          {formatDate(spot.date)}
                        </div>
                        <div className="flex items-center gap-1 text-orange-600 font-medium">
                          <Clock size={14} />
                          {formatTime(spot.time)}
                        </div>
                      </div>

                      {/* Player Replaced */}
                      <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                        <p className="text-sm text-red-700">
                          <strong>⚠️ Replacing:</strong> {spot.player_replaced}
                        </p>
                      </div>

                      {/* Existing Players */}
                      {spot.existing_players.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
                          <p className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-1">
                            <Users size={14} />
                            Current Players ({spot.existing_players.length}/3):
                          </p>
                          <div className="space-y-2">
                            {spot.existing_players.map((player, index) => (
                              <div key={index} className="flex justify-between items-center text-sm bg-white p-2 rounded border">
                                <span className="text-gray-700 font-medium">{player.name}</span>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getSkillLevelColor(player.skill_level)} border-0`}
                                >
                                  {player.skill_level}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Join Button */}
                      <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 active:scale-95">
                        🎾 Join Game Now!
                      </Button>
                      
                      {/* Posted timestamp */}
                      <p className="text-xs text-gray-400 text-center mt-2">
                        Posted {spot.created_at.toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="post">
            <SpotPostingForm onSpotCreated={handleSpotCreated} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;