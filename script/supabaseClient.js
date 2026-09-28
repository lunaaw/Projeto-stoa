import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Substitua pelas chaves reais do seu projeto no Supabase
const SUPABASE_URL = 'https://zlixkjuwhiijikrhofdh.supabase.co/rest/v1/';
const SUPABASE_KEY = 'e2debbed-2a5e-47fd-80fc-d9a27d2281cd';

// Inicializa o cliente do Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);