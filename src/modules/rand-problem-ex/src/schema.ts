export default Schema.object({
    _exrandDifficulty: Schema.tuple([
        Schema.boolean().default(true),
        Schema.boolean().default(true),
        Schema.boolean().default(true),
        Schema.boolean().default(true),
        Schema.boolean().default(true),
        Schema.boolean().default(true),
        Schema.boolean().default(true),
        Schema.boolean().default(true),
    ]),
    _exrandSource: Schema.tuple([
        Schema.boolean().default(true),
        Schema.boolean().default(false),
        Schema.boolean().default(false),
        Schema.boolean().default(false),
        Schema.boolean().default(false),
    ]),
})
