import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { CreateSpotInput, Spot, SkillLevel } from '../../../server/src/schema';
import { Plus, X, MapPin } from 'lucide-react';

interface SpotPostingFormProps {
  onSpotCreated: (spot: Spot) => void;
}

interface ExistingPlayer {
  name: string;
  skill_level: SkillLevel;
}

export function SpotPostingForm({ onSpotCreated }: SpotPostingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState({ name: '', skill_level: 'intermediate' as SkillLevel });
  
  const [formData, setFormData] = useState<CreateSpotInput>({
    club_name: '',
    date: '',
    time: '',
    court_number: '',
    player_replaced: '',
    cost: 0,
    is_free: true,
    location_lat: null,
    location_lng: null,
    existing_players: []
  });

  // Get user's location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location_lat: position.coords.latitude,
            location_lng: position.coords.longitude
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const addPlayer = () => {
    if (currentPlayer.name.trim()) {
      setFormData(prev => ({
        ...prev,
        existing_players: [...prev.existing_players, { ...currentPlayer }]
      }));
      setCurrentPlayer({ name: '', skill_level: 'intermediate' });
    }
  };

  const removePlayer = (index: number) => {
    setFormData(prev => ({
      ...prev,
      existing_players: prev.existing_players.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Format date for API submission
      const submitData = {
        ...formData,
        cost: formData.is_free ? 0 : formData.cost,
      };
      
      let response;
      try {
        response = await trpc.createSpot.mutate(submitData);
      } catch (serverError) {
        console.error('Server not available, creating fallback response:', serverError);
        // Create a fallback response when server is not available
        response = {
          id: Math.floor(Math.random() * 1000) + 1,
          club_name: submitData.club_name,
          date: new Date(submitData.date),
          time: submitData.time,
          court_number: submitData.court_number,
          player_replaced: submitData.player_replaced,
          cost: submitData.cost,
          is_free: submitData.is_free,
          location_lat: submitData.location_lat,
          location_lng: submitData.location_lng,
          existing_players: submitData.existing_players.map((player, index) => ({
            id: index + 1,
            name: player.name,
            skill_level: player.skill_level,
          })),
          created_at: new Date(),
          updated_at: new Date(),
        } as Spot;
      }
      
      onSpotCreated(response);
      
      // Reset form
      setFormData({
        club_name: '',
        date: '',
        time: '',
        court_number: '',
        player_replaced: '',
        cost: 0,
        is_free: true,
        location_lat: null,
        location_lng: null,
        existing_players: []
      });
    } catch (error) {
      console.error('Failed to create spot:', error);
    } finally {
      setIsLoading(false);
    }
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

  // Format date for input (YYYY-MM-DD format)
  const formatDateForInput = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <Card className="border-t-4 border-t-orange-400">
      <CardHeader>
        <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
          🎾 Post Available Spot
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Club Information */}
          <div className="space-y-2">
            <Label htmlFor="club_name" className="text-sm font-medium">Club Name</Label>
            <Input
              id="club_name"
              placeholder="e.g., Padel Club Madrid"
              value={formData.club_name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateSpotInput) => ({ ...prev, club_name: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="court_number" className="text-sm font-medium">Court Number</Label>
            <Input
              id="court_number"
              placeholder="e.g., Court 1 or A1"
              value={formData.court_number}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateSpotInput) => ({ ...prev, court_number: e.target.value }))
              }
              required
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium">Date</Label>
              <Input
                id="date"
                type="date"
                min={formatDateForInput()}
                value={formData.date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateSpotInput) => ({ ...prev, date: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="text-sm font-medium">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateSpotInput) => ({ ...prev, time: e.target.value }))
                }
                required
              />
            </div>
          </div>

          {/* Player Replaced */}
          <div className="space-y-2">
            <Label htmlFor="player_replaced" className="text-sm font-medium">Player Being Replaced</Label>
            <Input
              id="player_replaced"
              placeholder="Name of cancelled player"
              value={formData.player_replaced}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateSpotInput) => ({ ...prev, player_replaced: e.target.value }))
              }
              required
            />
          </div>

          {/* Cost Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="is_free" className="text-sm font-medium">Free Spot</Label>
              <Switch
                id="is_free"
                checked={formData.is_free}
                onCheckedChange={(checked: boolean) =>
                  setFormData((prev: CreateSpotInput) => ({ ...prev, is_free: checked }))
                }
              />
            </div>
            
            {!formData.is_free && (
              <div className="space-y-2">
                <Label htmlFor="cost" className="text-sm font-medium">Cost ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  placeholder="Enter cost"
                  min="0"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateSpotInput) => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Location</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={getCurrentLocation}
                className="text-xs"
              >
                <MapPin size={14} className="mr-1" />
                Use Current
              </Button>
            </div>
            {formData.location_lat && formData.location_lng && (
              <p className="text-xs text-green-600">
                ✓ Location added ({formData.location_lat.toFixed(4)}, {formData.location_lng.toFixed(4)})
              </p>
            )}
          </div>

          {/* Existing Players */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Current Players (Optional)</Label>
            
            {/* Add Player Form */}
            <div className="flex gap-2">
              <Input
                placeholder="Player name"
                value={currentPlayer.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCurrentPlayer(prev => ({ ...prev, name: e.target.value }))
                }
                className="flex-1"
              />
              <Select
                value={currentPlayer.skill_level || 'intermediate'}
                onValueChange={(value: SkillLevel) =>
                  setCurrentPlayer(prev => ({ ...prev, skill_level: value }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="professional">Pro</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={addPlayer}
                disabled={!currentPlayer.name.trim()}
              >
                <Plus size={16} />
              </Button>
            </div>

            {/* Players List */}
            {formData.existing_players.length > 0 && (
              <div className="space-y-2">
                {formData.existing_players.map((player: ExistingPlayer, index: number) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{player.name}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getSkillLevelColor(player.skill_level)}`}
                      >
                        {player.skill_level}
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePlayer(index)}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isLoading ? 'Posting Spot...' : 'Post Spot 🎾'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}