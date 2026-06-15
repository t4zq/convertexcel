"use strict";

const vscode = require("vscode");
const { parseShareUrl } = require("./shareState");
const { convertLatexTable, convertTikzGraph } = require("./conversion");

function selectedText(editor) {
  if (!editor || editor.selection.isEmpty) return "";
  return editor.document.getText(editor.selection).trim();
}

async function readShareState(editor) {
  const selected = selectedText(editor);
  if (selected) {
    const state = parseShareUrl(selected);
    if (state) return state;
  }

  const clipboard = await vscode.env.clipboard.readText();
  const state = parseShareUrl(clipboard);
  if (state) return state;

  throw new Error("converTeXcel の共有 URL が選択範囲またはクリップボードに見つかりません。");
}

async function insertText(editor, text) {
  await editor.edit((editBuilder) => {
    if (editor.selection.isEmpty) {
      editBuilder.insert(editor.selection.active, text);
    } else {
      editBuilder.replace(editor.selection, text);
    }
  });
}

async function runInsertCommand(context, convert) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("挿入先のエディタが開かれていません。");
    return;
  }

  try {
    const shareState = await readShareState(editor);
    if (!shareState.input.trim()) {
      throw new Error("共有 URL に入力データが含まれていません。");
    }
    const output = await convert(context.extensionPath, shareState);
    if (!output.trim()) {
      throw new Error("変換結果が空です。入力データと共有 URL を確認してください。");
    }
    await insertText(editor, output);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(message);
  }
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("convertexcel.insertLatexTableFromUrl", () =>
      runInsertCommand(context, convertLatexTable),
    ),
    vscode.commands.registerCommand("convertexcel.insertTikzGraphFromUrl", () =>
      runInsertCommand(context, convertTikzGraph),
    ),
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
