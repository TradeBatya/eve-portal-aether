import { BaseAdapter } from './BaseAdapter';

export interface SkillData {
  totalSp: number;
  unallocatedSp: number;
  skills: Skill[];
  skillQueue: SkillQueueItem[];
}

export interface Skill {
  skillId: number;
  skillName?: string;
  trainedSkillLevel: number;
  activeSkillLevel: number;
  skillpointsInSkill: number;
}

export interface SkillQueueItem {
  queuePosition: number;
  skillId: number;
  skillName?: string;
  finishedLevel: number;
  trainingStartSp?: number;
  levelStartSp?: number;
  levelEndSp?: number;
  startDate?: string;
  finishDate?: string;
}

/**
 * SkillsAdapter - Character skills and training data
 */
export class SkillsAdapter extends BaseAdapter {

  async getSkills(characterId: number): Promise<SkillData> {
    await this.validateToken(characterId, ['esi-skills.read_skills.v1']);
    this.log(`Fetching skills for character ${characterId}`);

    const skillsData = await this.fetchWithRetry<any>(
      `/characters/${characterId}/skills/`,
      characterId,
      { ttl: 3600 }
    );

    const skills: Skill[] = (skillsData.skills || []).map((skill: any) => ({
      skillId: skill.skill_id,
      trainedSkillLevel: skill.trained_skill_level,
      activeSkillLevel: skill.active_skill_level,
      skillpointsInSkill: skill.skillpoints_in_skill
    }));

    // Resolve skill names
    const skillIds = skills.map(s => s.skillId);
    const skillNames = await this.nameResolver.getNames(skillIds);
    
    skills.forEach(skill => {
      skill.skillName = skillNames.get(skill.skillId);
    });

    return {
      totalSp: skillsData.total_sp || 0,
      unallocatedSp: skillsData.unallocated_sp || 0,
      skills,
      skillQueue: []
    };
  }

  async getSkillQueue(characterId: number): Promise<SkillQueueItem[]> {
    await this.validateToken(characterId, ['esi-skills.read_skillqueue.v1']);
    this.log(`Fetching skill queue for character ${characterId}`);

    const queueData = await this.fetchWithRetry<any[]>(
      `/characters/${characterId}/skillqueue/`,
      characterId,
      { ttl: 300 }
    );

    if (!queueData || queueData.length === 0) {
      return [];
    }

    const queue: SkillQueueItem[] = queueData.map((item: any) => ({
      queuePosition: item.queue_position,
      skillId: item.skill_id,
      finishedLevel: item.finished_level,
      trainingStartSp: item.training_start_sp,
      levelStartSp: item.level_start_sp,
      levelEndSp: item.level_end_sp,
      startDate: item.start_date,
      finishDate: item.finish_date
    }));

    // Resolve skill names
    const skillIds = queue.map(q => q.skillId);
    const skillNames = await this.nameResolver.getNames(skillIds);
    
    queue.forEach(item => {
      item.skillName = skillNames.get(item.skillId);
    });

    return queue;
  }

  /**
   * Get complete skill data including queue
   */
  async getCompleteSkillData(characterId: number): Promise<SkillData> {
    await this.validateToken(characterId, ['esi-skills.read_skills.v1', 'esi-skills.read_skillqueue.v1']);
    this.log(`Fetching complete skill data for character ${characterId}`);

    const [skillsData, queue] = await Promise.all([
      this.getSkills(characterId),
      this.getSkillQueue(characterId)
    ]);

    return {
      ...skillsData,
      skillQueue: queue
    };
  }

  /**
   * Calculate total training time remaining
   */
  async calculateTrainingTime(characterId: number): Promise<number> {
    const queue = await this.getSkillQueue(characterId);

    if (queue.length === 0) return 0;

    const lastItem = queue[queue.length - 1];
    if (!lastItem.finishDate) return 0;

    const finishTime = new Date(lastItem.finishDate).getTime();
    const now = Date.now();

    return Math.max(0, finishTime - now);
  }

  /**
   * Get skills by group
   */
  async getSkillsByGroup(characterId: number): Promise<Map<string, Skill[]>> {
    const { skills } = await this.getSkills(characterId);
    
    // Group skills by category (would need additional ESI calls to get groups)
    // For now, return all in one group
    const grouped = new Map<string, Skill[]>();
    grouped.set('All Skills', skills);

    return grouped;
  }

  /**
   * Get skill training progress
   */
  async getTrainingProgress(characterId: number): Promise<any> {
    const queue = await this.getSkillQueue(characterId);

    if (queue.length === 0) {
      return {
        isTraining: false,
        currentSkill: null,
        progress: 0,
        timeRemaining: 0
      };
    }

    const currentSkill = queue[0];
    
    if (!currentSkill.startDate || !currentSkill.finishDate) {
      return {
        isTraining: false,
        currentSkill: null,
        progress: 0,
        timeRemaining: 0
      };
    }

    const startTime = new Date(currentSkill.startDate).getTime();
    const finishTime = new Date(currentSkill.finishDate).getTime();
    const now = Date.now();

    const totalTime = finishTime - startTime;
    const elapsed = now - startTime;
    const progress = Math.min(100, Math.max(0, (elapsed / totalTime) * 100));
    const timeRemaining = Math.max(0, finishTime - now);

    return {
      isTraining: true,
      currentSkill: currentSkill.skillName,
      currentLevel: currentSkill.finishedLevel,
      progress: Math.round(progress * 100) / 100,
      timeRemaining,
      queueLength: queue.length
    };
  }

  /**
   * Refresh skills data
   */
  async refresh(characterId: number): Promise<void> {
    this.log(`Refreshing skills data for character ${characterId}`);
    
    await this.invalidateCache(`char:${characterId}:skills`);
    
    // Force fresh fetch
    await this.getCompleteSkillData(characterId);
  }
}

export const skillsAdapter = new SkillsAdapter();
