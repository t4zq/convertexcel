import type { Block } from 'payload'

export const MarkdownBlock: Block = {
  slug: 'markdown',
  labels: { singular: 'Markdown本文', plural: 'Markdown本文' },
  fields: [
    {
      name: 'content',
      type: 'textarea',
      required: true,
      admin: {
        description: '見出し、段落、リスト、表、数式、コードブロックをMarkdownで記述します。',
        rows: 14,
      },
    },
  ],
}

export const CalloutBlock: Block = {
  slug: 'callout',
  labels: { singular: 'Callout', plural: 'Callout' },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'type',
      type: 'select',
      defaultValue: 'info',
      required: true,
      options: [
        { label: '情報', value: 'info' },
        { label: 'アイデア', value: 'idea' },
        { label: '成功', value: 'success' },
        { label: '注意', value: 'warn' },
        { label: 'エラー', value: 'error' },
      ],
    },
    { name: 'content', type: 'textarea', required: true, admin: { rows: 5 } },
  ],
}

export const CardsBlock: Block = {
  slug: 'cards',
  labels: { singular: 'カード一覧', plural: 'カード一覧' },
  fields: [
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
  ],
}

export const TabsBlock: Block = {
  slug: 'tabs',
  labels: { singular: 'タブ', plural: 'タブ' },
  fields: [
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 2,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'content', type: 'textarea', required: true, admin: { rows: 6 } },
      ],
    },
  ],
}

export const AccordionBlock: Block = {
  slug: 'accordions',
  labels: { singular: 'アコーディオン', plural: 'アコーディオン' },
  fields: [
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'content', type: 'textarea', required: true, admin: { rows: 6 } },
      ],
    },
  ],
}

export const StepsBlock: Block = {
  slug: 'steps',
  labels: { singular: '手順', plural: '手順' },
  fields: [
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'content', type: 'textarea', required: true, admin: { rows: 6 } },
      ],
    },
  ],
}

export const FilesBlock: Block = {
  slug: 'files',
  labels: { singular: 'ファイル構成', plural: 'ファイル構成' },
  fields: [
    { name: 'folder', type: 'text', required: true },
    {
      name: 'files',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [{ name: 'name', type: 'text', required: true }],
    },
  ],
}

export const BeforeAfterBlock: Block = {
  slug: 'beforeAfter',
  labels: { singular: '入力・出力比較', plural: '入力・出力比較' },
  fields: [
    { name: 'before', type: 'textarea', required: true, admin: { rows: 8 } },
    { name: 'after', type: 'textarea', required: true, admin: { rows: 8 } },
  ],
}

export const PackageListBlock: Block = {
  slug: 'packageList',
  labels: { singular: '必要パッケージ', plural: '必要パッケージ' },
  fields: [{ name: 'content', type: 'textarea', required: true, admin: { rows: 5 } }],
}

export const ConverterLinkBlock: Block = {
  slug: 'converterLink',
  labels: { singular: '変換画面リンク', plural: '変換画面リンク' },
  fields: [
    { name: 'label', type: 'text', required: true, defaultValue: '変換画面で試す' },
    { name: 'href', type: 'text', required: true, defaultValue: 'https://convertexcel.net/convert' },
  ],
}

export const MediaBlock: Block = {
  slug: 'media',
  labels: { singular: '画像・動画', plural: '画像・動画' },
  fields: [
    { name: 'media', type: 'upload', relationTo: 'media', required: true },
    { name: 'caption', type: 'text' },
  ],
}

export const docsBlocks = [
  MarkdownBlock,
  CalloutBlock,
  CardsBlock,
  TabsBlock,
  AccordionBlock,
  StepsBlock,
  FilesBlock,
  BeforeAfterBlock,
  PackageListBlock,
  ConverterLinkBlock,
  MediaBlock,
]
