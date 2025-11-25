import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, User, BookOpen, Wallet, Users, Brain, Building2, Briefcase, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  useMemberAuditMetadata, 
  useUpdateMemberAudit 
} from '@/hooks/useMemberAudit';
import { MemberAuditOverview } from './memberaudit/MemberAuditOverview';
import { MemberAuditSkills } from './memberaudit/MemberAuditSkills';
import { MemberAuditWallet } from './memberaudit/MemberAuditWallet';
import { MemberAuditContacts } from './memberaudit/MemberAuditContacts';
import { MemberAuditImplants } from './memberaudit/MemberAuditImplants';
import { MemberAuditContracts } from './memberaudit/MemberAuditContracts';
import { MemberAuditIndustry } from './memberaudit/MemberAuditIndustry';
import { MemberAuditLoyalty } from './memberaudit/MemberAuditLoyalty';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const MemberAudit = () => {
  const { user } = useAuth();
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);

  // Fetch user's characters
  const { data: characters = [], isLoading: loadingCharacters } = useQuery({
    queryKey: ['user-characters', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('eve_characters')
        .select('*')
        .eq('user_id', user.id)
        .order('is_main', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Auto-select main character
  if (!selectedCharacterId && characters.length > 0) {
    const mainChar = characters.find(c => c.is_main) || characters[0];
    setSelectedCharacterId(mainChar.character_id);
  }

  const { data: metadata, isLoading: loadingMetadata } = useMemberAuditMetadata(selectedCharacterId || undefined);
  const updateMutation = useUpdateMemberAudit();

  const handleSync = () => {
    if (selectedCharacterId) {
      updateMutation.mutate({ character_id: selectedCharacterId });
    }
  };

  const selectedCharacter = characters.find(c => c.character_id === selectedCharacterId);

  if (loadingCharacters) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading characters...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (characters.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Member Audit</CardTitle>
          <CardDescription>No characters linked</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Please link an EVE Online character to use Member Audit.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const isSyncing = metadata?.sync_status === 'syncing' || updateMutation.isPending;
  const syncProgress = metadata?.sync_progress || {};
  const avgProgress = Object.values(syncProgress).length > 0
    ? Object.values(syncProgress).reduce((a, b) => a + b, 0) / Object.values(syncProgress).length
    : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Member Audit
              </CardTitle>
              <CardDescription>
                Comprehensive character data analysis
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {characters.length > 1 && (
                <Select
                  value={selectedCharacterId?.toString()}
                  onValueChange={(value) => setSelectedCharacterId(Number(value))}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select character" />
                  </SelectTrigger>
                  <SelectContent>
                    {characters.map((char) => (
                      <SelectItem key={char.character_id} value={char.character_id.toString()}>
                        {char.character_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Data'}
              </Button>
            </div>
          </div>
        </CardHeader>

        {isSyncing && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Syncing modules...</span>
                <span className="text-muted-foreground">{Math.round(avgProgress)}%</span>
              </div>
              <Progress value={avgProgress} className="h-2" />
            </div>
          </CardContent>
        )}

        {metadata?.sync_errors && metadata.sync_errors.length > 0 && (
          <CardContent className="pt-0">
            <Alert variant="destructive">
              <AlertDescription>
                Sync completed with errors: {metadata.sync_errors.join(', ')}
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="overview">
            <User className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="skills">
            <BookOpen className="h-4 w-4 mr-2" />
            Skills
          </TabsTrigger>
          <TabsTrigger value="wallet">
            <Wallet className="h-4 w-4 mr-2" />
            Wallet
          </TabsTrigger>
          <TabsTrigger value="contacts">
            <Users className="h-4 w-4 mr-2" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="implants">
            <Brain className="h-4 w-4 mr-2" />
            Implants
          </TabsTrigger>
          <TabsTrigger value="contracts">
            <Building2 className="h-4 w-4 mr-2" />
            Contracts
          </TabsTrigger>
          <TabsTrigger value="industry">
            <Briefcase className="h-4 w-4 mr-2" />
            Industry
          </TabsTrigger>
          <TabsTrigger value="loyalty">
            <Award className="h-4 w-4 mr-2" />
            Loyalty
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <MemberAuditOverview 
            characterId={selectedCharacterId} 
            character={selectedCharacter}
            metadata={metadata}
          />
        </TabsContent>

        <TabsContent value="skills">
          <MemberAuditSkills characterId={selectedCharacterId} />
        </TabsContent>

        <TabsContent value="wallet">
          <MemberAuditWallet characterId={selectedCharacterId} />
        </TabsContent>

        <TabsContent value="contacts">
          <MemberAuditContacts characterId={selectedCharacterId} />
        </TabsContent>

        <TabsContent value="implants">
          <MemberAuditImplants characterId={selectedCharacterId} />
        </TabsContent>

        <TabsContent value="contracts">
          <MemberAuditContracts characterId={selectedCharacterId} />
        </TabsContent>

        <TabsContent value="industry">
          <MemberAuditIndustry characterId={selectedCharacterId} />
        </TabsContent>

        <TabsContent value="loyalty">
          <MemberAuditLoyalty characterId={selectedCharacterId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
