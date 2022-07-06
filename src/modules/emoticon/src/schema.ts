import Schema from 'schemastery'

export default Schema.object({
    // your static schema here
    // see <https://github.com/shigma/schemastery>
    hello: Schema.string().default('world')
})
