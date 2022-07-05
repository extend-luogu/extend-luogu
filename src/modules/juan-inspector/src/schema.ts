import Schema from 'schemastery'

export default Schema.object({
    _lastFetched: Schema.array(Schema.array(Schema.number()))
})
