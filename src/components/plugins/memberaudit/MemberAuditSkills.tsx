import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemberAuditSkills, useMemberAuditSkillqueue } from '@/hooks/useMemberAudit';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MemberAuditSkillsProps {
  characterId: number | null;
}

export const MemberAuditSkills = ({ characterId }: MemberAuditSkillsProps) => {
  const { data: skills = [], isLoading: loadingSkills } = useMemberAuditSkills(characterId || undefined);
  const { data: skillqueue = [], isLoading: loadingQueue } = useMemberAuditSkillqueue(characterId || undefined);

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
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            All Skills
          </CardTitle>
          <CardDescription>
            {skills.length} skills trained
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSkills ? (
            <p className="text-muted-foreground text-center py-4">Loading...</p>
          ) : skills.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No skills data available</p>
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
                {skills.map((skill) => (
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
