import { supabase } from '@/integrations/supabase/client';
import { Corporation, Alliance } from '@/types';

/**
 * Fetch corporation by ID
 */
export const getCorporation = async (id: number): Promise<Corporation | null> => {
  const { data, error } = await supabase
    .from('corporations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Fetch all corporations
 */
export const getCorporations = async (): Promise<Corporation[]> => {
  const { data, error } = await supabase
    .from('corporations')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
};

/**
 * Fetch alliance by ID
 */
export const getAlliance = async (id: number): Promise<Alliance | null> => {
  const { data, error } = await supabase
    .from('alliances')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Fetch all alliances
 */
export const getAlliances = async (): Promise<Alliance[]> => {
  const { data, error } = await supabase
    .from('alliances')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
};

/**
 * Create or update corporation
 */
export const upsertCorporation = async (corp: Partial<Corporation>): Promise<Corporation> => {
  const { data, error } = await supabase
    .from('corporations')
    .upsert([corp] as any)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Create or update alliance
 */
export const upsertAlliance = async (alliance: Partial<Alliance>): Promise<Alliance> => {
  const { data, error } = await supabase
    .from('alliances')
    .upsert([alliance] as any)
    .select()
    .single();

  if (error) throw error;
  return data;
};
