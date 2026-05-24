import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useLiveMatches = () => {
  const [liveMatches, setLiveMatches] = useState([]);

  useEffect(() => {
    // Initial fetch
    const fetchLive = async () => {
      const { data } = await supabase.from('live_matches').select('*');
      if (data) setLiveMatches(data);
    };
    fetchLive();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('live_matches_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_matches' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setLiveMatches(prev => [...prev.filter(m => m.match_key !== payload.new.match_key), payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setLiveMatches(prev => prev.map(m => m.match_key === payload.new.match_key ? payload.new : m));
        } else if (payload.eventType === 'DELETE') {
          setLiveMatches(prev => prev.filter(m => m.match_key !== payload.old.match_key));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const makeKey = (round, p1, p2) => `${round}_${p1?.id}_${p2?.id}`;

  const getLiveMatch = useCallback((round, p1, p2) => {
    const key = makeKey(round, p1, p2);
    return liveMatches.find(m => m.match_key === key) || null;
  }, [liveMatches]);

  const startLive = useCallback(async (match, round) => {
    const matchKey = makeKey(round, match.p1, match.p2);
    const { error } = await supabase.from('live_matches').upsert({
      match_key: matchKey,
      p1_name: match.p1?.name,
      p2_name: match.p2?.name,
      p1_team: match.p1?.team || null,
      p2_team: match.p2?.team || null,
      score1: 0,
      score2: 0,
      round,
      status: 'live',
    }, { onConflict: 'match_key' });
    if (error) { console.error('startLive error:', error); return null; }
    return matchKey;
  }, []);

  const updateScore = useCallback(async (matchKey, score1, score2) => {
    await supabase.from('live_matches').update({ score1, score2 }).eq('match_key', matchKey);
  }, []);

  const finishLive = useCallback(async (matchKey) => {
    await supabase.from('live_matches').delete().eq('match_key', matchKey);
  }, []);

  return { liveMatches, getLiveMatch, startLive, updateScore, finishLive };
};
