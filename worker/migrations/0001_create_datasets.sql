-- データセット(grid)永続化テーブル。旧 Rails の storage/datasets.json を置き換える。
CREATE TABLE IF NOT EXISTS datasets (
  name       TEXT PRIMARY KEY,
  rows       TEXT NOT NULL,           -- 2次元文字列配列を JSON 化したもの
  updated_at TEXT NOT NULL            -- ISO8601 (UTC)
);

-- 旧 storage/datasets.json の既存データを移行。
INSERT OR IGNORE INTO datasets (name, rows, updated_at) VALUES
  ('sample', '[["x","y"],["1","2"],["3","4"]]', '2026-06-06T06:41:34Z');
