import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemberAuditSkills, useMemberAuditSkillqueue } from '@/hooks/useMemberAudit';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Clock, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MemberAuditSkillsProps {
  characterId: number | null;
}

export const MemberAuditSkills = ({ characterId }: MemberAuditSkillsProps) => {
  const { data: skills = [], isLoading: loadingSkills } = useMemberAuditSkills(characterId || undefined);
  const { data: skillqueue = [], isLoading: loadingQueue } = useMemberAuditSkillqueue(characterId || undefined);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  // Get unique skill groups
  const skillGroups = useMemo(() => {
    const groups = new Set(skills.map(s => s.skill_group_name).filter(Boolean));
    return Array.from(groups).sort();
  }, [skills]);

  // Filter skills
  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      const matchesSearch = skill.skill_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGroup = selectedGroup === 'all' || skill.skill_group_name === selectedGroup;
      return matchesSearch && matchesGroup;
    });
  }, [skills, searchQuery, selectedGroup]);

  if (!characterId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">No character selected</p>
        </CardContent>
      </Card>
    );
  }

  const activeTraining = skillqueue.find(q => q.queue_position === 0);

  return (
    <div className="space-y-4">
      {/* Skill Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Skill Queue
          </CardTitle>
          <CardDescription>
            {skillqueue.length} skills in queue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingQueue ? (
            <p className="text-muted-foreground text-center py-4">Loading...</p>
          ) : skillqueue.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No skills in training queue</p>
          ) : (
            <div className="space-y-4">
              {activeTraining && (
                <div className="space-y-2 p-4 rounded-lg bg-accent/50">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{activeTraining.skill_name}</span>
                    <Badge>Level {activeTraining.finished_level}</Badge>
                  </div>
                  <Progress value={50} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    Completes {activeTraining.finish_date 
                      ? formatDistanceToNow(new Date(activeTraining.finish_date), { addSuffix: true })
                      : 'soon'}
                  </p>
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead>Skill</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Finish Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skillqueue.slice(activeTraining ? 1 : 0).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.queue_position}</TableCell>
                      <TableCell className="font-medium">{item.skill_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.finished_level}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {item.finish_date 
                          ? formatDistanceToNow(new Date(item.finish_date), { addSuffix: true })
                          : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Skills */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              All Skills
            </CardTitle>
            <CardDescription>
              {filteredSkills.length} of {skills.length} skills trained
            </CardDescription>
          </div>
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All groups</SelectItem>
                {skillGroups.map(group => (
                  <SelectItem key={group} value={group}>{group}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loadingSkills ? (
            <p className="text-muted-foreground text-center py-4">Loading...</p>
          ) : filteredSkills.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {searchQuery || selectedGroup !== 'all' ? 'No skills match your filters' : 'No skills data available'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Skill</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Skillpoints</TableHead>
                  <TableHead>Group</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSkills.map((skill) => (
                  <TableRow key={skill.id}>
                    <TableCell className="font-medium">{skill.skill_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge>{skill.trained_skill_level}</Badge>
                        {skill.trained_skill_level !== skill.active_skill_level && (
                          <Badge variant="outline">Active: {skill.active_skill_level}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {skill.skillpoints_in_skill.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {skill.skill_group_name || 'Unknown'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
