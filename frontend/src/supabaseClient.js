import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://deqqcrlryqrxqdsjqviq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlcXFjcmxyeXFyeHFkc2pxdmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzgwMTUsImV4cCI6MjA2ODYxNDAxNX0.bUIBHcMr35rq_W5dESGD4dwz2ymZWKtRfv6aQ7oXFto'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)