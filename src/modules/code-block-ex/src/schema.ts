export default Schema.object({
    copy_code_position: Schema
        .union([
            Schema.const('left' as const).description('左对齐'),
            Schema.const('right' as const).description('右对齐'),
        ])
        .default('right')
        .description('复制按钮对齐方式'),

    beautify_code_block: Schema
        .boolean()
        .default(true)
        .description('代码块美化'),

    code_block_title: Schema
        .string()
        .default('源代码 - {lang}')
        .description('自定义代码块标题 - 限定语言'),

    code_block_title_nolang: Schema
        .string()
        .default('源代码')
        .description('自定义代码块标题 - 默认'),

    copy_code_font: Schema
        .string()
        .default("'Fira Code', 'Fira Mono', 'Consolas'")
        .description('代码块字体'),

    cb_background_color: Schema
        .string()
        .default('white')
        .description('代码块背景色 (配合其他美化插件)'),

    max_show_lines: Schema
        .number()
        .default(-1)
        .min(-1)
        .max(100)
        .description('代码块最大显示行数'),
})
