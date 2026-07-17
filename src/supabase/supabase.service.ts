import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error('Variabel SUPABASE_URL dan SUPABASE_ANON_KEY wajib diisi di cPanel!');
    }

    this.supabase = createClient(url, key);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }
}