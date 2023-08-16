export default Schema.object({
    emoSource: Schema.union([
        Schema.const('//图.tk' as const).description('图.tk'),
        Schema.const('//啧.tk' as const).description('啧.tk（不完整）'),
    ])
        .default('//图.tk')
        .description('表情源'),
    emoMenuOpen: Schema.boolean(),
})
