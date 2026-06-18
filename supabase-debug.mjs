import { createClient } from '@supabase/supabase-js';
const url = 'https://cbpfwremlockfqlxhypr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNicGZ3cmVtbG9ja2ZxbHhoeXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NDY2NzksImV4cCI6MjA5NzMyMjY3OX0.NzLaSroP49lO150lYUmP2kaJ1IPTjF84emOcnKk2DDU';
const supabase = createClient(url, key);
(async () => {
  try {
    const q1 = await supabase.from('tb_avaliacao').select('*, usuario(*)').order('created_at',{ascending:false}).limit(3);
    console.log('q1', JSON.stringify({ error:q1.error, data:q1.data, status:q1.status, statusText:q1.statusText }, null, 2));
  } catch (e) {
    console.error('q1 exception', e);
  }
  try {
    const q2 = await supabase.from('tb_agendamento').select('*, barbeiro(*), servicos:tb_servico_has_tb_agendamento(preco_servico, servico:tb_servico(*))').eq('id_usuario','1eca18bf-22c2-479f-be86-4e86fd5cac3b').order('created_at', {ascending:false});
    console.log('q2', JSON.stringify({ error:q2.error, data:q2.data, status:q2.status, statusText:q2.statusText }, null, 2));
  } catch (e) {
    console.error('q2 exception', e);
  }
})();
