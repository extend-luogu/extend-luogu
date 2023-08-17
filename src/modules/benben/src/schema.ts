export default Schema.object({
    replyMarkdown: Schema.boolean()
        .default(true)
        .description('回复时附上原 markdown'),
    quikpost: Schema.boolean()
        .default(false)
        .description('Ctrl + Enter 发送犇犇'),
})
