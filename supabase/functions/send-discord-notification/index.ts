import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  type: 'operations' | 'intel' | 'pings' | 'recruitment' | 'general';
  title: string;
  description: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  thumbnail?: string;
  footer?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { payload } = await req.json() as { payload: NotificationPayload };
    
    console.log('Discord notification request:', payload.type);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get active webhooks for type
    const { data: webhooks, error } = await supabase
      .from('discord_webhooks')
      .select('webhook_url, channel_name')
      .eq('webhook_type', payload.type)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching webhooks:', error);
      throw error;
    }

    if (!webhooks || webhooks.length === 0) {
      console.log('No active webhooks found for type:', payload.type);
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No active webhooks' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Discord embed
    const embed = {
      title: payload.title,
      description: payload.description,
      color: payload.color || 0x5865F2, // Discord Blurple
      fields: payload.fields || [],
      thumbnail: payload.thumbnail ? { url: payload.thumbnail } : undefined,
      footer: payload.footer ? { text: payload.footer } : undefined,
      timestamp: new Date().toISOString(),
    };

    console.log(`Sending to ${webhooks.length} webhooks`);

    // Send to all active webhooks
    const promises = webhooks.map(webhook => 
      fetch(webhook.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
      }).catch(error => {
        console.error(`Failed to send to ${webhook.channel_name}:`, error);
        return null;
      })
    );

    const results = await Promise.allSettled(promises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;

    console.log(`Successfully sent ${successCount}/${webhooks.length} notifications`);

    return new Response(
      JSON.stringify({ success: true, sent: successCount, total: webhooks.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Discord notification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
