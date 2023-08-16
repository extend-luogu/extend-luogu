export default Schema.object({
    _difficulty: Schema.dict(Schema.number()),
    // WIP: _tags, _submissions
    _CFLastFetched: Schema.number().default(-1),
    _ATLastFetched: Schema.number().default(-1),
})
