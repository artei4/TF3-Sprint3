// Configuração do Supabase (back-end das contas, perfis e avaliações).
//
// ✅ A "publishable key" (sb_publishable_...) foi feita para ficar no front-end. Ela sozinha
//    não dá acesso aos dados: quem protege tudo são as regras RLS do banco (supabase/migrations).
// ❌ NUNCA coloque neste projeto: a senha do banco (postgresql://postgres:SENHA@...),
//    a "secret key" (sb_secret_...) nem a "service_role key". Essas dão acesso total.
//
// Para usar o site SEM Supabase (modo local, dados só no navegador), deixe os dois valores
// vazios ou abra o site com ?local=1 no final do endereço.
// Os valores vêm do .env (veja .env.example) ou das variáveis do projeto na Vercel.
// Sem .env, usa o projeto da equipe abaixo (chave publicável, pode ficar no código).
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://delhjdfecknikusehrga.supabase.co'
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY ?? 'sb_publishable_mD9C-MKt0WEeE9H9A4R0Lg_04yZo_dF'
