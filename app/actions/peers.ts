'use server';

import { unstable_cache } from 'next/cache';
import { MOCK_PEERS } from '@/lib/demo-store';
// In a real app, you would import createClient and fetch from Supabase.
// import { createClient } from '@/lib/supabase/server';

/**
 * Fetches all available peers with caching.
 * Caches the result for 60 seconds (revalidate: 60) to avoid hammering the database.
 */
export const getCachedPeers = unstable_cache(
  async () => {
    // Simulating database fetch delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // In production:
    // const supabase = createClient();
    // const { data } = await supabase.from('profiles').select('*');
    // return data;

    return MOCK_PEERS;
  },
  ['discover-peers-cache'],
  {
    revalidate: 60, // Cache for 1 minute
    tags: ['peers'],
  }
);
