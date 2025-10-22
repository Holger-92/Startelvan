import { supabase } from './supabase.js';

export async function getUserTeams() {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('updated_at', { ascending: false });

  return { data, error };
}

export async function getTeamWithPlayers(teamId) {
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .maybeSingle();

  if (teamError || !team) {
    return { data: null, error: teamError };
  }

  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: true });

  return {
    data: { ...team, players: players || [] },
    error: playersError
  };
}

export async function getTeamByShareCode(shareCode) {
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('share_code', shareCode)
    .eq('is_public', true)
    .maybeSingle();

  if (teamError || !team) {
    return { data: null, error: teamError };
  }

  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', team.id)
    .order('created_at', { ascending: true });

  return {
    data: { ...team, players: players || [] },
    error: playersError
  };
}

export async function createTeam(name = 'Mitt Lag', formation = '4-3-3') {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const { data, error } = await supabase
    .from('teams')
    .insert([
      {
        user_id: user.id,
        name,
        formation
      }
    ])
    .select()
    .single();

  return { data, error };
}

export async function updateTeam(teamId, updates) {
  const { data, error } = await supabase
    .from('teams')
    .update(updates)
    .eq('id', teamId)
    .select()
    .single();

  return { data, error };
}

export async function deleteTeam(teamId) {
  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', teamId);

  return { error };
}

export async function enableTeamSharing(teamId) {
  const { data: existingTeam } = await supabase
    .from('teams')
    .select('share_code')
    .eq('id', teamId)
    .maybeSingle();

  let shareCode = existingTeam?.share_code;

  if (!shareCode) {
    const { data } = await supabase.rpc('generate_share_code');
    shareCode = data;
  }

  const { data, error } = await supabase
    .from('teams')
    .update({
      is_public: true,
      share_code: shareCode
    })
    .eq('id', teamId)
    .select()
    .single();

  return { data, error };
}

export async function disableTeamSharing(teamId) {
  const { data, error } = await supabase
    .from('teams')
    .update({ is_public: false })
    .eq('id', teamId)
    .select()
    .single();

  return { data, error };
}

export async function savePlayers(teamId, players) {
  const { data: existingPlayers } = await supabase
    .from('players')
    .select('id')
    .eq('team_id', teamId);

  const existingIds = (existingPlayers || []).map(p => p.id);

  if (existingIds.length > 0) {
    await supabase
      .from('players')
      .delete()
      .eq('team_id', teamId);
  }

  const playersToInsert = players.map(player => ({
    team_id: teamId,
    name: player.name || 'Spelare',
    position: player.pos || player.position || '',
    shirt_number: player.shirt || player.shirt_number || '',
    x_position: player.x,
    y_position: player.y,
    image_url: player.asset || player.image_url || '',
    date_of_birth: player.dob || player.date_of_birth || '',
    height: player.height || '',
    origin: player.origin || '',
    games: player.games || 0,
    goals: player.goals || 0
  }));

  const { data, error } = await supabase
    .from('players')
    .insert(playersToInsert)
    .select();

  return { data, error };
}
