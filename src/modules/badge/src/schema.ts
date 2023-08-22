export default Schema.object({
    cache: Schema.number()
        .default(3600)
        .description('缓存时间（秒）'),
    badges: Schema.string()
        .default('{}'),
})
