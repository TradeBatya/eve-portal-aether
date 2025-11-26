import { BaseAdapter } from './BaseAdapter';
import { supabase } from '@/integrations/supabase/client';

/**
 * MemberAuditAdapter - Comprehensive character audit data
 * Extends BaseAdapter for unified ESI access
 */
export class MemberAuditAdapter extends BaseAdapter {

  /**
   * Get complete audit data for a character
   */
  async getCompleteAuditData(characterId: number) {
    try {
      // Use unified method to get all character data
      const characterData = await this.esiService.getCharacterData(characterId, [
        'basic', 'location', 'ship', 'skills', 'wallet', 'assets', 
        'clones'
      ]);

      // Additional Member Audit specific data
      const [implants, contacts, skillQueue] = await Promise.allSettled([
        this.esiService.request(`/characters/${characterId}/implants/`, { characterId, ttl: 3600 }),
        this.esiService.request(`/characters/${characterId}/contacts/`, { characterId, ttl: 1800 }),
        this.esiService.request(`/characters/${characterId}/skillqueue/`, { characterId, ttl: 300 })
      ]);

      return {
        ...characterData,
        implants: implants.status === 'fulfilled' ? implants.value.data : [],
        contacts: contacts.status === 'fulfilled' ? contacts.value.data : [],
        skillQueue: skillQueue.status === 'fulfilled' ? skillQueue.value.data : []
      };
    } catch (error) {
      console.error('MemberAuditAdapter error:', error);
      throw error;
    }
  }

  /**
   * Refresh character data and update database
   */
  async refreshCharacterData(characterId: number): Promise<void> {
    console.log(`[MemberAuditAdapter] Starting refresh for character ${characterId}`);
    try {
      // Clear memory cache to force fresh data
      console.log('[MemberAuditAdapter] Clearing memory cache...');
      this.esiService.clearCache('memory');
      
      // Fetch fresh data
      console.log('[MemberAuditAdapter] Fetching complete audit data...');
      const auditData = await this.getCompleteAuditData(characterId);
      console.log('[MemberAuditAdapter] Audit data fetched:', Object.keys(auditData));

      // Update member_audit_metadata
      console.log('[MemberAuditAdapter] Updating metadata...');
      await this.updateMetadata(characterId, auditData);

      // Update specific tables
      console.log('[MemberAuditAdapter] Updating skills...');
      await this.updateSkills(characterId, auditData.skills);
      
      console.log('[MemberAuditAdapter] Updating skill queue...');
      await this.updateSkillQueue(characterId, auditData.skillQueue);
      
      console.log('[MemberAuditAdapter] Updating implants...');
      await this.updateImplants(characterId, auditData.implants);
      
      console.log('[MemberAuditAdapter] Updating contacts...');
      await this.updateContacts(characterId, auditData.contacts);

      console.log(`[MemberAuditAdapter] Successfully refreshed data for character ${characterId}`);
    } catch (error: any) {
      console.error('[MemberAuditAdapter] Failed to refresh character data:', error);
      throw new Error(`Refresh failed: ${error.message}`);
    }
  }

  /**
   * Update member_audit_metadata table
   */
  private async updateMetadata(characterId: number, auditData: any): Promise<void> {
    console.log(`[MemberAuditAdapter] Preparing metadata for character ${characterId}`);
    
    // Get user_id from eve_characters table
    const { data: charData, error: charError } = await supabase
      .from('eve_characters')
      .select('user_id')
      .eq('character_id', characterId)
      .maybeSingle();

    if (charError || !charData) {
      console.error('[MemberAuditAdapter] Failed to get user_id:', charError);
      throw new Error('Failed to get user_id for character');
    }

    const metadata: any = {
      character_id: characterId,
      user_id: charData.user_id,
      security_status: auditData.basic?.security_status ?? null,
      total_sp: auditData.skills?.total_sp || 0,
      unallocated_sp: auditData.skills?.unallocated_sp || 0,
      wallet_balance: auditData.wallet || 0,
      last_update_at: new Date().toISOString(),
      sync_status: 'completed'
    };

    // Add location data if available
    if (auditData.location) {
      metadata.solar_system_id = auditData.location.solar_system_id;
      metadata.solar_system_name = auditData.location.solar_system_name;
      
      if (auditData.location.station_id) {
        metadata.location_id = auditData.location.station_id;
        metadata.location_name = auditData.location.station_name;
        metadata.location_type = 'station';
      } else if (auditData.location.structure_id) {
        metadata.location_id = auditData.location.structure_id;
        metadata.location_name = auditData.location.structure_name;
        metadata.location_type = 'structure';
      }
    }

    // Add ship data if available
    if (auditData.ship) {
      metadata.ship_type_id = auditData.ship.ship_type_id;
      metadata.ship_type_name = auditData.ship.ship_type_name;
      metadata.ship_name = auditData.ship.ship_name;
    }

    // Calculate total assets value
    if (auditData.assets && Array.isArray(auditData.assets)) {
      const { data: assetRecords } = await supabase
        .from('character_assets')
        .select('estimated_value, quantity')
        .eq('character_id', characterId);

      if (assetRecords) {
        const totalValue = assetRecords.reduce((sum: number, asset: any) => {
          return sum + ((asset.estimated_value || 0) * (asset.quantity || 1));
        }, 0);
        metadata.total_assets_value = totalValue;
      }
    }

    console.log('[MemberAuditAdapter] Writing metadata to database...');
    const { error } = await supabase
      .from('member_audit_metadata')
      .upsert(metadata, { onConflict: 'character_id' });

    if (error) {
      console.error('[MemberAuditAdapter] Failed to update metadata:', error);
      throw error;
    }
    
    console.log('[MemberAuditAdapter] Metadata updated successfully');
  }

  /**
   * Update skills table
   */
  private async updateSkills(characterId: number, skillsData: any): Promise<void> {
    if (!skillsData || !skillsData.skills) return;

    // Resolve skill names
    const skillIds = skillsData.skills.map((s: any) => s.skill_id);
    const skillNames = await this.esiService.resolveNames(skillIds);

    const skillRecords = skillsData.skills.map((skill: any) => ({
      character_id: characterId,
      skill_id: skill.skill_id,
      skill_name: skillNames.get(skill.skill_id) || `Skill ${skill.skill_id}`,
      trained_skill_level: skill.trained_skill_level,
      active_skill_level: skill.active_skill_level,
      skillpoints_in_skill: skill.skillpoints_in_skill,
      last_updated: new Date().toISOString()
    }));

    // Delete old skills and insert new ones
    await supabase
      .from('member_audit_skills')
      .delete()
      .eq('character_id', characterId);

    const { error } = await supabase
      .from('member_audit_skills')
      .insert(skillRecords);

    if (error) {
      console.error('Failed to update skills:', error);
    }
  }

  /**
   * Update skill queue table
   */
  private async updateSkillQueue(characterId: number, skillQueueData: any[]): Promise<void> {
    if (!skillQueueData || !Array.isArray(skillQueueData)) return;

    const skillIds = skillQueueData.map(s => s.skill_id);
    const skillNames = await this.esiService.resolveNames(skillIds);

    const queueRecords = skillQueueData.map((item: any) => ({
      character_id: characterId,
      queue_position: item.queue_position,
      skill_id: item.skill_id,
      skill_name: skillNames.get(item.skill_id) || `Skill ${item.skill_id}`,
      finished_level: item.finished_level,
      training_start_sp: item.training_start_sp,
      level_start_sp: item.level_start_sp,
      level_end_sp: item.level_end_sp,
      start_date: item.start_date,
      finish_date: item.finish_date,
      updated_at: new Date().toISOString()
    }));

    await supabase
      .from('member_audit_skillqueue')
      .delete()
      .eq('character_id', characterId);

    const { error } = await supabase
      .from('member_audit_skillqueue')
      .insert(queueRecords);

    if (error) {
      console.error('Failed to update skill queue:', error);
    }
  }

  /**
   * Update implants table
   */
  private async updateImplants(characterId: number, implantsData: any[]): Promise<void> {
    if (!implantsData || !Array.isArray(implantsData)) return;

    const implantNames = await this.esiService.resolveNames(implantsData);

    const implantRecords = implantsData.map((implantId: number, index: number) => ({
      character_id: characterId,
      implant_id: implantId,
      implant_name: implantNames.get(implantId) || `Implant ${implantId}`,
      slot: index + 1,
      last_updated: new Date().toISOString()
    }));

    await supabase
      .from('member_audit_implants')
      .delete()
      .eq('character_id', characterId);

    const { error } = await supabase
      .from('member_audit_implants')
      .insert(implantRecords);

    if (error) {
      console.error('Failed to update implants:', error);
    }
  }

  /**
   * Update contacts table
   */
  private async updateContacts(characterId: number, contactsData: any[]): Promise<void> {
    if (!contactsData || !Array.isArray(contactsData)) return;

    const contactIds = contactsData.map(c => c.contact_id);
    const contactNames = await this.esiService.resolveNames(contactIds);

    const contactRecords = contactsData.map((contact: any) => ({
      character_id: characterId,
      contact_id: contact.contact_id,
      contact_name: contactNames.get(contact.contact_id) || `Contact ${contact.contact_id}`,
      contact_type: contact.contact_type,
      standing: contact.standing,
      is_watched: contact.is_watched || false,
      is_blocked: contact.is_blocked || false,
      label_ids: contact.label_ids || [],
      last_updated: new Date().toISOString()
    }));

    await supabase
      .from('member_audit_contacts')
      .delete()
      .eq('character_id', characterId);

    const { error } = await supabase
      .from('member_audit_contacts')
      .insert(contactRecords);

    if (error) {
      console.error('Failed to update contacts:', error);
    }
  }

  /**
   * Get sync status for a character
   */
  async getSyncStatus(characterId: number): Promise<any> {
    const { data } = await supabase
      .from('member_audit_metadata')
      .select('sync_status, last_update_at, sync_errors')
      .eq('character_id', characterId)
      .maybeSingle();

    return data;
  }
}

export const memberAuditAdapter = new MemberAuditAdapter();
