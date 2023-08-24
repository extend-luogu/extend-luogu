export default Schema.object({
    cache: Schema.number()
        .default(3600)
        .description('缓存时间（秒）'),
    badge: Schema.dict(
        Schema.object({
            ts: Schema.number(),
            badge: Schema.object({
                bg: Schema.string(),
                fg: Schema.string(),
                text: Schema.string(),
                ft: Schema.string(),
                fw: Schema.string(),
                bd: Schema.string(),
                fs: Schema.string(),
            }),
        }),
    ),
})
