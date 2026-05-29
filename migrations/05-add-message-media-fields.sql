-- Ajout du support des médias dans la table messages

DO $$ BEGIN
  CREATE TYPE enum_messages_type_message AS ENUM ('texte', 'image', 'fichier', 'qr');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS type_message enum_messages_type_message NOT NULL DEFAULT 'texte',
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS nom_fichier VARCHAR(255),
  ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS taille_fichier INTEGER;

ALTER TABLE messages
  ALTER COLUMN contenu DROP NOT NULL;
