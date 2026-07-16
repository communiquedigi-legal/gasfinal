import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://plbkxsutiixhhqnndrsy.supabase.co';
const supabaseKey = 'sb_publishable_U-35oLEPCPMdwJLMfiB6og_6E4qDaf6';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching staff...');
  const { data: staff, error: staffErr } = await supabase.from('staff').select('*');
  console.log('Staff error:', staffErr);
  console.log('Staff count:', staff ? staff.length : 0);
  console.log(JSON.stringify(staff, null, 2));

  console.log('Fetching profiles...');
  const { data: profiles, error: profilesErr } = await supabase.from('profiles').select('*');
  console.log('Profiles error:', profilesErr);
  console.log('Profiles count:', profiles ? profiles.length : 0);
  console.log(JSON.stringify(profiles, null, 2));
}

run();
