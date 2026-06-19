import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`docs_blocks_markdown\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`content\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`docs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`docs_blocks_markdown_order_idx\` ON \`docs_blocks_markdown\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_markdown_parent_id_idx\` ON \`docs_blocks_markdown\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_markdown_path_idx\` ON \`docs_blocks_markdown\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`docs_blocks_callout\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`type\` text DEFAULT 'info',
  	\`content\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`docs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`docs_blocks_callout_order_idx\` ON \`docs_blocks_callout\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_callout_parent_id_idx\` ON \`docs_blocks_callout\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_callout_path_idx\` ON \`docs_blocks_callout\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`docs_blocks_cards_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`description\` text,
  	\`href\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`docs_blocks_cards\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`docs_blocks_cards_items_order_idx\` ON \`docs_blocks_cards_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_cards_items_parent_id_idx\` ON \`docs_blocks_cards_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`docs_blocks_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`docs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`docs_blocks_cards_order_idx\` ON \`docs_blocks_cards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_cards_parent_id_idx\` ON \`docs_blocks_cards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_cards_path_idx\` ON \`docs_blocks_cards\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`docs_blocks_tabs_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`content\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`docs_blocks_tabs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`docs_blocks_tabs_items_order_idx\` ON \`docs_blocks_tabs_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_tabs_items_parent_id_idx\` ON \`docs_blocks_tabs_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`docs_blocks_tabs\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`docs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`docs_blocks_tabs_order_idx\` ON \`docs_blocks_tabs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_tabs_parent_id_idx\` ON \`docs_blocks_tabs\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_tabs_path_idx\` ON \`docs_blocks_tabs\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`docs_blocks_accordions_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`content\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`docs_blocks_accordions\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`docs_blocks_accordions_items_order_idx\` ON \`docs_blocks_accordions_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_accordions_items_parent_id_idx\` ON \`docs_blocks_accordions_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`docs_blocks_accordions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`docs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`docs_blocks_accordions_order_idx\` ON \`docs_blocks_accordions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_accordions_parent_id_idx\` ON \`docs_blocks_accordions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_accordions_path_idx\` ON \`docs_blocks_accordions\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`docs_blocks_steps_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`content\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`docs_blocks_steps\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`docs_blocks_steps_items_order_idx\` ON \`docs_blocks_steps_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_steps_items_parent_id_idx\` ON \`docs_blocks_steps_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`docs_blocks_steps\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`docs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`docs_blocks_steps_order_idx\` ON \`docs_blocks_steps\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_steps_parent_id_idx\` ON \`docs_blocks_steps\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_steps_path_idx\` ON \`docs_blocks_steps\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`docs_blocks_files_files\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`docs_blocks_files\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`docs_blocks_files_files_order_idx\` ON \`docs_blocks_files_files\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_files_files_parent_id_idx\` ON \`docs_blocks_files_files\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`docs_blocks_files\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`folder\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`docs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`docs_blocks_files_order_idx\` ON \`docs_blocks_files\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_files_parent_id_idx\` ON \`docs_blocks_files\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_files_path_idx\` ON \`docs_blocks_files\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`docs_blocks_before_after\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`before\` text,
  	\`after\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`docs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`docs_blocks_before_after_order_idx\` ON \`docs_blocks_before_after\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_before_after_parent_id_idx\` ON \`docs_blocks_before_after\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_before_after_path_idx\` ON \`docs_blocks_before_after\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`docs_blocks_package_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`content\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`docs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`docs_blocks_package_list_order_idx\` ON \`docs_blocks_package_list\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_package_list_parent_id_idx\` ON \`docs_blocks_package_list\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_package_list_path_idx\` ON \`docs_blocks_package_list\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`docs_blocks_converter_link\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text DEFAULT '変換画面で試す',
  	\`href\` text DEFAULT 'https://convertexcel.net/convert',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`docs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`docs_blocks_converter_link_order_idx\` ON \`docs_blocks_converter_link\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_converter_link_parent_id_idx\` ON \`docs_blocks_converter_link\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_converter_link_path_idx\` ON \`docs_blocks_converter_link\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`docs_blocks_media\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`media_id\` integer,
  	\`caption\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`docs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`docs_blocks_media_order_idx\` ON \`docs_blocks_media\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_media_parent_id_idx\` ON \`docs_blocks_media\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_media_path_idx\` ON \`docs_blocks_media\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`docs_blocks_media_media_idx\` ON \`docs_blocks_media\` (\`media_id\`);`)
  await db.run(sql`CREATE TABLE \`docs\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`slug\` text,
  	\`description\` text,
  	\`order\` numeric DEFAULT 100,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`docs_slug_idx\` ON \`docs\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`docs_order_idx\` ON \`docs\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`docs_updated_at_idx\` ON \`docs\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`docs_created_at_idx\` ON \`docs\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`docs__status_idx\` ON \`docs\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_docs_v_blocks_markdown\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`content\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_docs_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_markdown_order_idx\` ON \`_docs_v_blocks_markdown\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_markdown_parent_id_idx\` ON \`_docs_v_blocks_markdown\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_markdown_path_idx\` ON \`_docs_v_blocks_markdown\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_docs_v_blocks_callout\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`type\` text DEFAULT 'info',
  	\`content\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_docs_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_callout_order_idx\` ON \`_docs_v_blocks_callout\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_callout_parent_id_idx\` ON \`_docs_v_blocks_callout\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_callout_path_idx\` ON \`_docs_v_blocks_callout\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_docs_v_blocks_cards_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`description\` text,
  	\`href\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_docs_v_blocks_cards\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_cards_items_order_idx\` ON \`_docs_v_blocks_cards_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_cards_items_parent_id_idx\` ON \`_docs_v_blocks_cards_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_docs_v_blocks_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_docs_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_cards_order_idx\` ON \`_docs_v_blocks_cards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_cards_parent_id_idx\` ON \`_docs_v_blocks_cards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_cards_path_idx\` ON \`_docs_v_blocks_cards\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_docs_v_blocks_tabs_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`content\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_docs_v_blocks_tabs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_tabs_items_order_idx\` ON \`_docs_v_blocks_tabs_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_tabs_items_parent_id_idx\` ON \`_docs_v_blocks_tabs_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_docs_v_blocks_tabs\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_docs_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_tabs_order_idx\` ON \`_docs_v_blocks_tabs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_tabs_parent_id_idx\` ON \`_docs_v_blocks_tabs\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_tabs_path_idx\` ON \`_docs_v_blocks_tabs\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_docs_v_blocks_accordions_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`content\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_docs_v_blocks_accordions\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_accordions_items_order_idx\` ON \`_docs_v_blocks_accordions_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_accordions_items_parent_id_idx\` ON \`_docs_v_blocks_accordions_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_docs_v_blocks_accordions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_docs_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_accordions_order_idx\` ON \`_docs_v_blocks_accordions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_accordions_parent_id_idx\` ON \`_docs_v_blocks_accordions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_accordions_path_idx\` ON \`_docs_v_blocks_accordions\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_docs_v_blocks_steps_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`content\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_docs_v_blocks_steps\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_steps_items_order_idx\` ON \`_docs_v_blocks_steps_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_steps_items_parent_id_idx\` ON \`_docs_v_blocks_steps_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_docs_v_blocks_steps\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_docs_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_steps_order_idx\` ON \`_docs_v_blocks_steps\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_steps_parent_id_idx\` ON \`_docs_v_blocks_steps\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_steps_path_idx\` ON \`_docs_v_blocks_steps\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_docs_v_blocks_files_files\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_docs_v_blocks_files\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_files_files_order_idx\` ON \`_docs_v_blocks_files_files\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_files_files_parent_id_idx\` ON \`_docs_v_blocks_files_files\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_docs_v_blocks_files\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`folder\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_docs_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_files_order_idx\` ON \`_docs_v_blocks_files\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_files_parent_id_idx\` ON \`_docs_v_blocks_files\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_files_path_idx\` ON \`_docs_v_blocks_files\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_docs_v_blocks_before_after\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`before\` text,
  	\`after\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_docs_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_before_after_order_idx\` ON \`_docs_v_blocks_before_after\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_before_after_parent_id_idx\` ON \`_docs_v_blocks_before_after\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_before_after_path_idx\` ON \`_docs_v_blocks_before_after\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_docs_v_blocks_package_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`content\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_docs_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_package_list_order_idx\` ON \`_docs_v_blocks_package_list\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_package_list_parent_id_idx\` ON \`_docs_v_blocks_package_list\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_package_list_path_idx\` ON \`_docs_v_blocks_package_list\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_docs_v_blocks_converter_link\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text DEFAULT '変換画面で試す',
  	\`href\` text DEFAULT 'https://convertexcel.net/convert',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_docs_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_converter_link_order_idx\` ON \`_docs_v_blocks_converter_link\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_converter_link_parent_id_idx\` ON \`_docs_v_blocks_converter_link\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_converter_link_path_idx\` ON \`_docs_v_blocks_converter_link\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_docs_v_blocks_media\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`media_id\` integer,
  	\`caption\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_docs_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_media_order_idx\` ON \`_docs_v_blocks_media\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_media_parent_id_idx\` ON \`_docs_v_blocks_media\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_media_path_idx\` ON \`_docs_v_blocks_media\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_blocks_media_media_idx\` ON \`_docs_v_blocks_media\` (\`media_id\`);`)
  await db.run(sql`CREATE TABLE \`_docs_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_slug\` text,
  	\`version_description\` text,
  	\`version_order\` numeric DEFAULT 100,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`docs\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_docs_v_parent_idx\` ON \`_docs_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_version_version_slug_idx\` ON \`_docs_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_version_version_order_idx\` ON \`_docs_v\` (\`version_order\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_version_version_updated_at_idx\` ON \`_docs_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_version_version_created_at_idx\` ON \`_docs_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_version_version__status_idx\` ON \`_docs_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_created_at_idx\` ON \`_docs_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_updated_at_idx\` ON \`_docs_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_latest_idx\` ON \`_docs_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_autosave_idx\` ON \`_docs_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`payload_jobs_log\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`executed_at\` text NOT NULL,
  	\`completed_at\` text NOT NULL,
  	\`task_slug\` text NOT NULL,
  	\`task_i_d\` text NOT NULL,
  	\`input\` text,
  	\`output\` text,
  	\`state\` text NOT NULL,
  	\`error\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`payload_jobs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_jobs_log_order_idx\` ON \`payload_jobs_log\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`payload_jobs_log_parent_id_idx\` ON \`payload_jobs_log\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_jobs\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`input\` text,
  	\`completed_at\` text,
  	\`total_tried\` numeric DEFAULT 0,
  	\`has_error\` integer DEFAULT false,
  	\`error\` text,
  	\`task_slug\` text,
  	\`queue\` text DEFAULT 'default',
  	\`wait_until\` text,
  	\`processing\` integer DEFAULT false,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_jobs_completed_at_idx\` ON \`payload_jobs\` (\`completed_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_jobs_total_tried_idx\` ON \`payload_jobs\` (\`total_tried\`);`)
  await db.run(sql`CREATE INDEX \`payload_jobs_has_error_idx\` ON \`payload_jobs\` (\`has_error\`);`)
  await db.run(sql`CREATE INDEX \`payload_jobs_task_slug_idx\` ON \`payload_jobs\` (\`task_slug\`);`)
  await db.run(sql`CREATE INDEX \`payload_jobs_queue_idx\` ON \`payload_jobs\` (\`queue\`);`)
  await db.run(sql`CREATE INDEX \`payload_jobs_wait_until_idx\` ON \`payload_jobs\` (\`wait_until\`);`)
  await db.run(sql`CREATE INDEX \`payload_jobs_processing_idx\` ON \`payload_jobs\` (\`processing\`);`)
  await db.run(sql`CREATE INDEX \`payload_jobs_updated_at_idx\` ON \`payload_jobs\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_jobs_created_at_idx\` ON \`payload_jobs\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`docs_id\` integer REFERENCES docs(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_docs_id_idx\` ON \`payload_locked_documents_rels\` (\`docs_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`docs_blocks_markdown\`;`)
  await db.run(sql`DROP TABLE \`docs_blocks_callout\`;`)
  await db.run(sql`DROP TABLE \`docs_blocks_cards_items\`;`)
  await db.run(sql`DROP TABLE \`docs_blocks_cards\`;`)
  await db.run(sql`DROP TABLE \`docs_blocks_tabs_items\`;`)
  await db.run(sql`DROP TABLE \`docs_blocks_tabs\`;`)
  await db.run(sql`DROP TABLE \`docs_blocks_accordions_items\`;`)
  await db.run(sql`DROP TABLE \`docs_blocks_accordions\`;`)
  await db.run(sql`DROP TABLE \`docs_blocks_steps_items\`;`)
  await db.run(sql`DROP TABLE \`docs_blocks_steps\`;`)
  await db.run(sql`DROP TABLE \`docs_blocks_files_files\`;`)
  await db.run(sql`DROP TABLE \`docs_blocks_files\`;`)
  await db.run(sql`DROP TABLE \`docs_blocks_before_after\`;`)
  await db.run(sql`DROP TABLE \`docs_blocks_package_list\`;`)
  await db.run(sql`DROP TABLE \`docs_blocks_converter_link\`;`)
  await db.run(sql`DROP TABLE \`docs_blocks_media\`;`)
  await db.run(sql`DROP TABLE \`docs\`;`)
  await db.run(sql`DROP TABLE \`_docs_v_blocks_markdown\`;`)
  await db.run(sql`DROP TABLE \`_docs_v_blocks_callout\`;`)
  await db.run(sql`DROP TABLE \`_docs_v_blocks_cards_items\`;`)
  await db.run(sql`DROP TABLE \`_docs_v_blocks_cards\`;`)
  await db.run(sql`DROP TABLE \`_docs_v_blocks_tabs_items\`;`)
  await db.run(sql`DROP TABLE \`_docs_v_blocks_tabs\`;`)
  await db.run(sql`DROP TABLE \`_docs_v_blocks_accordions_items\`;`)
  await db.run(sql`DROP TABLE \`_docs_v_blocks_accordions\`;`)
  await db.run(sql`DROP TABLE \`_docs_v_blocks_steps_items\`;`)
  await db.run(sql`DROP TABLE \`_docs_v_blocks_steps\`;`)
  await db.run(sql`DROP TABLE \`_docs_v_blocks_files_files\`;`)
  await db.run(sql`DROP TABLE \`_docs_v_blocks_files\`;`)
  await db.run(sql`DROP TABLE \`_docs_v_blocks_before_after\`;`)
  await db.run(sql`DROP TABLE \`_docs_v_blocks_package_list\`;`)
  await db.run(sql`DROP TABLE \`_docs_v_blocks_converter_link\`;`)
  await db.run(sql`DROP TABLE \`_docs_v_blocks_media\`;`)
  await db.run(sql`DROP TABLE \`_docs_v\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`payload_jobs_log\`;`)
  await db.run(sql`DROP TABLE \`payload_jobs\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
}
