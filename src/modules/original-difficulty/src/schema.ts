export default Schema.object({
    _difficulty: Schema.dict(Schema.number()),
    _ATLastFetched: Schema.number().default(-1),
})
