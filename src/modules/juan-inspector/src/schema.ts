import Schema from 'schemastery'

export default Schema.object({
    _lastFetched: Schema.dict(
        Schema.object({
            name: Schema.string().required(),
            count: Schema.number().required()
        })
    )
})
