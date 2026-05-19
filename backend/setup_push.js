const fs = require('fs');
const path = require('path');
const webpush = require('web-push');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function setup() {
  console.log("Generating VAPID Keys...");
  const vapidKeys = webpush.generateVAPIDKeys();
  console.log("Public Key:", vapidKeys.publicKey);
  
  // Append to backend .env
  const envPath = path.join(__dirname, '.env');
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  if (!envContent.includes('VAPID_PUBLIC_KEY')) {
    envContent += `\nVAPID_PUBLIC_KEY=${vapidKeys.publicKey}`;
    envContent += `\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}`;
    envContent += `\nVAPID_SUBJECT=mailto:admin@dinas.go.id\n`;
    fs.writeFileSync(envPath, envContent);
    console.log("Added VAPID keys to backend .env");
  } else {
    console.log("VAPID keys already exist in backend .env");
  }

  // Append to frontend .env
  const feEnvPath = path.join(__dirname, '../frontend/.env');
  let feEnvContent = fs.existsSync(feEnvPath) ? fs.readFileSync(feEnvPath, 'utf8') : '';
  if (!feEnvContent.includes('VITE_VAPID_PUBLIC_KEY')) {
    feEnvContent += `\nVITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}\n`;
    fs.writeFileSync(feEnvPath, feEnvContent);
    console.log("Added VAPID key to frontend .env");
  } else {
    console.log("VAPID key already exists in frontend .env");
  }

  // Setup Database Table
  console.log("Setting up database table 'push_subscriptions'...");
  const sql = `
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      UNIQUE(user_id, endpoint)
    );

    -- Enable Realtime for users table
    BEGIN;
    DROP PUBLICATION IF EXISTS supabase_realtime;
    CREATE PUBLICATION supabase_realtime;
    COMMIT;
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
  `;
  
  // Wait, Supabase JS client doesn't allow raw SQL execution unless via an RPC function.
  // I must tell the user to execute the SQL, or try using an RPC function if it exists.
  // Let me just save the SQL to a file for the user to execute.
  const sqlPath = path.join(__dirname, '../database/push_setup.sql');
  fs.writeFileSync(sqlPath, sql);
  console.log("Saved SQL to database/push_setup.sql");
}

setup().catch(console.error);
