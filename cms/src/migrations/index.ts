import * as migration_20250929_111647 from './20250929_111647';
import * as migration_20260619_054204_add_docs_collection from './20260619_054204_add_docs_collection';

export const migrations = [
  {
    up: migration_20250929_111647.up,
    down: migration_20250929_111647.down,
    name: '20250929_111647',
  },
  {
    up: migration_20260619_054204_add_docs_collection.up,
    down: migration_20260619_054204_add_docs_collection.down,
    name: '20260619_054204_add_docs_collection'
  },
];
